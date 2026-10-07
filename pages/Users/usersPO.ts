import { expect, Page, Locator } from "@playwright/test";
import { pause } from "../../utils/common";

const email = "muhammad@fundingpips.com";
const editedUserEmail = "mathijs+123a4@fundingpips.com";

export default class Users {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ================= Tabs / Headers =================

  getUsersTab() {
    return this.page.locator("a", { hasText: "Users" });
  }

  getUsersNumber() {
    return this.page.locator("h2.text-lg.font-semibold", { hasText: "Users" });
  }

  getCreatedAtHeader() {
    return this.page.locator("th.py-1", { hasText: "Created at" });
  }

  getNameHeader() {
    return this.page.locator("th.py-1", { hasText: "Name" });
  }

  getCountryHeader() {
    return this.page.locator("th.py-1", { hasText: "Country" });
  }

  getEmailHeader() {
    return this.page.locator("th.py-1", { hasText: "Email" });
  }

  getKYCHeader() {
    return this.page.locator("th.py-1", { hasText: "KYC" });
  }

  getTagsHeader() {
    return this.page.locator("th.py-1", { hasText: "Tags" });
  }

  getPhoneHeader() {
    return this.page.locator("th.py-1", { hasText: "Phone" });
  }

  getTradingAccountsHeader() {
    return this.page.locator("th.py-1", { hasText: "Trading accounts" });
  }

  getPayoutsHeader() {
    return this.page.locator("th.py-1", { hasText: "Payouts" });
  }

  getActionsHeader() {
    return this.page.locator("th.py-1", { hasText: "Actions" });
  }

  getExportCSVButton() {
    return this.page.locator("button", { hasText: "Export CSV" });
  }

  getExportPrimeButton() {
    return this.page.locator("button", { hasText: "Prime" });
  }

  getIPActivityLogMap() {
    return this.page.locator("div.gm-style").first();
  }

  getCloseIPSearch() {
    return this.page.locator("button:has(svg.lucide-x)").first();
  }

  getIPSearchInput() {
    return this.page.locator('input[placeholder="Search by IP"]');
  }

  // ================= User Details Tabs (right panel) =================

  getChallengesTab() {
    return this.page.getByRole("tab", { name: "Challenges" });
  }

  getIPActivityLogTab() {
    return this.page.getByRole("tab", { name: "IP Activity Log" });
  }

  getTransactionsTab() {
    return this.page.getByRole("tab", { name: "Transactions" });
  }

  getEmailLogsTab() {
    return this.page.getByRole("tab", { name: "Email Logs" });
  }

  getSavedMethodsTab() {
    return this.page.getByRole("tab", { name: "Saved Methods" });
  }

  getSavedMethodsCryptoTab() {
    return this.page.locator("button", { hasText: "Crypto Wallet" });
  }

  getSavedMethodsPaymentCardsTab() {
    return this.page.locator("button", { hasText: "Payment Cards" });
  }

  getSavedMethodsBankAccountsTab() {
    return this.page.locator("button", { hasText: "Bank Accounts" });
  }

  // ================= User Info (left panel) =================

  getUserInfoTab() {
    return this.page.getByRole("tab", { name: "User Info" });
  }

  // ================= Buttons / Actions =================

  getShowButton() {
    return this.page.getByRole("button", { name: "Show" });
  }

  getPaymentDetailsAction() {
    return this.page.getByText("Payment Details", { exact: true });
  }

  getClickHereAction() {
    return this.page.getByText("Click Here", { exact: true });
  }

  getFilterResultButton() {
    return this.page.locator('[type="submit"]');
  }

  getClearFiltersButton() {
    return this.page.locator("button", { hasText: "Clear Filters" });
  }

  getEditButtonByRow() {
    return this.page.locator("button:has(.lucide-pencil)").first();
  }

  // ================= Notes (Details page) =================

  getNotesTab() {
    return this.page.locator('button:has-text("Notes")');
  }

  getUserTabFromNotes() {
    return this.page.locator('[role="tabpanel"] .lucide-user');
  }

