import { expect } from '@playwright/test';

export default class DownloadHelper {
  static async downloadAndVerify(page, linkLocator, filenamePattern = /\.csv$/i, options = { timeout: 10000 }) {
    await expect(linkLocator).toBeVisible();
    const downloadPromise = page.waitForEvent('download', options);
    await linkLocator.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(filenamePattern);
    expect(await download.failure()).toBeNull();
    return download;
  }
}
