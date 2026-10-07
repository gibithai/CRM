import { Page, Locator, expect } from "@playwright/test";
import { pause } from "../../utils/common";
const accountLogin = "9006016";
const openPositionsAccountLogin = "0039209721";
const tradesPerIPAccountLogin = "419481";

class AccountDetails {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ==================== Helper Functions ===================== //

  async navigateToAccountPage() {
    await this.getAccountsTab().click();
    await expect(this.getAccountsLabel()).toBeVisible();
  }

  async navigateToRiskParametersTab() {
    await this.navigateToAccountPage();
    await this.getSearchField().fill(accountLogin);
    await this.getFilterResultButton().click();
    await pause(this.page);
    await expect(this.getAccountList()).toHaveCount(1);
    await this.getViewDetailsActionButton().nth(1).click({ force: true });
    await this.getRiskParametersTab().click();
    await pause(this.page);
  }

  async navigateToOpenPositionsTab() {
    await this.navigateToAccountPage();
    await this.getSearchField().fill(openPositionsAccountLogin);
    await this.getFilterResultButton().click();
    await pause(this.page);
    await expect(this.getAccountList()).toHaveCount(1);
    await this.getViewDetailsActionButton().nth(1).click({ force: true });
    await this.getOpenPositionsTab().click();
    await pause(this.page);
  }

  async isOpenPositionsTableEmpty(rows: Locator) {
    const firstRowText = await rows.first().textContent();
    if (firstRowText?.includes("No data")) {
      await expect(this.getOpenPositionsTable()).toContainText("No data");
      return true;
    }
    return false;
  }

  async navigateToTradesPerIPTab() {
    await this.navigateToAccountPage();
    await this.getSearchField().fill(tradesPerIPAccountLogin);
    await this.getFilterResultButton().click();
    await pause(this.page);
    await expect(this.getAccountList()).toHaveCount(1);
    await this.getViewDetailsActionButton().nth(1).click({ force: true });
    await this.getTradesPerIPTab().click();
    await pause(this.page);
  }

  async selectCalendarDateRange(monthLabel: string, fromDayLabel: RegExp, toDayLabel: RegExp) {
    const targetGrid = this.page.getByRole("grid", { name: monthLabel });
    for (let i = 0; i < 60 && !(await targetGrid.isVisible()); i++) {
      await this.getPreviousMonthButton().click();
    }
    await expect(targetGrid).toBeVisible();
    await targetGrid.getByRole("gridcell", { name: fromDayLabel }).click();
    await targetGrid.getByRole("gridcell", { name: toDayLabel }).click();
    await this.page.keyboard.press("Escape");
  }

  async isTradesPerIPTableEmpty(rows: Locator) {
    const firstRowText = await rows.first().textContent();
    if (firstRowText?.includes("No data")) {
      await expect(this.getTradesPerIPTable()).toContainText("No data");
      return true;
    }
    return false;
  }

  // ===================== Locators ===================== //

  getAccountsTab() {
    return this.page.locator('a:has-text("Accounts")');
  }

  getAccountsLabel() {
    return this.page.locator('h2:has-text("Accounts")');
  }

  getAccountList() {
    return this.page.locator("tbody tr");
  }

  getFilterDropdown() {
    return this.page.locator('[data-slot="command-input"]');
  }

  getFilter() {
    return this.page.locator('.space-y-2 [type="button"]');
  }

  getSuccessNotification(successMessage: string) {
    return this.page.locator(`div:has(> div[data-title]):has-text("${successMessage}")`);
  }

  getFilterResultButton() {
    return this.page.locator('[type="submit"]');
  }

  getSearchField() {
    return this.page.locator('[name="search_field"]');
  }

  getSearchByUserField() {
    return this.page.locator("#search-input-with-dropdown");
  }

  getUserEmail() {
    return this.page.locator("#combobox-listbox");
  }

  getUserList() {
    return this.page.locator("[data-cell-id='2_name']");
  }

  getViewDetailsActionButton() {
    return this.page.locator("button:has(.lucide-chevron-right)");
  }

