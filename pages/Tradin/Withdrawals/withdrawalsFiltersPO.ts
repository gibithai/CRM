import { expect, Page, Locator } from "@playwright/test";
import { pause } from "../../../utils/common";

const EXPECT_TIMEOUT = 15_000;

export default class WithdrawalsFilters {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  getWithdrawalsTab(): Locator {
    return this.page.getByRole("link", { name: "Withdrawals", exact: true });
  }

  getHeading(): Locator {
    return this.page.getByRole("heading", { name: "Withdrawals" });
  }

  getTableRows(): Locator {
    return this.page.locator("tbody tr");
  }

  getCell(row: Locator, nth1Based: number): Locator {
    return row.locator(`td:nth-child(${nth1Based})`);
  }

  getSearchByUserInput(): Locator {
    return this.page.locator('input[placeholder="User email or name"]');
  }

  getSearchByUserClearButton(): Locator {
    return this.page.locator('button[aria-label="Clear"]');
  }

  getStatusDropdown(): Locator {
    return this.page.getByText("Status", { exact: true }).locator("..").locator("button, select").first();
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

  // ===== Save/Delete Filters — matches colleague's Deposits.ts pattern exactly =====

  getSelectFilterButton(): Locator {
    return this.page.locator("button, [role='combobox']", { hasText: "Select filter" });
  }

  getDeleteSavedFilterButton(): Locator {
    return this.page.locator(".lucide-trash");
  }

  getFilterNameInputField(): Locator {
    return this.page.locator("#filter-name");
  }

  getSaveButton(): Locator {
    return this.page.locator('[role="dialog"] button', { hasText: "Save" });
  }

  getSuccessNotification(): Locator {
    return this.page.locator("[aria-label='Notifications alt+T']");
  }

  getSuccessNotificationCloseButton(): Locator {
    return this.page.locator('[aria-label="Close toast"]');
  }

  getDateFromInput(): Locator {
    return this.page.getByPlaceholder("Select dates");
  }

  getAmountMinInput(): Locator {
    return this.page.getByPlaceholder("Min");
  }

  getAmountMaxInput(): Locator {
    return this.page.getByPlaceholder("Max");
  }

  getDateRangeField(): Locator {
    return this.page.locator(".lucide-calendar").locator("..");
  }

  getThisMonthPresetButton(): Locator {
    return this.page.locator("button", { hasText: "This Month" });
  }

  async openPage() {
    await this.getWithdrawalsTab().click();
    await expect(this.getHeading()).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await expect(this.getTableRows().first()).toBeVisible({ timeout: EXPECT_TIMEOUT });

    // Wait for filter sidebar buttons to load - they're not rendering in automation without this
    await expect(this.getFilterResultsButton()).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await expect(this.getClearFiltersButton()).toBeVisible({ timeout: EXPECT_TIMEOUT });
  }

  async applyFiltersAndWait() {
    const filterBtn = this.getFilterResultsButton();
    await expect(filterBtn).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await filterBtn.click({ force: true });
    await this.page.waitForLoadState("networkidle");
    await expect(filterBtn).toBeEnabled();
  }

  async clearFiltersAndWait() {
    const clearBtn = this.getClearFiltersButton();
    await expect(clearBtn).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await clearBtn.click({ force: true });
    await this.page.waitForLoadState("networkidle");

    // "Clear Filters" resets Status/Date/Amount but not the Search by user field —
    // that field has its own "X" clear button (aria-label="Clear") inside the input.
    const searchClearBtn = this.getSearchByUserClearButton();
    if (await searchClearBtn.isVisible().catch(() => false)) {
      await searchClearBtn.click({ force: true });
      await pause(this.page, 300);
    }
    await expect(this.getSearchByUserInput()).toHaveValue("", { timeout: EXPECT_TIMEOUT });
  }

  async selectDropdownOption(dropdown: Locator, value: string) {
    await dropdown.click({ force: true });
    await pause(this.page);

    const input = this.getCommandInput();
    await expect(input).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await input.pressSequentially(value, { delay: 80 });

    const option = this.page.locator('[role="option"]:visible').filter({ hasText: value }).first();
    await expect(option).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await option.click({ force: true });

    await this.page.keyboard.press("Escape");
    await pause(this.page, 500);
  }

  async verifySearchByUserFilter(userName: string) {
    await this.openPage();
    await this.clearFiltersAndWait();

    const searchInput = this.getSearchByUserInput();
    await searchInput.fill(userName);
    await pause(this.page);

    // Wait for autocomplete dropdown to appear with suggestions
    const suggestion = this.page.locator('[role="option"]:visible').filter({ hasText: userName }).first();
    await expect(suggestion).toBeVisible({ timeout: EXPECT_TIMEOUT });

    // Click the suggestion to select it
    await suggestion.click({ force: true });
    await pause(this.page, 500);

    // Now apply the filter
    await this.applyFiltersAndWait();

    const rows = this.getTableRows();
    const count = await rows.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        await expect(this.getCell(rows.nth(i), 2)).toContainText(userName, { timeout: EXPECT_TIMEOUT, ignoreCase: true });
      }
    } else {
      await expect(this.page.getByText(/no data/i)).toBeVisible({ timeout: EXPECT_TIMEOUT });
    }

