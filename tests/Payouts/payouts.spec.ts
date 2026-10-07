import { test } from "@playwright/test";
import { qase } from "playwright-qase-reporter";

const tagName = getTag("tag");
import { Page, Browser, BrowserContext, chromium } from "@playwright/test";

import Payouts from "../../pages/Payouts/payoutsPO";
import { login, getTag } from "../../utils/common";

test.describe("Test Scenarios for Payouts Page", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let payouts_Page: any;

  test.beforeAll(async () => {
    test.setTimeout(100000);
    browser = await chromium.launch();
    context = await browser.newContext();
    page = await context.newPage();
    payouts_Page = new Payouts(page);
    await login(page);
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  });

  test(qase(567, "Delete all the created notes"), async () => {
    await payouts_Page.deleteAllNotes();
  });

  test(qase([336, 337], "Verify the list of payouts"), async () => {
    await payouts_Page.verifyPayoutsList();
  });

  test(qase(344, "Verify search filter on Payouts page"), async () => {
    await payouts_Page.verifyPayoutSearchFilter();
  });

  test(qase(345, "Verify payout statuses filter on Payouts page"), async () => {
    await payouts_Page.verifyPayoutStatusesFilter();
  });

  test(qase(346, "Verify payout type filter on Payouts page"), async () => {
    await payouts_Page.verifyPayoutTypeFilter();
  });

  test(qase(427, "Verify payout cycle filter on Payouts page"), async () => {
    await payouts_Page.verifyPayoutCycleFilter();
  });

  test(qase([350, 351], "Adding save filters on Payouts page"), async () => {
    await payouts_Page.savePayoutFilters();
  });

  test(qase(352, "Delete saved filter from Payouts page"), async () => {
    await payouts_Page.deleteSavedFilter();
  });

  test(qase(562, "Adding tag to a user from payouts"), async () => {
    await payouts_Page.addTagToPayout(tagName);
  });

  test(qase(564, "Verify the added tag is visible in payout details"), async () => {
    await payouts_Page.verifyTheAddedTag(tagName);
  });

  test(qase(563, "Verify payout tag filter on Payouts page"), async () => {
    await payouts_Page.verifyTagFilter(tagName);
  });

  test(qase([339, 338, 342], "Export and verify CSV data from Payouts page"), async () => {
    await payouts_Page.exportCSV();
  });

  test(qase(565, "Add a note to a payout"), async () => {
    await payouts_Page.addPayoutNote();
  });

  test(qase(566, "Edit the note added to a payout"), async () => {
    await payouts_Page.editPayoutNote();
  });

  test(qase(567, "Delete the added note to a payout"), async () => {
    await payouts_Page.deletePayoutNote();
  });

  test(qase(432, "Perform assign bulk action on Payouts page"), async () => {
    await payouts_Page.performAssignBulkAction();
  });

  test(qase(655, "Perform unassign bulk action on Payouts page"), async () => {
    await payouts_Page.performUnAssignBulkAction();
  });

  test(qase(656, "Perform create_processing_task bulk action on Payouts page"), async () => {
    await payouts_Page.createProcessingTaskBulkAction();
  });
});
