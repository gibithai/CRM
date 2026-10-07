// import { test } from "@playwright/test";
// import { qase } from "playwright-qase-reporter";

// import { Page, Browser, BrowserContext, chromium } from "@playwright/test";

// import Accounts from "../../pages/Accounts/accountsPO";
// import { login } from "../../utils/common";

// test.describe("Test Scenarios for Accounts Page", () => {
//   let browser: Browser;
//   let context: BrowserContext;
//   let page: Page;
//   let account_Page: any;

//   test.beforeAll(async () => {
//     test.setTimeout(100000);
//     browser = await chromium.launch();
//     context = await browser.newContext();
//     page = await context.newPage();
//     account_Page = new Accounts(page);
//     await login(page);
//     await page.goto("/");
//   });

//   test.afterAll(async () => {
//     if (page) await page.close();
//     if (context) await context.close();
//     if (browser) await browser.close();
//   });

//   test(qase(663, "Create bulk reactivate task"), async () => {
//     await account_Page.createBulkReactivateTask();
//   });

//   test(qase(664, "Create bulk violate task"), async () => {
//     await account_Page.createBulkViolateTask();
//   });

//   test(qase(665, "Create bulk approve task"), async () => {
//     await account_Page.createBulkApproveTask();
//   });

//   test(qase(666, "Create bulk disable trading task"), async () => {
//     await account_Page.createBulkDisableTradingTask();
//   });

//   test(qase(667, "Create bulk onboarding/enable trading task"), async () => {
//     await account_Page.createBulkOnboardingTask();
//   });

//   test(qase(683, "Create send email by login task"), async () => {
//     await account_Page.createSendEmailByLoginTask();
//   });
// });
