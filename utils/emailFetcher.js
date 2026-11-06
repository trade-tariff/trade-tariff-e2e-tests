import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { simpleParser } from "mailparser";

export default class EmailFetcher {
  constructor(bucket, prefix = "", region = "eu-west-2") {
    this.bucket = bucket;
    this.prefix = prefix;
    this.s3Client = new S3Client({ region });
    this.targetRecipient = process.env.PASSWORDLESS_SUBSCRIPTIONS_EMAIL;
  }

  async getLatestEmail({ limit = 100, notBefore } = {}) {
    const listCommand = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: this.prefix,
      MaxKeys: limit,
    });

    const response = await this.s3Client.send(listCommand);

    const contents = (response.Contents ?? [])
      .filter((object) => object.Key)
      .sort(
        (a, b) => new Date(b.LastModified ?? 0) - new Date(a.LastModified ?? 0),
      );

    for (const object of contents) {
      const email = await this._fetchAndParseEmail(object.Key);

      if (!email) {
        continue;
      }

      const isForTargetRecipient = email.to
        .toLowerCase()
        .includes(this.targetRecipient.toLowerCase());

      if (!isForTargetRecipient) {
        continue;
      }

      if (notBefore && email.send_date < notBefore) {
        continue;
      }

      const code = this.extractCode(email);

      if (code) {
        return {
          ...email,
          code,
        };
      }
    }

    return null;
  }

  async deleteEmail(key) {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    try {
      await this.s3Client.send(deleteCommand);
    } catch (error) {
      console.error(`Error deleting email with key ${key}:`, error);
    }
  }

  async _fetchAndParseEmail(key) {
    const getCommand = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    const { Body } = await this.s3Client.send(getCommand);
    const chunks = [];
    for await (const chunk of Body) chunks.push(chunk);
    const rawEmail = Buffer.concat(chunks).toString("utf-8");

    return this._parseMime(rawEmail, key);
  }

  async _parseMime(rawEmail, key) {
    try {
      const parsed = await simpleParser(rawEmail);
      const from = parsed.from?.text || "Unknown";
      const to = parsed.to?.text || "Unknown";
      const subject = parsed.subject || "No Subject";
      const send_date = parsed.date || new Date();
      const body = parsed.html || parsed.textAsHtml || parsed.text || ""; // Prefer HTML, fallback to text

      return { from, to, send_date, subject, body, s3_key: key };
    } catch (error) {
      console.error(`Error parsing MIME for ${key}:`, error);
      return null;
    }
  }

  /*
    # email object
    {
      from: string (email address),
      to: string (email address),
      send_date: date,
      subject: string,
      body: string,
      s3_key: string
    }
  */

  extractCode(emailObj) {
    if (!emailObj || !emailObj.body) return null;

    const codeRegex = /(?:Enter this code to log in: )(\d{6})/g;
    const emailCode = [...emailObj.body.matchAll(codeRegex)].map((m) => m[1]);

    return emailCode[0] || null;
  }
}
