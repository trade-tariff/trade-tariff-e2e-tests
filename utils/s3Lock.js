import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { setTimeout as sleep } from "timers/promises";
import { randomUUID } from "node:crypto";

export default class S3Lock {
  constructor(
    bucket,
    lockKey = "locks/myott-e2e.lock",
    region = "eu-west-2",
    maxWaitMs = 60000,
    pollIntervalMs = 5000,
    // S3 lock should not live longer than this
    // and is reaped after this timeout
    staleAfterMs = 120000,
  ) {
    this.bucket = bucket;
    this.lockKey = lockKey;
    this.s3Client = new S3Client({ region });
    this.maxWaitMs = maxWaitMs;
    this.pollIntervalMs = pollIntervalMs;
    this.staleAfterMs = staleAfterMs;
    this.ownership = null;
  }

  async acquire() {
    const token = randomUUID();

    try {
      const response = await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: this.lockKey,
          Body: JSON.stringify({
            token,
            lockedAt: new Date().toISOString(),
            pid: process.pid,
          }),
          IfNoneMatch: "*",
        }),
      );

      this.ownership = {
        token: token,
        etag: response.ETag,
      };

      return true;
    } catch (error) {
      if (error.name === "PreconditionFailed") {
        await this.#reapIfStale();
        return false;
      }
      throw error;
    }
  }

  async #reapIfStale() {
    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: this.lockKey,
        }),
      );

      const body = await response.Body.transformToString();
      const lock = body ? JSON.parse(body) : null;
      const age = lock ? Date.now() - new Date(lock.lockedAt).getTime() : 0;

      if (lock && age > this.staleAfterMs) {
        console.log(
          `Reaping stale lock ${lock.token} held by PID ${lock.pid}, age ${age}ms`,
        );
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: this.lockKey,
            IfMatch: response.ETag,
          }),
        );
      }
    } catch (error) {
      // The lock was released, or replaced since it was read
      if (error.name === "NoSuchKey" || isPreconditionFailed(error)) return;
      throw error;
    }
  }

  async exists() {
    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: this.lockKey,
        }),
      );
      return true;
    } catch (error) {
      if (error.name === "NotFound") return false;
      throw error;
    }
  }

  async release() {
    const ownership = this.ownership;
    if (!ownership) return;

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: this.lockKey,
          IfMatch: ownership.etag,
        }),
      );
    } catch (error) {
      if (!isPreconditionFailed(error)) {
        throw error;
      }

      console.warn(
        `Lock ${ownership.token} was replaced, leaving current lock`,
      );
    }

    if (this.ownership === ownership) {
      this.ownership = null;
    }
  }

  async withLock(callback) {
    const start = Date.now();
    const removeShutdownHandlers = this.registerShutdownHandlers();

    try {
      while (Date.now() - start < this.maxWaitMs) {
        if (await this.acquire()) {
          try {
            return await callback();
          } finally {
            await this.release();
          }
        }
        await sleep(this.pollIntervalMs);
      }
      throw new Error(`Failed to acquire lock after ${this.maxWaitMs}ms`);
    } finally {
      removeShutdownHandlers();
    }
  }

  registerShutdownHandlers() {
    const handlers = {
      SIGINT: 130,
      SIGTERM: 143,
    };

    const listeners = Object.entries(handlers).map(([signal, exitCode]) => {
      const listener = async () => {
        console.log(`${signal} received; attempting lock release`);
        try {
          await this.release();
        } finally {
          process.exit(exitCode);
        }
      };
      process.once(signal, listener);
      return [signal, listener];
    });

    return () => {
      for (const [signal, listener] of listeners) {
        process.off(signal, listener);
      }
    };
  }
}

function isPreconditionFailed(error) {
  return (
    error.name === "PreconditionFailed" ||
    error.$metadata?.httpStatusCode === 412
  );
}