  getNoteInputField() {
    return this.page.locator('[data-slot="textarea"]');
  }

  getAddNoteButton() {
    return this.page.locator("button span:has-text('Add')");
  }

  getEditNoteButton() {
    return this.page.locator("button span:has-text('Edit note')").first();
  }

  getDeleteNoteButton() {
    return this.page.locator(".lucide-trash2");
  }

  getDialogDeleteButton() {
    return this.page.locator('button:has-text("Delete")').first();
  }

  getSuccessNotification(successMessage: string): Locator {
    return this.page.locator(`div:has(> div[data-title]):has-text("${successMessage}")`);
  }

  getSuccessNotificationCloseButton() {
    return this.page.locator('[aria-label="Close toast"]');
  }

  // ===== Notes items (cards) =====

  getNoteCardByText(text: string) {
    return this.page
      .locator("div.rounded-xl")
      .filter({ has: this.page.locator("p", { hasText: text }) })
      .first();
  }

  getEditButtonInNote(card: Locator) {
    return card.locator("button:has(svg.lucide-pencil)").first();
  }

  getDeleteButtonInNote(card: Locator) {
    return card.locator("button:has(svg.lucide-trash-2)").first();
  }

  // ================= Challenges headers =================
  getChallengesIDHeader() {
    return this.page.locator("th div", { hasText: "ID" }).first();
  }
  getChallengesSizeHeader() {
    return this.page.locator("th div", { hasText: "SIZE" }).first();
  }
  getChallengesTypeHeader() {
    return this.page.locator("th div", { hasText: "TYPE" }).first();
  }
  getChallengesStatusHeader() {
    return this.page.locator("th div", { hasText: "STATUS" }).first();
  }

  // ================= Transactions headers =================

  getTransactionsIDHeader() {
    return this.page.locator("th", { hasText: "Transaction ID" }).first();
  }
  getTransactionsCreatedAtHeader() {
    return this.page.locator("th", { hasText: "Created At" }).first();
  }
  getTransactionsTypeHeader() {
    return this.page.locator("th", { hasText: "Entry Type" }).first();
  }
  getTransactionsStatusHeader() {
    return this.page.locator("th", { hasText: "Status" }).first();
  }
  getTransactionsPSPHeader() {
    return this.page.locator("th", { hasText: "Source" }).first();
  }
  getTransactionsAmountHeader() {
    return this.page.locator("th", { hasText: "Amount" }).first();
  }

  getIPActivityLogRow() {
    return this.page.locator("tr.h-10").first();
  }

  // ================= Table =================

  getFirstUserRow(): Locator {
    return this.page.locator("tbody tr").first();
  }

  private async waitForMinRows(minRows = 2, timeout = 30000) {
    await expect(this.getFirstUserRow()).toBeVisible({ timeout });
    await expect.poll(async () => await this.page.locator("tbody tr").count(), { timeout }).toBeGreaterThanOrEqual(minRows);
    await expect.poll(async () => (await this.getFirstUserRow().textContent())?.trim() || "", { timeout }).not.toContain("Loading");
  }

