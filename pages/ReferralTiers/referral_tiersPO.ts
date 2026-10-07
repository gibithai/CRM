import { expect, Page, Locator } from "@playwright/test";
import { pause } from "../../utils/common";

export default class ReferralTiers {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ---------------- Locators ----------------  //

  getReferralTiersTab() {
    return this.page.getByRole("link", { name: "Referral Tiers" });
  }

  getReferralTiersHeading() {
    return this.page.getByRole("heading", { name: "Referral Tiers" });
  }

  getReferraTiersQuantity() {
    return this.page.locator("h2", { hasText: "Referral Tiers" });
  }

  getReferralName() {
    return this.page.getByRole("columnheader", { name: "Name", exact: true });
  }

  getReferralIsCustom() {
    return this.page.locator("th.py-1", { hasText: "Is Custom" });
  }

  getReferralOnlyFirstPurchase() {
    return this.page.locator("th.py-1", { hasText: "Only First Purchase" });
  }

  getReferralApplyFrom() {
    return this.page.locator("th.py-1", { hasText: "Apply From" });
  }

  getReferralCommission() {
    return this.page.getByRole("columnheader", { name: "Commission %", exact: true });
  }

  getReferralFirstPurchaseCommission() {
    return this.page.getByRole("columnheader", { name: "First Purchase Commission %", exact: true });
  }

  getReferralDiscount() {
    return this.page.getByRole("columnheader", { name: "Discount %", exact: true });
  }

  getReferralFirstPurchaseDiscount() {
    return this.page.getByRole("columnheader", { name: "First Purchase Discount %", exact: true });
  }

  getReferralNthPurchaseComission() {
    return this.page.getByRole("columnheader", { name: "Nth Purchase Commission", exact: true });
  }

  getReferralPayoutCommission() {
    return this.page.getByRole("columnheader", { name: "Payout Commission %", exact: true });
  }

  getReferralPayoutCommissionCap() {
    return this.page.getByRole("columnheader", { name: "Payout Commission Cap", exact: true });
  }

  getActions() {
    return this.page.locator("th.py-1", { hasText: "Actions" });
  }

  getTableRows() {
    return this.page.locator("tbody tr");
  }

  getRowsByText(text: string) {
    return this.page.locator("tbody tr", { hasText: text });
  }

  getReferralRowByText(text: string) {
    return this.getRowsByText(text).first();
  }

  getDialog() {
    return this.page.getByRole("dialog");
  }

  getEditButtonInRow(row: Locator): Locator {
    return row.locator("button:has(svg.lucide-pencil)").first();
  }

  getDeleteButtonInRow(row: Locator): Locator {
    return row.locator("td").last().locator("button").nth(1);
  }

  getUpdatedToast() {
    return this.page.getByText(/referral tier updated successfully/i).first();
  }

  getCreatedToast() {
    return this.page.getByText(/referral tier created successfully/i).first();
  }

  getDeletedToast() {
    return this.page.getByText(/referral tier deleted successfully/i).first();
  }

  getReferralTierDialog() {
    return this.page.getByRole("dialog").filter({
      has: this.page.getByRole("heading", { name: "New Referral Tier" }),
    });
  }

  getNameInput() {
    return this.page.locator("#name");
  }

  getApplyFromInput() {
    return this.page.locator("#apply_from");
  }

  getCommissionPercentInput() {
    return this.page.locator("#commission_percentage");
  }

  getFirstPurchaseCommissionPercentInput() {
    return this.page.locator("#first_purchase_commission_percentage");
  }

  getDiscountPercentInput() {
    return this.page.locator("#discount_percentage");
  }

  getFirstPurchaseDiscountPercentInput() {
    return this.page.locator("#first_purchase_discount_percentage");
  }

  getNthPurchaseCommissionInput() {
    return this.page.locator("#nth_purchase_commission");
  }

  getPayoutCommissionPercentInput() {
    return this.page.locator("#payout_commission_percentage");
  }

  getPayoutCommissionCapInput() {
    return this.page.locator("#payout_commission_cap");
  }

  getOpenCreateReferralButton() {
    return this.page.getByRole("button", { name: "Create Referral Tier" }).first();
  }

  getCreateReferralTierSubmitButton() {
    return this.getReferralTierDialog().getByRole("button", { name: "Create Referral Tier" });
  }

  // ---------------- Helpers ----------------

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

  // ---------------- Actions ----------------

  async openReferralTiers() {
    await this.getReferralTiersTab().click();
    await expect(this.getReferralTiersHeading()).toBeVisible({ timeout: 15000 });
  }

  async openCreateDialog() {
    await this.openReferralTiers();

    const btn = this.getOpenCreateReferralButton();
    await expect(btn).toBeVisible();
    await btn.click();

    const dialog = this.getReferralTierDialog();
    await expect(dialog).toBeVisible({ timeout: 15000 });

    await expect(dialog.locator("#name")).toBeVisible();
    return dialog;
  }

