import { expect, Page } from "@playwright/test";
import { pause } from "../../utils/common";

import path from "path";
import { deleteFileIfExists, validateExportCSVHeaders, validateUsersFromCSV, parseCsvToObjects } from "../../utils/common";
const payoutReference = "eb488c097fdf";
const userEmail = "muhammad@fundingpips.com";
const assignedUser = "ivan+finance@fundingpips.com";
class Payouts {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ==================== Helper Functions ===================== //

  async navigateToTasksPage() {
    await this.getTasksTab().click();
    await expect(this.getTasksLabel()).toBeVisible();
  }

  async navigateToPayoutsPage() {
    await this.getPayoutsTab().click();
    await expect(this.getPayoutsLabel()).toBeVisible();
  }

  // ===================== Locators ===================== //

  getPayoutsTab() {
    return this.page.locator("a", { hasText: "Payouts" });
  }

  getPayoutsLabel() {
    return this.page.locator("h2", { hasText: "History" });
  }

  getPayoutList() {
    return this.page.locator("tbody tr");
  }

  getSearchField() {
    return this.page.locator('[name="search_field"]');
  }

  getPayoutFilter() {
    return this.page.locator('.space-y-2 [type="button"]');
  }

  getFilterDropdown() {
    return this.page.locator('[data-slot="command-input"]');
  }

  getFilterResultButton() {
    return this.page.locator('[type="submit"]');
  }

  getSearchByUserFilter() {
    return this.page.locator('[placeholder="User email or name"]');
  }

  getUserFromDropdown(email: string) {
    return this.page.locator('[role="option"]', { hasText: email });
  }

  getDeleteSavedFilterButton() {
    return this.page.locator(".lucide-trash");
  }

  getSuccessNotification() {
    return this.page.locator("[aria-label='Notifications alt+T']");
  }

  getSaveFiltersButton() {
    return this.page.locator("button", { hasText: "Save filters" });
  }

  getSaveButton() {
    return this.page.locator('[role="dialog"] button', { hasText: "Save" });
  }

  getFilterNameInputField() {
    return this.page.locator("#filter-name");
  }

  getSearchTagInputField() {
    return this.page.locator('[data-slot="command-input"]');
  }

  getEditActionButton() {
    return this.page.locator("span .lucide-pencil");
  }

  getNotesTab() {
    return this.page.locator('button:has-text("Notes")');
  }

  getDeleteNoteButton() {
    return this.page.locator(".lucide-trash2");
  }

  getDialogDeleteButton() {
    return this.page.locator('button:has-text("Delete")');
  }

  getSuccessNotificationCloseButton() {
    return this.page.locator('[aria-label="Close toast"]');
  }

  getAddNoteButton() {
    return this.page.locator("button span:has-text('Add')");
  }

  getEditNoteButton() {
    return this.page.locator("button span:has-text('Edit note')");
  }

  getClearFiltersButton() {
    return this.page.locator("button", { hasText: "Clear Filters" });
  }

  getEditWindowCloseButton() {
    return this.page.locator('[type="button"] span:has-text("Close")');
  }

  getNoteInputField() {
    return this.page.locator('[data-slot="textarea"]');
  }

  getSelectAllCheckbox() {
    return this.page.locator("th [role='checkbox']");
  }

  getRowCheckbox() {
    return this.page.locator("[aria-label='Select row']");
  }

  getBulkActionsButton() {
    return this.page.locator("button", { hasText: "Bulk actions" });
  }

  getAssignBulkOption(Action: string) {
    return this.page.locator('[role="menuitem"]', { hasText: Action });
  }

  getCreateProcessingLabel() {
    return this.page.locator("h2", { hasText: "Create Processing Task" });
  }

  getAmountToBeProcessedLabel() {
    return this.page.locator("h2", { hasText: "Amount to be processed for each payment method" });
  }

  getCreateTaskButton() {
    return this.page.locator("button", { hasText: "Create Task" });
  }

  getAssignToInputField() {
    return this.page.locator('[role="dialog"] [type="text"]');
  }

  getUpdateButton() {
    return this.page.locator('[role="dialog"] button', { hasText: "Update" });
  }

  getHeaders(column: number, header: string) {
    return this.page.locator(`th:nth-child(${column})`, { hasText: header });
  }

  getTasksTab() {
    return this.page.locator("a", { hasText: "Tasks" });
  }

