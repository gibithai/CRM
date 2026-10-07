import { expect, Page } from "@playwright/test";
import { pause, getScheduleAt } from "../../utils/common";
const userEmail = "muhammad@fundingpips.com";

class ScheduledActions {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ==================== Helper Functions ===================== //

  async navigateToScheduledActionsPage() {
    await this.getScheduledActionsTab().click();
    await expect(this.getScheduledActionsLabel()).toBeVisible();
  }

  // ===================== Locators ===================== //

  getScheduledActionsTab() {
    return this.page.getByRole("link", { name: "Scheduled Actions", exact: true });
  }

  getScheduledActionsLabel() {
    return this.page.locator("h2", { hasText: "Scheduled Actions" });
  }

  getScheduledActionsList() {
    return this.page.locator("tbody tr");
  }

  getFilter() {
    return this.page.locator('.space-y-2 [type="button"]');
  }

  getCreatedByFilterInputField() {
    return this.page.locator('[type="text"]');
  }

  getFilterDropdown() {
    return this.page.locator('[data-slot="command-input"]');
  }

  getUserFromDropdown(email: string) {
    return this.page.locator('[role="option"]', { hasText: email });
  }

  getFilterResultButton() {
    return this.page.locator('[type="submit"]');
  }

  getClearFiltersButton() {
    return this.page.locator("button", { hasText: "Clear Filters" });
  }

  getSelectFilterButton() {
    return this.page.locator("button", { hasText: "Select filter" });
  }

  getDeleteSavedFilterButton() {
    return this.page.locator(".lucide-trash");
  }

  getSuccessNotification() {
    return this.page.locator("[aria-label='Notifications alt+T']");
  }

  getSearchFieldFilter() {
    return this.page.locator('input[name="search_field"]');
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

  getSuccessNotificationCloseButton() {
    return this.page.locator('[aria-label="Close toast"]');
  }

  getActionsDot() {
    return this.page.locator(".lucide-ellipsis");
  }

  getActionMenuItem(itemText: string) {
    return this.page.locator(`[role="menuitem"]:has-text("${itemText}")`);
  }

  getReschedulePopupTitle() {
    return this.page.locator('[role="dialog"] h2');
  }

  getCalender() {
    return this.page.locator(".lucide-calendar");
  }

  getDateFromCalender(formattedScheduledAt: string) {
    return this.page.locator(`[data-day="${formattedScheduledAt}"] button`);
  }

  getRescheduleButton() {
    return this.page.locator('button span:has-text("Reschedule")');
  }

  getConfirmButton() {
    return this.page.locator('button span:has-text("Confirm")');
  }

  getTimeHours() {
    return this.page.locator('[data-slot="scroll-area"]');
  }

  // ===================== Actions ===================== //

  async verifyScheduledActionsList() {
    await this.navigateToScheduledActionsPage();
    const rows = await this.getScheduledActionsList().elementHandles();
    if (rows.length > 1) {
      for (const row of rows) {
        const scheduledType = await row.$eval("td:nth-child(1)", (el) => el.textContent?.trim());
        expect(scheduledType).not.toBe("");
      }
    }
  }

  async verifyStatusesFilter() {
    await this.navigateToScheduledActionsPage();
    await pause(this.page);
    await this.getFilter().nth(1).click();
    await this.getFilterDropdown().pressSequentially("scheduled");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);

    const scheduledActionRows = await this.page.$$("table tbody tr");
    if (scheduledActionRows.length > 1) {
      for (const row of scheduledActionRows) {
        const status = await row.$("td:nth-child(3)");
        const taskText = await status?.innerText();
        expect(taskText).toBe("Scheduled");
      }
    } else {
      await expect(this.getScheduledActionsList()).toContainText("No scheduled actions");
    }
    await this.getClearFiltersButton().click();
    await expect(this.getClearFiltersButton()).toBeEnabled();
  }

  async verifySchedulableTypesFilter() {
    await this.navigateToScheduledActionsPage();
    await pause(this.page);
    await this.getFilter().nth(2).click();
    await this.getFilterDropdown().pressSequentially("task");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);

