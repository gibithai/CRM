import { expect, Page } from "@playwright/test";
import { pause } from "../../utils/common";

class Deposits {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ==================== Helper Functions ===================== //

  async navigateToDepositsPage() {
    await this.getDepositsTab().click();
    await expect(this.getDepositsHeading()).toBeVisible();
  }

  // ===================== Locators ===================== //

  getDepositsTab() {
    return this.page.locator("a", { hasText: "Deposits" });
  }

  getDepositsHeading() {
    return this.page.locator("h2", { hasText: "Deposits" });
  }

  getSearchField() {
    return this.page.getByPlaceholder("User email, user name");
  }

  getUserFromDropdown(email: string) {
    return this.page.locator('[role="option"]', { hasText: email });
  }

  getStatusFilterButton() {
    return this.page.locator('button[aria-haspopup="dialog"]');
  }

  getFilterDropdownInput() {
    return this.page.locator('[data-slot="command-input"]');
  }

  getFilterResultsButton() {
    return this.page.locator("button", { hasText: "Filter results" });
  }

  getClearFiltersButton() {
    return this.page.locator("button", { hasText: "Clear Filters" });
  }

  getSaveFiltersButton() {
    return this.page.locator("button", { hasText: "Save filters" });
  }

  getFilterNameInputField() {
    return this.page.locator("#filter-name");
  }

  getSaveButton() {
    return this.page.locator('[role="dialog"] button', { hasText: "Save" });
  }

  getSuccessNotification() {
    return this.page.locator("[aria-label='Notifications alt+T']");
  }

  getSuccessNotificationCloseButton() {
    return this.page.locator('[aria-label="Close toast"]');
  }

  getSelectFilterButton() {
    return this.page.locator("button, [role='combobox']", { hasText: "Select filter" });
  }

  getDeleteSavedFilterButton() {
    return this.page.locator(".lucide-trash");
  }

  getAmountFromField() {
    return this.page.locator('[name="amount_from"]');
  }

  getAmountToField() {
    return this.page.locator('[name="amount_to"]');
  }

  getDateRangeField() {
    return this.page.locator(".lucide-calendar").locator("..");
  }

  getThisMonthPresetButton() {
    return this.page.locator("button", { hasText: "This Month" });
  }

  getColumnHeader(name: string) {
    return this.page.getByRole("columnheader", { name });
  }

  getDepositRows() {
    return this.page.locator("table tbody tr");
  }

  getDepositDialog() {
    return this.page.locator('[role="dialog"]', { hasText: "Deposit #" });
  }

  getDepositDialogCloseButton() {
    return this.getDepositDialog().locator("button", { hasText: "Close" });
  }

  getApproveDepositButton() {
    return this.getDepositDialog().locator("button", { hasText: "Approve Deposit" });
  }

  getRejectDepositButton() {
    return this.getDepositDialog().locator("button", { hasText: "Reject Deposit" });
  }

  getDialogFieldRow(label: string) {
    return this.getDepositDialog().locator("div.flex.text-sm", { hasText: label });
  }

  getActionConfirmDialog() {
    return this.page.locator('[role="dialog"]', { hasText: "Are you sure you want to" });
  }

  getActionConfirmButton() {
    return this.getActionConfirmDialog().getByRole("button", { name: "Confirm" });
  }

  // ===================== Actions ===================== //

