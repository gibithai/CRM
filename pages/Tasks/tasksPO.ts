import { expect, Page } from "@playwright/test";
import { pause, getScheduleAt, getDisplayDate } from "../../utils/common";

import path from "path";
import fs from "fs";
import { validateTaskDatesWithinTimeline, refreshUntilVisible, createCsvFileFromJSON } from "../../utils/common";
import Accounts from "../Accounts/accountsPO";

class Tasks {
  private page: Page;

  private accounts: Accounts;

  constructor(page: Page) {
    this.page = page;
    this.accounts = new Accounts(page);
  }

  // ==================== Helper Functions ===================== //

  async navigateToTasksPage() {
    await this.getTasksTab().click();
    await expect(this.getTasksLabel()).toBeVisible();
  }

  // ===================== Locators ===================== //

  getTasksTab() {
    return this.page.locator("a", { hasText: "Tasks" });
  }

  getTasksLabel() {
    return this.page.locator("h2", { hasText: "Tasks" });
  }

  getTasksList() {
    return this.page.locator("tbody tr");
  }

  getTasksFilter() {
    return this.page.locator('.space-y-2 [type="button"]');
  }

  getFilterDropdown() {
    return this.page.locator('[data-slot="command-input"]');
  }

  getFilterResultButton() {
    return this.page.locator('[type="submit"]');
  }

  getClearFiltersButton() {
    return this.page.locator("button", { hasText: "Clear Filters" });
  }

  getFilterInput() {
    return this.page.locator('[type="text"]');
  }

  getDropdownList() {
    return this.page.locator('[data-slot="scroll-area"]');
  }

  getDateFromCalendar() {
    return this.page.locator('[role="dialog"]');
  }

  getDeleteSavedFilterButton() {
    return this.page.locator(".lucide-trash");
  }

  getSaveFiltersButton() {
    return this.page.locator("button", { hasText: "Save filters" });
  }

  getSelectFilterButton() {
    return this.page.locator("button", { hasText: "Select filter" });
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

  getCommandDropdown() {
    return this.page.locator('[role="marquee"]');
  }

  getCommandOption(option: string) {
    return this.page.locator(`[data-value="${option}"]`);
  }

  getCommandRow(command: string) {
    return this.page.locator("tbody tr", { hasText: `${command}` });
  }

  getCommandLabel(command: string) {
    return this.page.locator("h1", { hasText: `${command}` });
  }

  getProcessButton() {
    return this.page.locator("button", { hasText: "Process" });
  }

  getConfirmDialogButton() {
    return this.page.locator("button", { hasText: "Confirm" });
  }

  getSuccessNotificationCloseButton() {
    return this.page.locator('[aria-label="Close toast"]');
  }

  getScheduleButton() {
    return this.page.locator("button", { hasText: "Schedule" });
  }

  getDateFromCalender(formattedScheduledAt: string) {
    return this.page.locator(`[data-day="${formattedScheduledAt}"] button`);
  }

  getTimeHours() {
    return this.page.locator('[data-slot="scroll-area"]');
  }

  getApplyButton() {
    return this.page.locator("button", { hasText: "Apply" });
  }

  getConfirmButton() {
    return this.page.locator("button", { hasText: "Confirm" });
  }

  getScheduledActionsTab() {
    return this.page.locator('[role="tab"]', { hasText: "Scheduled Actions" });
  }

  getViewDetailsButton() {
    return this.page.locator("button:has(.lucide-chevron-right)");
  }

  getCalender() {
    return this.page.locator('[role="dialog"] .lucide-calendar');
  }

  getActionsDot() {
    return this.page.locator(".lucide-ellipsis");
  }

  getActionMenuItem(itemText: string) {
    return this.page.locator(`[role="menuitem"]:has-text("${itemText}")`);
  }

  // ===================== Actions ===================== //

  async verifyTasksList() {
    await this.navigateToTasksPage();
    const tasksCommand = await this.page.$$("table tbody tr");
    if (tasksCommand.length > 0) {
      for (const task of tasksCommand) {
        const taskName = await task.$("td:nth-child(3)");
        expect(taskName).not.toBe("");
      }
    } else {
      await expect(this.getTasksList()).toContainText("No tasks available");
    }
  }

  async verifyTaskStatusFilter(status: string) {
    await this.navigateToTasksPage();
    await this.getTasksFilter().nth(2).click();
    await this.getFilterDropdown().pressSequentially(status);
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await this.page.locator("th:nth-child(4)", { hasText: "Status" }).waitFor({ state: "visible" });
    await pause(this.page);
    const tasksRows = await this.page.$$("table tbody tr");
    if (tasksRows.length > 0) {
      for (const task of tasksRows) {
        const taskStatus = await task.$("td:nth-child(4)");
        const statusText = await taskStatus?.innerText();
        expect(statusText).toBe("Cancelled");
      }
    } else {
      await expect(this.getTasksList()).toContainText("No tasks available");
    }
    await this.getClearFiltersButton().click();
    await expect(this.getClearFiltersButton()).toBeEnabled();
  }

  async verifyTaskProcessedByFilter(processedBy: string) {
    await this.navigateToTasksPage();
    await this.getFilterInput().nth(1).pressSequentially(processedBy);
    await this.getDropdownList().locator(`text=${processedBy}`).waitFor({ state: "visible" });
    await this.getDropdownList().locator(`text=${processedBy}`).click();

    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);

    const tasksRows = await this.page.$$("table tbody tr");
    if (tasksRows.length > 0) {
      for (const task of tasksRows) {
        const taskProcessedBy = await task.$("td:nth-child(7)");
        const processedByText = await taskProcessedBy?.innerText();
        expect(processedByText).toBe("Muhammad K");
      }
    } else {
      await expect(this.getTasksList()).toContainText("No tasks available");
    }
    await this.getClearFiltersButton().click();
    await expect(this.getClearFiltersButton()).toBeEnabled();
  }

