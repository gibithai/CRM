import { expect, Page } from "@playwright/test";
import { pause } from "../../utils/common";
const userEmail = "muhammad@fundingpips.com";

class Accounts {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ==================== Helper Functions ===================== //

  async navigateToTasksPage() {
    await this.getTasksTab().click();
    await expect(this.getTasksLabel()).toBeVisible();
  }

  async navigateToAccountPage() {
    await this.getAccountsTab().click();
    await expect(this.getAccountsLabel()).toBeVisible();
  }

  // ===================== Locators ===================== //

  getTasksTab() {
    return this.page.locator("a", { hasText: "Tasks" });
  }

  getTasksLabel() {
    return this.page.locator("h2", { hasText: "Tasks" });
  }

  getAccountsTab() {
    return this.page.locator("a", { hasText: "Accounts" });
  }

  getAccountsLabel() {
    return this.page.locator("h2", { hasText: "Accounts" });
  }

  getAccountList() {
    return this.page.locator("tbody tr");
  }

  getSearchField() {
    return this.page.locator('[name="search_field"]');
  }

  getSearchByUserFilter() {
    return this.page.locator("#search-input-with-dropdown");
  }

  getUserFromDropdown(email: string) {
    return this.page.locator('[role="option"]', { hasText: email });
  }

  getFilter() {
    return this.page.locator('.space-y-2 [type="button"]');
  }

  getFilterDropdown() {
    return this.page.locator('[data-slot="command-input"]');
  }

  getFilterResultButton() {
    return this.page.locator('[type="submit"]');
  }

  getMaxAccountSize() {
    return this.page.locator('[name="account_size_to"]');
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

  getDeleteSavedFilterButton() {
    return this.page.locator(".lucide-trash");
  }

  getClearFiltersButton() {
    return this.page.locator("button", { hasText: "Clear Filters" });
  }

  getAssignBulkOption(Action: string) {
    return this.page.locator('[role="menuitem"]', { hasText: Action });
  }

  getRowCheckbox() {
    return this.page.locator("[aria-label='Select row']");
  }

  getBulkActionsButton() {
    return this.page.locator("button", { hasText: "Bulk actions" });
  }

  getTaskNoteInputField() {
    return this.page.locator('[name="note"]');
  }

  getCreateTaskButton() {
    return this.page.locator('[role="dialog"] button', { hasText: "Create Task" });
  }

  getSuccessNotificationCloseButton() {
    return this.page.locator('[aria-label="Close toast"]');
  }

  // ===================== Actions ===================== //

  async verifyAccountsList() {
    await this.navigateToAccountPage();
    await this.page.locator("th:nth-child(2)", { hasText: "Login" }).waitFor({ state: "visible" });

    const rows = this.page.locator("table tbody tr");
    const rowCount = await rows.count();

    if (rowCount > 0) {
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        const loginCell = row.locator("td:nth-child(2)");
        await loginCell.waitFor({ state: "visible" });
        const login = (await loginCell.textContent())?.trim() ?? "";
        expect(login).not.toBe("");
      }
    } else {
      await expect(this.getAccountList()).toContainText("No more records");
    }
  }

  async verifySearchFilter() {
    const responsePromise = this.page.waitForResponse((resp) => resp.url().includes("/api/trading_accounts?") && resp.status() === 200);
    await this.navigateToAccountPage();
    await this.getSearchField().fill("869667");
    await this.getFilterResultButton().click();

    const response = await responsePromise;
    expect(response.status()).toBe(200);

    const rows = this.getAccountList();
    await expect(rows).toHaveCount(1);
    await expect(rows.locator("td").nth(1)).toHaveText("869667");
    await this.page.locator("button", { hasText: "Clear Filters" }).click();
  }

  async verifyAccountTypeFilter() {
    const responsePromise = this.page.waitForResponse((resp) => resp.url().includes("/api/trading_accounts?") && resp.status() === 200);
    await this.navigateToAccountPage();
    await this.getFilter().first().click();
    await this.getFilterDropdown().fill("Algo");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");

    await this.getFilterResultButton().click();

    const response = await responsePromise;
    expect(response.status()).toBe(200);
    await pause(this.page);
    const rows = await this.getAccountList().elementHandles();
    for (const row of rows) {
      const accountType = (await row.$eval("td:nth-child(4)", (td) => td.textContent)).trim();
      expect(accountType).toBe("Algo");
    }
    await this.page.locator("button", { hasText: "Clear Filters" }).click();
  }