  getEditActionButton() {
    return this.page.locator("button:has(.lucide-pencil)");
  }

  getEditAccountTitle() {
    return this.page.locator('h2:has-text("Edit Account")');
  }

  getNotesTab() {
    return this.page.locator('button:has-text("Notes")');
  }

  getAccountNotesInputField() {
    return this.page.locator('[role="dialog"] [data-slot="textarea"]');
  }

  getAddNoteButton() {
    return this.page.locator("button span:has-text('Add')");
  }

  getMinTradingDaysField() {
    return this.page.locator("#min_trading_days");
  }

  getMaxChallengeDurationDaysField() {
    return this.page.locator("#max_challenge_duration_days");
  }

  getClearFiltersButton() {
    return this.page.locator("button", { hasText: "Clear Filters" });
  }

  getSaveButton() {
    return this.page.locator('[role="dialog"] [type="submit"]');
  }

  getEditNoteButton() {
    return this.page.locator("button span:has-text('Edit note')");
  }

  getSuccessNotificationCloseButton() {
    return this.page.locator('[aria-label="Close toast"]');
  }

  getDeleteNoteButton() {
    return this.page.locator("button:has(.lucide-trash2)");
  }

  getDialogDeleteButton() {
    return this.page.locator('button:has-text("Delete")');
  }

  getNoteInputField() {
    return this.page.locator('[data-slot="textarea"]');
  }

  getUserTabFromNotes() {
    return this.page.locator('[role="tabpanel"] .lucide-user');
  }

  getRiskParametersTab() {
    return this.page.locator('button:has-text("Risk Parameters")');
  }

  getCreateRiskParameterButton() {
    return this.page.locator('button:has-text("Create Risk Parameter")');
  }

  getRiskParameterTypeDropdown() {
    return this.page.locator('[role="dialog"] button:has-text("Select Risk Parameter Type")');
  }

  getRiskParameterTypeButton() {
    return this.page.locator('[role="dialog"] button[aria-haspopup="dialog"]');
  }

  getDropdownOptionExact(optionText: string) {
    return this.page.getByRole("option", { name: optionText, exact: true });
  }

  getRiskParameterAttributeField(labelText: string) {
    return this.page.locator('[role="dialog"] label', { hasText: labelText });
  }

  getCloseRiskParameterDialogButton() {
    return this.page.locator('[role="dialog"] button', { hasText: "Close" });
  }

  getRiskLevelDropdown() {
    return this.page.locator('[role="dialog"] button[role="combobox"]');
  }

  getDropdownOption(optionText: string) {
    return this.page.locator('[role="option"]', { hasText: optionText });
  }

  getThresholdInputField() {
    return this.page.locator('input[name="threshold"]');
  }

  getValueInputField() {
    return this.page.locator('input[name="value"]');
  }

  getRiskParameterRow(objective: string) {
    return this.page.locator("tbody tr", { hasText: objective });
  }

  getDeleteRiskParameterButton() {
    return this.page.locator("button:has(.lucide-trash2)");
  }

  getConfirmDeleteButton() {
    return this.page.locator('button:has-text("Confirm")');
  }

  getOpenPositionsTab() {
    return this.page.locator('button:has-text("Open positions")');
  }

  getOpenPositionsTable() {
    return this.page.locator('[role="tabpanel"] table');
  }

  getOpenPositionRows() {
    return this.getOpenPositionsTable().locator("tbody tr");
  }

  getOpenPositionsFilterButton() {
    return this.page.getByRole("button", { name: "Filters", exact: true });
  }

  getOpenPositionsFilterActionDropdown() {
    return this.page.locator('[role="dialog"] button', { hasText: "Select action type" });
  }

  getOpenPositionsTradeSymbolDropdown() {
    return this.page.locator('[role="dialog"] button', { hasText: "Select trade symbol" });
  }

  getOpenPositionsViolationStatusDropdown() {
    return this.page.locator('[role="dialog"] button', { hasText: "Select violation status" });
  }

