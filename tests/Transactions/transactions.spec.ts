import { test, Page, Browser, BrowserContext, chromium } from "@playwright/test";
import Transactions from "../../pages/Transactions/transactionsPO";
import { login } from "../../utils/common";
import { qase } from "playwright-qase-reporter";

test.describe("Transactions", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let transactionsPage: Transactions;

  test.beforeAll(async () => {
    test.setTimeout(100000);
    browser = await chromium.launch();
    context = await browser.newContext();
    page = await context.newPage();
    transactionsPage = new Transactions(page);
    await login(page);
    await page.goto("/");
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  });

  test(qase(610, "Verify All table columns on the page"), async () => {
    await transactionsPage.verifyUsersPageVisibility();
  });

  test(qase(612, "Verify Sorting"), async () => {
    await transactionsPage.verifySorting();
  });

  test(qase(611, "Verify CSV export"), async () => {
    await transactionsPage.verifyExportCSVHeaders();
  });
});
