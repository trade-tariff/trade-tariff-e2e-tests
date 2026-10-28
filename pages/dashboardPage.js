import { expect } from "@playwright/test";

export default class DashboardPage {
  constructor(page) {
    this.page = page;
    this.keys = {};
  }

  async createKey(description) {
    this.assertDashboardPage();

    await this.navigateToFpoKeysTab();

    await this.page.getByRole("link", { name: "Create new key" }).click();

    this.assertNewKeyPage();

    await this.page.locator("#api-key-description-field").fill(description);
    await this.page.getByRole("button", { name: /continue/i }).click();

    await this.assertKeyCreationSuccess();

    await this.storeKey(description);

    await this.page.getByRole("link", { name: "Back to api keys" }).click();

    this.assertApiKeysPage();

    await this.assertKeyCreated(description);
  }

  async revokeKey(description) {
    await this.ensureOnApiKeysPage();

    const revokeButton = await this.keyRow(description).getByRole("link", {
      name: "Revoke",
    });

    if (!(await revokeButton.isVisible())) return; //already revoked, or never created;
    await revokeButton.click();

    this.assertRevokeKeyPage();
    await this.assertRevokeConfirmationPage(description);

    const revokedAt = new Date();
    await this.page.getByRole("button", { name: "Revoke" }).click();

    this.assertApiKeysPage();

    await this.assertRevoked(description, revokedAt);
  }

  async deleteKey(description) {
    await this.ensureOnApiKeysPage();

    const deleteButton = await this.keyRow(description).getByRole("link", {
      name: "Delete",
    });

    if (!(await deleteButton.isVisible())) return;
    await deleteButton.click();

    this.assertDeleteKeyPage();
    await this.assertDeleteConfirmationPage(description);

    await this.page.getByRole("button", { name: "Delete" }).click();

    this.assertApiKeysPage();

    await this.assertDeleted(description);
  }

  async assertRevoked(description, revokedAt = new Date()) {
    const keyRow = this.keyRow(description);
    await expect(keyRow).toBeVisible();

    // The revoke can cross midnight, so accept either date
    const revokedText = [
      ...new Set([this.revokedDate(revokedAt), this.revokedDate()]),
    ];
    const statusCell = keyRow.locator("td.govuk-table__cell:nth-child(4)");
    await expect(statusCell).toHaveText(
      new RegExp(`^(${revokedText.join("|")})$`),
    );

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

    const statusCell = keyRow.locator("td.govuk-table__cell:nth-child(4)");
    await expect(statusCell).toContainText(/active/i);

    const descriptionCell = keyRow.locator("td").first();
    await expect(descriptionCell).toContainText(description);

    const revokeLink = keyRow.getByRole("link", { name: "Revoke" });
    await expect(revokeLink).toBeVisible();
  }

  async assertKeyCreationSuccess() {
    await expect(
      this.page.getByText(/Your API Key has been created successfully/i),
    ).toBeVisible();
    await expect(
      this.page.getByText(/You must copy this key to somewhere safe/i),
    ).toBeVisible();
    await expect(this.page.locator("code.govuk-code")).toBeVisible();
    await expect(
      this.page.getByRole("button", { name: /copy to clipboard/i }),
    ).toBeVisible();
  }

  async assertRevokeConfirmationPage(description) {
    await expect(
      this.page.getByText(
        /Your API Key will be revoked with immediate effect/i,
      ),
    ).toBeVisible();
    await expect(this.page.getByText(description)).toBeVisible();
  }

  async assertDeleteConfirmationPage(description) {
    await expect(
      this.page.getByText(
        /Your API Key will be deleted with immediate effect/i,
      ),
    ).toBeVisible();
    await expect(this.page.getByText(description)).toBeVisible();
  }

  getKey(description) {
    return description in this.keys ? this.keys[description] : null;
  }

  async storeKey(description) {
    const key = await this.page.locator("code.govuk-code").innerText();
    this.keys[description] = key.trim();
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

  assertApiKeysPage() {
    expect(this.page.url()).toContain("/api_keys");
  }

  keyRow(description) {
    return this.page.getByRole("row").filter({ hasText: description });
  }

  async navigateToFpoKeysTab() {
    const fpoKeysTab = this.page
      .getByRole("link", { name: /FPO Keys/i })
      .or(this.page.getByRole("tab", { name: /FPO Keys/i }));
    await fpoKeysTab.click();
    await this.page.waitForLoadState("networkidle");
  }

  async ensureOnApiKeysPage() {
    if (!this.page.url().includes("/api_keys")) {
      if (this.page.url().match(/\/organisations\/[0-9a-f-]+$/i)) {
        await this.navigateToFpoKeysTab();
      } else {
        const baseUrl = this.page.url().split("/").slice(0, 3).join("/");
        await this.page.goto(`${baseUrl}/api_keys`);
        await this.page.waitForLoadState("networkidle");
      }
    }
  }

  revokedDate(date = new Date()) {
    const formattedDate = date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/London",
    });
    return `Revoked on ${formattedDate}`;
  }
}