  getOpenPositionsDateRangeField() {
    return this.page.locator('[role="dialog"]').getByText("Select dates");
  }

  getPreviousMonthButton() {
    return this.page.getByRole("button", { name: "Go to the Previous Month" });
  }

  getOpenPositionsApplyFilterButton() {
    return this.page.locator('[role="dialog"] button', { hasText: "Filter results" });
  }

  getOpenPositionsSaveFiltersButton() {
    return this.page.locator('[role="dialog"] button', { hasText: "Save filters" });
  }

  getOpenPositionsFilterNameInputField() {
    return this.page.getByRole("textbox", { name: "Name your settings" });
  }

  getOpenPositionsSaveFilterConfirmButton() {
    return this.page.getByRole("button", { name: "Save", exact: true });
  }

  getOpenPositionsSelectFilterDropdown() {
    return this.page.locator("button", { hasText: "Select filter" });
  }

  getOpenPositionsDeleteSavedFilterButton() {
    return this.page.locator(".lucide-trash");
  }

  getTradesPerIPTab() {
    return this.page.locator('button:has-text("Trades per IP")');
  }

  getTradesPerIPPanel() {
    return this.page.getByRole("tabpanel", { name: "Trades per IP" });
  }

  getTradesPerIPTable() {
    return this.getTradesPerIPPanel()
      .locator("table")
      .filter({ has: this.page.locator("th", { hasText: "IP" }) });
  }

  getTradesPerIPRows() {
    return this.getTradesPerIPTable().locator("tbody tr");
  }

  getTradesPerIPColumnHeader(columnName: string) {
    return this.getTradesPerIPTable().locator("th", { hasText: columnName });
  }

  getTradesPerIPSearchField() {
    return this.getTradesPerIPPanel().getByPlaceholder("Search by IP");
  }

  getTradesPerIPClearSearchButton() {
    return this.getTradesPerIPPanel().locator("button:has(.lucide-x)");
  }

  getTradesPerIPFilterButton() {
    return this.page.getByRole("button", { name: "Filters", exact: true });
  }

  getTradesPerIPVPNDropdown() {
    return this.page.locator('[role="dialog"] button[aria-haspopup="dialog"]');
  }

  getTradesPerIPApplyFilterButton() {
    return this.page.locator('[role="dialog"] button', { hasText: "Filter results" });
  }

  getTradesPerIPDateRangeField() {
    return this.page.locator('[role="dialog"]').getByText("Select dates");
  }

  // ===================== Actions ===================== //

  async editAccountInfo() {
    await this.navigateToAccountPage();
    await this.getSearchField().fill("50045");
    await this.getFilterResultButton().click();
    await pause(this.page);
    await expect(this.getAccountList()).toHaveCount(1);
    await this.getEditActionButton().first().click({ force: true });
    await expect(this.getEditAccountTitle()).toBeVisible();
    await expect(this.getSaveButton()).toBeVisible();
    await pause(this.page);
    await this.getMinTradingDaysField().fill("15");
    await this.getMaxChallengeDurationDaysField().fill("30");
    await this.getSaveButton().click();
    await expect(this.getSuccessNotification("Trading account updated successfully")).toBeVisible();
    await this.getSuccessNotificationCloseButton().click();
  }

  async addAccountNotes() {
    await this.navigateToAccountPage();
    await this.getSearchField().fill(accountLogin);
    await pause(this.page);
    await this.getFilterResultButton().click();
    await expect(this.getAccountList()).toHaveCount(1);
    await this.getViewDetailsActionButton().nth(1).click({ force: true });
    await this.getNotesTab().click();
    await pause(this.page);
    await this.getUserTabFromNotes().click();
    await this.getNoteInputField().fill("This is a test note for the Automation.");
    await expect(this.getAddNoteButton()).toBeEnabled();
    await pause(this.page);
    await this.getAddNoteButton().click();
    await expect(this.getAddNoteButton()).toBeDisabled();
    await expect(this.getSuccessNotification("Note successfully created")).toBeVisible();
    await this.getSuccessNotificationCloseButton().click();
    const noteInputField = this.page.locator("div.rounded-xl").filter({
      has: this.page.locator("p", { hasText: "This is a test note for the Automation." }),
    });

    await expect(noteInputField).toBeVisible();
  }

