import { expect } from "@playwright/test";

/**
 * Page object for the FPO hub dashboard: organisation view, API keys tab,
 * create/revoke/delete key flows, and reading the created key value for API calls.
 */
export default class DashboardPage {
  constructor(page) {
    this.page = page;
    this.keys = {};
  }

  async createKey(description) {
    this.assertDashboardPage();

    await this.navigateToFpoKeysTab();

    await this.createKeyButton().click();

    this.assertNewKeyPage();

    await this.createKeyDescriptionInput().fill(description);
    await this.createKeySubmitButton().click();

    // Verify key creation success page
    await this.assertKeyCreationSuccess();

    await this.storeKey(description);

    // Click "Back to api keys" to see the key row in the table
    await this.backToDashboardLink().click();

    // After clicking back, we're on the /api_keys page where we can see the key row
    this.assertApiKeysPage();

    await this.assertKeyCreated(description);
  }

  async revokeKey(description) {
    // Navigate to /api_keys page (or use FPO Keys tab if on dashboard)
    await this.ensureOnApiKeysPage();

    await this.revokeKeyLink(description).click();

    this.assertRevokeKeyPage();
    await this.assertRevokeConfirmationPage(description);

    await this.revokeKeyButton().click();

    // After revoking, we're redirected back to the /api_keys page
    this.assertApiKeysPage();

    await this.assertRevoked(description);
  }

  async deleteKey(description) {
    // Navigate to /api_keys page (or use FPO Keys tab if on dashboard)
    await this.ensureOnApiKeysPage();

    await this.deleteKeyLink(description).click();

    this.assertDeleteKeyPage();
    await this.assertDeleteConfirmationPage(description);

    await this.deleteKeyButton().click();

    // After deleting, we're redirected back to the /api_keys page
    this.assertApiKeysPage();

    await this.assertDeleted(description);
  }

  async assertRevoked(description) {
    // We're already on the /api_keys page after revoking
    const keyRow = this.keyRow(description);
    await expect(keyRow).toBeVisible();

    // Verify status shows "Revoked"
    const statusCell = this.revokedKeyStatus(description);
    await expect(statusCell).toHaveText(this.revokedDate());

    // Verify "Delete" link is visible (replaces "Revoke" link)
    const deleteLink = this.deleteKeyLink(description);
    await expect(deleteLink).toBeVisible();
  }

  async assertDeleted(description) {
    // We're already on the /api_keys page after deleting
    const keyRow = this.keyRow(description);

    await expect(keyRow).not.toBeVisible();
  }

  async assertKeyCreated(description) {
    const keyRow = this.keyRow(description);
    await expect(keyRow).toBeVisible();

    // Verify status is "Active"
    const statusCell = this.keyStatus(description);
    await expect(statusCell).toContainText(/active/i);

    // Verify description matches
    const descriptionCell = this.keyDescription(description);
    await expect(descriptionCell).toContainText(description);

    // Verify "Revoke" link is visible for active keys
    const revokeLink = this.revokeKeyLink(description);
    await expect(revokeLink).toBeVisible();
  }

  async assertKeyCreationSuccess() {
    // Verify success panel
    await expect(
      this.page.getByText(/Your API Key has been created successfully/i),
    ).toBeVisible();

    // Verify warning message
    await expect(
      this.page.getByText(/You must copy this key to somewhere safe/i),
    ).toBeVisible();

    // Verify API Key secret is displayed
    await expect(this.createdApiKey()).toBeVisible();

    // Verify "Copy to clipboard" button exists
    await expect(this.copyToClipboardButton()).toBeVisible();
  }

  async assertRevokeConfirmationPage(description) {
    // Verify warning message
    await expect(
      this.page.getByText(
        /Your API Key will be revoked with immediate effect/i,
      ),
    ).toBeVisible();

    // Verify key details are shown (description should be visible)
    await expect(this.page.getByText(description)).toBeVisible();
  }

  async assertDeleteConfirmationPage(description) {
    // Verify warning message
    await expect(
      this.page.getByText(
        /Your API Key will be deleted with immediate effect/i,
      ),
    ).toBeVisible();

    // Verify key details are shown (description should be visible)
    await expect(this.page.getByText(description)).toBeVisible();
  }

  assertDashboardPage() {
    expect(this.page.url()).toMatch(
      /\/organisations\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  }

  assertNewKeyPage() {
    expect(this.page.url()).toContain("/api_keys/new");
  }

  assertRevokeKeyPage() {
    expect(this.page.url()).toMatch(/\/api_keys\/.*\/revoke/);
  }

  assertDeleteKeyPage() {
    expect(this.page.url()).toMatch(/\/api_keys\/.*\/delete/);
  }

  assertCreatePage() {
    expect(this.page.url()).toContain("/api_keys");
  }

  assertApiKeysPage() {
    expect(this.page.url()).toContain("/api_keys");
  }

  async storeKey(description) {
    let key = await this.createdApiKey().innerText();
    key = key.trim();

    this.setKey(description, key);
  }

  getKey(description) {
    if (description in this.keys) {
      return this.keys[description];
    }

    return null;
  }

  setKey(description, key) {
    this.keys[description] = key;
  }

  createKeyButton() {
    return this.page.getByRole("link", { name: "Create new key" });
  }

  createKeyDescriptionInput() {
    return this.page.locator("#api-key-description-field");
  }

  createKeySubmitButton() {
    return this.page.getByRole("button", { name: /continue/i });
  }

  createdApiKey() {
    return this.page.locator("code.govuk-code");
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

  /** Status cell is the 4th column in the API keys table (1-based). */
  keyStatus(description) {
    return this.keyRow(description).locator(
      "td.govuk-table__cell:nth-child(4)",
    );
  }

  revokedKeyStatus(description) {
    return this.keyStatus(description);
  }

  keyDescription(description) {
    return this.keyRow(description).locator("td").first();
  }

  copyToClipboardButton() {
    return this.page.getByRole("button", { name: /copy to clipboard/i });
  }

  /** Table row for the API key with this description. Avoids XPath injection by using filter. */
  keyRow(description) {
    return this.page.getByRole("row").filter({ hasText: description });
  }

  async navigateToFpoKeysTab() {
    const fpoKeysTab = this.fpoKeysTab();
    await fpoKeysTab.click();
    await this.page.waitForLoadState("networkidle");
  }

  async ensureOnApiKeysPage() {
    if (!this.page.url().includes("/api_keys")) {
      if (this.page.url().match(/\/organisations\/[0-9a-f-]+$/i)) {
        await this.navigateToFpoKeysTab();
      } else {
        // Build base URL (origin) from current URL and go to /api_keys
        await this.page.goto(
          `${this.page.url().split("/").slice(0, 3).join("/")}/api_keys`,
        );
        await this.page.waitForLoadState("networkidle");
      }
    }
  }

  fpoKeysTab() {
    return this.page
      .getByRole("link", { name: /FPO Keys/i })
      .or(this.page.getByRole("tab", { name: /FPO Keys/i }));
  }

  backToDashboardLink() {
    return this.page.getByRole("link", { name: "Back to api keys" });
  }

  revokedDate() {
    const today = new Date();
    const day = today.getDate();
    const month = today.toLocaleString("default", { month: "long" });
    const year = today.getFullYear();

    return `Revoked on ${day} ${month} ${year}`;
  }
}
