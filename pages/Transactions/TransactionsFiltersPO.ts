import { expect, Page, Locator } from "@playwright/test";
import { pause } from "../../utils/common";

const EXPECT_TIMEOUT = 15_000;

export default class TransactionsFilters {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ================= Tabs / Table =================

  getTransactionsTab(): Locator {
    return this.page.locator("a", { hasText: "Transactions" });
  }

  getTransactionsLabel(): Locator {
    return this.page.locator("h2", { hasText: "Transactions" });
  }

  getTransactionsRows(): Locator {
    return this.page.locator("tbody tr");
  }

  getFirstRow(): Locator {
    return this.getTransactionsRows().first();
  }

  getCell(row: Locator, nth1Based: number): Locator {
    return row.locator(`td:nth-child(${nth1Based})`);
  }

  getSourceTypeBadge(row: Locator): Locator {
    return this.getCell(row, 7).locator(".rounded-full").first();
  }

  async getFirstRowSourceType(): Promise<string> {
    const row = this.getFirstRow();
    await expect(row).toBeVisible({ timeout: EXPECT_TIMEOUT });
    return (await this.getSourceTypeBadge(row).innerText()).trim();
  }

  async getFirstRowEmail(): Promise<string> {
    const row = this.getFirstRow();
    await expect(row).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const cellText = await this.getCell(row, 8).innerText();
    const match = cellText.match(/[^\s]+@[^\s]+\.[^\s]+/);
    expect(match).not.toBeNull();
    return match![0];
  }

  async getFirstRowStatus(): Promise<string> {
    const row = this.getFirstRow();
    await expect(row).toBeVisible({ timeout: EXPECT_TIMEOUT });
    return (await this.getCell(row, 6).innerText()).trim();
  }

  async getFirstRowTransactionType(): Promise<string> {
    const row = this.getFirstRow();
    await expect(row).toBeVisible({ timeout: EXPECT_TIMEOUT });
    return (await this.getCell(row, 4).innerText()).trim();
  }

  async getFirstRowCreatedAtText(): Promise<string> {
    const row = this.getFirstRow();
    await expect(row).toBeVisible({ timeout: EXPECT_TIMEOUT });
    return (await this.getCell(row, 3).innerText()).trim();
  }

  async getFirstRowAmountNumber(): Promise<number> {
    const row = this.getFirstRow();
    await expect(row).toBeVisible({ timeout: EXPECT_TIMEOUT });
    const raw = (await this.getCell(row, 5).innerText()).trim();
    const n = Number(raw.replace(/[^0-9.]/g, ""));
    expect(Number.isFinite(n)).toBeTruthy();
    return n;
  }

  // ================= Filters sidebar =================

  getSearchInputField(): Locator {
    return this.page.getByPlaceholder(/user email/i);
  }

  private getDropdownTriggerInSection(sectionLabel: string): Locator {
    const label = this.page.getByText(sectionLabel, { exact: true });

    return label.locator("xpath=ancestor::div[contains(@class,'space-y-') or contains(@class,'mb-')][1]").locator("button").first();
  }

  getSourceDropdown(): Locator {
    return this.getDropdownTriggerInSection("Source");
  }

  getStatusDropdown(): Locator {
    return this.getDropdownTriggerInSection("Status");
  }

  getTransactionTypeDropdown(): Locator {
    return this.getDropdownTriggerInSection("Entry Type");
  }

  getStartedAtFilter(): Locator {
    return this.page.locator('div.cursor-pointer:has-text("Select dates")').first();
  }

  getAmountMinInput(): Locator {
    return this.page.getByPlaceholder(/^min$/i);
  }