  getTasksLabel() {
    return this.page.locator("h2", { hasText: "Tasks" });
  }

  getCommandLabel(command: string) {
    return this.page.locator("h1", { hasText: `${command}` });
  }

  getUserTabFromNotes() {
    return this.page.locator(".lucide-user");
  }

  getTagFromIdexPage(tagName: string) {
    return this.page.locator(`[data-value="__create__${tagName}"]`);
  }

  // ===================== Actions ===================== //

  async verifyPayoutsList() {
    await this.navigateToPayoutsPage();
    await this.page.locator("th:nth-child(2)", { hasText: "Reference" }).waitFor({ state: "visible" });
    const payoutsRows = await this.page.$$("table tbody tr");
    for (const payoutRow of payoutsRows) {
      const userCell = await payoutRow.$("td:nth-child(3) a");
      if (userCell) {
        const href = await userCell.evaluate((el) => el.getAttribute("href"));
        if (href === "/users/undefined") {
          continue;
        }
      }
      const referenceCell = await payoutRow.$("td:nth-child(2) span");
      if (!referenceCell) continue;
      const referenceText = (await referenceCell.textContent())?.trim();
      expect(referenceText).not.toBe("");
    }
  }

  async verifyPayoutSearchFilter() {
    await this.navigateToPayoutsPage();
    await this.page.locator("th:nth-child(2)", { hasText: "Reference" }).waitFor({ state: "visible" });

    await this.getSearchField().pressSequentially(payoutReference, { delay: 200 });
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    const rows = this.getPayoutList();
    await expect(rows.filter({ hasText: payoutReference }).first()).toBeVisible();
    await this.getClearFiltersButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
  }

  async verifyPayoutStatusesFilter() {
    await this.navigateToPayoutsPage();
    await this.getPayoutFilter().nth(0).click();
    await this.getFilterDropdown().pressSequentially("Requested");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    const payoutsRows = await this.page.$$("table tbody tr");
    await this.page.locator("th:nth-child(11)", { hasText: "Status" }).waitFor({ state: "visible" });
    for (const payoutRow of payoutsRows) {
      const userCell = await payoutRow.$("td:nth-child(3) a");
      if (userCell) {
        const href = await userCell.evaluate((el) => el.getAttribute("href"));

        if (href === "/users/undefined") {
          continue;
        }
      }
      const statusCell = await payoutRow.$("td:nth-child(11)");
      if (!statusCell) continue;
      const statusText = (await statusCell.textContent())?.trim();
      expect(statusText).toBe("Requested");
    }
    await this.getClearFiltersButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
  }

  async verifyPayoutTypeFilter() {
    await this.navigateToPayoutsPage();
    await this.getPayoutFilter().nth(1).click();
    await this.getFilterDropdown().pressSequentially("Affiliate");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);

    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    const payoutsRows = await this.page.$$("table tbody tr");
    await this.page.locator("th:nth-child(12)", { hasText: "Payout Type" }).waitFor({ state: "visible" });

