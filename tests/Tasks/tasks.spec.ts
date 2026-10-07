import { test } from "@playwright/test";
import { Page, Browser, BrowserContext, chromium } from "@playwright/test";
import { qase } from "playwright-qase-reporter";

import { login } from "../../utils/common";
import Tasks from "../../pages/Tasks/tasksPO";

test.describe("Test Scenarios for Tasks Page", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let tasks_Page: any;
  const status = "Cancelled";
  const processedBy = "muhammad@fundingpips.com";

  test.beforeAll(async () => {
    test.setTimeout(100000);
    browser = await chromium.launch();
    context = await browser.newContext();
    page = await context.newPage();
    tasks_Page = new Tasks(page);
    await login(page);
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  });

  test(qase(642, "Verify the list of tasks"), async () => {
    await tasks_Page.verifyTasksList();
  });

  test(qase([405, 409, 412], "Verify Status filter on tasks page"), async () => {
    await tasks_Page.verifyTaskStatusFilter(status);
  });

  test(qase(639, "Verify ProcessedBy filter on tasks page"), async () => {
    await tasks_Page.verifyTaskProcessedByFilter(processedBy);
  });

  test(qase(638, "Verify AddedBy filter on tasks page"), async () => {
    const addedBy = "melashu@fundingpips.com";
    await tasks_Page.verifyTaskAddedByFilter(addedBy);
  });

  test(qase([640, 390], "Verify CreatedAt filter on tasks page"), async () => {
    await tasks_Page.verifyTaskCreatedAtFilter();
  });

  test(qase(641, "Verify LastRun filter on tasks page"), async () => {
    await tasks_Page.verifyTasksLastRunFilter();
  });

  test(qase([408, 411], "Verify the combined filters functionality on tasks page"), async () => {
    await tasks_Page.verifyCombinedFilters(status, processedBy);
  });

  test(qase(410, "Verify Save Payout filter on tasks page"), async () => {
    await tasks_Page.savePayoutFilters("Completed");
  });

  test(qase(643, "Verify Delete Saved filter on tasks page"), async () => {
    await tasks_Page.deleteSavedFilter();
  });

  test(qase([721, 724], "Verify applying schedule actions on tasks"), async () => {
    await tasks_Page.applyScheduleActionsOnTasks(status, processedBy);
  });

  test(qase(722, "Verify the applied scheduled actions on tasks"), async () => {
    await tasks_Page.verifyScheduledActionsForTasks(status, processedBy);
  });

  test(qase(723, "Cancel the scheduled actions on tasks"), async () => {
    await tasks_Page.cancelScheduledTaskUpdate(status, processedBy);
  });

  // test(qase(644, "Verify upload Referrals from CSV file on tasks page"), async () => {
  //   await tasks_Page.uploadReferralsFromCSVFile();
  // });

  // test(qase([645, 388, 389], "Verify upload Bulk Comments from CSV file on tasks page"), async () => {
  //   await tasks_Page.uploadBulkCommentsFromCSVFile();
  // });

  // // test(qase(648, "Verify upload Process Payouts from CSV file on tasks page"), async () => {
  // //   await tasks_Page.uploadProcessPayoutsFromCSVFile();
  // // });

  // test(qase([646, 403], "Verify upload Deduct Commission from CSV file on tasks page"), async () => {
  //   await tasks_Page.uploadDeductCommissionsFromCSVFile();
  // });

  // test(qase([647, 392], "Verify upload Bulk Approve from CSV file on tasks page"), async () => {
  //   await tasks_Page.uploadBulkApproveFromCSVFile();
  // });

  // test(qase(391, "Verify download sample CSV file functionality on tasks page"), async () => {
  //   await tasks_Page.verifyDownloadedSample();
  // });
});
