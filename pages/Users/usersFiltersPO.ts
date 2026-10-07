import { expect, Page, Locator } from "@playwright/test";
import { pause } from "../../utils/common";

const EXPECT_TIMEOUT = 15_000;

export default class UsersFilters {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ================= Tabs / Table =================

  getUsersTab(): Locator {
    return this.page.locator("a", { hasText: "Users" });
  }

  getUsersLabel(): Locator {
    return this.page.locator("h2", { hasText: "Users" });
  }

  getUsersRows(): Locator {
    return this.page.locator("tbody tr");
  }

  getFirstRow(): Locator {
    return this.getUsersRows().first();
  }

  // 1 Created at, 2 Name, 3 Country, 4 Brand, 5 Email, 6 KYC, 7 Tags, 8 Phone...
  getCell(row: Locator, nth1Based: number): Locator {
    return row.locator(`td:nth-child(${nth1Based})`);
  }

  async getFirstRowEmail(): Promise<string> {
    const row = this.getFirstRow();
    await expect(row).toBeVisible({ timeout: EXPECT_TIMEOUT });
    const email = (await this.getCell(row, 5).innerText()).trim();
    expect(email).toMatch(/.+@.+\..+/);
    return email;
  }

  async getFirstRowKyc(): Promise<string> {
    const row = this.getFirstRow();
    await expect(row).toBeVisible({ timeout: EXPECT_TIMEOUT });
    return (await this.getCell(row, 6).innerText()).trim();
  }

  // ================= Filters sidebar =================

  getSearchInput(): Locator {
    return this.page.locator('input[name="search_field"]');
  }

  getEmailInput(): Locator {
    return this.page.getByPlaceholder(/search for email/i);
  }

  getKYCnameInput(): Locator {
    return this.page.getByPlaceholder(/search for KYC name|KYC name/i);
  }

  private getDropdownTriggerInSection(sectionLabel: string): Locator {
    const label = this.page.getByText(sectionLabel, { exact: true });
    return label.locator("xpath=ancestor::div[contains(@class,'space-y-') or contains(@class,'mb-')][1]").locator("button").first();
  }

  getKycDropdown(): Locator {
    return this.getDropdownTriggerInSection("KYC Status");
  }

  getCountryDropdown(): Locator {
    return this.getDropdownTriggerInSection("Country");
  }

  getCommandInput(): Locator {
    return this.page.locator('[data-slot="command-input"]:visible').first();
  }

  getFilterResultsButton(): Locator {
    return this.page.locator("button", { hasText: /Filter results/i });
  }

  getClearFiltersButton(): Locator {
    return this.page.locator("button", { hasText: "Clear Filters" });
  }

  getSaveFiltersButton(): Locator {
    return this.page.locator("button", { hasText: "Save filters" });
  }

  getFilterNameInput(): Locator {
    return this.page.locator("#filter-name");
  }

  getSaveButton(): Locator {
    return this.page.locator('[role="dialog"] button', { hasText: "Save" });
  }

  getSelectSavedFilterButton(): Locator {
    return this.page.locator("button", { hasText: "Select filter" });
  }

  getDeleteSavedFilterButton(): Locator {
    return this.page.locator(".lucide-trash");
  }

  getSuccessNotification(): Locator {
    return this.page.locator("[aria-label='Notifications alt+T']");
  }

  // ================= Helpers =================

