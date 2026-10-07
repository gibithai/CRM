import { expect, Locator, Page } from "@playwright/test";
import { pause } from "../../utils/common";

class Groups {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ==================== Helper Functions ===================== //

  async navigateToGroupsPage() {
    await this.page.locator('[aria-label="More pages"]').click();
    await this.getGroupsTab().click();
    await expect(this.getGroupsLabel()).toBeVisible();
  }

  async selectDropdownFromFilters(filterButton: Locator, option: string) {
    await filterButton.click();
    const listbox = this.page.locator('[role="listbox"]');
    await listbox.waitFor({ state: "visible" });
    await listbox.getByRole("option", { name: option, exact: true }).click();
    await this.page.mouse.click(0, 0);
    await expect(listbox).toBeHidden();
  }

  async selectDropdownFromCreateWindow(filterButton: Locator, option: string) {
    await filterButton.click();
    const listbox = this.page.locator('[role="listbox"]');
    await listbox.waitFor({ state: "visible" });
    await listbox.getByRole("option", { name: option, exact: true }).click();
    await expect(listbox).toBeHidden();
  }

  // ===================== Locators ===================== //

  getGroupsTab() {
    return this.page.getByRole("menuitem", { name: "Groups", exact: true });
  }

  getGroupsLabel() {
    return this.page.locator("h2", { hasText: "Groups" });
  }

  getGroupsList() {
    return this.page.locator("tbody tr");
  }

  getFilterResultButton() {
    return this.page.locator('[type="submit"]');
  }

  getClearFiltersButton() {
    return this.page.locator("button", { hasText: "Clear Filters" });
  }

  getSearchFilterInput() {
    return this.page.locator('input[name="search_field"]');
  }

  getAccountTypeFilterButton() {
    return this.page.locator(':text-is("Account type") + button');
  }

  getPlatformFilterButton() {
    return this.page.locator(':text-is("Platform") + button');
  }

  getPhaseFilterButton() {
    return this.page.locator(':text-is("Phase") + button');
  }

  getCurrencyFilterButton() {
    return this.page.locator(':text-is("Currency") + button');
  }

  getAccountSizeMinButton() {
    return this.page.getByRole("button").filter({ hasText: /^Min$/ });
  }

  getAccountSizeMaxButton() {
    return this.page.getByRole("button").filter({ hasText: /^Max$/ });
  }

  getSwapFreeFilterButton() {
    return this.page.locator(':text-is("Swap free") + button');
  }

  getCloseOnlyFilterButton() {
    return this.page.locator(':text-is("Close only") + button');
  }

  getCreateGroupButton() {
    return this.page.locator("button span", { hasText: "Create Group" });
  }

  getGroupNameInput() {
    return this.page.locator('input[name="name"]');
  }

  getGroupExternalIdentifierInput() {
    return this.page.locator('input[name="external_identifier"]');
  }

  getGroupPlatformDropdown() {
    return this.page.locator('[role="dialog"]').first().getByRole("marquee").nth(0);
  }

  getGroupAccountTypeDropdown() {
    return this.page.locator('[role="dialog"]').first().getByRole("marquee").nth(1);
  }

  getGroupPhaseDropdown() {
    return this.page.locator('[role="dialog"]').first().getByRole("marquee").nth(2);
  }

  getGroupCurrencyDropdown() {
    return this.page.locator('[role="dialog"]').first().getByRole("marquee").nth(3);
  }

  getGroupLeverageDropdown() {
    return this.page.locator('[role="dialog"]').first().getByRole("marquee").nth(4);
  }

  getCreateGroupSubmitButton() {
    return this.page.locator('[role="dialog"]').first().locator("button", { hasText: "Create Group" });
  }

  getSuccessNotification() {
    return this.page.locator("[aria-label='Notifications alt+T']");
  }

  getSuccessNotificationCloseButton() {
    return this.page.locator('[aria-label="Close toast"]');
  }

  getEditGroupButton(groupName: string) {
    return this.page
      .locator("tbody tr", { has: this.page.locator("td:nth-child(1)", { hasText: groupName }) })
      .first()
      .locator("td:last-child button");
  }

  getUpdateGroupSubmitButton() {
    return this.page.locator('[role="dialog"]').first().locator("button", { hasText: "Update Group" });
  }

  getFilterNameInputField() {
    return this.page.locator("#filter-name");
  }

  getSaveButton() {
    return this.page.locator('[role="dialog"] button', { hasText: "Save" });
  }

  getSelectFilterButton() {
    return this.page.locator("button", { hasText: "Select filter" });
  }

  getSaveFiltersButton() {
    return this.page.locator("button", { hasText: "Save filters" });
  }