  getAmountMaxInput(): Locator {
    return this.page.getByPlaceholder(/^max$/i);
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

  getHideButton(): Locator {
    return this.page.locator("button", { hasText: "Hide sidebar" });
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

  getDeleteSavedFilterButtonFor(filterName: string): Locator {
    return this.page.locator("div, span").filter({ hasText: filterName }).locator(".lucide-trash");
  }

  getDeleteSavedFilterButton(): Locator {
    return this.page.locator(".lucide-trash");
  }

  getSuccessNotification(): Locator {
    return this.page.locator("[aria-label='Notifications alt+T']");
  }

  // ================= Helpers =================

  private async waitTableOrNoData() {
    await Promise.race([
      this.getTransactionsRows().first().waitFor({ state: "visible", timeout: EXPECT_TIMEOUT }),
      this.page.getByText(/no data/i).waitFor({ state: "visible", timeout: EXPECT_TIMEOUT }),
    ]).catch(() => {});
  }

  async openTransactions() {
    await this.getTransactionsTab().click();

    await expect(this.getTransactionsLabel()).toBeVisible({
      timeout: EXPECT_TIMEOUT,
    });

    await this.page.locator("th:nth-child(1)", { hasText: /transaction id/i }).waitFor({ state: "visible", timeout: EXPECT_TIMEOUT });

    await expect(this.getTransactionsRows().first()).toBeVisible({
      timeout: EXPECT_TIMEOUT,
    });
  }

  async applyFiltersAndWait() {
    const filterBtn = this.getFilterResultsButton();

    await Promise.all([this.page.waitForLoadState("networkidle"), filterBtn.click({ force: true })]);

    await expect(filterBtn).toBeEnabled({ timeout: EXPECT_TIMEOUT });

    await this.waitTableOrNoData();
  }

  async clearFiltersAndWait() {
    const filterBtn = this.getFilterResultsButton();

    await this.getClearFiltersButton().click({ force: true });

    await expect(filterBtn).toBeEnabled({ timeout: EXPECT_TIMEOUT });

    await this.waitTableOrNoData();
  }

  async assertTableOrNoData(assertRows: () => Promise<void>) {
    const rows = this.getTransactionsRows();
    const count = await rows.count();

    if (count > 0) {
      await assertRows();
    } else {
      await expect(this.page.getByText(/no data/i)).toBeVisible({
        timeout: EXPECT_TIMEOUT,
      });
    }
  }

  async selectDropdownValue(dropdown: Locator, value: string, delay = 80) {
    await dropdown.click({ force: true });

    const input = this.getCommandInput();
    await expect(input).toBeVisible({ timeout: EXPECT_TIMEOUT });

    await input.fill("");
    await input.pressSequentially(value, { delay });

    const option = this.page
      .getByRole("option", {
        name: new RegExp(value, "i"),
      })
      .first();

    await expect(option).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await option.click();

    await this.page.keyboard.press("Escape");
  }

  async setAmountRange(min: number, max: number) {
    const minInput = this.getAmountMinInput();
    const maxInput = this.getAmountMaxInput();

    await expect(minInput).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await expect(maxInput).toBeVisible({ timeout: EXPECT_TIMEOUT });

    await minInput.fill(String(min));
    await maxInput.fill(String(max));
  }

  // ================= Tests =================

  async verifySearchFilter() {
    await this.openTransactions();

    const email = await this.getFirstRowEmail();
    await this.getSearchInputField().fill(email);
    await this.applyFiltersAndWait();

    await this.assertTableOrNoData(async () => {
      await expect(this.getTransactionsRows().filter({ hasText: email }).first()).toBeVisible({ timeout: EXPECT_TIMEOUT });
    });

    await this.clearFiltersAndWait();
  }

  async verifyPSPsFilter() {
    await this.openTransactions();

    const sourceType = await this.getFirstRowSourceType();
    await this.selectDropdownValue(this.getSourceDropdown(), sourceType);
    await this.applyFiltersAndWait();

    await this.assertTableOrNoData(async () => {
      const rows = this.getTransactionsRows();
      const count = await rows.count();

      for (let i = 0; i < count; i++) {
        await expect(this.getSourceTypeBadge(rows.nth(i))).toHaveText(sourceType, {
          timeout: EXPECT_TIMEOUT,
        });
      }
    });

    await this.clearFiltersAndWait();
  }

  async verifyStatusFilter() {
    await this.openTransactions();

    const status = "Cancelled";
    await this.selectDropdownValue(this.getStatusDropdown(), status);

    await this.applyFiltersAndWait();

    const rows = this.getTransactionsRows();
    await expect(rows.first()).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i).locator("td:nth-child(6)")).toHaveText(status, { timeout: EXPECT_TIMEOUT });
    }