  async editAccountNotes() {
    await this.navigateToAccountPage();
    await this.getSearchField().fill(accountLogin);
    await this.getFilterResultButton().click();
    await expect(this.getAccountList()).toHaveCount(1);
    await this.getViewDetailsActionButton().nth(1).click({ force: true });
    await this.getNotesTab().click();
    await this.getUserTabFromNotes().first().click();

    // Edit existing user note
    const noteContainer = this.page.locator("div.rounded-xl").filter({
      has: this.page.locator("p", { hasText: "This is a test note for the Automation." }),
    });

    await noteContainer.locator(".lucide-pencil").click();
    await this.getAccountNotesInputField().fill("This is an edited test note for the Automation.");
    await this.getEditNoteButton().click();
    await pause(this.page);
    await expect(this.getSuccessNotification("Note updated successfully")).toBeVisible();
    await this.getSuccessNotificationCloseButton().click();
  }

  async deleteAccountNotes() {
    await this.navigateToAccountPage();
    await this.getSearchField().fill(accountLogin);
    await this.getFilterResultButton().click();
    await expect(this.getAccountList()).toHaveCount(1);
    await this.getViewDetailsActionButton().nth(1).click({ force: true });
    await this.getNotesTab().click();
    await this.getUserTabFromNotes().first().click();
    await this.getDeleteNoteButton().first().click();
    await this.getDialogDeleteButton().click();
    await expect(this.getSuccessNotification("Note deleted successfully")).toBeVisible();
    await this.getSuccessNotificationCloseButton().click();
  }

  async deleteAllNotes() {
    await this.navigateToAccountPage();
    await this.getSearchField().fill(accountLogin);
    await this.getFilterResultButton().click();
    await pause(this.page);
    await expect(this.getAccountList()).toHaveCount(1);
    await this.getViewDetailsActionButton().nth(1).click({ force: true });
    await this.getNotesTab().click();
    await this.getUserTabFromNotes().first().click();
    await pause(this.page);
    const notes = this.getDeleteNoteButton();
    const noteCount = await notes.count();

    if (noteCount === 0) {
      await this.page.locator('p:has-text("No user notes found.")').waitFor({ state: "visible" });
    } else {
      for (let i = 0; i < noteCount; i++) {
        await notes.first().waitFor({ state: "visible" });
        await notes.first().click();
        await this.getDialogDeleteButton().click();
        await expect(this.getSuccessNotification("Note deleted successfully")).toBeVisible();
        await this.getSuccessNotificationCloseButton().click();
        await pause(this.page);
      }
    }
  }

  async deleteAllRiskParameters() {
    await this.navigateToRiskParametersTab();
    const riskParameters = this.getDeleteRiskParameterButton();
    const riskParameterCount = await riskParameters.count();

    if (riskParameterCount === 0) {
      console.log("No risk parameters found.");
    } else {
      for (let i = 0; i < riskParameterCount; i++) {
        await riskParameters.first().waitFor({ state: "visible" });
        await riskParameters.first().click();
        await this.getConfirmDeleteButton().click();
        await expect(this.getSuccessNotification("Risk parameter deleted successfully")).toBeVisible();
        await this.getSuccessNotificationCloseButton().click();
        await this.page.waitForTimeout(500);
      }
    }
  }

  async createRiskParameter() {
    await this.navigateToRiskParametersTab();
    await this.getCreateRiskParameterButton().click();
    await this.getRiskParameterTypeDropdown().click();
    await this.getDropdownOption("Eod trailing loss").click();
    await this.getRiskLevelDropdown().click();
    await this.getDropdownOption("Violation").click();
    await this.getThresholdInputField().fill("2");
    await this.getValueInputField().fill("200");
    await this.getSaveButton().click();
    await expect(this.getSuccessNotification("Risk parameter is successfully created")).toBeVisible();
    await this.getSuccessNotificationCloseButton().click();
  }