  private escapeRegExp(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private async waitTableOrNoData() {
    await Promise.race([
      this.getUsersRows().first().waitFor({ state: "visible", timeout: EXPECT_TIMEOUT }),
      this.page.getByText(/no data/i).waitFor({ state: "visible", timeout: EXPECT_TIMEOUT }),
    ]).catch(() => {});
  }

  async openUsers() {
    await this.getUsersTab().click();
    await expect(this.getUsersLabel()).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await this.page.locator("th:nth-child(1)", { hasText: "CREATED AT" }).waitFor({ state: "visible", timeout: EXPECT_TIMEOUT });
    await expect(this.getUsersRows().first()).toBeVisible({ timeout: EXPECT_TIMEOUT });
  }

  async applyFiltersAndWait() {
    const filterBtn = this.getFilterResultsButton();
    await Promise.all([this.page.waitForLoadState("networkidle"), filterBtn.click({ force: true })]);
    await expect(filterBtn).toBeEnabled();
  }

  async clearFiltersAndWait() {
    const filterBtn = this.getFilterResultsButton();
    await this.getClearFiltersButton().click({ force: true });
    await expect(filterBtn).toBeEnabled();
    await this.waitTableOrNoData();
  }

  async assertTableOrNoData(assertRows: () => Promise<void>) {
    const rows = this.getUsersRows();
    const count = await rows.count();

    if (count > 0) {
      await assertRows();
    } else {
      await expect(this.page.getByText(/no data/i)).toBeVisible({ timeout: EXPECT_TIMEOUT });
    }
  }

  async selectDropdownValue(dropdown: Locator, value: string, delay = 80) {
    await dropdown.click({ force: true });

    const input = this.getCommandInput();
    await expect(input).toBeVisible({ timeout: EXPECT_TIMEOUT });

    await input.fill("");
    await input.pressSequentially(value, { delay });

    await input.press("ArrowDown");
    await input.press("Enter");

    await this.page.keyboard.press("Escape");
  }

  async selectKycExact(status: string, delay = 80) {
    await this.getKycDropdown().click({ force: true });

    const input = this.getCommandInput();
    await expect(input).toBeVisible({ timeout: EXPECT_TIMEOUT });

    await input.fill("");
    await input.pressSequentially(status, { delay });

    const safe = this.escapeRegExp(status);
    const option = this.page
      .locator('[role="option"]:visible')
      .filter({ hasText: new RegExp(`^${safe}$`, "i") })
      .first();

    await expect(option).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await option.click({ force: true });

    await this.page.keyboard.press("Escape");
  }

  async selectCountryFR(delay = 80) {
    await this.getCountryDropdown().click({ force: true });

    const input = this.getCommandInput();
    await expect(input).toBeVisible({ timeout: EXPECT_TIMEOUT });

    await input.fill("");
    await input.pressSequentially("FR", { delay });

    const option = this.page.locator('[role="option"]:visible', { hasText: "France" }).first();
    await expect(option).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await option.click({ force: true });

    await this.page.mouse.click(0, 0);
    await pause(this.page, 500);
  }

  // ================= Tests =================

  async verifySearchFilter() {
    await this.openUsers();
    const email = await this.getFirstRowEmail();
    await this.getSearchInput().fill(email);
    await this.applyFiltersAndWait();

    await this.assertTableOrNoData(async () => {
      await expect(this.getUsersRows().filter({ hasText: email }).first()).toBeVisible({ timeout: EXPECT_TIMEOUT });
    });
    await this.clearFiltersAndWait();
  }

  async verifyEmailFilter() {
    await this.openUsers();
    const email = await this.getFirstRowEmail();
    await this.getEmailInput().fill(email);
    await this.applyFiltersAndWait();

    await this.assertTableOrNoData(async () => {
      await expect(this.getUsersRows().filter({ hasText: email }).first()).toBeVisible({ timeout: EXPECT_TIMEOUT });
    });
    await this.clearFiltersAndWait();
  }

  async verifyKYCname() {
    await this.openUsers();
    const needle = "Sheila";
    await this.getKYCnameInput().fill(needle);
    await this.applyFiltersAndWait();

    await this.assertTableOrNoData(async () => {
      await expect(this.getUsersRows().first()).toBeVisible({ timeout: EXPECT_TIMEOUT });
    });

    await this.clearFiltersAndWait();
  }

  async verifyKycStatusFilter() {
    await this.openUsers();
    await this.clearFiltersAndWait();
    const kyc = await this.getFirstRowKyc();
    if (!kyc || kyc.toLowerCase() === "all") return;

    await this.selectKycExact(kyc);
    await this.applyFiltersAndWait();
    await this.assertTableOrNoData(async () => {
      const rows = this.getUsersRows();
      const count = await rows.count();

      for (let i = 0; i < count; i++) {
        await expect(rows.nth(i).locator("td:nth-child(6)")).toHaveText(kyc, { timeout: EXPECT_TIMEOUT });
      }
    });
    await this.clearFiltersAndWait();
  }

  async verifyCountryFilter() {
    await this.openUsers();
    const expectedCode = "FR";
    await this.selectCountryFR();
    await this.applyFiltersAndWait();
    await pause(this.page, 1000);

    await this.assertTableOrNoData(async () => {
      const rows = this.getUsersRows();
      const count = await rows.count();

      for (let i = 0; i < count; i++) {
        await expect(rows.nth(i).locator("td:nth-child(3)")).toHaveText(expectedCode, { timeout: EXPECT_TIMEOUT });
      }
    });
    await this.clearFiltersAndWait();
  }

  async verifyTagsFilter() {
    await this.openUsers();
    await this.page.locator('.space-y-2 [type="button"]').nth(2).click();
    await this.page.locator('[data-slot="command-input"]').pressSequentially("new12", { delay: 200 });
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.locator('[type="submit"]').click();
    await expect(this.page.locator('[type="submit"]')).toBeEnabled();

    await this.assertTableOrNoData(async () => {
      const rows = this.getUsersRows();
      const count = await rows.count();

      for (let i = 0; i < count; i++) {
        const tagText = (await rows.nth(i).locator("td:nth-child(7)").textContent())?.trim() ?? "";
        expect(tagText).toContain("#new12");
      }
    });
    await this.clearFiltersAndWait();
  }

  async verifyCombinedFilters() {
    await this.openUsers();
    await this.selectCountryFR();
    await this.applyFiltersAndWait();
    const email = await this.getFirstRowEmail();
    const kyc = await this.getFirstRowKyc();
    await this.getEmailInput().fill(email);
    await this.selectDropdownValue(this.getKycDropdown(), kyc);
    await this.applyFiltersAndWait();

    await this.assertTableOrNoData(async () => {
      const rows = this.getUsersRows();
      const count = await rows.count();

      for (let i = 0; i < count; i++) {
        const row = rows.nth(i);
        await expect(row.locator("td:nth-child(3)")).toHaveText("FR", { timeout: EXPECT_TIMEOUT });
        await expect(row.locator("td:nth-child(5)")).toHaveText(email, { timeout: EXPECT_TIMEOUT });
        await expect(row.locator("td:nth-child(6)")).toHaveText(kyc, { timeout: EXPECT_TIMEOUT });
      }
    });
    await this.clearFiltersAndWait();
  }

  async verifySaveFilters() {
    await this.openUsers();
    const email = await this.getFirstRowEmail();
    await this.getEmailInput().fill(email);
    await this.getSaveFiltersButton().click({ force: true });
    await expect(this.getFilterNameInput()).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const filterName = `QA_Users_Filter_${Date.now()}`;
    await this.getFilterNameInput().fill(filterName);
    const saveBtn = this.getSaveButton();
    await expect(saveBtn).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await saveBtn.click();
    await expect(this.getSuccessNotification()).toContainText("Successfully saved filter.", { timeout: EXPECT_TIMEOUT });
    await this.clearFiltersAndWait();
  }

  async deleteSavedFilter() {
    await this.openUsers();
    await this.getSelectSavedFilterButton().click({ force: true });
    await this.getDeleteSavedFilterButton().click({ force: true });
    await expect(this.getSuccessNotification()).toContainText("Successfully deleted filter.", { timeout: EXPECT_TIMEOUT });
    await this.clearFiltersAndWait();
  }
}
