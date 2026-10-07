import { test, Page, Browser, BrowserContext, chromium } from "@playwright/test";
import { login } from "../../utils/common";
import { qase } from "playwright-qase-reporter";

import PrimeAccounts from "../../pages/Accounts/primeAccountsPO";

test.describe("Test Scenarios for Prime Accounts Page", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let primeAccounts_Page: any;

  test.beforeAll(async () => {
    test.setTimeout(100000);
    browser = await chromium.launch();
    context = await browser.newContext();
    page = await context.newPage();
    primeAccounts_Page = new PrimeAccounts(page);
    await login(page);
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  });

  test(qase(726, "Verify the prime mode is active "), async () => {
    await primeAccounts_Page.verifyPrimeMode();
  });

  test(qase(727, "Verify the list of prime accounts"), async () => {
    await primeAccounts_Page.verifyPrimeAccountsList();
  });
});
