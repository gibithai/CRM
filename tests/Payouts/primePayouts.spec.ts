import { test, Page, Browser, BrowserContext, chromium } from "@playwright/test";
import { login } from "../../utils/common";
import PrimePayouts from "../../pages/Payouts/primePayoutsPO";
import { qase } from "playwright-qase-reporter";

test.describe("Test Scenarios for Prime Payouts Page", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let primePayouts: any;

  test.beforeAll(async () => {
    test.setTimeout(100000);
    browser = await chromium.launch();
    context = await browser.newContext();
    page = await context.newPage();
    primePayouts = new PrimePayouts(page);
    await login(page);
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  });

  test(qase(728, "Verify the prime mode is active "), async () => {
    await primePayouts.verifyPrimeMode();
  });

  test(qase(729, "Verify the prime payout from list"), async () => {
    await primePayouts.verifyPrimePayoutFromList();
  });
});