  async verifyCombinedFilters() {
    const responsePromise = this.page.waitForResponse((resp) => resp.url().includes("/api/trading_accounts?") && resp.status() === 200);
    await this.getAccountsTab().click();
    // Phase filter
    await this.getFilter().nth(1).click();
    await this.getFilterDropdown().fill("Master");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);

    // Platform filter
    await this.getFilter().nth(2).click();
    await pause(this.page);
    await this.getFilterDropdown().fill("mt5");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);
    await pause(this.page);

    // Status filter
    await this.getFilter().nth(4).click();
    await this.getFilterDropdown().fill("Ongoing");
    await pause(this.page);
    await this.page.keyboard.press("Enter");

    await this.getFilterResultButton().click();
    await pause(this.page);
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    const rows = this.page.locator("tbody tr");
    const rowCount = await rows.count();

    const firstRowText = await rows.first().textContent();

    if (firstRowText?.includes("No data")) {
      await expect(this.getAccountList()).toContainText("No data");
    } else {
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        const phase = (await row.locator("td:nth-child(5)").textContent())?.trim();
        const platform = (await row.locator("td:nth-child(6)").textContent())?.trim();
        const status = (await row.locator("td:nth-child(7)").textContent())?.trim();

        expect(phase).toBe("Master");
        expect(platform).toBe("MetaTrader 5");
        expect(status).toBe("Ongoing");
      }
    }
  }

  async verifySaveFilters() {
    await this.getAccountsTab().click();
    await this.getSearchField().fill("muhammad@fundingpips.com");
    await this.getFilter().nth(1).click();
    await this.getFilterDropdown().fill("Master");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);

    await this.getSaveFiltersButton().click();
    await this.getFilterNameInputField().fill("QA_Saved_Filter");
    await this.getSaveButton().click();
    await expect(this.getSuccessNotification()).toHaveText("Successfully saved filter.");
    await this.getSuccessNotificationCloseButton().click();
  }

  async deleteSavedFilter() {
    await this.navigateToAccountPage();
    await this.page.locator("button", { hasText: "Select filter" }).click();
    await this.getDeleteSavedFilterButton().click();
    await expect(this.getSuccessNotification()).toHaveText("Successfully deleted filter.");
    await this.getSuccessNotificationCloseButton().click();
  }

  async getFirstAccountAfterInReviewFilter() {
    await this.navigateToAccountPage();
    await this.getFilter().nth(4).click();
    await this.getFilterDropdown().fill("Inreview");
    await pause(this.page);
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.getFilterResultButton().click();
    await pause(this.page);

    const rows = this.getAccountList();
    const count = await rows.count();
    return await rows.first().locator("td:nth-child(2)").first().textContent();
  }

  async createBulkReactivateTask() {
    await this.navigateToAccountPage();
    await expect(this.getBulkActionsButton()).toBeVisible();

    // It will only process the not_passed and closed accounts, ignoring all other statuses.
    await this.getFilter().nth(4).click();
    await this.getFilterDropdown().fill("Notpassed");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.getFilterResultButton().click();
    await pause(this.page);
    for (let i = 0; i < 2; i++) {
      await this.getRowCheckbox().nth(i).check();
    }
    await this.getBulkActionsButton().click();
    await this.getAssignBulkOption("Create Bulk Reactivate Task").click();
    await this.getTaskNoteInputField().pressSequentially("Bulk Reactivate Task for Not Passed Accounts");
    await this.getCreateTaskButton().click();
    await expect(this.getSuccessNotification()).toHaveText(
      "Task is being created in the background; please visit the tasks page in a few minutes to check it"
    );
    await this.getSuccessNotificationCloseButton().click();
    await this.navigateToTasksPage();
    await pause(this.page);

    const tasksRows = await this.page.$$("table tbody tr");
    const firstRow = tasksRows[0];

    const command = (await firstRow.$eval("td:nth-child(3)", (td) => td.textContent)).trim();
    const status = (await firstRow.$eval("td:nth-child(4)", (td) => td.textContent)).trim();

    expect(command).toBe("Bulk reactivate accounts");
    expect(status).toBe("Created");
  }

  async createBulkViolateTask() {
    await this.navigateToAccountPage();
    await expect(this.getBulkActionsButton()).toBeVisible();

    // It will only process the In_review accounts.
    await this.getFilter().nth(4).click();
    await this.getFilterDropdown().fill("Inreview");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.getFilterResultButton().click();
    await pause(this.page);
    for (let i = 0; i < 2; i++) {
      await this.getRowCheckbox().nth(i).check();
    }
    await this.getBulkActionsButton().click();
    await this.getAssignBulkOption("Create Bulk Violate Task").click();
    await this.getTaskNoteInputField().pressSequentially("Bulk Violate Task for In Review Accounts");
    await this.page.locator('[role="dialog"] [role="marquee"]').click();
    await this.page.locator('[role="dialog"] [role="marquee"]').pressSequentially("QA", { delay: 100 });
    await this.page.locator('[data-value="QA"]', { hasText: "QA" }).click();
    await this.getCreateTaskButton().click();
    await expect(this.getSuccessNotification()).toHaveText(
      "Task is being created in the background; please visit the tasks page in a few minutes to check it"
    );
    await this.getSuccessNotificationCloseButton().click();
    await this.navigateToTasksPage();
    await this.page.reload();
    await pause(this.page);
    const tasksRows = await this.page.$$("table tbody tr");
    const firstRow = tasksRows[0];

    const command = (await firstRow.$eval("td:nth-child(3)", (td) => td.textContent)).trim();
    const status = (await firstRow.$eval("td:nth-child(4)", (td) => td.textContent)).trim();

    expect(command).toBe("Bulk violate");
    expect(status).toBe("Created");
  }

  async createBulkApproveTask() {
    await this.navigateToAccountPage();
    await expect(this.getBulkActionsButton()).toBeVisible();

    // It will only process the In_review accounts and mark them as Passed.
    await this.getFilter().nth(4).click();
    await this.getFilterDropdown().fill("Inreview");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.getFilterResultButton().click();
    await pause(this.page);
    for (let i = 0; i < 2; i++) {
      await this.getRowCheckbox().nth(i).check();
    }
    await this.getBulkActionsButton().click();
    await this.getAssignBulkOption("Create Bulk Approve Task").click();
    await this.getTaskNoteInputField().pressSequentially("Bulk Approve Task for In Review Accounts");
    await this.getCreateTaskButton().click();
    await expect(this.getSuccessNotification()).toHaveText(
      "Task is being created in the background; please visit the tasks page in a few minutes to check it"
    );
    await this.getSuccessNotificationCloseButton().click();
    await this.navigateToTasksPage();
    await this.page.reload();
    await pause(this.page);
    const tasksRows = await this.page.$$("table tbody tr");
    const firstRow = tasksRows[0];

    const command = (await firstRow.$eval("td:nth-child(3)", (td) => td.textContent)).trim();
    const status = (await firstRow.$eval("td:nth-child(4)", (td) => td.textContent)).trim();

    expect(command).toBe("Bulk approve");
    expect(status).toBe("Created");
  }

  async createBulkDisableTradingTask() {
    await this.navigateToAccountPage();
    await this.getSearchByUserFilter().pressSequentially("61");
    await this.getUserFromDropdown(userEmail).click();
    await this.page.mouse.click(0, 0);
    await pause(this.page);

    await this.getFilter().first().click();
    await this.getFilterDropdown().fill("Onestep");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);
    await pause(this.page);

    await this.getFilter().nth(1).click();
    await this.getFilterDropdown().fill("Student");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);
    await pause(this.page);

    await this.getFilter().nth(2).click();
    await this.getFilterDropdown().fill("mt5");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);

    await this.getFilterResultButton().click();
    await pause(this.page);
    for (let i = 0; i < 2; i++) {
      await this.getRowCheckbox().nth(i).check();
    }
    await this.getBulkActionsButton().click();
    await this.getAssignBulkOption("Create Bulk Disable Trading Task").click();
    await this.getCreateTaskButton().click();
    await expect(this.getSuccessNotification()).toHaveText(
      "Task is being created in the background; please visit the tasks page in a few minutes to check it"
    );
    await this.getSuccessNotificationCloseButton().click();
    await this.navigateToTasksPage();
    await this.page.reload();
    await pause(this.page);
    const tasksRows = await this.page.$$("table tbody tr");
    const firstRow = tasksRows[0];

    const command = (await firstRow.$eval("td:nth-child(3)", (td) => td.textContent)).trim();
    const status = (await firstRow.$eval("td:nth-child(4)", (td) => td.textContent)).trim();

    expect(command).toBe("Bulk disable trading");
    expect(status).toBe("Created");
    await this.page.locator("tr td .lucide-x").first().click();
    await this.page.locator("button", { hasText: "Confirm" }).click();
    await pause(this.page);

    await this.page.reload();
    await pause(this.page);
    const tasksRowsAfterCancel = await this.page.$$("table tbody tr");
    const firstRowAfterCancel = tasksRowsAfterCancel[0];
    const statusAfterCancel = (await firstRowAfterCancel.$eval("td:nth-child(4)", (td) => td.textContent)).trim();

    expect(statusAfterCancel).toBe("Cancelled");
  }

  async createBulkOnboardingTask() {
    await this.navigateToAccountPage();
    await this.getSearchByUserFilter().pressSequentially("61");
    await this.getUserFromDropdown(userEmail).click();
    await this.page.mouse.click(0, 0);
    await pause(this.page);

    await this.getFilter().first().click();
    await this.getFilterDropdown().fill("Twostep");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);
    await pause(this.page);

    await this.getFilter().nth(4).click();
    await this.getFilterDropdown().fill("closed");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);

    await this.getFilterResultButton().click();
    await pause(this.page);
    for (let i = 0; i < 2; i++) {
      await this.getRowCheckbox().nth(i).check();
    }
    await this.getBulkActionsButton().click();
    await this.getAssignBulkOption("Create Bulk Onboarding/Enable Trading Task").click();
    await this.getCreateTaskButton().click();
    await expect(this.getSuccessNotification()).toHaveText(
      "Task is being created in the background; please visit the tasks page in a few minutes to check it"
    );
    await this.getSuccessNotificationCloseButton().click();
    await this.navigateToTasksPage();
    await this.page.reload();
    await pause(this.page);
    const tasksRows = await this.page.$$("table tbody tr");
    const firstRow = tasksRows[0];

    const command = (await firstRow.$eval("td:nth-child(3)", (td) => td.textContent)).trim();
    const status = (await firstRow.$eval("td:nth-child(4)", (td) => td.textContent)).trim();

    expect(command).toBe("Bulk onboard");
    expect(status).toBe("Created");
    await this.page.locator("tr td .lucide-x").first().click();
    await this.page.locator("button", { hasText: "Confirm" }).click();
    await pause(this.page);

    await this.page.reload();
    await pause(this.page);
    const tasksRowsAfterCancel = await this.page.$$("table tbody tr");
    const firstRowAfterCancel = tasksRowsAfterCancel[0];
    const statusAfterCancel = (await firstRowAfterCancel.$eval("td:nth-child(4)", (td) => td.textContent)).trim();

    expect(statusAfterCancel).toBe("Cancelled");
  }

  async createSendEmailByLoginTask() {
    await this.navigateToAccountPage();
    await this.getSearchByUserFilter().pressSequentially("61");
    await this.getUserFromDropdown(userEmail).click();
    await this.page.mouse.click(0, 0);
    await pause(this.page);

    await this.getFilterResultButton().click();
    await pause(this.page);
    for (let i = 0; i < 2; i++) {
      await this.getRowCheckbox().nth(i).check();
    }
    await this.getBulkActionsButton().click();
    await this.getAssignBulkOption("Create Send Email By Login Task").click();
    await this.page.locator('[role="dialog"] [role="marquee"]').click();
    await this.page.locator('[role="dialog"] [role="marquee"]').pressSequentially("QA", { delay: 100 });
    await this.page.locator('[data-value="QA"]', { hasText: "QA" }).click();
    await this.getCreateTaskButton().click();
    await expect(this.getSuccessNotification()).toHaveText(
      "Task is being created in the background; please visit the tasks page in a few minutes to check it"
    );
    await this.getSuccessNotificationCloseButton().click();
    await this.navigateToTasksPage();
    await this.page.reload();
    await pause(this.page);
    const tasksRows = await this.page.$$("table tbody tr");
    const firstRow = tasksRows[0];

    const command = (await firstRow.$eval("td:nth-child(3)", (td) => td.textContent)).trim();
    const status = (await firstRow.$eval("td:nth-child(4)", (td) => td.textContent)).trim();

    expect(command).toBe("Send emails by TradingAccount Login");
    expect(status).toBe("Created");
  }
}

export default Accounts;