  getDeleteSavedFilterButton() {
    return this.page.locator(".lucide-trash");
  }

  // ===================== Actions ===================== //

  async verifyGroupsList() {
    await this.navigateToGroupsPage();
    await this.page.locator("th:nth-child(2)", { hasText: "External Identifier" }).waitFor({ state: "visible" });
    const rows = this.page.locator("table tbody tr");
    const rowCount = await rows.count();

    if (rowCount > 0) {
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        const groupsName = row.locator("td:nth-child(1)");
        const externalIdentifier = row.locator("td:nth-child(2)");
        await externalIdentifier.waitFor({ state: "visible" });
        expect(await externalIdentifier.textContent()).not.toBe("");
        expect(await groupsName.textContent()).not.toBe("");
      }
    } else {
      await expect(this.getGroupsList()).toContainText("No more records");
    }
  }

  async searchGroupsByName() {
    await this.navigateToGroupsPage();
    await this.getSearchFilterInput().fill("qa_groups");
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);

    const rows = await this.getGroupsList().elementHandles();
    if (rows.length > 0) {
      for (const row of rows) {
        const groupName = await row.$eval("td:nth-child(1) span", (td) => td.textContent?.trim());
        expect(groupName).toBe("qa_groups");
      }
    } else {
      await expect(this.getGroupsList()).toContainText("No data");
    }
    await this.getClearFiltersButton().click();
  }

  async filterByAccountType(accountType: string) {
    await this.navigateToGroupsPage();
    await pause(this.page);
    await this.selectDropdownFromFilters(this.getAccountTypeFilterButton(), accountType);
    await pause(this.page);
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);

    const rows = await this.getGroupsList().elementHandles();
    if (rows.length > 0) {
      for (const row of rows) {
        const accountTypeOption = await row.$eval("td:nth-child(4)", (td) => td.textContent?.trim());
        expect(accountTypeOption).toBe(accountType);
      }
    } else {
      await expect(this.getGroupsList()).toContainText("No data");
    }
    await this.getClearFiltersButton().click();
  }

  async filterByCombinedFilters(platform: string, phase: string, currency: string) {
    await this.navigateToGroupsPage();
    await pause(this.page);
    await this.selectDropdownFromFilters(this.getPlatformFilterButton(), platform);
    await this.page.mouse.click(0, 0);
    await pause(this.page);
    await this.selectDropdownFromFilters(this.getPhaseFilterButton(), phase);
    await this.page.mouse.click(0, 0);
    await pause(this.page);
    await this.selectDropdownFromFilters(this.getCurrencyFilterButton(), currency);
    await this.page.mouse.click(0, 0);
    await pause(this.page);

    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);

    const rows = await this.getGroupsList().elementHandles();
    if (rows.length > 0) {
      for (const row of rows) {
        const platformCell = await row.$eval("td:nth-child(3)", (td) => td.textContent?.trim());
        const phaseCell = await row.$eval("td:nth-child(5)", (td) => td.textContent?.trim());
        const currencyCell = await row.$eval("td:nth-child(6)", (td) => td.textContent?.trim());
        expect(platformCell).toBe(platform);
        expect(phaseCell).toBe(phase);
        expect(currencyCell).toBe(currency);
      }
    } else {
      await expect(this.getGroupsList()).toContainText("No data");
    }
    await this.getClearFiltersButton().click();
  }

  async filterByAccountSize(min: string, max: string) {
    await this.navigateToGroupsPage();
    await pause(this.page);
    await this.selectDropdownFromFilters(this.getAccountSizeMinButton(), min);
    await pause(this.page);
    await this.selectDropdownFromFilters(this.getAccountSizeMaxButton(), max);

    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);
    const minVal = parseInt(min, 10);
    const maxVal = parseInt(max, 10);

    const rows = await this.getGroupsList().elementHandles();
    if (rows.length > 0) {
      for (const row of rows) {
        const sizeText = await row.$eval("td:nth-child(8)", (td) => td.textContent?.trim());
        const accountSize = parseInt(sizeText || "0", 10);
        expect(accountSize).toBeGreaterThanOrEqual(minVal);
        expect(accountSize).toBeLessThanOrEqual(maxVal);
      }
    } else {
      await expect(this.getGroupsList()).toContainText("No data");
    }
    await this.getClearFiltersButton().click();
  }

  async filterBySwapFree(option: string) {
    await this.navigateToGroupsPage();
    await pause(this.page);
    await this.selectDropdownFromFilters(this.getSwapFreeFilterButton(), option);
    await this.page.mouse.click(0, 0);
    await pause(this.page);
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);

    const rows = await this.getGroupsList().elementHandles();
    if (rows.length > 0) {
      for (const row of rows) {
        const swapFreeCell = await row.$eval("td:nth-child(9)", (td) => td.textContent?.trim());
        expect(swapFreeCell).toBe(option);
      }
    } else {
      await expect(this.getGroupsList()).toContainText("No data");
    }
    await this.getClearFiltersButton().click();
  }

  async filterByCloseOnly(option: string) {
    await this.navigateToGroupsPage();
    await pause(this.page);
    await this.selectDropdownFromFilters(this.getCloseOnlyFilterButton(), option);
    await this.page.mouse.click(0, 0);
    await pause(this.page);
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);

    const rows = await this.getGroupsList().elementHandles();
    if (rows.length > 0) {
      for (const row of rows) {
        const closeOnlyCell = await row.$eval("td:nth-child(10)", (td) => td.textContent?.trim());
        expect(closeOnlyCell).toBe(option);
      }
    } else {
      await expect(this.getGroupsList()).toContainText("No data");
    }
    await this.getClearFiltersButton().click();
  }

  async createGroup(
    name: string,
    externalIdentifier: string,
    platform: string,
    accountType: string,
    phase: string,
    currency: string,
    leverage: string
  ) {
    await this.navigateToGroupsPage();
    await pause(this.page, 500);
    await this.getCreateGroupButton().click();
    await this.page.locator('h2:has-text("New Group")').waitFor({ state: "visible" });
    await this.getGroupNameInput().fill(name);
    await this.getGroupExternalIdentifierInput().fill(externalIdentifier);
    await this.selectDropdownFromCreateWindow(this.getGroupPlatformDropdown(), platform);
    await this.selectDropdownFromCreateWindow(this.getGroupAccountTypeDropdown(), accountType);
    await this.selectDropdownFromCreateWindow(this.getGroupPhaseDropdown(), phase);
    await this.selectDropdownFromCreateWindow(this.getGroupCurrencyDropdown(), currency);
    await this.selectDropdownFromCreateWindow(this.getGroupLeverageDropdown(), leverage);
    await expect(this.getCreateGroupSubmitButton()).toBeEnabled();
    await this.getCreateGroupSubmitButton().click();
    await expect(this.getSuccessNotification()).toHaveText("Group created successfully");
    await this.getSuccessNotificationCloseButton().click();
  }

  async verifyCreatedGroup(groupName: string) {
    await this.navigateToGroupsPage();
    await pause(this.page);
    await this.getSearchFilterInput().pressSequentially(groupName, { delay: 100 });
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);
    await expect(this.page.locator("tbody td:nth-child(1)", { hasText: groupName }).first()).toBeVisible();
    await this.getClearFiltersButton().click();
  }

  async editGroup(groupName: string, newName: string) {
    await this.navigateToGroupsPage();
    await pause(this.page);
    await this.getSearchFilterInput().pressSequentially(groupName, { delay: 100 });
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);
    await this.getEditGroupButton(groupName).click();
    await pause(this.page);
    await this.page.locator('h2:has-text("Edit Group")').waitFor({ state: "visible" });
    await this.getGroupNameInput().click({ clickCount: 3 });
    await this.getGroupNameInput().fill(newName);
    await expect(this.getUpdateGroupSubmitButton()).toBeEnabled();
    await this.getUpdateGroupSubmitButton().click();
    await expect(this.getSuccessNotification()).toHaveText("Group updated successfully");
    await this.getSuccessNotificationCloseButton().click();
    await this.getClearFiltersButton().click();
  }

  async verifyUpdatedGroup(newGroupName: string) {
    await this.navigateToGroupsPage();
    await pause(this.page);
    await this.getSearchFilterInput().pressSequentially(newGroupName, { delay: 100 });
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);
    await expect(this.page.locator("tbody td:nth-child(1)", { hasText: newGroupName }).first()).toBeVisible();
    await this.getClearFiltersButton().click();
  }

  async verifySaveFilters() {
    await this.navigateToGroupsPage();
    await this.getSearchFilterInput().pressSequentially(" qa_groups", { delay: 100 });
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);
    await this.getSaveFiltersButton().click();
    await this.getFilterNameInputField().fill("QA_Saved_Filter");
    await this.getSaveButton().click();
    await expect(this.getSuccessNotification()).toHaveText("Successfully saved filter.");
    await this.getSuccessNotificationCloseButton().click();
  }

  async deleteSavedFilter() {
    await this.navigateToGroupsPage();
    await this.getSelectFilterButton().click();
    await this.getDeleteSavedFilterButton().click();
    await expect(this.getSuccessNotification()).toHaveText("Successfully deleted filter.");
    await this.getSuccessNotificationCloseButton().click();
  }
}
export default Groups;