  async verifyRiskParameterAttributesUpdateOnTypeChange() {
    await this.navigateToRiskParametersTab();
    await this.getCreateRiskParameterButton().click();

    // Eod trailing loss exposes Max loss amount / Trailing limit / T4b stopout enabled
    await this.getRiskParameterTypeButton().click();
    await this.getDropdownOptionExact("Eod trailing loss").click();
    await expect(this.getRiskParameterAttributeField("Max loss amount")).toBeVisible();
    await expect(this.getRiskParameterAttributeField("Trailing limit")).toBeVisible();
    await expect(this.page.locator('[role="dialog"]').getByText("T4b stopout enabled")).toBeVisible();

    // Switching to Min active trading days should drop the Eod-specific fields and show its own attributes
    await this.getRiskParameterTypeButton().click();
    await this.getDropdownOptionExact("Min active trading days").click();
    await expect(this.getRiskParameterAttributeField("Max loss amount")).toHaveCount(0);
    await expect(this.getRiskParameterAttributeField("Trailing limit")).toHaveCount(0);
    await expect(this.getRiskParameterAttributeField("Daily profit percentage")).toBeVisible();
    await expect(this.getRiskParameterAttributeField("Start date")).toBeVisible();

    // Switching to Max lots exposure should drop all type-specific fields, leaving only the base fields
    await this.getRiskParameterTypeButton().click();
    await this.getDropdownOptionExact("Max lots exposure").click();
    await expect(this.getRiskParameterAttributeField("Daily profit percentage")).toHaveCount(0);
    await expect(this.getRiskParameterAttributeField("Start date")).toHaveCount(0);
    await expect(this.getRiskParameterAttributeField("Threshold")).toBeVisible();
    await expect(this.getRiskParameterAttributeField("Value")).toBeVisible();

    await this.getCloseRiskParameterDialogButton().click();
  }

  async verifyCreatedRiskParameter() {
    await this.navigateToRiskParametersTab();
    const createdRiskParameter = this.getRiskParameterRow("EodTrailingLoss");
    await expect(createdRiskParameter).toBeVisible();

    const cells = createdRiskParameter.locator("td");
    const tradingObjective = cells.nth(0);
    const result = cells.nth(1);
    const threshold = cells.nth(2);
    const riskLevel = cells.nth(3);
    const status = cells.nth(4);

    await expect(tradingObjective).toHaveText("EodTrailingLoss");
    await expect(result).toHaveText("200");
    await expect(threshold).toHaveText("2");
    await expect(riskLevel).toContainText("Violation");
    await expect(status).toContainText("Pending");
  }

  async editRiskParameter(objective: string) {
    await this.navigateToRiskParametersTab();
    const riskParameterRow = this.getRiskParameterRow(objective);
    await riskParameterRow.locator(".lucide-pencil").click();
    await this.getThresholdInputField().fill("5");
    await this.getValueInputField().fill("500");
    await this.getSaveButton().click();
    await expect(this.getSuccessNotification("Risk parameter is successfully updated")).toBeVisible();
    await this.getSuccessNotificationCloseButton().click();
  }

  async verifyEditedRiskParameter() {
    await this.navigateToRiskParametersTab();
    const editedRiskParameter = this.getRiskParameterRow("EodTrailingLoss");
    await expect(editedRiskParameter).toBeVisible();

    const cells = editedRiskParameter.locator("td");
    const tradingObjective = cells.nth(0);
    const result = cells.nth(1);
    const threshold = cells.nth(2);
    const riskLevel = cells.nth(3);
    const status = cells.nth(4);

    await expect(tradingObjective).toHaveText("EodTrailingLoss");
    await expect(result).toHaveText("500");
    await expect(threshold).toHaveText("5");
    await expect(riskLevel).toContainText("Violation");
    await expect(status).toContainText("Pending");
  }

