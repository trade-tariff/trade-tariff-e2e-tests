import { expect } from "@playwright/test";
/**
 * Page object for Trade Tariff key lifecycle on the dev hub.
 */
export class TradeTariffKeysPage {
  constructor(page) {
    this.page = page;
    this.secrets = {};
  }
  async createKey(description) {
    this.assertDashboardPage();
    await this.navigateToTradeTariffKeysTab();
    await this.createKeyButton().click();
    this.assertNewKeyPage();
    await this.createKeyDescriptionInput().fill(description);
    await this.createKeySubmitButton().click();
    // Intermediate success page (not the keys table): summary, secret + copy, token URL and curl — see hub trade_tariff_keys/create.
    const scopesText =
      await this.assertPostCreateSuccessPageAndReadScopes(description);
    await this.storeSecret(description);
    await this.backToTradeTariffKeysLink().click();
    this.assertTradeTariffKeysPage();
    await this.assertKeyCreated(description, scopesText);
  }
  async revokeKey(description) {
    await this.ensureOnTradeTariffKeysPage();
    await this.revokeKeyLink(description).click();
    this.assertRevokeKeyPage();
    await this.assertRevokeConfirmationPage(description);
    await this.revokeKeyButton().click();
    this.assertTradeTariffKeysPage();
    await this.assertRevoked(description);
  }
  async deleteKey(description) {
    await this.ensureOnTradeTariffKeysPage();
    await this.deleteKeyLink(description).click();
    this.assertDeleteKeyPage();
    await this.assertDeleteConfirmationPage(description);
    await this.deleteKeyButton().click();
    this.assertTradeTariffKeysPage();
    await this.assertDeleted(description);
  }
  getSecret(description) {
    if (description in this.secrets) return this.secrets[description];
    return null;
  }
  /**
   * Asserts the post-create page: summary (client id, description, scopes), client secret + copy,
   * token endpoint and example curl. Returns scopes text to match on the index table after "Back".
   */
  async assertPostCreateSuccessPageAndReadScopes(description) {
    await expect(
      this.page.getByRole("heading", { name: /Trade Tariff API key created/i }),
    ).toBeVisible();
    await expect(
      this.page.getByText(/Copy your client secret now/i),
    ).toBeVisible();
    const summary = this.page.locator("dl.govuk-summary-list");
    await expect(summary).toBeVisible();
    const clientIdText = (
      await this.summaryValueForKey("Client ID").innerText()
    ).trim();
    expect(
      clientIdText.length,
      "Client ID should be shown on success page",
    ).toBeGreaterThan(0);
    await expect(this.summaryValueForKey("Description")).toHaveText(
      description,
    );
    const scopesText = (
      await this.summaryValueForKey("Scopes").innerText()
    ).trim();
    expect(
      scopesText.length,
      "Scopes should be shown on success page",
    ).toBeGreaterThan(0);
    await expect(
      this.page.getByRole("heading", { name: /^Client secret$/i }),
    ).toBeVisible();
    await expect(this.createdClientSecret()).toBeVisible();
    await expect(this.copySecretButton()).toBeVisible();
    await expect(
      this.page.getByRole("heading", { name: /How to get an access token/i }),
    ).toBeVisible();
    await expect(
      this.page.getByText(/Use the token endpoint below/i),
    ).toBeVisible();
    await expect(this.tokenEndpointCode()).toBeVisible();
    await expect(this.curlCommandBlock()).toBeVisible();
    await expect(this.copyCurlCommandButton()).toBeVisible();
    return scopesText;
  }
  summaryValueForKey(key) {
    return this.page
      .locator(".govuk-summary-list__row")
      .filter({
        has: this.page.locator(".govuk-summary-list__key", { hasText: key }),
      })
      .locator(".govuk-summary-list__value");
  }
  async assertKeyCreated(description, scopesText) {
    const keyRow = this.keyRow(description);
    await expect(keyRow).toBeVisible();
    await expect(this.keyStatus(description)).toContainText(/active/i);
    await expect(this.keyDescription(description)).toContainText(description);
    await expect(this.keyScopes(description)).toContainText(scopesText);
    await expect(this.revokeKeyLink(description)).toBeVisible();
  }
  async assertRevoked(description) {
    const keyRow = this.keyRow(description);
    await expect(keyRow).toBeVisible();
    await expect(this.keyStatus(description)).toContainText(/revoked/i);
    await expect(this.deleteKeyLink(description)).toBeVisible();
  }
  async assertDeleted(description) {
    await expect(this.keyRow(description)).not.toBeVisible();
  }
  async assertRevokeConfirmationPage(description) {
    await expect(
      this.page.getByText(
        /Your Trade Tariff API Key will be revoked with immediate effect/i,
      ),
    ).toBeVisible();
    await expect(this.page.getByText(description)).toBeVisible();
  }
  async assertDeleteConfirmationPage(description) {
    await expect(
      this.page.getByText(
        /Your Trade Tariff API Key will be deleted with immediate effect/i,
      ),
    ).toBeVisible();
    await expect(this.page.getByText(description)).toBeVisible();
  }
  assertDashboardPage() {
    expect(this.page.url()).toMatch(/\/organisations\/[0-9a-f-]+$/i);
  }
  assertNewKeyPage() {
    expect(this.page.url()).toContain("/trade_tariff_keys/new");
  }
  assertRevokeKeyPage() {
    expect(this.page.url()).toMatch(/\/trade_tariff_keys\/.*\/revoke/);
  }
  assertDeleteKeyPage() {
    expect(this.page.url()).toMatch(/\/trade_tariff_keys\/.*\/delete/);
  }
  assertTradeTariffKeysPage() {
    expect(this.page.url()).toContain("/trade_tariff_keys");
  }
  async storeSecret(description) {
    const secret = (await this.createdClientSecret().innerText()).trim();
    this.secrets[description] = secret;
  }
  createKeyButton() {
    return this.page.getByRole("link", { name: "Create new Trade Tariff key" });
  }
  createKeyDescriptionInput() {
    return this.page.locator('input[name="trade_tariff_key_description"]');
  }
  createKeySubmitButton() {
    return this.page.getByRole("button", { name: /continue/i });
  }
  createdClientSecret() {
    return this.page.locator("#trade-tariff-client-secret");
  }
  copySecretButton() {
    return this.page.getByRole("button", { name: /copy secret/i });
  }
  tokenEndpointCode() {
    return this.page.locator("#trade-tariff-token-endpoint");
  }
  curlCommandBlock() {
    return this.page.locator("#trade-tariff-curl-command");
  }
  copyCurlCommandButton() {
    return this.page.getByRole("button", { name: /copy curl command/i });
  }
  backToTradeTariffKeysLink() {
    return this.page.getByRole("link", { name: "Back to Trade Tariff keys" });
  }
  keyRow(description) {
    return this.page.getByRole("row").filter({ hasText: description });
  }
  /** Status is the 5th column in Trade Tariff keys table. */
  keyStatus(description) {
    return this.keyRow(description).locator(
      "td.govuk-table__cell:nth-child(5)",
    );
  }
  keyDescription(description) {
    // Row starts with a <th> (Client ID), so the first <td> is Description.
    return this.keyRow(description).locator("td").nth(0);
  }
  /** Scopes column (3rd data column) on Trade Tariff keys index table. */
  keyScopes(description) {
    return this.keyRow(description).locator(
      "td.govuk-table__cell:nth-child(3)",
    );
  }
  revokeKeyLink(description) {
    return this.keyRow(description).getByRole("link", { name: "Revoke" });
  }
  deleteKeyLink(description) {
    return this.keyRow(description).getByRole("link", { name: "Delete" });
  }
  revokeKeyButton() {
    return this.page.getByRole("button", { name: "Revoke" });
  }
  deleteKeyButton() {
    return this.page.getByRole("button", { name: "Delete" });
  }
  async navigateToTradeTariffKeysTab() {
    await this.tradeTariffKeysTab().click();
    await this.page.waitForLoadState("networkidle");
  }
  async ensureOnTradeTariffKeysPage() {
    if (!this.page.url().includes("/trade_tariff_keys")) {
      if (this.page.url().match(/\/organisations\/[0-9a-f-]+$/i)) {
        await this.navigateToTradeTariffKeysTab();
      } else {
        const origin = this.page.url().split("/").slice(0, 3).join("/");
        await this.page.goto(`${origin}/trade_tariff_keys`);
        await this.page.waitForLoadState("networkidle");
      }
    }
  }
  tradeTariffKeysTab() {
    return this.page
      .getByRole("link", { name: /Trade Tariff Keys/i })
      .or(this.page.getByRole("tab", { name: /Trade Tariff Keys/i }));
  }
}
