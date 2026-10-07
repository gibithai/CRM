import { test } from "@playwright/test";
import { Page, Browser, BrowserContext, chromium } from "@playwright/test";
import { qase } from "playwright-qase-reporter";

const couponNameFilter = "coupon_for_automation";
const referralEmail = "muhammad@fundingpips.com";
const couponName = "testCoupon-" + Date.now();
const updatedCoupon = "updatedTestCoupon-" + Date.now();
const couponCode = Math.random().toString(36).slice(2, 6).toUpperCase();
const updatedCouponCode = Math.random().toString(36).slice(2, 6).toUpperCase();

import Coupons from "../../pages/Coupons/couponsPO";
import { login } from "../../utils/common";

test.describe("Test Scenarios for Coupons Page", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let coupons_page: Coupons;

  test.beforeAll(async () => {
    test.setTimeout(100000);
    browser = await chromium.launch();
    context = await browser.newContext();
    page = await context.newPage();
    coupons_page = new Coupons(page);

    await login(page);
  });

  test("Delete all saved filters", async () => {
    await coupons_page.deleteAllSavedFilters();
  });

  test(qase([401, 402], "Verify the list of coupons"), async () => {
    await coupons_page.verifyCouponsList();
  });

  test(qase([415, 416], "Search and filter by coupon name"), async () => {
    await coupons_page.searchFilterByCouponName(couponNameFilter);
  });

  test(qase(421, "Verify referral search filter"), async () => {
    await coupons_page.verifyReferralSearchFilter(referralEmail);
  });

  test(qase(417, "Verify saving a filter"), async () => {
    await coupons_page.verifySaveFilters(couponName);
  });

  test(qase(418, "Verify deleting a saved filter"), async () => {
    await coupons_page.deleteSavedFilter();
  });

  test(qase(414, "Create a new coupon"), async () => {
    await coupons_page.createCoupon(couponName);
  });

  test(qase(422, "Verify the newly created coupon appears in the list"), async () => {
    await coupons_page.verifyCreatedCoupon(couponName);
  });

  test(qase(404, "Edit the newly created coupon appears in the list"), async () => {
    await coupons_page.editCreatedCoupon(couponName, updatedCoupon);
  });

  test(qase(422, "Create a new coupon code from a specific coupon"), async () => {
    await coupons_page.createCouponCode(updatedCoupon, referralEmail, couponCode);
  });

  test(qase(423, "Edit the created coupon code"), async () => {
    await coupons_page.editCouponCode(updatedCoupon, updatedCouponCode);
  });

  test(qase(424, "Verify the edited coupon code appears in the list"), async () => {
    await coupons_page.deleteCouponCode(updatedCoupon, updatedCouponCode);
  });

  test(qase(425, "Search and filter coupon_code by code"), async () => {
    const couponName = "AutomationTesting";
    const couponCode = "QCODE";
    await coupons_page.verifyCouponCodesByUser(couponName, couponCode);
  });

  test(qase(419, "Create and cancel a new coupon from the coupon details page"), async () => {
    const couponName = "AutomationTesting";
    await coupons_page.createAndCancelFromCouponDetailsPage(couponName, updatedCoupon);
  });

  test(qase(420, "Verify the hide sidebar button functionality"), async () => {
    await coupons_page.verifyHideSidebarButton();
  });

  test(qase(413, "Delete the newly created coupon"), async () => {
    await coupons_page.deleteCreatedCoupon(updatedCoupon);
  });

  test(qase([711, 725], "Apply schedule actions on coupons"), async () => {
    await coupons_page.applyScheduleActionsOnCoupons();
  });

  test(qase([712, 713], "Verify the applied scheduled actions on coupons"), async () => {
    await coupons_page.verifyScheduledActionsForCoupons();
  });

  test(qase(714, "Cancel the scheduled actions on coupons"), async () => {
    await coupons_page.cancelScheduledCouponUpdate();
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  });
});