  async deleteRiskParameter(objective: string) {
    await this.navigateToRiskParametersTab();
    const riskParameterRow = this.getRiskParameterRow(objective);

    if (await riskParameterRow.count()) {
      await riskParameterRow.locator(".lucide-trash2").click();
      await this.getConfirmDeleteButton().click();
      await expect(this.getSuccessNotification("Risk parameter deleted successfully")).toBeVisible();
      await this.getSuccessNotificationCloseButton().click();
    } else {
      console.log(`No "${objective}" risk parameter found.`);
    }
  }

  async verifyOpenPositionsList() {
    await this.navigateToOpenPositionsTab();
    await this.page.locator("th:nth-child(1)", { hasText: "Position" }).waitFor({ state: "visible" });

    const rows = this.getOpenPositionRows();
    const rowCount = await rows.count();

    if (!(await this.isOpenPositionsTableEmpty(rows))) {
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        const positionCell = row.locator("td:nth-child(1)");
        await positionCell.waitFor({ state: "visible" });
        const position = (await positionCell.textContent())?.trim() ?? "";
        expect(position).not.toBe("");
      }
    }
  }

  async verifyOpenPositionsFilterByAction(action: string) {
    await this.navigateToOpenPositionsTab();
    await this.getOpenPositionsFilterButton().click();
    await this.getOpenPositionsFilterActionDropdown().click();
    await this.getDropdownOption(action).click();
    await this.getOpenPositionsApplyFilterButton().click();
    await pause(this.page);

    const rows = this.getOpenPositionRows();
    const rowCount = await rows.count();

    if (!(await this.isOpenPositionsTableEmpty(rows))) {
      for (let i = 0; i < rowCount; i++) {
        await expect(rows.nth(i).locator("td").nth(4)).toHaveText(action);
      }
    }
  }

  async verifyOpenPositionsCombinedFilters() {
    await this.navigateToOpenPositionsTab();
    await this.getOpenPositionsFilterButton().click();

    // Trade Symbol filter
    await this.getOpenPositionsTradeSymbolDropdown().click();
    await this.getDropdownOption("XAUUSD").click();

    // Violation Status filter
    await this.getOpenPositionsViolationStatusDropdown().click();
    await this.getDropdownOption("No violation").click();

    // Opened at date range filter
    await this.getOpenPositionsDateRangeField().click();
    await this.selectCalendarDateRange("May 2025", /May 1st, 2025/, /May 31st, 2025/);

    await this.getOpenPositionsApplyFilterButton().click();
    await pause(this.page);
    const rows = this.getOpenPositionRows();
    const rowCount = await rows.count();

    if (!(await this.isOpenPositionsTableEmpty(rows))) {
      const fromDate = new Date(2025, 4, 1);
      const toDate = new Date(2025, 4, 31);

      for (let i = 0; i < rowCount; i++) {
        const cells = rows.nth(i).locator("td");
        await expect(cells.nth(3)).toHaveText("XAUUSD");

        const openDateText = (await cells.nth(1).textContent())?.trim() ?? "";
        const [day, month, year] = openDateText.split("/").map(Number);
        const openDate = new Date(year, month - 1, day);

        expect(openDate.getTime()).toBeGreaterThanOrEqual(fromDate.getTime());
        expect(openDate.getTime()).toBeLessThanOrEqual(toDate.getTime());
      }
    }
    await this.getOpenPositionsFilterButton().click();
    await this.getClearFiltersButton().click();
  }

  async verifyOpenPositionsSaveFilters() {
    await this.navigateToOpenPositionsTab();
    await this.getOpenPositionsFilterButton().click();

    await this.getOpenPositionsTradeSymbolDropdown().click();
    await this.getDropdownOption("XAUUSD").click();
    await this.getOpenPositionsSaveFiltersButton().click();
    await this.getOpenPositionsFilterNameInputField().fill("QA_Open_Positions_Filter");
    await this.getOpenPositionsSaveFilterConfirmButton().click();
    await expect(this.getSuccessNotification("Successfully saved filter.")).toBeVisible();
    await this.getSuccessNotificationCloseButton().click();
    await this.getClearFiltersButton().click();
    await this.page.keyboard.press("Escape");
  }

  async deleteOpenPositionsSavedFilter() {
    await this.navigateToOpenPositionsTab();
    await this.getOpenPositionsFilterButton().click();
    await this.getOpenPositionsSelectFilterDropdown().click();
    await this.getOpenPositionsDeleteSavedFilterButton().click();
    await expect(this.getSuccessNotification("Successfully deleted filter.")).toBeVisible();
    await this.getSuccessNotificationCloseButton().click();
    await this.page.keyboard.press("Escape");
  }

  async verifyTradesPerIPList() {
    await this.navigateToTradesPerIPTab();
    await this.getTradesPerIPColumnHeader("IP").waitFor({ state: "visible" });

    const rows = this.getTradesPerIPRows();
    const rowCount = await rows.count();

    if (!(await this.isTradesPerIPTableEmpty(rows))) {
      for (let i = 0; i < rowCount; i++) {
        const ipCell = rows.nth(i).locator("td").nth(4);
        await ipCell.waitFor({ state: "visible" });
        const ip = (await ipCell.textContent())?.trim() ?? "";
        expect(ip).not.toBe("");
      }
    }
  }

  async verifyTradesPerIPFilterByIP() {
    await this.navigateToTradesPerIPTab();
    const rows = this.getTradesPerIPRows();
    if (await this.isTradesPerIPTableEmpty(rows)) {
      return;
    }
    const ip = (await rows.first().locator("td").nth(4).textContent())?.trim() ?? "";
    await this.getTradesPerIPSearchField().fill(ip);
    await pause(this.page);
    const filteredRows = this.getTradesPerIPRows();
    const filteredRowCount = await filteredRows.count();

    if (!(await this.isTradesPerIPTableEmpty(filteredRows))) {
      for (let i = 0; i < filteredRowCount; i++) {
        await expect(filteredRows.nth(i).locator("td").nth(4)).toHaveText(ip);
      }
    }
  }

  async verifyTradesPerIPFilterByVPN(vpnStatus: string) {
    await this.navigateToTradesPerIPTab();
    await this.getTradesPerIPFilterButton().click();
    await this.getTradesPerIPVPNDropdown().click();
    await this.getDropdownOption(vpnStatus).click();
    await this.getTradesPerIPApplyFilterButton().click();
    await pause(this.page);

    const rows = this.getTradesPerIPRows();
    const rowCount = await rows.count();

    if (!(await this.isTradesPerIPTableEmpty(rows))) {
      for (let i = 0; i < rowCount; i++) {
        await expect(rows.nth(i).locator("td").nth(5)).toHaveText(vpnStatus);
      }
    }
    await this.getTradesPerIPFilterButton().click();
    await this.getClearFiltersButton().click();
  }

  async verifyTradesPerIPFilterByDateRange() {
    await this.navigateToTradesPerIPTab();
    await this.getTradesPerIPFilterButton().click();
    await this.getTradesPerIPDateRangeField().click();
    await this.selectCalendarDateRange("October 2025", /October 1st, 2025/, /October 31st, 2025/);

    await this.getTradesPerIPApplyFilterButton().click();
    await pause(this.page);

    const rows = this.getTradesPerIPRows();
    const rowCount = await rows.count();

    if (!(await this.isTradesPerIPTableEmpty(rows))) {
      const fromDate = new Date(2025, 9, 1);
      const toDate = new Date(2025, 9, 31);

      for (let i = 0; i < rowCount; i++) {
        const rawDateText = (await rows.nth(i).locator("td").nth(0).textContent())?.trim() ?? "";
        const dateText = rawDateText.replace(/(\d{4})(\d{1,2}:\d{2})/, "$1 $2");
        const date = new Date(dateText);

        expect(date.getTime()).toBeGreaterThanOrEqual(fromDate.getTime());
        expect(date.getTime()).toBeLessThanOrEqual(toDate.getTime());
      }
    }
  }
}

export default AccountDetails;
