import { expect } from "@playwright/test";

export default class TradeTariffKeysPage {
  constructor(page) {
    this.page = page;
    this.secrets = {};
  }

  async createKey(description) {
    await this.navigateToTradeTab();

    await this.page
      .getByRole("link", { name: "Create new Trade Tariff key" })
      .click();

    this.assertNewKeyPage();

    await this.page
      .locator("#trade-tariff-key-description-field")
      .fill(description);
    await this.page.getByRole("button", { name: /continue/i }).click();

    await this.assertKeyCreationSuccess();

    await this.storeSecret(description);

    await this.page
      .getByRole("link", { name: "Back to Trade Tariff keys" })
      .click();

    this.assertKeysPage();

    await this.assertKeyCreated(description);
  }

  async revokeKey(description) {
    await this.ensureOnKeysPage();

    await this.keyRow(description)
      .getByRole("link", { name: "Revoke" })
      .click();

    this.assertRevokeKeyPage();
    await this.assertRevokeConfirmationPage(description);

    await this.page.getByRole("button", { name: "Revoke" }).click();

    this.assertKeysPage();

    await this.assertRevoked(description);
  }

  async deleteKey(description) {
    await this.ensureOnKeysPage();

    await this.keyRow(description)
      .getByRole("link", { name: "Delete" })
      .click();

    this.assertDeleteKeyPage();
    await this.assertDeleteConfirmationPage(description);

    await this.page.getByRole("button", { name: "Delete" }).click();

    this.assertKeysPage();

    await this.assertDeleted(description);
  }

  async assertRevoked(description) {
    const keyRow = this.keyRow(description);
    await expect(keyRow).toBeVisible();

    const statusCell = keyRow.locator("td.govuk-table__cell:nth-child(5)");
    await expect(statusCell).toHaveText("Revoked");

    const deleteLink = keyRow.getByRole("link", { name: "Delete" });
    await expect(deleteLink).toBeVisible();
  }

  async assertDeleted(description) {
    const keyRow = this.keyRow(description);
    await expect(keyRow).not.toBeVisible();
  }

  async assertKeyCreated(description) {
    const keyRow = this.keyRow(description);
    await expect(keyRow).toBeVisible();

    const statusCell = keyRow.locator("td.govuk-table__cell:nth-child(5)");
    await expect(statusCell).toContainText(/active/i);

    const descriptionCell = keyRow.locator("td").first();
    await expect(descriptionCell).toContainText(description);

    const revokeLink = keyRow.getByRole("link", { name: "Revoke" });
    await expect(revokeLink).toBeVisible();
  }

  async assertKeyCreationSuccess() {
    await expect(
      this.page.getByText(/Trade Tariff API key created/i),
    ).toBeVisible();
    await expect(
      this.page.getByText(/copy your client secret now/i),
    ).toBeVisible();
    await expect(
      this.page.locator("#trade-tariff-client-secret"),
    ).toBeVisible();
    await expect(
      this.page.getByRole("button", { name: /copy secret/i }),
    ).toBeVisible();
  }

  async assertRevokeConfirmationPage(description) {
    await expect(
      this.page.getByText(
        /Your Trade Tariff API key will be revoked with immediate effect/i,
      ),
    ).toBeVisible();
    await expect(this.page.getByText(description)).toBeVisible();
  }

  async assertDeleteConfirmationPage(description) {
    await expect(
      this.page.getByText(
        /Your Trade Tariff API key will be deleted with immediate effect/i,
      ),
    ).toBeVisible();
    await expect(this.page.getByText(description)).toBeVisible();
  }

  getSecret(description) {
    return description in this.secrets ? this.secrets[description] : null;
  }

  async storeSecret(description) {
    const secret = await this.page
      .locator("#trade-tariff-client-secret")
      .innerText();
    this.secrets[description] = secret.trim();
  }

  assertNewKeyPage() {
    expect(this.page.url()).toContain("keys/new");
  }

  assertRevokeKeyPage() {
    expect(this.page.url()).toMatch(/keys\/.*\/revoke/);
  }

  assertDeleteKeyPage() {
    expect(this.page.url()).toMatch(/keys\/.*\/delete/);
  }

  assertKeysPage() {
    expect(this.page.url()).toContain("keys");
  }

  keyRow(description) {
    return this.page.getByRole("row").filter({ hasText: description });
  }

  async navigateToTradeTab() {
    const tradeTab = this.page
      .getByRole("link", { name: /Trade Tariff Keys/i })
      .or(this.page.getByRole("tab", { name: /Trade Tariff Keys/i }));
    await tradeTab.click();
    await this.page.waitForLoadState("networkidle");
  }

  async ensureOnKeysPage() {
    if (!this.page.url().includes("/trade_tariff_keys")) {
      const baseUrl = this.page.url().split("/").slice(0, 3).join("/");
      await this.page.goto(`${baseUrl}/trade_tariff_keys`);
      await this.page.waitForLoadState("networkidle");
    }
  }
}
