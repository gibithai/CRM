import { expect, Page, Locator } from "@playwright/test";

const EXPECT_TIMEOUT = 15_000;

export default class TemplatesFilters {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  getTemplatesTab(): Locator {
    return this.page.getByRole("link", { name: "Templates", exact: true });
  }

  getTemplatesLabel(): Locator {
    return this.page.locator("h2", { hasText: "Templates" });
  }

  getTableRows(): Locator {
    return this.page.locator("tbody tr");
  }

  getCell(row: Locator, nth1Based: number): Locator {
    return row.locator(`td:nth-child(${nth1Based})`);
  }

  getSearchInput(): Locator {
    return this.page.locator('input[name="search_field"]');
  }

  getFilterResultsButton(): Locator {
    return this.page.locator("button", { hasText: /Filter results/i });
  }

  getAccountTypeDropdown(): Locator {
    return this.page.getByText("Account Type", { exact: true }).locator("..").locator("button").first();
  }

  getAccountSizeDropdown(): Locator {
    return this.page.getByText("Account Size", { exact: true }).locator("..").locator("button").first();
  }

  getCommandInput(): Locator {
    return this.page.locator('[data-slot="command-input"]:visible').first();
  }

  async openTemplates() {
    await this.getTemplatesTab().click();
    await expect(this.getTemplatesLabel()).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await expect(this.getTableRows().first()).toBeVisible({ timeout: EXPECT_TIMEOUT });
  }

  async applyFiltersAndWait() {
    const filterBtn = this.getFilterResultsButton();
    await Promise.all([this.page.waitForLoadState("networkidle"), filterBtn.click({ force: true })]);
    await expect(filterBtn).toBeEnabled();
  }

  async clearFiltersAndWait() {
    await this.page.locator("button", { hasText: "Clear Filters" }).click({ force: true });
    await expect(this.getFilterResultsButton()).toBeEnabled();
    await this.page.waitForTimeout(500);
  }

  async selectDropdownOption(dropdown: Locator, value: string) {
    await dropdown.click({ force: true });

    const input = this.getCommandInput();
    await expect(input).toBeVisible({ timeout: EXPECT_TIMEOUT });

    await input.pressSequentially(value, { delay: 80 });

    console.log(`Input value after typing: ${await input.inputValue()}`);

    const option = this.page.locator('[role="option"]:visible').filter({ hasText: value }).first();
    await expect(option).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await option.click({ force: true });

    await this.page.mouse.click(600, 400);
    await this.page.waitForTimeout(500);
  }

  async assertAllRowsContainText(columnNth: number, expectedText: string) {
    const rows = this.getTableRows();
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i).locator(`td:nth-child(${columnNth})`)).toContainText(expectedText, { timeout: EXPECT_TIMEOUT });
    }
  }

  async verifyAccountTypeFilter(accountType: string, expectedCellText: string) {
    await this.openTemplates();

    await this.selectDropdownOption(this.getAccountTypeDropdown(), accountType);
    await this.applyFiltersAndWait();

    const rows = this.getTableRows();
    const count = await rows.count();

    if (count > 0) {
      await this.assertAllRowsContainText(4, expectedCellText);
    } else {
      await expect(this.page.getByText(/no data/i)).toBeVisible({ timeout: EXPECT_TIMEOUT });
    }

    await this.clearFiltersAndWait();
  }

  async verifyAccountSizeFilter(accountSize: string) {
    await this.openTemplates();

    await this.selectDropdownOption(this.getAccountSizeDropdown(), accountSize);
    await this.applyFiltersAndWait();

    const rows = this.getTableRows();
    const count = await rows.count();

    if (count > 0) {
      await this.assertAllRowsContainText(5, accountSize);
    } else {
      await expect(this.page.getByText(/no data/i)).toBeVisible({ timeout: EXPECT_TIMEOUT });
    }

    await this.clearFiltersAndWait();
  }

  async verifyMultipleFilters(accountType: string, expectedTypeText: string, accountSize: string) {
    await this.openTemplates();

    await this.selectDropdownOption(this.getAccountSizeDropdown(), accountSize);
    await this.selectDropdownOption(this.getAccountTypeDropdown(), accountType);

    await this.applyFiltersAndWait();
    const rows = this.getTableRows();
    const count = await rows.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const row = rows.nth(i);
        await expect(row.locator("td:nth-child(4)")).toContainText(expectedTypeText, { timeout: EXPECT_TIMEOUT });
        await expect(row.locator("td:nth-child(5)")).toContainText(accountSize, { timeout: EXPECT_TIMEOUT });
      }
    } else {
      await expect(this.page.getByText(/no data/i)).toBeVisible({ timeout: EXPECT_TIMEOUT });
    }
    await this.clearFiltersAndWait();
  }
}