  async VerifyPageVisibility() {
    await this.openReferralTiers();

    await expect(this.getReferralTiersHeading()).toBeVisible();
    await expect(this.getReferraTiersQuantity()).toBeVisible();
    await expect(this.getReferralName()).toBeVisible();
    await expect(this.getReferralIsCustom()).toBeVisible();
    await expect(this.getReferralOnlyFirstPurchase()).toBeVisible();
    await expect(this.getReferralApplyFrom()).toBeVisible();
    await expect(this.getReferralCommission()).toBeVisible();
    await expect(this.getReferralFirstPurchaseCommission()).toBeVisible();
    await expect(this.getReferralDiscount()).toBeVisible();
    await expect(this.getReferralFirstPurchaseDiscount()).toBeVisible();
    await expect(this.getReferralNthPurchaseComission()).toBeVisible();
    await expect(this.getReferralPayoutCommission()).toBeVisible();
    await expect(this.getReferralPayoutCommissionCap()).toBeVisible();
    await expect(this.getActions()).toBeVisible();
  }

  async VerifySorting() {
    await this.openReferralTiers();

    await this.waitForMinRows(1);

    const rowCount = await this.getTableRows().count();
    if (rowCount < 2) return;

    await this.getReferralApplyFrom().click();
    await pause(this.page, 1000);
    const applyDesc = this.toNumbers(await this.getColumnTexts(4));
    expect(this.isSortedDesc(applyDesc)).toBeTruthy();

    await this.getReferralApplyFrom().click();
    await pause(this.page, 1000);
    const applyAsc = this.toNumbers(await this.getColumnTexts(4));
    expect(this.isSortedAsc(applyAsc)).toBeTruthy();

    await this.getReferralCommission().click();
    await pause(this.page, 1000);
    const commissionDesc = this.toNumbers(await this.getColumnTexts(5));
    expect(this.isSortedDesc(commissionDesc)).toBeTruthy();

    await this.getReferralCommission().click();
    await pause(this.page, 1000);
    const commissionAsc = this.toNumbers(await this.getColumnTexts(5));
    expect(this.isSortedAsc(commissionAsc)).toBeTruthy();
  }

  async createReferralTier(tierName: string) {
    const dialog = await this.openCreateDialog();
    await expect(this.getReferralTierDialog()).toBeVisible();
    await pause(this.page);

    const fill = async (loc: Locator, val: string) => {
      await expect(loc).toBeEditable({ timeout: 15000 });
      await loc.click();
      await loc.fill(val);
      await expect(loc).toHaveValue(val);
      await pause(this.page);
    };

    const nameInput = this.getNameInput();
    await expect(nameInput).toBeEditable({ timeout: 15000 });
    await nameInput.click();
    await pause(this.page, 500);
    await nameInput.pressSequentially(tierName, { delay: 150 });
    await pause(this.page, 500);
    await fill(this.getApplyFromInput(), "1");
    await fill(this.getCommissionPercentInput(), "1");
    await fill(this.getFirstPurchaseCommissionPercentInput(), "1");
    await fill(this.getDiscountPercentInput(), "1");
    await fill(this.getFirstPurchaseDiscountPercentInput(), "1");
    await fill(this.getNthPurchaseCommissionInput(), "1");
    await fill(this.getPayoutCommissionPercentInput(), "1");
    await fill(this.getPayoutCommissionCapInput(), "1");

    const submit = this.getReferralTierDialog().getByRole("button", { name: "Create Referral Tier" });
    await expect(submit).toBeEnabled({ timeout: 10000 });
    await submit.click();

    await expect(this.getCreatedToast()).toBeVisible({ timeout: 15000 });
    await expect(this.getReferralTierDialog()).toBeHidden({ timeout: 15000 });
    await this.page.reload();
    await this.waitForMinRows(1);
  }

  async editReferralTier(oldTitle: string, newTitle: string) {
    await this.openReferralTiers();
    await this.waitForMinRows(1);
    await this.page.waitForLoadState("networkidle");

    const row = this.getReferralRowByText(oldTitle);
    await expect(row).toBeVisible({ timeout: 15000 });

    await row.scrollIntoViewIfNeeded();
    await row.hover();
    await pause(this.page, 300);
    await this.getEditButtonInRow(row).dispatchEvent("click");

    const dialog = this.getDialog();
    await expect(dialog).toBeVisible({ timeout: 15000 });

    const nameInput = dialog.getByLabel("Name");
    await nameInput.click({ clickCount: 3 });
    await nameInput.pressSequentially(newTitle, { delay: 100 });
    await pause(this.page);

    const updateBtn = dialog.getByRole("button", { name: "Update Referral Tier" });
    await expect(updateBtn).toBeEnabled({ timeout: 15000 });
    await updateBtn.click();

    await expect(this.getUpdatedToast()).toBeVisible({ timeout: 15000 });
    await expect(dialog).toBeHidden({ timeout: 15000 });
    await pause(this.page, 1500);
    await this.page.reload();
    await this.waitForMinRows(1);
    await expect.poll(async () => await this.getRowsByText(newTitle).count(), { timeout: 20000 }).toBeGreaterThan(0);
  }

  async deleteReferralTier(tierName: string) {
    await this.openReferralTiers();

    const row = this.getReferralRowByText(tierName);
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.scrollIntoViewIfNeeded();
    await this.getDeleteButtonInRow(row).dispatchEvent("click");

    const dialog = this.getDialog();
    await expect(dialog).toBeVisible({ timeout: 15000 });

    await dialog.getByRole("button", { name: "Confirm" }).click();

    await expect(this.getDeletedToast()).toBeVisible({ timeout: 15000 });
    await expect(this.getRowsByText(tierName)).toHaveCount(0, { timeout: 20000 });
  }

  async verifyCreateAndDeleteFlow(tierName: string) {
    await this.createReferralTier(tierName);
    await this.deleteReferralTier(tierName);
  }
}
