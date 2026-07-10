import { expect } from "@playwright/test";

/**
 * Prefer an authenticated request over Playwright's "download" event.
 * Exchange-rate files redirect (app → API → signed S3). That multi-hop
 * attachment path often never fires page.waitForEvent("download") within
 * short CI timeouts, which flakes staging/prod deploys.
 */
export function filenameFromDisposition(disposition, finalUrl, originalUrl) {
  const star = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (star?.[1]) {
    return decodeURIComponent(star[1].trim());
  }

  const plain = disposition.match(/filename="?([^";]+)"?/i);
  if (plain?.[1]) {
    return plain[1].trim();
  }

  for (const candidate of [finalUrl, originalUrl]) {
    try {
      const leaf = new URL(candidate).pathname.split("/").pop();
      if (leaf) {
        return decodeURIComponent(leaf);
      }
    } catch {
      // ignore invalid URL
    }
  }

  return "";
}

export default class DownloadHelper {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {import('@playwright/test').Locator} linkLocator
   * @param {RegExp} [filenamePattern]
   * @param {{
   *   timeout?: number,
   *   assertBody?: (body: Buffer, meta: { filename: string, url: string, finalUrl: string }) => void | Promise<void>,
   * }} [options]
   */
  static async downloadAndVerify(
    page,
    linkLocator,
    filenamePattern = /\.csv$/i,
    options = {},
  ) {
    const timeout = options.timeout ?? 30_000;
    const assertBody = options.assertBody;

    await expect(linkLocator).toBeVisible();

    const href = await linkLocator.getAttribute("href");
    expect(href, "download link should have an href").toBeTruthy();

    const absoluteUrl = new URL(href, page.url()).toString();
    const response = await page.request.get(absoluteUrl, {
      timeout,
      maxRedirects: 10,
    });

    expect(
      response.ok(),
      `download request failed: ${response.status()} for ${absoluteUrl}`,
    ).toBeTruthy();

    const headers = response.headers();
    const contentType = headers["content-type"] ?? "";
    expect(
      contentType.includes("text/html"),
      `expected a file download but received HTML (${contentType}) from ${absoluteUrl} (final: ${response.url()})`,
    ).toBe(false);

    const body = Buffer.from(await response.body());
    expect(
      body.byteLength,
      `download body was empty for ${absoluteUrl}`,
    ).toBeGreaterThan(0);

    const disposition = headers["content-disposition"] ?? "";
    const filename = filenameFromDisposition(
      disposition,
      response.url(),
      absoluteUrl,
    );
    expect(filename).toMatch(filenamePattern);

    if (assertBody) {
      await assertBody(body, {
        filename,
        url: absoluteUrl,
        finalUrl: response.url(),
      });
    }

    return {
      body,
      filename,
      response,
      suggestedFilename: () => filename,
      failure: async () => null,
    };
  }
}
