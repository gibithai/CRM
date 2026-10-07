import { expect, Page, Locator } from "@playwright/test";
import { validateExportCSVHeaders, deleteFileIfExists } from "../../utils/common";

export default class Transactions {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  getTransactionsTab() {
    return this.page.getByRole("link", { name: "Transactions" });
  }

  getTransactionsHeading() {
    return this.page.getByRole("heading", { name: "Transactions" });
  }

  getTableRows() {
    return this.page.locator("tbody tr");
  }

  getNoDataLabel() {
    return this.page.getByText(/no data/i);
  }

  getFirstRow() {
    return this.getTableRows().first();
  }

  getFirstRowDataCell() {
    return this.getFirstRow().locator("td").nth(1);
  }

  getTransactionIdTitle() {
    return this.page.locator("th.py-1", { hasText: "Transaction ID" });
  }

  getCreatedAtTitle() {
    return this.page.locator("th.py-1", { hasText: "Created at" });
  }

  getTransactionTypeTitle() {
    return this.page.locator("th.py-1", { hasText: "Entry Type" });
  }

  getStatusTitle() {
    return this.page.locator("th.py-1", { hasText: "Status" });
  }

  getSourceTitle() {
    return this.page.locator("th.py-1", { hasText: "Source" });
  }

  getBalanceOwnerTitle() {
    return this.page.locator("th.py-1", { hasText: "Balance owner" });
  }

  getAmountTitle() {
    return this.page.locator("th.py-1", { hasText: "Amount" });
  }

  getReferenceTitle() {
    return this.page.locator("th.py-1", { hasText: "Reference" });
  }

  getCSVbutton() {
    return this.page.locator("button", { hasText: "Export CSV" });
  }

  // Helpers

  async waitForMinRows(min: number, timeout = 15000) {
    await expect.poll(async () => await this.getTableRows().count(), { timeout }).toBeGreaterThanOrEqual(min);
  }

  async getColumnTexts(colIndex: number, limit = 10) {
    const cells = this.page.locator(`tbody tr td:nth-child(${colIndex})`);
    const count = Math.min(await cells.count(), limit);

    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      values.push((await cells.nth(i).innerText()).trim());
    }
    return values;
  }

  private toNumbers(values: string[]) {
    return values
      .map((v) => v.replace(/[^\d.-]/g, ""))
      .map((v) => Number(v))
      .filter((v) => !Number.isNaN(v));
  }

  private isSortedAsc(nums: number[]) {
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] < nums[i - 1]) return false;
    }
    return true;
  }

  private isSortedDesc(nums: number[]) {
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] > nums[i - 1]) return false;
    }
    return true;
  }

  // Actions
  async openTransactions() {
    await this.getTransactionsTab().click();
    await expect(this.getTransactionsHeading()).toBeVisible({ timeout: 15000 });
  }

  async verifyUsersPageVisibility() {
    await this.openTransactions();

    await expect(this.getFirstRow()).toBeVisible();
    await expect(this.getTransactionIdTitle()).toBeVisible();
    await expect(this.getReferenceTitle()).toBeVisible();
    await expect(this.getCreatedAtTitle()).toBeVisible();
    await expect(this.getTransactionTypeTitle()).toBeVisible();
    await expect(this.getAmountTitle()).toBeVisible();
    await expect(this.getStatusTitle()).toBeVisible();
    await expect(this.getSourceTitle()).toBeVisible();
    await expect(this.getBalanceOwnerTitle()).toBeVisible();
    await expect(this.getCSVbutton()).toBeVisible();
  }

  async verifySorting() {
    await this.openTransactions();

    await this.waitForMinRows(1);
    const rowCount = await this.getTableRows().count();
    if (rowCount < 2) return;

    await this.getCreatedAtTitle().click();
    const applyAsc = this.toNumbers(await this.getColumnTexts(3));
    expect(this.isSortedAsc(applyAsc)).toBeTruthy();

    await this.getCreatedAtTitle().click();
    const applyDesc = this.toNumbers(await this.getColumnTexts(3));
    expect(this.isSortedDesc(applyDesc)).toBeTruthy();

    await this.getAmountTitle().click();
    const amountAsc = this.toNumbers(await this.getColumnTexts(5));
    expect(this.isSortedAsc(amountAsc)).toBeTruthy();

    await this.getAmountTitle().click();
    const amountDesc = this.toNumbers(await this.getColumnTexts(5));
    expect(this.isSortedDesc(amountDesc)).toBeTruthy();
  }

  async verifyExportCSVHeaders() {
    await this.openTransactions();

    const downloadPromise = this.page.waitForEvent("download");
    await this.getCSVbutton().click();
    const download = await downloadPromise;

    const filePath = "downloads/transactions-export.csv";
    deleteFileIfExists(filePath);

    await download.saveAs(filePath);

    const expectedHeaders = ["ID", "Amount", "Entry Type", "Reference", "Source Type", "Source ID", "Status", "Created At", "User ID", "User Email"];

    validateExportCSVHeaders(filePath, expectedHeaders);

    deleteFileIfExists(filePath);
  }
}
