import { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { setTimeout as sleep } from 'timers/promises';

export default class S3Lock {
  constructor(bucket, lockKey = 'locks/myott-e2e.lock', region = 'eu-west-2', maxWaitMs = 60000, pollIntervalMs = 5000) {
    this.bucket = bucket;
    this.lockKey = lockKey;
    this.s3Client = new S3Client({ region });
    this.maxWaitMs = maxWaitMs;
    this.pollIntervalMs = pollIntervalMs;
  }

  async acquire() {
    try {
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.lockKey,
        Body: JSON.stringify({ lockedAt: new Date().toISOString(), pid: process.pid }),
        IfNoneMatch: '*',
      }));
      return true;
    } catch (error) {
      if (error.name === 'PreconditionFailed') {
        return false;
      }
      throw error;
    }
  }

  async exists() {
    try {
      await this.s3Client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: this.lockKey
      }));
      return true;
    } catch (error) {
      if (error.name === 'NotFound') return false;
      throw error;
    }
  }

  async release() {
    await this.s3Client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: this.lockKey
    }));
  }

  async withLock(callback) {
    const start = Date.now();
    this.registerShutdownHandlers();
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
  }

  registerShutdownHandlers() {
    process.once('SIGTERM', async () => {
      console.log('SIGTERM received; attempting lock release');
      await this.release();
      process.exit(0);
    });

    process.once('SIGINT', async () => {
      console.log('SIGINT (Ctrl+C) received; attempting lock release');
      await this.release();
      process.exit(0);
    });

    // Unhandled errors
    process.once('uncaughtException', async (err) => {
      console.error('Uncaught exception; attempting lock release', err);
      await this.release();
      process.exit(1);
    });

    process.once('unhandledRejection', async (reason) => {
      console.error('Unhandled rejection; attempting lock release', reason);
      await this.release();
      process.exit(1);
    });

    process.once('exit', (code) => {
      console.log(`Process exiting with code ${code}; attempting sync lock release`);
      this.release();
    });
  }
}
