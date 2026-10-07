import { expect, Page } from "@playwright/test";
import { pause, getScheduleAt, getDisplayDate } from "../../utils/common";

class Coupons {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ==================== Helper Functions ===================== //

  async navigateToCouponsPage() {
    await this.getCouponsTab().click();
    await expect(this.getCouponsLabel()).toBeVisible();
  }

  async redirectToCouponDetailsPage(updatedCoupon: string) {
    await this.getSearchFieldFilter().pressSequentially(updatedCoupon, { delay: 200 });
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);
    await expect(this.getCouponsList()).toContainText(updatedCoupon);
    await this.getViewDetailsButton().nth(0).click({ force: true });
    await expect(this.page.getByText(updatedCoupon)).toBeVisible();
  }

  // ===================== Locators ===================== //

  getCouponsTab() {
    return this.page.getByRole("link", { name: "Coupons", exact: true });
  }

  getCouponsLabel() {
    return this.page.locator("h2", { hasText: "Coupons" });
  }

  getCouponsList() {
    return this.page.locator("tbody tr");
  }

  getSearchFieldFilter() {
    return this.page.locator('input[name="search_field"]');
  }

  getReferralSearchFilter() {
    return this.page.locator('[type="text"]');
  }

  getFilterResultButton() {
    return this.page.locator('[type="submit"]');
  }

  getClearFiltersButton() {
    return this.page.locator("button", { hasText: "Clear Filters" });
  }

  getSaveFiltersButton() {
    return this.page.locator("button", { hasText: "Save filters" });
  }

  getSuccessNotification() {
    return this.page.locator("[aria-label='Notifications alt+T']");
  }

  getDeleteSavedFilterButton() {
    return this.page.locator(".lucide-trash");
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

  getCreateCouponButton() {
    return this.page.locator("button", { hasText: "Create Coupon" });
  }

  getCouponNameInputField() {
    return this.page.locator("#name");
  }

  getPriceInputField() {
    return this.page.locator("#amount");
  }

  getRedemptionLimitInputField() {
    return this.page.locator("#redemption_limit");
  }

  getFirstPurchaseAmountInputField() {
    return this.page.locator("#first_purchase_amount");
  }

  getReferralUserIdInputField() {
    return this.page.locator("#user_id");
  }

  getCreateButton() {
    return this.page.locator('[role="dialog"] button', { hasText: "Create" });
  }

  getCouponTypeDropdown() {
    return this.page.getByRole("marquee").nth(0);
  }

  getCouponTypeOption(option: string) {
    return this.page.getByRole("option", { name: option });
  }

  getEditCouponButton() {
    return this.page.locator("span .lucide-pencil").first();
  }

  getSaveUpdatedCouponButton() {
    return this.page.locator('[role="dialog"] button', { hasText: "Save" });
  }

  getSuccessNotificationCloseButton() {
    return this.page.locator('[aria-label="Close toast"]');
  }

  getViewDetailsButton() {
    return this.page.locator("button:has(.lucide-chevron-right)");
  }

  getDeleteCouponButton() {
    return this.page.locator("td button:has(.lucide-trash2)").first();
  }

  getDeleteButtonInConfirmDialog() {
    return this.page.locator('[role="dialog"] button', { hasText: "Confirm" });
  }

  getEditCouponLabel() {
    return this.page.locator("h2", { hasText: "Edit Coupon" });
  }

  getCreateNewCodeButton() {
    return this.page.locator("button", { hasText: " Create new Code" });
  }

  getEditCouponCodeButton() {
    return this.page.locator("td button:has(.lucide-pencil)");
  }

  getCouponCodeField() {
    return this.page.locator("#code");
  }

  getUserEmailField() {
    return this.page.locator("#user_email");
  }

  getOnlyFirstPurchaseCheckbox() {
    return this.page.locator("#only_first_purchase");
  }

  getUpdateButton() {
    return this.page.locator("button", { hasText: "Update" });
  }

  getDeleteCouponCodeButton() {
    return this.page.locator("td button:has(.lucide-trash2)");
  }

  getCouponCodeSearchField() {
    return this.page.locator('[type="text"]');
  }

  getHideSidebarButton() {
    return this.page.locator("button", { hasText: "Hide sidebar" });
  }

  getEditCouponButtonFromDetailsPage() {
    return this.page.locator("button", { hasText: "  Edit Coupon" });
  }

  getCancelButton() {
    return this.page.locator("button", { hasText: "Cancel" });
  }

  getDateFromCalender(formattedScheduledAt: string) {
    return this.page.locator(`[data-day="${formattedScheduledAt}"] button`);
  }

  getTimeHours() {
    return this.page.locator('[data-slot="scroll-area"]');
  }

  getActionsDot() {
    return this.page.locator(".lucide-ellipsis");
  }

  getActionMenuItem(itemText: string) {
    return this.page.locator(`[role="menuitem"]:has-text("${itemText}")`);
  }

  getScheduleButton() {
    return this.page.locator("button", { hasText: "Schedule" });
  }

  getApplyButton() {
    return this.page.locator("button", { hasText: "Apply" });
  }

  getScheduleCouponUpdateLabel() {
    return this.page.locator("h2", { hasText: "Schedule coupon update" });
  }

  getConfirmButton() {
    return this.page.locator("button", { hasText: "Confirm" });
  }

  getScheduledActionsTab() {
    return this.page.locator('[role="tab"]', { hasText: "Scheduled Actions" });
  }

  // ===================== Actions ===================== //

  async deleteAllSavedFilters() {
    await this.navigateToCouponsPage();
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

  async verifyCouponsList() {
    await this.navigateToCouponsPage();
    const rows = await this.getCouponsList().elementHandles();
    if (rows.length > 0) {
      for (const row of rows) {
        const couponName = (await row.$eval("td:nth-child(1)", (td) => td.textContent)).trim();
        expect(couponName).not.toBe("");
      }
    } else {
      await expect(this.getCouponsList()).toContainText("No more records");
    }
  }

  async searchFilterByCouponName(couponNameFilter: string) {
    await this.navigateToCouponsPage();
    await this.getSearchFieldFilter().pressSequentially(couponNameFilter);
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);

    const rows = await this.getCouponsList().elementHandles();
    if (rows.length > 0) {
      for (const row of rows) {
        const name = await row.$eval("td:nth-child(1)", (td) => td.textContent?.trim());
        expect(name).toBe(couponNameFilter);
      }
    } else {
      await expect(this.getCouponsList()).toContainText("No data");
    }
    await this.getClearFiltersButton().click();
  }

  async verifyReferralSearchFilter(referralEmail: string) {
    await this.navigateToCouponsPage();
    await this.getReferralSearchFilter().pressSequentially(referralEmail, { delay: 100 });
    await this.page.locator("div", { hasText: referralEmail }).first().click();
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);

    const rows = await this.getCouponsList().elementHandles();
    if (rows.length > 0) {
      for (const row of rows) {
        const referralName = await row.$eval("td:nth-child(11)", (td) => td.textContent?.trim());
        expect(referralName).toBe("Muhammad K");
      }
    } else {
      await expect(this.getCouponsList()).toContainText("No data");
    }
    await this.getClearFiltersButton().click();
  }

  async verifySaveFilters(couponNameFilter: string) {
    await this.navigateToCouponsPage();
    await this.getSearchFieldFilter().pressSequentially(couponNameFilter);
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await this.getSaveFiltersButton().click();
    await this.getFilterNameInputField().fill("QA_Saved_Filter");
    await this.getSaveButton().click();
    await expect(this.getSuccessNotification()).toHaveText("Successfully saved filter.");
    await this.getSuccessNotificationCloseButton().click();
  }

  async deleteSavedFilter() {
    await this.navigateToCouponsPage();
    await this.getSelectFilterButton().click();
    await this.getDeleteSavedFilterButton().click();
    await expect(this.getSuccessNotification()).toHaveText("Successfully deleted filter.");
    await this.getSuccessNotificationCloseButton().click();
  }

  async createCoupon(couponName: string) {
    const validTillDate = new Date();
    validTillDate.setDate(validTillDate.getDate() + 1);
    const day = String(validTillDate.getDate()).padStart(2, "0");
    const month = String(validTillDate.getMonth() + 1).padStart(2, "0");
    const year = validTillDate.getFullYear();
    const formattedValidTillDate = `${year}-${month}-${day}`;
    await this.navigateToCouponsPage();
    await this.getCreateCouponButton().click();
    await this.getCouponNameInputField().pressSequentially(couponName);
    await this.getCouponTypeDropdown().click();
    await this.getCouponTypeOption("percentage").click();
    await this.getPriceInputField().pressSequentially("50");
    await this.getRedemptionLimitInputField().pressSequentially("2");
    await this.getFirstPurchaseAmountInputField().click();
    await this.getReferralUserIdInputField().pressSequentially("61");
    await this.page.locator(".lucide-calendar").nth(1).click({ force: true });
    await this.page.locator(`[data-day="${formattedValidTillDate}"] button`).click();
    await this.page.mouse.click(0, 0);
    await expect(this.getCreateButton()).toBeEnabled();
    await this.getCreateButton().click();
    await expect(this.getSuccessNotification()).toHaveText("Coupon created successfully");
    await this.getSuccessNotificationCloseButton().click();
    await this.getClearFiltersButton().click();
  }

  async verifyCreatedCoupon(couponName: string) {
    await this.navigateToCouponsPage();
    await this.getSearchFieldFilter().pressSequentially(couponName, { delay: 200 });
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);
    await expect(this.getCouponsList()).toContainText(couponName);
    await this.getClearFiltersButton().click();
  }

  async editCreatedCoupon(couponName: string, updatedCoupon: string) {
    await this.navigateToCouponsPage();
    await this.getSearchFieldFilter().pressSequentially(couponName, { delay: 200 });
    await this.page.mouse.click(0, 0);
    await this.getFilterResultButton().click({ force: true });
    await pause(this.page);
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);
    await this.getEditCouponButton().click({ force: true });
    await pause(this.page);
    await this.getEditCouponLabel().waitFor({ state: "visible", timeout: 5000 });
    await this.getCouponNameInputField().clear();
    await this.getCouponNameInputField().pressSequentially(updatedCoupon, { delay: 200 });
    await this.getPriceInputField().clear();
    await this.getPriceInputField().pressSequentially("25");
    await this.getRedemptionLimitInputField().clear();
    await this.getRedemptionLimitInputField().pressSequentially("1");
    await this.getFirstPurchaseAmountInputField().clear();
    await expect(this.getSaveUpdatedCouponButton()).toBeEnabled();
    await this.getSaveUpdatedCouponButton().click();
    await pause(this.page, 2000);
    await expect(this.getSuccessNotification()).toHaveText("Coupon updated successfully");
    await this.getSuccessNotificationCloseButton().click();
    await this.getClearFiltersButton().click();
  }

  async deleteCreatedCoupon(updatedCouponCode: string) {
    await this.navigateToCouponsPage();
    await this.getSearchFieldFilter().pressSequentially(updatedCouponCode, { delay: 100 });
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);
    const deleteBtn = this.getDeleteCouponButton();
    await deleteBtn.scrollIntoViewIfNeeded();
    await deleteBtn.click();
    await pause(this.page);
    await this.getDeleteButtonInConfirmDialog().click();
    await expect(this.getSuccessNotification()).toContainText("Coupon deleted successfully");
    await this.getSuccessNotificationCloseButton().click();
    await this.getClearFiltersButton().click();
  }

  async createCouponCode(updatedCoupon: string, referralEmail: string, couponCode: string) {
    await this.navigateToCouponsPage();
    await this.redirectToCouponDetailsPage(updatedCoupon);
    await this.getCreateNewCodeButton().click();
    await this.getCouponCodeField().pressSequentially(couponCode);
    await this.getUserEmailField().pressSequentially(referralEmail);
    await this.getRedemptionLimitInputField().pressSequentially("1");
    await this.getOnlyFirstPurchaseCheckbox().click();
    await this.getCreateButton().click();
    await expect(this.getSuccessNotification()).toHaveText("Coupon code created");
    await this.getSuccessNotificationCloseButton().click();
  }

  async editCouponCode(updatedCoupon: string, updatedCouponCode: string) {
    await this.navigateToCouponsPage();
    await this.redirectToCouponDetailsPage(updatedCoupon);
    await pause(this.page);
    await this.getEditCouponCodeButton().click({ force: true });
    await this.getCouponCodeField().clear();
    await this.getCouponCodeField().pressSequentially(updatedCouponCode);
    await this.getRedemptionLimitInputField().clear();
    await this.getRedemptionLimitInputField().pressSequentially("2");
    await this.getUpdateButton().click();
    await expect(this.getSuccessNotification()).toHaveText("Coupon code updated");
    await this.getSuccessNotificationCloseButton().click();
  }

  async deleteCouponCode(updatedCoupon: string, updatedCouponCode: string) {
    await this.navigateToCouponsPage();
    await this.redirectToCouponDetailsPage(updatedCoupon);
    await pause(this.page);
    await expect(this.getCouponsList()).toContainText(updatedCouponCode);
    await this.getDeleteCouponCodeButton().first().click();
    await this.getDeleteButtonInConfirmDialog().click();
    await expect(this.getSuccessNotification()).toHaveText("Coupon code deleted");
    await this.getSuccessNotificationCloseButton().click();
  }

  async verifyCouponCodesByUser(couponName: string, couponCode: string) {
    await this.navigateToCouponsPage();
    await this.getSearchFieldFilter().pressSequentially(couponName);
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);
    await this.getViewDetailsButton().nth(0).click({ force: true });
    await pause(this.page);
    await expect(this.page.getByText(couponName)).toBeVisible();
    await this.getCouponCodeSearchField().pressSequentially(couponCode);
    await this.page.keyboard.press("Enter");
    await pause(this.page);

    const couponCodeList = await this.getCouponsList().locator("td:nth-child(1)").textContent();
    expect(couponCodeList).toContain(couponCode);
  }

  async createAndCancelFromCouponDetailsPage(couponName: string, updatedCoupon: string) {
    await this.navigateToCouponsPage();
    await this.getSearchFieldFilter().pressSequentially(couponName);
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);
    await this.getViewDetailsButton().nth(0).click({ force: true });
    await expect(this.page.getByText(couponName)).toBeVisible();
    await pause(this.page);
    await this.getEditCouponButtonFromDetailsPage().click({
      force: true,
    });
    await this.getCouponNameInputField().clear();
    await this.getCouponNameInputField().fill(updatedCoupon);
    await this.getCancelButton().click();
    await expect(this.page.getByText(couponName)).toBeVisible();
  }

  async verifyHideSidebarButton() {
    await this.navigateToCouponsPage();
    await this.getHideSidebarButton().click();
    await expect(this.getFilterResultButton()).toBeHidden();
    await this.page.locator(".lucide-panel-right").click();
    await expect(this.getFilterResultButton()).toBeVisible();
  }

  async applyScheduleActionsOnCoupons() {
    const { datePart, hours, minutes } = getScheduleAt();
    await this.navigateToCouponsPage();
    await this.getSearchFieldFilter().pressSequentially("scheduledCouponsAutomation");
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);
    await this.getEditCouponButton().click({ force: true });
    await pause(this.page);
    await this.getPriceInputField().clear();
    await this.getPriceInputField().pressSequentially("20");
    await this.getScheduleButton().click();
    await this.getDateFromCalender(datePart).click();
    await this.getTimeHours().nth(0).getByRole("button", { name: hours, exact: true }).click();
    await this.getTimeHours().nth(1).getByRole("button", { name: minutes, exact: true }).click();
    await this.getApplyButton().click();
    await expect(this.getScheduleCouponUpdateLabel()).toBeVisible();
    await this.getConfirmButton().click();
    await expect(this.getSuccessNotification()).toHaveText(/Coupon update scheduled for .+/);
    await this.getSuccessNotificationCloseButton().click();
    await this.getClearFiltersButton().click();
  }

  async verifyScheduledActionsForCoupons() {
    const displayDate = getDisplayDate();
    await this.navigateToCouponsPage();
    await this.getSearchFieldFilter().pressSequentially("scheduledCouponsAutomation", { delay: 200 });
    await this.getFilterResultButton().click({ force: true });
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);
    await this.getViewDetailsButton().nth(0).click({ force: true });
    await expect(this.page.getByText("scheduledCouponsAutomation")).toBeVisible();
    await this.getScheduledActionsTab().click();
    await pause(this.page);

    while (true) {
      await pause(this.page);
      const actionsDot = this.page.locator(".lucide-ellipsis");
      if ((await actionsDot.count()) > 0 && (await actionsDot.first().isVisible())) {
        break;
      }
      const nextBtn = this.page.getByRole("button", { name: "Go to next page" });
      if ((await nextBtn.count()) === 0 || !(await nextBtn.isEnabled())) {
        break;
      }
      await nextBtn.click();
    }
    await this.page
      .locator("tr")
      .filter({ has: this.page.getByText("Scheduled", { exact: true }) })
      .getByRole("button", { name: "View payload" })
      .nth(0)
      .click();
    await expect(
      this.page
        .locator("button")
        .filter({
          hasText: new RegExp(`${displayDate}`),
        })
        .nth(0)
    ).toBeVisible();
    await this.page.mouse.click(0, 0);
    await this.getCouponsTab().click();
    await this.getClearFiltersButton().click();
  }

  async cancelScheduledCouponUpdate() {
    await this.navigateToCouponsPage();
    await this.getSearchFieldFilter().pressSequentially("scheduledCouponsAutomation");
    await this.getFilterResultButton().click();
    await expect(this.getFilterResultButton()).toBeEnabled();
    await pause(this.page);
    await this.getViewDetailsButton().nth(0).click({ force: true });
    await pause(this.page);
    await this.getScheduledActionsTab().click();
    while (true) {
      await pause(this.page);
      const actionsDot = this.page.locator(".lucide-ellipsis");
      if ((await actionsDot.count()) > 0 && (await actionsDot.first().isVisible())) {
        break;
      }
      const nextBtn = this.page.getByRole("button", { name: "Go to next page" });
      if ((await nextBtn.count()) === 0 || !(await nextBtn.isEnabled())) {
        break;
      }
      await nextBtn.click();
    }
    await this.getActionsDot().first().click();
    await this.getActionMenuItem("Cancel").click();
    await this.getConfirmButton().click();
    await expect(this.getSuccessNotification()).toHaveText("Scheduled action successfully cancelled");
  }
}
export default Coupons;
