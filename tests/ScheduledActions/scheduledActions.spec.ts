import { test } from "@playwright/test";
import Tasks from "../../pages/Tasks/tasksPO";
import { qase } from "playwright-qase-reporter";

import { Page, Browser, BrowserContext, chromium } from "@playwright/test";

import ScheduledActions from "../../pages/ScheduledActions/scheduledActionsPO";
import { login } from "../../utils/common";

test.describe("Test Scenarios for Scheduled Actions Page", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let tasks_Page: any;
  let scheduledActions_Page: any;

  test.beforeAll(async () => {
    test.setTimeout(100000);
    browser = await chromium.launch();
    context = await browser.newContext();
    page = await context.newPage();
    scheduledActions_Page = new ScheduledActions(page);
    tasks_Page = new Tasks(page);

    await login(page);
    await page.goto("/");
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  });

  test(qase(734, "Delete all saved filters"), async () => {
    await scheduledActions_Page.deleteAllSavedFilters();
  });

  test(qase(688, "Verify the list of scheduled actions"), async () => {
    await scheduledActions_Page.verifyScheduledActionsList();
  });

  test(qase(669, "Verify the statuses filter"), async () => {
    await scheduledActions_Page.verifyStatusesFilter();
  });

  test(qase([673, 736], "Verify the schedulable types filter"), async () => {
    await scheduledActions_Page.verifySchedulableTypesFilter();
  });

  test(qase([674, 737], "Verify the created by filter"), async () => {
    await scheduledActions_Page.verifyCreatedByFilter();
  });

  test(qase(675, "Verify saving a filter for scheduled actions"), async () => {
    await scheduledActions_Page.verifySaveFilters();
  });

  test(qase(734, "Verify deleting a saved filter"), async () => {
    await scheduledActions_Page.deleteSavedFilter();
  });

  test(qase(671, "Reschedule a task from the schedule actions page"), async () => {
    const status = "Cancelled";
    const processedBy = "muhammad@fundingpips.com";
    await tasks_Page.applyScheduleActionsOnTasks(status, processedBy);
    await scheduledActions_Page.rescheduleProcessedTask();
  });

  test(qase(670, "Cancel a scheduled action from the scheduled actions page"), async () => {
    await scheduledActions_Page.cancelScheduledAction();
  });
});