    await this.clearFiltersAndWait();
  }

  async verifySubTypeFilter() {
    await this.openTransactions();

    const sourceType = "InternalTransfer";
    await this.selectDropdownValue(this.getSourceDropdown(), sourceType);
    await this.applyFiltersAndWait();

    await this.assertTableOrNoData(async () => {
      const rows = this.getTransactionsRows();
      const count = await rows.count();

      for (let i = 0; i < count; i++) {
        await expect(this.getSourceTypeBadge(rows.nth(i))).toHaveText(sourceType, { timeout: EXPECT_TIMEOUT });
      }
    });
    await this.clearFiltersAndWait();
  }

  async verifyTransactionTypeFilter() {
    await this.openTransactions();

    const transactionType = await this.getFirstRowTransactionType();
    await this.selectDropdownValue(this.getTransactionTypeDropdown(), transactionType);

    await this.applyFiltersAndWait();

    await this.assertTableOrNoData(async () => {
      const rows = this.getTransactionsRows();
      const count = await rows.count();

      for (let i = 0; i < count; i++) {
        await expect(rows.nth(i).locator("td:nth-child(4)")).toHaveText(transactionType, { timeout: EXPECT_TIMEOUT });
      }
    });

    await this.clearFiltersAndWait();
  }

  async verifyStartedAtFilter() {
    await this.openTransactions();

    const trigger = this.getStartedAtFilter();
    await trigger.click({ force: true });

    const datePopup = this.page
      .locator('[role="dialog"], [data-radix-popper-content-wrapper], [data-state="open"]')
      .filter({ hasText: "This Month" })
      .first();

    await expect(datePopup).toBeVisible({ timeout: EXPECT_TIMEOUT });

    await datePopup.getByText("This Month", { exact: true }).click();

    await this.applyFiltersAndWait();

    await this.assertTableOrNoData(async () => {
      await expect(this.getTransactionsRows().first()).toBeVisible({
        timeout: EXPECT_TIMEOUT,
      });
    });

    await this.clearFiltersAndWait();
  }

  async verifyAmountFilter() {
    await this.openTransactions();

    const min = 100;
    const max = 200;

    await this.getAmountMinInput().fill(String(min));
    await this.getAmountMinInput().press("Tab");

    await this.getAmountMaxInput().fill(String(max));
    await this.getAmountMaxInput().press("Tab");

    await this.applyFiltersAndWait();
    await pause(this.page);

    await this.assertTableOrNoData(async () => {
      const rows = this.getTransactionsRows();
      const count = await rows.count();

      const firstRowText = await rows.first().textContent();
      if (firstRowText?.includes("No data")) {
        await expect(this.page.locator("tbody tr")).toContainText("No data", { timeout: EXPECT_TIMEOUT });
      } else {
        for (let i = 0; i < count; i++) {
          const raw = await rows.nth(i).locator("td:nth-child(5)").innerText();
          const value = Number(raw.replace(/[^0-9.]/g, ""));

          expect(value).toBeGreaterThanOrEqual(min);
          expect(value).toBeLessThanOrEqual(max);
        }
      }
    });

    await this.clearFiltersAndWait();
  }

  async verifyMultipleFilters() {
    await this.openTransactions();

    const status = "Cancelled";
    const transactionType = "Deposit";

    await this.selectDropdownValue(this.getStatusDropdown(), status);
    await pause(this.page);
    await this.selectDropdownValue(this.getTransactionTypeDropdown(), transactionType);
    await this.applyFiltersAndWait();

    await this.assertTableOrNoData(async () => {
      const rows = this.getTransactionsRows();
      const count = await rows.count();

      for (let i = 0; i < count; i++) {
        const row = rows.nth(i);
        await expect(row.locator("td:nth-child(6)")).toHaveText(status, { timeout: EXPECT_TIMEOUT });
        await expect(row.locator("td:nth-child(4)")).toHaveText(transactionType, { timeout: EXPECT_TIMEOUT });
      }
    });

    await this.clearFiltersAndWait();
  }

  async verifySaveFilters(): Promise<string> {
    await this.openTransactions();

    const filterName = `QA_Filter_${Date.now()}`;

    await this.getSearchInputField().fill("joshua@fundingpips.com");
    await this.selectDropdownValue(this.getStatusDropdown(), "Cancelled");

    await this.getSaveFiltersButton().click();
    await this.getFilterNameInput().fill(filterName);
    await this.getSaveButton().click();

    await expect(this.getSuccessNotification()).toContainText("Successfully saved filter");

    return filterName;
  }

  async VerifyDeleteSavedFilter(filterName: string) {
    await this.openTransactions();

    await this.getSelectSavedFilterButton().click();

    const deleteBtn = this.getDeleteSavedFilterButtonFor(filterName);
    await expect(deleteBtn).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await deleteBtn.click();

    await expect(this.getSuccessNotification()).toContainText("Successfully deleted filter", { timeout: EXPECT_TIMEOUT });
  }

  async deleteAllSavedFilters() {
    await this.openTransactions();
    try {
      await this.getSelectSavedFilterButton().waitFor({ state: "visible", timeout: 5000 });
    } catch (error) {
      console.log("No saved filters found.");
      return;
    }
    while (await this.getSelectSavedFilterButton().isVisible()) {
      await this.getSelectSavedFilterButton().click();
      const deleteBtn = this.getDeleteSavedFilterButton().nth(0);

      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        await expect(this.getSuccessNotification()).toContainText("Successfully deleted filter", { timeout: EXPECT_TIMEOUT });
        await this.page.reload();
        await pause(this.page);
      } else {
        break;
      }
    }
  }

  async verifyHideButton() {
    await this.openTransactions();

    await this.getHideButton().click();
  }
}
