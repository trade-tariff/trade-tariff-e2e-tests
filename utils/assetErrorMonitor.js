import { expect } from "@playwright/test";

export function monitorAssetErrors(page) {
  const assetFailures = [];
  const assetConsoleErrors = [];
  const pageErrors = [];
  const assetPathPattern = /\/(assets|javascripts)\//;

  page.on("response", (response) => {
    const url = response.url();

    if (response.status() >= 400 && assetPathPattern.test(url)) {
      assetFailures.push(`${response.status()} ${url}`);
    }
  });

  page.on("console", (message) => {
    const text = message.text();

    if (
      message.type() === "error" &&
      (assetPathPattern.test(text) ||
        (text.includes("Failed to load resource") &&
          assetPathPattern.test(message.location().url)))
    ) {
      assetConsoleErrors.push(text);
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  return {
    assertNoErrors() {
      expect(assetFailures).toEqual([]);
      expect(assetConsoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
    },
  };
}
