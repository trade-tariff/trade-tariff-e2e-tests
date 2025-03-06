const { chromium } = require("@playwright/test");
const { baseUrl } = require("./playwright-variables");

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(baseUrl);
}
export default globalSetup;