    const scheduledActionRows = await this.page.$$("table tbody tr");
    if (scheduledActionRows.length > 1) {
      for (const row of scheduledActionRows) {
        const status = await row.$("td:nth-child(1)");
        const taskText = await status?.innerText();
        expect(taskText).toContain("Task");
      }
    } else {
      await expect(this.getScheduledActionsList()).toContainText("No scheduled actions");
    }
    await this.getClearFiltersButton().click();
    await expect(this.getClearFiltersButton()).toBeEnabled();
  }

  async verifyCreatedByFilter() {
    await this.navigateToScheduledActionsPage();
    await pause(this.page);
    await this.getCreatedByFilterInputField().click();
    await this.getCreatedByFilterInputField().pressSequentially("61", { delay: 200 });
    await pause(this.page);
    await this.getUserFromDropdown(userEmail).click();
    await this.page.mouse.click(0, 0);
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);

    const rows = this.page.locator("table tbody tr");
    const rowCount = await rows.count();
    const firstRowText = await rows.first().textContent();
    if (firstRowText?.includes("No scheduled actions")) {
      await expect(this.getScheduledActionsList()).toContainText("No scheduled actions");
    } else {
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        const taskText = (await row.locator("td:nth-child(4)").textContent())?.trim();
        expect(taskText).toBe("Muhammad K");
      }
    }
    await this.getClearFiltersButton().click();
    await expect(this.getClearFiltersButton()).toBeEnabled();
  }

  async deleteAllSavedFilters() {
    await this.navigateToScheduledActionsPage();
    try {
      await this.getSelectFilterButton().waitFor({ state: "visible", timeout: 5000 });
    } catch (error) {
      console.log("No saved filters found.");
      return;
    }
    while (await this.getSelectFilterButton().isVisible()) {
      await this.getSelectFilterButton().click();
      const deleteBtn = this.getDeleteSavedFilterButton().nth(0);

      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        await expect(this.getSuccessNotification()).toHaveText("Successfully deleted filter.");
        await this.page.reload();
        await pause(this.page);
      } else {
        break;
      }
    }
  }

  async verifySaveFilters() {
    await this.navigateToScheduledActionsPage();
    await pause(this.page);
    await this.getFilter().nth(1).click();
    await this.getFilterDropdown().pressSequentially("scheduled");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);
    await expect(this.getFilterResultButton()).toBeEnabled();
    await this.getSaveFiltersButton().click();
    await this.getFilterNameInputField().fill("QA_Saved_Filter");
    await this.getSaveButton().click();
    await expect(this.getSuccessNotification()).toHaveText("Successfully saved filter.");
    await this.getSuccessNotificationCloseButton().click();
  }

  async deleteSavedFilter() {
    await this.navigateToScheduledActionsPage();
    await this.getSelectFilterButton().click();
    await this.getDeleteSavedFilterButton().click();
    await expect(this.getSuccessNotification()).toHaveText("Successfully deleted filter.");
    await this.getSuccessNotificationCloseButton().click();
  }

  async rescheduleProcessedTask() {
    const { datePart, hours, minutes } = getScheduleAt();

    await this.navigateToScheduledActionsPage();
    await this.getFilter().nth(1).click();
    await this.getFilterDropdown().pressSequentially("scheduled");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);
    await this.getFilter().nth(2).click();
    await this.getFilterDropdown().pressSequentially("task");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await this.getActionsDot().nth(0).click();
    await this.getActionMenuItem("Reschedule").click();
    await expect(this.getReschedulePopupTitle()).toHaveText("Reschedule Scheduled Action");
    await this.getCalender().nth(1).click();
    await this.getDateFromCalender(datePart).click();
    await this.getTimeHours().nth(0).getByRole("button", { name: hours, exact: true }).click();
    await this.getTimeHours().nth(1).getByRole("button", { name: minutes, exact: true }).click();
    await this.page.mouse.click(0, 0);
    await this.getRescheduleButton().click();
    await expect(this.getSuccessNotification()).toHaveText("Scheduled action successfully rescheduled");
    await this.getSuccessNotificationCloseButton().click();
    await this.getClearFiltersButton().click();
  }

  async cancelScheduledAction() {
    await this.navigateToScheduledActionsPage();
    await pause(this.page);
    await this.getFilter().nth(1).click();
    await this.getFilterDropdown().pressSequentially("scheduled");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);
    await this.getFilter().nth(2).click();
    await this.getFilterDropdown().pressSequentially("task");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);
    await this.getActionsDot().nth(0).click();
    await this.getActionMenuItem("Cancel").click();
    await this.getConfirmButton().click();
    await expect(this.getSuccessNotification()).toHaveText("Scheduled action successfully cancelled");
    await this.getSuccessNotificationCloseButton().click();
    await this.getClearFiltersButton().click();
  }
}

export default ScheduledActions;
