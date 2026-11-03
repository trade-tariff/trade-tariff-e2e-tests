import { expect } from "@playwright/test";

export default class KeysPage {
  constructor(page) {
    this.page = page;
    this.secrets = {};
  }

  async createKey(description) {
    await this.page
      .getByRole("link", {
        name: /create new (?:trade tariff) key/i,
      })
      .click();

    await this.keyDescriptionInput().fill(description);
    await this.continueButton().click();
    await this.assertKeyCreationSuccess();
    await this.setSecret(description);
    await this.backLink().click();

    await this.assertKeyCreated(description);
  }

  async revokeKey(description) {
    const revokeLink = this.revokeLink(this.keyRow(description));

    if (!(await revokeLink.isVisible())) return;
    await revokeLink.click();

    this.assertRevokeKeyPage();
    await this.assertRevokeConfirmationPage(description);
    await this.revokeButton().click();
    await this.assertKeyRevoked(description);
  }

  async deleteKey(description) {
    const deleteLink = this.deleteLink(this.keyRow(description));

    if (!(await deleteLink.isVisible())) return;
    await deleteLink.click();

    this.assertDeleteKeyPage();
    await this.assertDeleteConfirmationPage(description);
    await this.deleteButton().click();
    await this.assertDeleted(description);
  }

  getSecret(description) {
    return description in this.secrets ? this.secrets[description] : null;
  }

  async setSecret(locator, description) {
    const secret = await this.page.locator(locator).innerText();
    this.secrets[description] = secret.trim();
  }

  // Assertions
  async assertKeyCreated(description) {
    const keyRow = this.keyRow(description);
    await expect(keyRow).toBeVisible();
    await expect(this.statusCell()).toContainText(/active/i);
    await expect(this.descriptionCell(description)).toContainText(description);
    await expect(this.revokeLink()).toBeVisible();
  }

  async assertKeyCreationSuccess() {
    await expect(this.keyCreatedText()).toBeVisible();
    await expect(this.secret()).toBeVisible();
    await expect(this.copyButton()).toBeVisible();
  }

  async assertKeyRevoked(description) {
    const keyRow = this.keyRow(description);
    await expect(keyRow).toBeVisible();
    await expect(this.statusCell().toContainText(/revoked/i));
    await expect(this.descriptionCell(description)).toContainText(description);
    await expect(this.revokeLink().toBeVisible());
  }

  async assertKeyDeleted(description) {
    const keyRow = this.keyRow(description);
    await expect(keyRow).not.toBeVisible();
  }

  async assertRevokeConfirmationPage(description) {
    await expect(
      this.page.getByText(
        /your (?:trade tariff) api key will be revoked with immediate effect/i,
      ),
    ).toBeVisible();
    await expect(this.page.getByText(description)).toBeVisible();
  }

  async assertDeleteConfirmationPage(description) {
    await expect(
      this.page.getByText(
        /your (?:trade tariff) api key will be deleted with immediate effect/i,
      ),
    ).toBeVisible();
    await expect(this.page.getByText(description)).toBeVisible();
  }

  // Locators
  keyCreatedText() {
    return this.page.getByText(/(?:trade tariff) api key created/i);
  }

  revokeLink(row) {
    return row.getByRole("link", {
      name: "Revoke",
    });
  }

  revokeButton() {
    return this.page.getByRole("button", {
      name: "Revoke",
    });
  }

  deleteLink(row) {
    return row.getByRole("link", {
      name: "Delete",
    });
  }

  deleteButton() {
    return this.page.getByRole("button", {
      name: "Delete",
    });
  }

  continueButton() {
    return this.page.getByRole("button", {
      name: /continue/i,
    });
  }

  backLink() {
    return this.page.getByRole("link", {
      name: /back to (?:trade tariff) keys/i,
    });
  }

  copyButton() {
    return this.page.getByRole("button").filter({ hasText: /copy/i });
  }

  keyRow(description) {
    return this.page.getByRole("row").filter({ hasText: description });
  }

  statusCell() {
    return this.page.getByTestId("status_cell");
  }

  descriptionCell(description) {
    return this.keyRow(description).locator("td").first();
  }

  keyDescriptionInput() {
    return this.page.getByTestId("key_description_input");
  }

  secret() {
    // will find whichever is visible using the :visible pseudo-class
    return this.page.locator(
      "code#api-key-secret:visible",
      "code#trade-tariff-client-secret:visible",
    );
  }

  fpoKeysTabLink() {
    return this.page.getByRole("link", {
      name: /fpo keys/i,
    });
  }

  tariffKeysTabLink() {
    return this.page.getByRole("link", {
      name: /trade tariff keys/i,
    });
  }
}
