import { expect, Page, Locator } from "@playwright/test";
import { pause } from "../../../utils/common";

const EXPECT_TIMEOUT = 15_000;

const VALID_STATUSES = ["Requested", "Processing", "Processed", "Failed", "Partially Processed"];

export default class Withdrawals {
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

  static COLUMNS = {
    REFERENCE: 1,
    USER: 2,
    AMOUNT: 3,
    STATUS: 4,
    REVIEW_STATUS: 5,
    CREATED: 6,
    ACTIONS: 7,
  };

  getColumnHeader(name: string): Locator {
    return this.page.getByRole("columnheader", { name, exact: true });
  }

  getSortableHeader(name: string): Locator {
    return this.getColumnHeader(name);
  }

  getFiltersSidebar(): Locator {
    return this.page.getByText("Filters", { exact: true }).locator("..");
  }

  getHideSidebarButton(): Locator {
    return this.page.getByRole("button", { name: /hide sidebar/i });
  }

  async openPage() {
    await this.getWithdrawalsTab().click();
    await expect(this.getHeading()).toBeVisible({ timeout: EXPECT_TIMEOUT });
    await expect(this.getTableRows().first()).toBeVisible({ timeout: EXPECT_TIMEOUT });
  }

  async verifyPageVisibility() {
    await this.openPage();

    await expect(this.getColumnHeader("Reference")).toBeVisible();
    await expect(this.getColumnHeader("User")).toBeVisible();
    await expect(this.getColumnHeader("Amount")).toBeVisible();
    await expect(this.getColumnHeader("Status")).toBeVisible();
    await expect(this.getColumnHeader("Review Status")).toBeVisible();
    await expect(this.getColumnHeader("Created")).toBeVisible();
    await expect(this.getColumnHeader("Actions")).toBeVisible();
  }

  async getAmountColumnValues(): Promise<number[]> {
    const rows = this.getTableRows();
    const count = await rows.count();
    const values: number[] = [];

    for (let i = 0; i < count; i++) {
      const text = await this.getCell(rows.nth(i), Withdrawals.COLUMNS.AMOUNT).innerText();
      values.push(parseFloat(text.replace(/[^0-9.-]/g, "")));
    }
    return values;
  }

  async getCreatedColumnValues(): Promise<Date[]> {
    const rows = this.getTableRows();
    const count = await rows.count();
    const values: Date[] = [];

    for (let i = 0; i < count; i++) {
      const text = await this.getCell(rows.nth(i), Withdrawals.COLUMNS.CREATED).innerText();
      values.push(new Date(text));
    }
    return values;
  }

  async verifyAmountSorting() {
    await this.openPage();

    const header = this.getSortableHeader("Amount");

    await header.click({ force: true });
    await pause(this.page);
    let values = await this.getAmountColumnValues();
    const ascending = [...values].sort((a, b) => a - b);
    expect(values).toEqual(ascending);

    await header.click({ force: true });
    await pause(this.page);
    values = await this.getAmountColumnValues();
    const descending = [...values].sort((a, b) => b - a);
    expect(values).toEqual(descending);
  }

  async verifyCreatedSorting() {
    await this.openPage();

    const header = this.getSortableHeader("Created");

    await header.click({ force: true });
    await pause(this.page);
    let values = await this.getCreatedColumnValues();
    const ascending = [...values].sort((a, b) => a.getTime() - b.getTime());
    expect(values.map((d) => d.getTime())).toEqual(ascending.map((d) => d.getTime()));

    await header.click({ force: true });
    await pause(this.page);
    values = await this.getCreatedColumnValues();
    const descending = [...values].sort((a, b) => b.getTime() - a.getTime());
    expect(values.map((d) => d.getTime())).toEqual(descending.map((d) => d.getTime()));
  }

  async verifyStatusesCorrectness() {
    await this.openPage();

    const rows = this.getTableRows();
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const statusText = (await this.getCell(rows.nth(i), Withdrawals.COLUMNS.STATUS).innerText()).trim();
      expect(VALID_STATUSES).toContain(statusText);
    }
  }

  async verifyHideSidebar() {
    await this.openPage();

    await expect(this.getFiltersSidebar()).toBeVisible();
    await this.getHideSidebarButton().click({ force: true });
    await pause(this.page);
    await expect(this.getFiltersSidebar()).not.toBeVisible();
  }
}