  async verifyTaskAddedByFilter(addedBy: string) {
    await this.navigateToTasksPage();
    await this.getFilterInput().nth(0).pressSequentially(addedBy);
    await this.getDropdownList().locator(`text=${addedBy}`).waitFor({ state: "visible" });
    await this.getDropdownList().locator(`text=${addedBy}`).click();
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);

    const tasksRows = await this.page.$$("table tbody tr");
    if (tasksRows.length > 0) {
      for (const task of tasksRows) {
        const taskAddedBy = await task.$("td:nth-child(6)");
        const addedByText = await taskAddedBy?.innerText();
        expect(addedByText).toBe("Melashu A");
      }
    } else {
      await expect(this.getTasksList()).toContainText("No tasks available");
    }
    await this.getClearFiltersButton().click();
    await expect(this.getClearFiltersButton()).toBeEnabled();
  }

  async verifyTaskCreatedAtFilter() {
    await this.navigateToTasksPage();
    await this.getTasksFilter().nth(0).click();
    await this.getDateFromCalendar().locator("button", { hasText: " Last Week" }).click();
    const getSelectedTimeLine = await this.page.locator(".lucide-calendar + div").nth(1).textContent();
    await this.page.mouse.click(0, 0);
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);
    await validateTaskDatesWithinTimeline(this.page, getSelectedTimeLine, "0");
    await this.getClearFiltersButton().click();
    await expect(this.getClearFiltersButton()).toBeEnabled();
  }

  async verifyTasksLastRunFilter() {
    await this.navigateToTasksPage();
    await this.getTasksFilter().nth(1).click();
    await this.getDateFromCalendar().locator("button", { hasText: "This Week" }).click();
    const getSelectedTimeLine = await this.page.locator(".lucide-calendar + div").first().textContent();
    await this.page.mouse.click(0, 0);
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);
    await validateTaskDatesWithinTimeline(this.page, getSelectedTimeLine, "0");
    await this.getClearFiltersButton().click();
    await expect(this.getClearFiltersButton()).toBeEnabled();
  }

  async savePayoutFilters(status: string) {
    await this.navigateToTasksPage();
    await this.getTasksFilter().nth(2).click();
    await this.getFilterDropdown().pressSequentially(status);
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);
    await this.getSaveFiltersButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await this.getFilterNameInputField().pressSequentially("Tasks_Saved_Filter");
    await this.getSaveButton().click();
    await expect(this.getSuccessNotification()).toContainText("Successfully saved filter.");
    await this.getSuccessNotificationCloseButton().click();
    await this.getClearFiltersButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
  }

  async deleteSavedFilter() {
    await this.navigateToTasksPage();
    await this.getSelectFilterButton().click();
    await this.getDeleteSavedFilterButton().click();
    await expect(this.getSuccessNotification()).toContainText("Successfully deleted filter.");
    await this.getSuccessNotificationCloseButton().click();
    await this.getClearFiltersButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
  }

  async uploadReferralsFromCSVFile() {
    await this.navigateToTasksPage();
    await this.getCommandDropdown().click();
    await this.getCommandOption("Tasks::AffiliatesFromCsv").click();

    const filePath = path.resolve(process.cwd(), "data/ReferralsFrom.csv");
    await this.page.setInputFiles('input[type="file"]', filePath);
    await expect(this.getSuccessNotification()).toContainText("Task created. Click Process to run processing");
    await this.getSuccessNotificationCloseButton().click();
    await this.getCommandRow("Referrals from CSV").locator(".lucide-chevron-right").first().click();
    await expect(this.getCommandLabel("Referrals from CSV")).toBeVisible();
    await this.getProcessButton().click();
    await pause(this.page);

    const successToast = this.page.locator('li[data-sonner-toast][data-visible="true"]').filter({ hasText: "Processing run" });
    await expect(successToast).toBeVisible();
    await successToast.getByLabel("Close toast").click();
    await pause(this.page);
    await this.getSuccessNotificationCloseButton().click({ force: true });
    const taskStatus = this.page
      .locator(".rounded-xl div", {
        hasText: /Failed|Completed/i,
      })
      .nth(3);
    await this.getSuccessNotificationCloseButton().click({ force: true });
    await refreshUntilVisible(this.page, taskStatus);
    await expect(taskStatus).toHaveText(/Failed|Completed/i, {
      timeout: 1000,
    });
  }

  async uploadBulkCommentsFromCSVFile() {
    await this.navigateToTasksPage();
    await this.getCommandDropdown().click();
    await this.getCommandOption("Tasks::BulkComment").click();

    const filePath = path.resolve(process.cwd(), "data/BulkComments.csv");
    await this.page.setInputFiles('input[type="file"]', filePath);
    await expect(this.getSuccessNotification()).toContainText("Task created. Click Process to run processing");
    await this.getSuccessNotificationCloseButton().click();
    await this.getCommandRow("Bulk comment").locator(".lucide-play").first().click();
    await this.getConfirmDialogButton().click();
    await pause(this.page);
    const successToast = this.page.locator('li[data-sonner-toast][data-visible="true"]').filter({ hasText: "Processing run" });
    await expect(successToast).toBeVisible();
    await successToast.getByLabel("Close toast").click();
    await this.getCommandRow("Bulk comment").locator(".lucide-chevron-right").first().click();
    await pause(this.page);

    const taskStatus = this.page
      .locator(".rounded-xl div", {
        hasText: /Failed|Completed/i,
      })
      .nth(3);
    await this.getSuccessNotificationCloseButton().click({ force: true });
    await refreshUntilVisible(this.page, taskStatus);
    await expect(taskStatus).toHaveText(/Failed|Completed/i, {
      timeout: 1000,
    });
  }

  async uploadProcessPayoutsFromCSVFile() {
    await this.navigateToTasksPage();
    await this.getCommandDropdown().click();
    await this.getCommandOption("Tasks::ProcessPayouts").click();

    const filePath = path.resolve(process.cwd(), "data/ProcessPayouts.csv");
    await this.page.setInputFiles('input[type="file"]', filePath);
    await expect(this.getSuccessNotification()).toContainText("Task created. Click Process to run processing");
    await this.getSuccessNotificationCloseButton().click();
    await this.getCommandRow("Process Payouts").locator(".lucide-play").first().click();
    await this.getConfirmDialogButton().click();
    await this.getSuccessNotification().waitFor({ state: "visible" });
    await expect(this.page.getByText("Processing run")).toBeVisible();
    // await expect(this.page.locator('li.toast[data-sonner-toast] [data-title=""]', { hasText: "Processing run" })).toBeVisible({ timeout: 10000 });
    // await expect(this.getSuccessNotification()).toContainText("Processing run");
    await this.getCommandRow("Process Payouts").locator(".lucide-chevron-right").first().click();

    const taskStatus = this.page
      .locator(".rounded-xl div", {
        hasText: /Failed|Completed/i,
      })
      .nth(3);
    await refreshUntilVisible(this.page, taskStatus);
    await expect(taskStatus).toHaveText(/Failed|Completed/i, {
      timeout: 1000,
    });
  }

  async uploadDeductCommissionsFromCSVFile() {
    await this.navigateToTasksPage();
    await this.getCommandDropdown().click();
    await this.getCommandOption("Tasks::DeductCommissionFromCsv").click();

    const filePath = path.resolve(process.cwd(), "data/DeductCommissions.csv");
    await this.page.setInputFiles('input[type="file"]', filePath);
    await expect(this.getSuccessNotification()).toContainText("Task created. Click Process to run processing");
    await this.getSuccessNotificationCloseButton().click();
    await this.getCommandRow("Deduct commission from csv").locator(".lucide-play").first().click();
    await this.getConfirmDialogButton().click();
    const successToast = this.page.locator('li[data-sonner-toast][data-visible="true"]').filter({ hasText: "Processing run" });
    await expect(successToast).toBeVisible();
    await successToast.getByLabel("Close toast").click();
    await this.getCommandRow("Deduct commission from csv").locator(".lucide-chevron-right").first().click();
    await pause(this.page);

    const taskStatus = this.page
      .locator(".rounded-xl div", {
        hasText: /Failed|Completed/i,
      })
      .nth(3);
    await this.getSuccessNotificationCloseButton().click({ force: true });
    await refreshUntilVisible(this.page, taskStatus);
    await expect(taskStatus).toHaveText(/Failed|Completed/i, {
      timeout: 1000,
    });
  }

  async uploadBulkApproveFromCSVFile() {
    const userLoginNumber = await this.accounts.getFirstAccountAfterInReviewFilter();
    await this.navigateToTasksPage();
    await this.getCommandDropdown().click();
    await this.getCommandOption("Tasks::BulkApprove").click();

    const myTestData = [{ login: userLoginNumber, note: "Dummy Playwright Test Note" }];
    const fileToUpload = createCsvFileFromJSON(myTestData, "users.csv");
    await this.page.locator('input[type="file"]').setInputFiles(fileToUpload);

    await expect(this.getSuccessNotification()).toContainText("Task created. Click Process to run processing");
    await this.getSuccessNotificationCloseButton().click();
    await this.getCommandRow("Bulk approve").locator(".lucide-chevron-right").first().click();
    await this.page.waitForLoadState("networkidle");
    await expect(this.getCommandLabel("Bulk approve")).toBeVisible();
    await this.getProcessButton().click();
    const successToast = this.page.locator('li[data-sonner-toast][data-visible="true"]').filter({ hasText: "Processing run" });
    await expect(successToast).toBeVisible();
    await successToast.getByLabel("Close toast").click();
    await this.page.waitForLoadState("networkidle");
    const taskStatus = this.page
      .locator(".rounded-xl div", {
        hasText: /Failed|Completed/i,
      })
      .nth(3);
    await refreshUntilVisible(this.page, taskStatus);
    await expect(taskStatus).toHaveText(/Failed|Completed/i, {
      timeout: 1000,
    });
  }

  async verifyCombinedFilters(status: string, processedBy: string) {
    await this.navigateToTasksPage();
    await this.getTasksFilter().nth(2).click();
    await this.getFilterDropdown().pressSequentially(status);
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);
    await this.getFilterInput().nth(1).pressSequentially(processedBy);
    await this.getDropdownList().locator(`text=${processedBy}`).waitFor({ state: "visible" });
    await this.getDropdownList().locator(`text=${processedBy}`).click();

    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);

    const tasksRows = await this.page.$$("table tbody tr");
    if (tasksRows.length > 0) {
      for (const task of tasksRows) {
        const taskStatus = await task.$("td:nth-child(4)");
        const statusText = await taskStatus?.innerText();
        expect(statusText).toBe("Cancelled");
        const taskProcessedBy = await task.$("td:nth-child(7)");
        const processedByText = await taskProcessedBy?.innerText();
        expect(processedByText).toBe("Muhammad K");
      }
    } else {
      await expect(this.getTasksList()).toContainText("No tasks available");
    }
  }

  async verifyDownloadedSample() {
    await this.navigateToTasksPage();
    await this.getCommandDropdown().click();
    await this.getCommandOption("Tasks::BalanceOperation").click();
    const [download] = await Promise.all([this.page.waitForEvent("download"), this.page.getByRole("button", { name: "Download Sample" }).click()]);
    expect(download.suggestedFilename()).toMatch(/^Balance operation(\s\(\d+\))?\.csv$/);
    const filePath = await download.path();
    expect(filePath).not.toBeNull();
    const fileContent = fs.readFileSync(filePath!, "utf-8");
    // Validate headers
    expect(fileContent).toContain("login,amount,comment");
    //  validate rows data
    expect(fileContent).toContain("newton.spinka,183");
    expect(fileContent).toContain("ryan.lockman,-499");
  }

  async applyScheduleActionsOnTasks(status: string, processedBy: string) {
    const { datePart, hours, minutes } = getScheduleAt();
    await this.navigateToTasksPage();
    await this.getTasksFilter().nth(2).click();
    await this.getFilterDropdown().pressSequentially(status, { delay: 200 });
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);
    await this.getFilterInput().nth(1).pressSequentially(processedBy);
    await this.getDropdownList().locator(`text=${processedBy}`).waitFor({ state: "visible" });
    await this.getDropdownList().locator(`text=${processedBy}`).click();
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);

    await this.getScheduleButton().nth(0).click();
    await this.getCalender().click();
    await this.getDateFromCalender(datePart).click();
    await this.getTimeHours().nth(0).getByRole("button", { name: hours, exact: true }).click();
    await this.getTimeHours().nth(1).getByRole("button", { name: minutes, exact: true }).click();
    await this.page.mouse.click(0, 0);
    await this.page.locator('[role="dialog"] button', { hasText: "Schedule" }).click();
    await expect(this.getSuccessNotification()).toHaveText("Task successfully scheduled");
    await this.getSuccessNotificationCloseButton().click();
    await this.getClearFiltersButton().click();
  }

  async verifyScheduledActionsForTasks(status: string, processedBy: string) {
    const displayDate = getDisplayDate();
    await this.navigateToTasksPage();
    await this.getTasksFilter().nth(2).click();
    await this.getFilterDropdown().pressSequentially(status, { delay: 200 });
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);
    await this.getFilterInput().nth(1).pressSequentially(processedBy);
    await this.getDropdownList().locator(`text=${processedBy}`).waitFor({ state: "visible" });
    await this.getDropdownList().locator(`text=${processedBy}`).click();
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);
    await this.page.locator("table tbody tr").first().hover();
    await this.getViewDetailsButton().nth(1).click({ force: true });
    await pause(this.page);
    await this.getScheduledActionsTab().click();
    await pause(this.page);

    while (true) {
      await pause(this.page);
      const actionsDot = this.page.locator(".lucide-ellipsis");
      if ((await actionsDot.count()) > 0 && (await actionsDot.first().isVisible())) {
        break;
      }
      const nextBtn = this.page.getByRole("button", { name: "Go to last page" });
      if ((await nextBtn.count()) === 0 || !(await nextBtn.isEnabled())) {
        break;
      }
      await nextBtn.click();
    }
    await expect(this.page.locator("tr").filter({ hasText: displayDate }).getByText("Scheduled")).toBeVisible();
    await this.page.mouse.click(0, 0);
    await this.getTasksTab().click();
    await this.getClearFiltersButton().click();
  }

  async cancelScheduledTaskUpdate(status: string, processedBy: string) {
    await this.navigateToTasksPage();
    await this.getTasksFilter().nth(2).click();
    await this.getFilterDropdown().pressSequentially(status, { delay: 200 });
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);
    await this.getFilterInput().nth(1).pressSequentially(processedBy);
    await this.getDropdownList().locator(`text=${processedBy}`).waitFor({ state: "visible" });
    await this.getDropdownList().locator(`text=${processedBy}`).click();
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);
    await this.page.locator("table tbody tr").first().hover();
    await this.getViewDetailsButton().nth(1).click({ force: true });
    await this.getScheduledActionsTab().click();
    await pause(this.page);
    await this.getActionsDot().first().click();
    await this.getActionMenuItem("Cancel").click();
    await this.getConfirmButton().click();
    await expect(this.getSuccessNotification()).toHaveText("Scheduled action successfully cancelled");
    await this.getSuccessNotificationCloseButton().click();
  }
}
export default Tasks;