  async verifyDepositsList() {
    await this.navigateToDepositsPage();
    await this.getColumnHeader("UUID").waitFor({ state: "visible" });

    const rows = this.getDepositRows();
    const rowCount = await rows.count();

    if (rowCount > 0) {
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        const uuidCell = row.locator("td:nth-child(1)");
        await uuidCell.waitFor({ state: "visible" });
        const uuid = (await uuidCell.textContent())?.trim() ?? "";
        expect(uuid).not.toBe("");
      }
    } else {
      await expect(this.getDepositRows()).toContainText("No data");
    }
  }

  async verifySearchFilter() {
    await this.navigateToDepositsPage();
    await this.getSearchField().pressSequentially("Chitresh");
    await this.getUserFromDropdown("chitresh@fundingpips.com").click();
    await this.getFilterResultsButton().click();
    await expect(this.getFilterResultsButton()).toBeEnabled();
    expect(this.page.url()).toContain("filter_user_id");

    await pause(this.page);
    const rows = this.getDepositRows();
    const rowCount = await rows.count();
    if (rowCount > 0) {
      for (let i = 0; i < rowCount; i++) {
        const user = (await rows.nth(i).locator("td:nth-child(5)").textContent())?.trim() ?? "";
        expect(user).toContain("Chitresh");
      }
    } else {
      await expect(this.getDepositRows()).toContainText("No data");
    }

    await this.getClearFiltersButton().click();
  }

  async verifyStatusFilter() {
    await this.navigateToDepositsPage();
    await this.getStatusFilterButton().click();
    await this.getFilterDropdownInput().fill("Paid");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");

    await this.getFilterResultsButton().click();
    await expect(this.getFilterResultsButton()).toBeEnabled();
    expect(this.page.url()).toContain("statuses%5B%5D=paid");

    await pause(this.page);
    const rows = this.getDepositRows();
    const rowCount = await rows.count();
    if (rowCount > 0) {
      for (let i = 0; i < rowCount; i++) {
        const status = (await rows.nth(i).locator("td:nth-child(3)").textContent())?.trim() ?? "";
        expect(status).toBe("Paid");
      }
    } else {
      await expect(this.getDepositRows()).toContainText("No data");
    }

    await this.getClearFiltersButton().click();
  }

  async verifyAmountRangeFilter() {
    await this.navigateToDepositsPage();
    await this.getAmountFromField().fill("500");
    await this.getAmountToField().fill("2000");
    await this.getFilterResultsButton().click();
    await expect(this.getFilterResultsButton()).toBeEnabled();
    expect(this.page.url()).toContain("amount_from=500");
    expect(this.page.url()).toContain("amount_to=2000");

    await pause(this.page);
    const rows = this.getDepositRows();
    const rowCount = await rows.count();
    if (rowCount > 0) {
      for (let i = 0; i < rowCount; i++) {
        const amountText = (await rows.nth(i).locator("td:nth-child(6)").textContent())?.trim() ?? "";
        const amount = Number(amountText.replace(/[^0-9.]/g, ""));
        expect(amount).toBeGreaterThanOrEqual(500);
        expect(amount).toBeLessThanOrEqual(2000);
      }
    } else {
      await expect(this.getDepositRows()).toContainText("No data");
    }

    await this.getClearFiltersButton().click();
  }

  async verifyDateRangeFilter() {
    await this.navigateToDepositsPage();
    await this.getDateRangeField().click();
    await this.getThisMonthPresetButton().click();
    await this.getFilterResultsButton().click();
    await expect(this.getFilterResultsButton()).toBeEnabled();
    expect(this.page.url()).toContain("created_at_from");
    expect(this.page.url()).toContain("created_at_to");

    await pause(this.page);
    const now = new Date();
    const rows = this.getDepositRows();
    const rowCount = await rows.count();
    if (rowCount > 0) {
      for (let i = 0; i < rowCount; i++) {
        const dateText = (await rows.nth(i).locator("td:nth-child(2)").textContent())?.trim() ?? "";
        const date = new Date(dateText);
        expect(date.getMonth()).toBe(now.getMonth());
        expect(date.getFullYear()).toBe(now.getFullYear());
      }
    } else {
      await expect(this.getDepositRows()).toContainText("No data");
    }

    await this.getClearFiltersButton().click();
  }

  async verifySaveFilters() {
    await this.navigateToDepositsPage();
    await this.getStatusFilterButton().click();
    await this.getFilterDropdownInput().fill("Cancelled");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");

    await this.getSaveFiltersButton().click();
    await this.getFilterNameInputField().fill("QA_Deposits_Filter");
    await this.getSaveButton().click();
    await expect(this.getSuccessNotification()).toHaveText("Successfully saved filter.");
    await this.getSuccessNotificationCloseButton().click();
    await this.getClearFiltersButton().click();
  }

  async deleteSavedFilter() {
    await this.navigateToDepositsPage();
    await this.getSelectFilterButton().click();
    await this.getDeleteSavedFilterButton().click();
    await expect(this.getSuccessNotification()).toHaveText("Successfully deleted filter.");
    await this.getSuccessNotificationCloseButton().click();
    await this.getClearFiltersButton().click();
  }

  async verifyDepositDetails() {
    await this.navigateToDepositsPage();
    await this.getSearchField().pressSequentially("Muhammad");
    await this.getUserFromDropdown("muhammad@fundingpips.com").click();
    await this.getFilterResultsButton().click();
    await expect(this.getFilterResultsButton()).toBeEnabled();
    const firstRow = this.getDepositRows().first();
    await expect(firstRow.getByRole("button", { name: "Copy" })).toBeVisible();
    const uuid = (await firstRow.locator("td").nth(0).textContent())?.trim() ?? "";
    const status = (await firstRow.locator("td").nth(2).textContent())?.trim() ?? "";

    await firstRow.getByRole("button", { name: "View deposit details" }).click();
    await expect(this.getDepositDialog()).toBeVisible();
    await expect(this.getDepositDialog()).toContainText(uuid.replace("Copy", "").trim());
    await expect(this.getDialogFieldRow("Status")).toContainText(status);
    await expect(this.getDepositDialog()).toContainText("Paymaxis");
    await expect(this.getDialogFieldRow("Charge Type")).toContainText("Deposit");
    // Approve/Reject only show for deposits that haven't already been reviewed (e.g. by a previous test run).
    if (await this.getApproveDepositButton().isVisible()) {
      await expect(this.getRejectDepositButton()).toBeVisible();
    }

    await this.getDepositDialogCloseButton().click();
    await expect(this.getDepositDialog()).not.toBeVisible();
  }

  async getLatestDeposit() {
    await this.navigateToDepositsPage();
    await this.getSearchField().pressSequentially("Muhammad");
    await this.getUserFromDropdown("muhammad@fundingpips.com").click();
    await this.getFilterResultsButton().click();
    await expect(this.getFilterResultsButton()).toBeEnabled();
    await pause(this.page, 3000);

    const firstRow = this.getDepositRows().first();
    await expect(firstRow.getByRole("button", { name: "Copy" })).toBeVisible();
    await firstRow.getByRole("button", { name: "View deposit details" }).click();
    await expect(this.getDepositDialog()).toBeVisible();
  }

  async verifyApproveDeposit() {
    await this.getLatestDeposit();

    await this.getApproveDepositButton().click();
    await expect(this.getActionConfirmDialog()).toBeVisible();
    await this.getActionConfirmButton().click();
    await expect(this.getSuccessNotification()).toContainText("Deposit successfully approved");
    await this.getSuccessNotificationCloseButton().click();
    await this.getDepositDialogCloseButton().click();
    await this.getClearFiltersButton().click();
  }

  async verifyRejectDeposit() {
    await this.getLatestDeposit();

    await this.getRejectDepositButton().click();
    await expect(this.getActionConfirmDialog()).toBeVisible();
    await this.getActionConfirmButton().click();
    await expect(this.getSuccessNotification()).toContainText("Deposit successfully rejected");
    await this.getSuccessNotificationCloseButton().click();
    await this.getDepositDialogCloseButton().click();
    await this.getClearFiltersButton().click();
  }
}

export default Deposits;
