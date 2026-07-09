import { expect } from "@playwright/test";

export function monitorAssetErrors(page) {
  const assetFailures = [];
  const consoleErrors = [];
  const pageErrors = [];

  page.on("response", (response) => {
    const url = response.url();

    if (
      response.status() >= 400 &&
      (url.includes("/assets/") || url.includes("/javascripts/"))
    ) {
      assetFailures.push(`${response.status()} ${url}`);
    }
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  return {
    assertNoErrors() {
      expect(assetFailures).toEqual([]);
      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
    },
  };
}