  private async getColumnTexts(nth1Based: number, take = 10): Promise<string[]> {
    const all = await this.page.locator(`tbody tr td:nth-child(${nth1Based})`).allTextContents();
    return all
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, take);
  }

  getExpandButtonInFirstRow(): Locator {
    const row = this.getFirstUserRow();
    return row.locator("button:has(.lucide-chevron-right)").first();
  }

  getEmailPreviewDialog() {
    return this.page.locator('[data-slot="dialog-content"]');
  }

  getEmailPreviewCloseButton() {
    return this.page.locator("button:has(svg.lucide-x)").first();
  }

  // ================= Navigation =================

  async openUsersTab() {
    await this.getUsersTab().click();
    await expect(this.getFirstUserRow()).toBeVisible({ timeout: 30000 });
  }

  async returnToUsersPage() {
    await this.getUsersTab().click();
    await expect(this.page).toHaveURL(/\/users(\?.*)?$/);
    await expect(this.getFirstUserRow()).toBeVisible({ timeout: 30000 });
  }

  async openUserDetails() {
    await this.openUsersTab();
    await this.page.locator('[name="email"]').pressSequentially(email);
    await this.getFilterResultButton().click();
    await pause(this.page);
    await this.getExpandButtonInFirstRow().click({ force: true });
  }

  // ================= Verifications =================

  async verifyUsersPageVisibility() {
    await this.openUsersTab();
    await expect(this.getUsersNumber()).toBeVisible();
    await expect(this.getCreatedAtHeader()).toBeVisible();
    await expect(this.getNameHeader()).toBeVisible();
    await expect(this.getCountryHeader()).toBeVisible();
    await expect(this.getEmailHeader()).toBeVisible();
    await expect(this.getKYCHeader()).toBeVisible();
    await expect(this.getTagsHeader()).toBeVisible();
    await expect(this.getPhoneHeader()).toBeVisible();
    await expect(this.getTradingAccountsHeader()).toBeVisible();
    await expect(this.getPayoutsHeader()).toBeVisible();
    await expect(this.getActionsHeader()).toBeVisible();
    await expect(this.getExportCSVButton()).toBeVisible();
  }

  // ================= Details / Expand =================

  async clickShowIfPresent() {
    const showButton = this.getShowButton().first();
    try {
      await showButton.waitFor({ state: "visible", timeout: 2000 });
      await showButton.click({ force: true });
      await expect(this.page).toHaveURL(/\/accounts\/\d+/, { timeout: 15000 });
      await expect(this.page.locator("h1, h2").first()).toBeVisible({ timeout: 10000 });
      await this.page.goBack();
    } catch {}
  }

  async openPaymentDetails() {
    const payment = this.getPaymentDetailsAction().first();
    await expect(payment).toBeVisible({ timeout: 10000 });
    await payment.scrollIntoViewIfNeeded();
    await payment.click({ force: true });
    await expect(this.page.locator('div:has(> div > span:text-is("Charge Type")) span.font-semibold')).toHaveText("Purchase");
    await expect(this.page.locator('div:has(> div > span:text-is("Provider")) span.font-semibold')).toHaveText("Paymaxis");

    const clickHere = this.getClickHereAction().first();
    await expect(clickHere).toBeVisible();

    const downloadPromise = this.page.waitForEvent("download");
    await clickHere.click({ force: true });
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBeTruthy();

    await this.page.keyboard.press("Escape").catch(() => {});
  }

  // ================= User Details Tab Navigation =================

  private async assertOnUserDetailsPage() {
    await expect(this.page).toHaveURL(/\/users\/\d+(\?.*)?$/, { timeout: 15000 });
  }

  async openChallengesTab() {
    await this.assertOnUserDetailsPage();
    await this.getChallengesTab().click();
    await expect(this.getChallengesTab()).toHaveAttribute("data-state", "active", { timeout: 10000 });
    await expect(this.getChallengesIDHeader()).toBeVisible();
    await expect(this.getChallengesSizeHeader()).toBeVisible();
    await expect(this.getChallengesTypeHeader()).toBeVisible();
    await expect(this.getChallengesStatusHeader()).toBeVisible();
    const hasData = await this.getFirstUserRow()
      .isVisible()
      .catch(() => false);
    if (hasData) {
      await expect(this.getFirstUserRow()).toBeVisible({ timeout: 10000 });
    } else {
      await expect(this.page.locator("text=No data")).toBeVisible();
    }
  }

  async openIPActivityLogTab() {
    await this.assertOnUserDetailsPage();
    await this.getIPActivityLogTab().click();
    await expect(this.getIPActivityLogTab()).toHaveAttribute("data-state", "active", { timeout: 10000 });
    await expect(this.page.locator("div.gm-style").first()).toBeVisible({ timeout: 10000 });

    await this.getIPSearchInput().fill("999.999.999.999");
    await pause(this.page, 1000);
    await expect(this.page.locator("tr.h-10", { hasText: "999.999.999.999" })).not.toBeVisible({ timeout: 5000 });
    await this.getCloseIPSearch().click();

    await this.getIPSearchInput().fill("10.0.8.154");
    await pause(this.page, 1000);
    await expect(this.page.locator("tr.h-10", { hasText: "10.0.8.154" })).toBeVisible({ timeout: 10000 });
    await this.getCloseIPSearch().click();
  }

  async openTransactionsTab() {
    await this.assertOnUserDetailsPage();
    await this.getTransactionsTab().click();
    await expect(this.getTransactionsTab()).toHaveAttribute("data-state", "active", { timeout: 10000 });
    await expect(this.getTransactionsIDHeader()).toBeVisible();
    await expect(this.getTransactionsCreatedAtHeader()).toBeVisible();
    await expect(this.getTransactionsTypeHeader()).toBeVisible();
    await expect(this.getTransactionsStatusHeader()).toBeVisible();
    await expect(this.getTransactionsPSPHeader()).toBeVisible();
    await expect(this.getTransactionsAmountHeader()).toBeVisible();
    const hasData = await this.getFirstUserRow()
      .isVisible()
      .catch(() => false);
    if (hasData) {
      await expect(this.getFirstUserRow()).toBeVisible({ timeout: 10000 });
    } else {
      await expect(this.page.locator("text=No data")).toBeVisible();
    }
  }

  async openEmailLogsTab() {
    await this.assertOnUserDetailsPage();
    await this.getEmailLogsTab().click();
    await expect(this.getEmailLogsTab()).toHaveAttribute("data-state", "active", { timeout: 10000 });

    const hasData = await this.getFirstUserRow()
      .isVisible()
      .catch(() => false);
    if (hasData) {
      await expect(this.getFirstUserRow()).toBeVisible({ timeout: 10000 });
      await this.getFirstUserRow().locator('button:has-text("Show")').click();
      await expect(this.getEmailPreviewDialog()).toBeVisible({ timeout: 10000 });

      const downloadPromise = this.page.waitForEvent("download");
      await this.getEmailPreviewDialog().locator('button:has-text("PNG")').click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBeTruthy();

      await this.getEmailPreviewCloseButton().click();
      await expect(this.getEmailPreviewDialog()).toBeHidden({ timeout: 10000 });
    } else {
      await expect(this.page.locator("text=No data")).toBeVisible();
    }
  }

  async openSavedMethodsTab() {
    await this.assertOnUserDetailsPage();
    await this.getSavedMethodsTab().click();
    await expect(this.getSavedMethodsTab()).toHaveAttribute("data-state", "active", { timeout: 10000 });

    await expect(this.getSavedMethodsCryptoTab()).toBeVisible();
    await expect(this.getSavedMethodsPaymentCardsTab()).toBeVisible();
    await expect(this.getSavedMethodsBankAccountsTab()).toBeVisible();

    await this.getSavedMethodsCryptoTab().click();
    const hasCrypto = await this.getFirstUserRow()
      .isVisible()
      .catch(() => false);
    if (hasCrypto) {
      await expect(this.getFirstUserRow()).toBeVisible({ timeout: 10000 });
    } else {
      await expect(this.page.locator("text=No crypto wallets found")).toBeVisible();
    }
  }

  // ================= Notes CRUD =================

  async openNotesTabInDetails() {
    await expect(this.getNotesTab()).toBeVisible({ timeout: 15000 });
    await this.getNotesTab().click();
    const textareaVisible = await this.getNoteInputField()
      .isVisible()
      .catch(() => false);
    if (!textareaVisible) {
      await this.getUserTabFromNotes().first().click();
    }
    const noteInput = await this.getNoteInputField()
      .isVisible()
      .catch(() => false);
    if (!noteInput) {
      await this.getUserTabFromNotes().first().click();
    }
    await expect(this.getNoteInputField()).toBeVisible({ timeout: 15000 });
    await expect(this.getAddNoteButton()).toBeVisible({ timeout: 15000 });
  }

  async addUserNote(text: string) {
    await this.openNotesTabInDetails();
    await this.getNoteInputField().fill(text);
    await expect(this.getAddNoteButton()).toBeEnabled({ timeout: 15000 });
    await this.getAddNoteButton().click();
    await expect(this.getSuccessNotification("Note successfully created")).toBeVisible();
    await this.getSuccessNotificationCloseButton().click();
    await expect(this.getNoteCardByText(text)).toBeVisible({ timeout: 15000 });
  }

  async editUserNote(oldText: string, newText: string) {
    await this.openNotesTabInDetails();
    const card = this.getNoteCardByText(oldText);
    await expect(card).toBeVisible({ timeout: 15000 });
    await this.getEditButtonInNote(card).click({ force: true });
    const editTextarea = this.page.locator('textarea[data-slot="textarea"]').nth(1);
    await expect(editTextarea).toBeVisible({ timeout: 15000 });
    await editTextarea.fill(newText);
    await expect(this.getEditNoteButton()).toBeEnabled({ timeout: 15000 });
    await this.getEditNoteButton().click();
    await expect(this.getSuccessNotification("Note updated successfully")).toBeVisible();
    await this.getSuccessNotificationCloseButton().click();
    await expect(this.getNoteCardByText(newText)).toBeVisible({ timeout: 15000 });
  }

  async deleteUserNote(text: string) {
    await this.openNotesTabInDetails();
    const card = this.getNoteCardByText(text);
    await expect(card).toBeVisible({ timeout: 15000 });
    await this.getDeleteButtonInNote(card).click({ force: true });
    await expect(this.getDialogDeleteButton()).toBeVisible({ timeout: 15000 });
    await this.getDialogDeleteButton().click();
    await expect(this.getSuccessNotification("Note deleted successfully")).toBeVisible();
    await this.getSuccessNotificationCloseButton().click();
    await expect(card).toBeHidden({ timeout: 15000 });
  }

  async userNotesCrudFlow() {
    const note = `Auto note ${Date.now()}`;
    const edited = `${note} edited`;
    await this.addUserNote(note);
    await this.editUserNote(note, edited);
    await this.deleteUserNote(edited);
  }

  // ================= Sorting =================

  async verifySortBy() {
    await this.openUsersTab();
    const rowsCount = await this.page.locator("tbody tr").count();
    if (rowsCount < 2) return;
    await this.verifyColumnSort(this.getCreatedAtHeader(), 1);
    await this.verifyColumnSort(this.getNameHeader(), 2);
  }

  private async verifyColumnSort(header: Locator, columnIndex: number) {
    await this.waitForMinRows(2);
    await header.click();
    await this.waitForMinRows(2);
    const firstOrder = await this.getColumnTexts(columnIndex, 10);
    await header.click();
    await this.waitForMinRows(2);
    const secondOrder = await this.getColumnTexts(columnIndex, 10);
    if (firstOrder.length >= 2 && secondOrder.length >= 2) {
      expect(secondOrder).not.toEqual(firstOrder);
    }
  }

  // ================= Edit =================

  async openBackEditAndUpdateLastNameFirstUser(lastName: string = "Kostya Test") {
    await this.openUsersTab();
    await this.page.locator('[name="email"]').pressSequentially(editedUserEmail);
    await this.getFilterResultButton().click();
    await pause(this.page, 3000);
    await this.getEditButtonByRow().click({ force: true });
    const lastNameInput = this.page.locator("#last_name");
    await expect(lastNameInput).toBeVisible();
    await lastNameInput.fill("");
    await lastNameInput.fill(lastName);
    const submitButton = this.page.locator("button", { hasText: /submit/i }).first();
    await expect(submitButton).toBeEnabled();
    await submitButton.click({ force: true });
    await expect(this.getSuccessNotification("User updated successfully")).toBeVisible();
    await this.getSuccessNotificationCloseButton().click();
    await this.getClearFiltersButton().click();
  }
}