    await this.clearFiltersAndWait();
  }

  async verifyStatusFilter(status: string) {
    await this.openPage();
    await this.clearFiltersAndWait();

    await this.selectDropdownOption(this.getStatusDropdown(), status);
    await this.applyFiltersAndWait();

    const rows = this.getTableRows();
    const count = await rows.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        await expect(this.getCell(rows.nth(i), 4)).toContainText(status, { timeout: EXPECT_TIMEOUT });
      }
    } else {
      await expect(this.page.getByText(/no data/i)).toBeVisible({ timeout: EXPECT_TIMEOUT });
    }

    await this.clearFiltersAndWait();
  }

  async verifyStatusFilterSearch(searchTerm: string, expectedOption: string) {
    await this.openPage();
    await this.clearFiltersAndWait();

    await this.getStatusDropdown().click({ force: true });
    const input = this.getCommandInput();
    await expect(input).toBeVisible({ timeout: EXPECT_TIMEOUT });

    await input.pressSequentially(searchTerm, { delay: 80 });

    const option = this.page.locator('[role="option"]:visible').filter({ hasText: expectedOption }).first();
    await expect(option).toBeVisible({ timeout: EXPECT_TIMEOUT });

    const allOptions = this.page.locator('[role="option"]:visible');
    const optionsCount = await allOptions.count();
    for (let i = 0; i < optionsCount; i++) {
      await expect(allOptions.nth(i)).toContainText(new RegExp(searchTerm, "i"));
    }

    await this.page.keyboard.press("Escape");
    await pause(this.page, 500);
  }

  async verifyFilterResultsButton(userName: string) {
    await this.openPage();
    await this.clearFiltersAndWait();

    const totalBefore = await this.getResultsCount();

    await this.getSearchByUserInput().fill(userName);
    await pause(this.page);
    await this.applyFiltersAndWait();

    const totalAfter = await this.getResultsCount();
    const rowsCount = await this.getTableRows().count();

    expect(totalAfter).toBeLessThanOrEqual(totalBefore);
    expect(rowsCount).toBeLessThanOrEqual(totalAfter);

    await this.clearFiltersAndWait();
  }

  async verifyClearFilters(userName: string) {
    await this.openPage();
    await this.clearFiltersAndWait();

    const totalBefore = await this.getResultsCount();

    await this.getSearchByUserInput().fill(userName);
    await pause(this.page);
    await this.applyFiltersAndWait();

    await this.clearFiltersAndWait();

    await expect(this.getSearchByUserInput()).toHaveValue("");
    const totalAfter = await this.getResultsCount();
    expect(totalAfter).toEqual(totalBefore);
  }

  async getResultsCount(): Promise<number> {
    const btnText = await this.getFilterResultsButton().innerText();
    const match = btnText.match(/\((\d+)\)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async verifyAmountRangeFilter(min: string, max: string) {
    await this.openPage();
    await this.clearFiltersAndWait();

    await this.getAmountMinInput().fill(min);
    await this.getAmountMaxInput().fill(max);
    await pause(this.page);
    await this.applyFiltersAndWait();

    const rows = this.getTableRows();
    const count = await rows.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const text = await this.getCell(rows.nth(i), 3).innerText();
        const amount = parseFloat(text.replace(/[^0-9.-]/g, ""));
        expect(amount).toBeGreaterThanOrEqual(parseFloat(min));
        expect(amount).toBeLessThanOrEqual(parseFloat(max));
      }
    } else {
      await expect(this.page.getByText(/no data/i)).toBeVisible({ timeout: EXPECT_TIMEOUT });
    }

    await this.clearFiltersAndWait();
  }

  async verifyCombinedFilters(userName: string, status: string) {
    await this.openPage();
    await this.clearFiltersAndWait();

    const searchInput = this.getSearchByUserInput();
    await searchInput.fill(userName);
    await pause(this.page);

    const suggestion = this.page.locator('[role="option"]:visible').filter({ hasText: userName }).first();
    await expect(suggestion).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await suggestion.click({ force: true });
    await pause(this.page, 500);

    await this.selectDropdownOption(this.getStatusDropdown(), status);
    await this.applyFiltersAndWait();

    const rows = this.getTableRows();
    const count = await rows.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const row = rows.nth(i);
        await expect(this.getCell(row, 2)).toContainText(userName, { timeout: EXPECT_TIMEOUT });
        await expect(this.getCell(row, 4)).toContainText(status, { timeout: EXPECT_TIMEOUT });
      }
    } else {
      await expect(this.page.getByText(/no data/i)).toBeVisible({ timeout: EXPECT_TIMEOUT });
    }

    await this.clearFiltersAndWait();
  }

  getThisYearPresetButton(): Locator {
    return this.page.locator("button", { hasText: "This Year" });
  }

  async verifyDateRangeFilter() {
    await this.openPage();
    await this.clearFiltersAndWait();

    await this.getDateRangeField().click();
    await this.getThisYearPresetButton().click();
    await this.applyFiltersAndWait();

    const now = new Date();
    const rows = this.getTableRows();
    const count = await rows.count();

    if (count > 0) {
      // Guard against reading the table mid-render (transient/stale cell content
      // like a lone digit instead of a real date) — wait until it stabilizes.
      await expect(async () => {
        const firstCellText = await this.getCell(rows.first(), 6).innerText();
        expect(firstCellText).toMatch(/\b\d{4}\b/);
      }).toPass({ timeout: EXPECT_TIMEOUT });

      for (let i = 0; i < count; i++) {
        const text = await this.getCell(rows.nth(i), 6).innerText();
        const yearMatch = text.match(/\b(\d{4})\b/);
        expect(yearMatch, `Could not find a 4-digit year in Created cell text: "${text}"`).not.toBeNull();
        const year = parseInt(yearMatch![1], 10);
        expect(year).toBe(now.getFullYear());
      }
    } else {
      await expect(this.page.getByText(/no data/i)).toBeVisible({ timeout: EXPECT_TIMEOUT });
    }

    await this.clearFiltersAndWait();
  }

  async verifySaveFilters(userName: string, presetName: string) {
    await this.openPage();
    await this.clearFiltersAndWait();

    const searchInput = this.getSearchByUserInput();
    await searchInput.fill(userName);
    await pause(this.page);

    const suggestion = this.page.locator('[role="option"]:visible').filter({ hasText: userName }).first();
    await expect(suggestion).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await suggestion.click({ force: true });
    await pause(this.page, 500);

    await this.applyFiltersAndWait();

    await this.getSaveFiltersButton().click();
    await this.getFilterNameInputField().fill(presetName);
    await this.getSaveButton().click();
    await expect(this.getSuccessNotification()).toHaveText("Successfully saved filter.");
    await this.getSuccessNotificationCloseButton().click();
    await this.clearFiltersAndWait();
  }

  async deleteSavedFilter() {
    await this.openPage();
    await this.getSelectFilterButton().click();
    await this.getDeleteSavedFilterButton().click();
    await expect(this.getSuccessNotification()).toHaveText("Successfully deleted filter.");
    await this.getSuccessNotificationCloseButton().click();
    await this.clearFiltersAndWait();
  }
}