    for (const payoutRow of payoutsRows) {
      const userCell = await payoutRow.$("td:nth-child(3) a");
      if (userCell) {
        const href = await userCell.evaluate((el) => el.getAttribute("href"));

        if (href === "/users/undefined") {
          continue;
        }
      }
      const typeCell = await payoutRow.$("td:nth-child(12)");
      if (!typeCell) continue;
      const typeText = (await typeCell.textContent())?.trim();
      expect(typeText).toBe("Affiliate");
    }
    await this.getClearFiltersButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
  }

  async verifyPayoutCycleFilter() {
    await this.navigateToPayoutsPage();
    await this.getPayoutFilter().nth(5).click();
    await this.getFilterDropdown().pressSequentially("Tuesday");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);

    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    const payoutsRows = await this.page.$$("table tbody tr");
    await this.page.locator("th:nth-child(17)", { hasText: "Payout Cycle" }).waitFor({ state: "visible" });

    for (const payoutRow of payoutsRows) {
      const userCell = await payoutRow.$("td:nth-child(3) a");
      if (userCell) {
        const href = await userCell.evaluate((el) => el.getAttribute("href"));

        if (href === "/users/undefined") {
          continue;
        }
      }
      const cycleCell = await payoutRow.$("td:nth-child(17)");
      if (!cycleCell) continue;
      const cycleText = (await cycleCell.textContent())?.trim();
      expect(cycleText).toBe("Tuesday");
    }
    await this.getClearFiltersButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
  }

  async deleteSavedFilter() {
    await this.navigateToPayoutsPage();
    await this.page.locator("button", { hasText: "Select filter" }).click();
    await this.getDeleteSavedFilterButton().click();
    await expect(this.getSuccessNotification()).toContainText("Successfully deleted filter.");
    await this.getClearFiltersButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
  }

  async savePayoutFilters() {
    await this.navigateToPayoutsPage();
    await this.getSearchField().pressSequentially(payoutReference);
    await this.getSaveFiltersButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await this.getFilterNameInputField().pressSequentially("Payouts_Saved_Filter");
    await this.getSaveButton().click();
    await expect(this.getSuccessNotification()).toContainText("Successfully saved filter.");
    await this.getClearFiltersButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
  }

  async addTagToPayout(tagName: string) {
    await this.navigateToPayoutsPage();
    await this.getSearchField().pressSequentially(payoutReference);
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await this.page.locator("table tbody tr", { hasText: payoutReference }).locator("td:nth-child(15)").click({ force: true });
    await this.getSearchTagInputField().pressSequentially(tagName, { delay: 200 });
    await this.getTagFromIdexPage(tagName).waitFor({ state: "visible" });
    await this.getTagFromIdexPage(tagName).click();
    await this.page.mouse.click(0, 0);
    // await expect(this.page.getByText("Tag successfully updated").first()).toBeVisible();
    await this.getClearFiltersButton().click();
    await expect(this.getClearFiltersButton()).toBeEnabled();
  }

  async verifyTheAddedTag(tagName: string) {
    await this.navigateToPayoutsPage();
    await this.getSearchField().pressSequentially(payoutReference);
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);
    const row = this.page.locator("table tbody tr", { hasText: payoutReference });
    await row.waitFor({ state: "visible" });
    await row.locator("td:nth-child(15)").click({ force: true });
    await this.getSearchTagInputField().pressSequentially(tagName, { delay: 200 });
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);
    // await expect(this.page.getByText("Tag successfully updated").first()).toBeVisible();
    await this.getClearFiltersButton().click();
    await expect(this.getClearFiltersButton()).toBeEnabled();
  }

  async verifyTagFilter() {
    await this.navigateToPayoutsPage();
    await this.getPayoutFilter().nth(3).click();
    await pause(this.page);
    await this.getFilterDropdown().pressSequentially("Froz", { delay: 200 });
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();

    const payoutsRows = await this.page.$$("table tbody tr");
    for (const payoutRow of payoutsRows) {
      const userCell = await payoutRow.$("td:nth-child(3) a");
      if (userCell) {
        const href = await userCell.evaluate((el) => el.getAttribute("href"));
        if (href === "/users/undefined") continue;
      }

      const tagCell = await payoutRow.$("td:nth-child(15)");
      if (!tagCell) continue;

      const tagText = (await tagCell.textContent()) ?? "";
      expect(tagText.toLowerCase()).toContain("#froz");
    }
    await this.getClearFiltersButton().click();
    await expect(this.getClearFiltersButton()).toBeEnabled();
  }

  async exportCSV() {
    const payoutCSV = path.join(process.cwd(), "downloads", "export.csv");
    deleteFileIfExists(payoutCSV);

    const downloadPromise = this.page.waitForEvent("download");
    const responsePromise = this.page.waitForResponse((resp) => resp.url().includes("/api/payouts") && resp.status() === 200);

    await this.navigateToPayoutsPage();
    await this.getSearchByUserFilter().pressSequentially(userEmail);
    await this.getUserFromDropdown(userEmail).click();
    await this.page.mouse.click(0, 0);

    await this.getFilterResultButton().click();

    const response = await responsePromise;
    expect(response.status()).toBe(200);
    await pause(this.page);
    await this.page.locator("button", { hasText: "Export CSV" }).click();

    const download = await downloadPromise;
    await download.saveAs(payoutCSV);

    validateExportCSVHeaders(payoutCSV, ["User", "Status", "Amount", "Reference", "Payment method", "Login", "Refunds"]);
    const data = parseCsvToObjects(payoutCSV);
    validateUsersFromCSV(data, "User", ["Muhammad K"]);
  }

  async deleteAllNotes() {
    await this.navigateToPayoutsPage();
    await this.getSearchField().pressSequentially(payoutReference, { delay: 500 });
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await this.page.locator("table tbody tr").first().hover();
    await this.getEditActionButton().nth(1).click();
    await this.getNotesTab().click();
    await this.getUserTabFromNotes().first().click();

    const notes = this.getDeleteNoteButton();
    const noteCount = await notes.count();

    if (noteCount === 0) {
      await this.page.locator('p:has-text("No user notes found.")').waitFor({ state: "visible" });
    } else {
      for (let i = 0; i < noteCount; i++) {
        await notes.first().waitFor({ state: "visible" });
        await notes.first().click();
        await this.getDialogDeleteButton().click();
        await expect(this.getSuccessNotification()).toContainText("Note deleted successfully");
        await this.page.getByRole("listitem").filter({ hasText: "Note deleted successfully" }).getByLabel("Close toast").click();
      }
    }
    await this.page.locator('p:has-text("No user notes found.")').waitFor({ state: "visible" });
    await this.getEditWindowCloseButton().click();
    await this.getClearFiltersButton().click();
    await expect(this.getClearFiltersButton()).toBeEnabled();
  }

  async addPayoutNote() {
    await this.navigateToPayoutsPage();
    await this.getSearchField().pressSequentially(payoutReference, { delay: 500 });
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);
    await this.getEditActionButton().last().click({ force: true });
    await this.getNotesTab().click();
    await this.getUserTabFromNotes().click();
    await expect(this.getNoteInputField()).toBeVisible();
    await this.getNoteInputField().pressSequentially("This is a test note for the Payouts Automation.");
    await expect(this.getAddNoteButton()).toBeEnabled();
    await this.getAddNoteButton().click();
    await expect(this.getSuccessNotification()).toContainText("Note successfully created");
    await this.page.getByRole("listitem").filter({ hasText: "Note successfully created" }).getByLabel("Close toast").click();
    await expect(this.page.locator("p")).toContainText("This is a test note for the Payouts Automation.");
    await this.getEditWindowCloseButton().click();
    await this.getClearFiltersButton().click();
    await expect(this.getClearFiltersButton()).toBeEnabled();
  }

  async editPayoutNote() {
    await this.navigateToPayoutsPage();
    await this.getSearchField().pressSequentially(payoutReference, { delay: 500 });
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);
    await this.getEditActionButton().last().click({ force: true });
    await this.getNotesTab().click();
    await this.getUserTabFromNotes().first().click();
    const addedNote = this.page.locator("div.rounded-xl").filter({
      has: this.page.locator("p", { hasText: "This is a test note for the Payouts Automation." }),
    });
    await addedNote.locator("button .lucide-pencil").click();
    await this.getNoteInputField().nth(1).clear();
    await this.getNoteInputField().nth(1).pressSequentially("This is an edited test note for the Payouts Automation.");
    await expect(this.getEditNoteButton()).toBeEnabled();
    await this.getEditNoteButton().click();
    await pause(this.page);
    await expect(this.getSuccessNotification()).toContainText("Note updated successfully");
    await this.page.getByRole("listitem").filter({ hasText: "Note updated successfully" }).getByLabel("Close toast").click();
    await expect(this.page.locator("p")).toContainText("This is an edited test note for the Payouts Automation.");
    await this.getEditWindowCloseButton().click();
    await this.getClearFiltersButton().click();
    await expect(this.getClearFiltersButton()).toBeEnabled();
  }

  async deletePayoutNote() {
    await this.navigateToPayoutsPage();
    await this.getSearchField().pressSequentially(payoutReference, { delay: 500 });
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await this.getEditActionButton().nth(1).click({ force: true });
    await this.getNotesTab().click();
    await this.getUserTabFromNotes().first().click();
    await pause(this.page);
    await this.getDeleteNoteButton().click();
    await this.getDialogDeleteButton().click();
    await expect(this.getSuccessNotification()).toContainText("Note deleted successfully");
    await this.page.getByRole("listitem").filter({ hasText: "Note deleted successfully" }).getByLabel("Close toast").click();
    await this.getEditWindowCloseButton().click();
    await this.getClearFiltersButton().click();
    await expect(this.getClearFiltersButton()).toBeEnabled();
  }

  async performAssignBulkAction() {
    await this.navigateToPayoutsPage();
    await this.getSearchByUserFilter().pressSequentially("61");
    await this.getUserFromDropdown(userEmail).click();
    await this.page.mouse.click(0, 0);
    await this.getPayoutFilter().nth(2).click();
    await this.getFilterDropdown().pressSequentially("Pay");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");

    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await this.getSelectAllCheckbox().check();

    await this.getBulkActionsButton().click();
    await this.getAssignBulkOption("Assign").click();
    await pause(this.page);
    await this.getAssignToInputField().nth(1).pressSequentially("ivan", { delay: 100 });
    await this.getUserFromDropdown(assignedUser).click();
    await this.getUpdateButton().click();
    await pause(this.page);

    await expect(this.getSuccessNotification()).toContainText("The assignee of the selected payouts has been changed successfully");
    await this.page
      .getByRole("listitem")
      .filter({ hasText: "The assignee of the selected payouts has been changed successfully" })
      .getByLabel("Close toast")
      .click();

    await this.getHeaders(6, "Assignee").waitFor({ state: "visible" });
    const payoutsRows = await this.page.$$("table tbody tr");
    for (const row of payoutsRows) {
      const assignee = (await row.$eval("td:nth-child(6)", (td) => td.textContent)).trim();
      expect(assignee).toBe("Ivan G");
    }
    await this.getClearFiltersButton().click();
    await pause(this.page);
  }

  async performUnAssignBulkAction() {
    await this.navigateToPayoutsPage();
    await this.getSearchByUserFilter().pressSequentially("61");
    await this.getUserFromDropdown(userEmail).click();
    await this.page.mouse.click(0, 0);
    await this.getPayoutFilter().nth(2).click();
    await this.getFilterDropdown().pressSequentially("Pay");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");

    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await this.getSelectAllCheckbox().check();

    await this.getBulkActionsButton().click();
    await this.getAssignBulkOption("Assign").click();
    await this.getAssignToInputField().nth(1).pressSequentially("Unassigned ", { delay: 100 });
    await this.getUserFromDropdown("Unassigned").click();
    await this.getUpdateButton().click();
    await pause(this.page);

    await expect(this.getSuccessNotification()).toContainText("The assignee of the selected payouts has been changed successfully");
    await this.page
      .getByRole("listitem")
      .filter({ hasText: "The assignee of the selected payouts has been changed successfully" })
      .getByLabel("Close toast")
      .click();

    await this.getHeaders(6, "Assignee").waitFor({ state: "visible" });
    await pause(this.page);
    const payoutsRows = await this.page.$$("table tbody tr");
    for (const row of payoutsRows) {
      const assignee = (await row.$eval("td:nth-child(6)", (td) => td.textContent)).trim();
      expect(assignee).toBe("Unassigned");
    }
    await this.getClearFiltersButton().click();
  }

  async createProcessingTaskBulkAction() {
    await this.navigateToPayoutsPage();
    await this.getPayoutFilter().nth(0).click();
    await this.getFilterDropdown().pressSequentially("Requested");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);
    await pause(this.page);

    await this.getPayoutFilter().nth(2).click();
    await this.getFilterDropdown().pressSequentially("Rise", { delay: 200 });
    await this.page.keyboard.press("Enter");
    await this.page.mouse.click(0, 0);
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await this.getRowCheckbox().first().check();
    await this.getBulkActionsButton().click();
    await this.getAssignBulkOption("Create processing task").click();
    await this.getCreateProcessingLabel().waitFor({ state: "visible" });
    await this.getAmountToBeProcessedLabel().waitFor({ state: "visible" });
    await this.getCreateTaskButton().click();
    await expect(this.getSuccessNotification()).toContainText(
      "The task is being created in the background. Please visit the Tasks page in a few minutes to check its status."
    );
    await this.page
      .getByRole("listitem")
      .filter({ hasText: "The task is being created in the background. Please visit the Tasks page in a few minutes to check its status." })
      .getByLabel("Close toast")
      .click();

    await this.navigateToTasksPage();
    await pause(this.page);

    const payoutsRows = await this.page.$$("table tbody tr");
    const firstRow = payoutsRows[0];

    const command = (await firstRow.$eval("td:nth-child(3)", (td) => td.textContent)).trim();
    const status = (await firstRow.$eval("td:nth-child(4)", (td) => td.textContent)).trim();

    expect(command).toBe("Process payouts");
    expect(status).toBe("Created");
  }
}
export default Payouts;
