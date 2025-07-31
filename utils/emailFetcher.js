import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { URL } from 'url';
import { simpleParser } from 'mailparser';
import * as cheerio from 'cheerio';

export default class EmailFetcher {
  constructor(bucket, prefix = '', region = 'eu-west-2') {
    this.bucket = bucket;
    this.prefix = prefix;
    this.s3Client = new S3Client({ region });
    this.targetRecipient = process.env.PASSWORDLESS_SUBSCRIPTIONS_EMAIL;
  }

  async getLatestEmail(limit = 100) {
    let allContents = [];

    const listCommand = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: this.prefix,
      MaxKeys: limit,
    });
    const response = await this.s3Client.send(listCommand);
    if (response.Contents) {
      allContents = response.Contents;
    }

    if (allContents.length === 0) return [];

    allContents.sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified));

    let email = undefined;
    for (const obj of allContents) {
      const emailData = await this._fetchAndParseEmail(obj.Key);
      if (emailData && emailData.to.toLowerCase().includes(this.targetRecipient.toLowerCase())) {
        const whitelistedLinks = this.getWhitelistedLinks(emailData);
        if (whitelistedLinks.length > 0) {
          emailData.whitelistedLinks = whitelistedLinks;
          email = emailData;
          break;
        }
      }
    }
    return email;
  }

  async _fetchAndParseEmail(key) {
    const getCommand = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    const { Body } = await this.s3Client.send(getCommand);
    const chunks = [];
    for await (const chunk of Body) chunks.push(chunk);
    const rawEmail = Buffer.concat(chunks).toString('utf-8');

    return this._parseMime(rawEmail, key);
  }

  async _parseMime(rawEmail, key) {
    try {
      const parsed = await simpleParser(rawEmail);
      const from = parsed.from?.text || 'Unknown';
      const to = parsed.to?.text || 'Unknown';
      const subject = parsed.subject || 'No Subject';
      const send_date = parsed.date || new Date();
      const body = parsed.html || parsed.textAsHtml || parsed.text || '';  // Prefer HTML, fallback to text

      return { from, to, send_date, subject, body, s3_key: key };
    } catch (error) {
      console.error(`Error parsing MIME for ${key}:`, error);
      return null;
    }
  }

  extractLinks(emailObj) {
    if (!emailObj || !emailObj.body) return [];
    const $ = cheerio.load(emailObj.body);
    const anchorLinks = $('a').map((_i, el) => $(el).attr('href')).get().filter(Boolean);
    const plainLinks = [...emailObj.body.matchAll(/(https?:\/\/[^\s<>"']+)/gi)].map(m => m[1]);

    return [...new Set([...anchorLinks, ...plainLinks])];
  }

  getWhitelistedLinks(emailObj) {
    const encodedEmail = encodeURIComponent(this.targetRecipient).replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const callbackRegex = new RegExp(`^(?:https?:\\/\\/)?(?:id\\.dev|id\\.staging)\\.trade-tariff\\.service\\.gov\\.uk\\/passwordless\\/callback\\?email=${encodedEmail}&token=[a-f0-9]{64}&consumer=myott$`);
    const allLinks = this.extractLinks(emailObj);
    return allLinks.filter(link => {
      try {
        return callbackRegex.test(new URL(link).href);
      } catch (error) {
        console.log(`Invalid URL in email`, error);
        return false;
      }
    });
  }
}
