import { expect, Page, Locator } from "@playwright/test";
import { pause } from "../../utils/common";

export default class Templates {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  getDialog() {
    return this.page.getByRole("dialog");
  }

  getTemplatesTab() {
    return this.page.getByRole("link", { name: "Templates", exact: true });
  }

  getHeading() {
    return this.page.getByRole("heading", { name: "Templates" });
  }

  getTableRows() {
    return this.page.locator("tbody tr");
  }

  getRowsByText(text: string) {
    return this.page.locator("tbody tr", { hasText: text });
  }

  getTemplateRowByText(text: string) {
    return this.getRowsByText(text).first();
  }

  getTemplatesQuantity() {
    return this.page.locator("h2", { hasText: "Templates" });
  }

  getTemplatesColumnName() {
    return this.page.locator("th.py-1", { hasText: "Name" });
  }

  getTemplatesColumnPhase() {
    return this.page.locator("th.py-1", { hasText: "Phase" });
  }

  getTemplatesColumnAccountType() {
    return this.page.locator("th.py-1", { hasText: "Account Type" });
  }

  getTemplatesColumnAccountSize() {
    return this.page.locator("th.py-1", { hasText: "Account Size" });
  }

  getTemplatesColumnActions() {
    return this.page.locator("th.py-1", { hasText: "Actions" });
  }

  getCreateButton() {
    return this.page.getByRole("button", { name: "Create Template" });
  }

  getSubmitButton() {
    return this.getDialog().getByRole("button", { name: "Create" });
  }

  getSuccessToast() {
    return this.page.getByText(/template created successfully/i).first();
  }

  getUpdateSuccessToast() {
    return this.page.getByText("Template updated successfully").first();
  }

  getName() {
    return this.page.locator("#name");
  }

  getContractIdentifier() {
    return this.page.locator("#contract_identifier");
  }

  getPurchasePrice() {
    return this.page.locator('[name="purchase_price"]');
  }

  getMinTradingDays() {
    return this.page.locator('[name="min_trading_days"]');
  }

  getMaxChallengeDuration() {
    return this.page.locator("#max_challenge_duration_days");
  }

  getPhaseDropdown() {
    return this.getDialog().getByRole("button").nth(0);
  }

  getAccountTypeDropdown() {
    return this.getDialog().getByRole("button").nth(1);
  }

  getAccountSizeDropdown() {
    return this.getDialog().getByRole("button").nth(2);
  }

  getLeverageDropdown() {
    return this.getDialog().getByRole("button").nth(3);
  }

  getUpgradeTemplateDropdown() {
    return this.getDialog().getByRole("button").nth(4);
  }

  getDropdownSearch() {
    return this.page.locator("[cmdk-root] input").first();
  }

  getSearchInput(): Locator {
    return this.page.locator('input[name="search_field"]');
  }

  getFilterResultsButton(): Locator {
    return this.page.locator("button", { hasText: /Filter results/i });
  }

  getEditButtonInRow(row: Locator): Locator {
    return row.locator("button:has(svg.lucide-pencil)").first();
  }

  getDeleteButtonInRow(row: Locator): Locator {
    return row.locator("td").last().locator("button").nth(1);
  }

  async openPage() {
    await this.getTemplatesTab().click();
    await expect(this.getHeading()).toBeVisible();
  }

  async searchTemplateByName(templateName: string) {
    await this.getSearchInput().fill(templateName);
    await pause(this.page);
    await this.getFilterResultsButton().click();
    await pause(this.page);
  }

  async verifyPageVisibility() {
    await this.openPage();

    await expect(this.getHeading()).toBeVisible();
    await expect(this.getTemplatesQuantity()).toBeVisible();
    await expect(this.getTemplatesColumnName()).toBeVisible();
    await expect(this.getTemplatesColumnPhase()).toBeVisible();
    await expect(this.getTemplatesColumnAccountType()).toBeVisible();
    await expect(this.getTemplatesColumnAccountSize()).toBeVisible();
    await expect(this.getTemplatesColumnActions()).toBeVisible();
  }

  async verifyTemplateCreation(templateName: string) {
    await this.openPage();

    await this.getCreateButton().click();
    await expect(this.getDialog()).toBeVisible();
    await pause(this.page);

    await this.getName().fill(templateName);
    await pause(this.page);

    await this.getContractIdentifier().fill(`contract_${templateName}`);
    await pause(this.page);

    await this.getPhaseDropdown().click();
    await this.page.getByRole("option", { name: "Master" }).click();
    await pause(this.page);

    await this.getAccountTypeDropdown().click();
    let search = this.getDropdownSearch();
    await search.fill("Two step");
    await this.page.keyboard.press("Enter");
    await pause(this.page);

    await this.getAccountSizeDropdown().click();
    search = this.getDropdownSearch();
    await search.fill("5000");
    await this.page.keyboard.press("Enter");
    await pause(this.page);

    await this.getPurchasePrice().fill("100");
    await pause(this.page);

    const submit = this.getSubmitButton();

    await expect(submit).toBeEnabled();
    await submit.click({ force: true });

    await submit.waitFor({ state: "detached" });

    await expect(this.getSuccessToast()).toBeVisible();
    await pause(this.page, 500);

    await this.searchTemplateByName(templateName);

    await expect.poll(async () => await this.getRowsByText(templateName).count()).toBeGreaterThan(0);
  }

  async verifyTemplateSearch(templateName: string) {
    await this.searchTemplateByName(templateName);

    await expect(this.getTemplateRowByText(templateName)).toBeVisible({
      timeout: 20000,
    });
  }

  async verifyTemplateEdit(templateName: string, updatedName: string) {
    await this.openPage();

    await this.searchTemplateByName(templateName);
    await pause(this.page);

    const row = this.getTemplateRowByText(templateName);
    await expect(row).toBeVisible();

    await row.hover();
    await this.getEditButtonInRow(row).click();

    const dialog = this.getDialog();
    await expect(dialog).toBeVisible();
    await pause(this.page);

    await this.getName().click({ clickCount: 3 });
    await this.getName().pressSequentially(updatedName, { delay: 50 });
    await pause(this.page);

    const saveBtn = dialog.getByRole("button", { name: "Save" });
    await expect(saveBtn).toBeEnabled({ timeout: 10000 });
    await saveBtn.click();

    await expect(this.getUpdateSuccessToast()).toBeVisible();
    await pause(this.page, 500);

    await this.searchTemplateByName(updatedName);
    await expect(this.getTemplateRowByText(updatedName)).toBeVisible({ timeout: 15000 });
  }

  async verifyTemplateDelete(templateName: string) {
    await this.openPage();

    await this.searchTemplateByName(templateName);

    const row = this.getTemplateRowByText(templateName);
    await expect(row).toBeVisible();

    await row.hover();
    await this.getDeleteButtonInRow(row).click();
    await pause(this.page);

    await this.page.getByRole("button", { name: /confirm/i }).click();

    await expect(this.page.getByText(/deleted successfully/i)).toBeVisible();
    await pause(this.page, 500);

    await this.searchTemplateByName(templateName);

    await expect(this.getRowsByText(templateName)).toHaveCount(0);
  }
}
