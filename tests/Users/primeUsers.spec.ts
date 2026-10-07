import { test, Page, Browser, BrowserContext, chromium } from "@playwright/test";
import { login } from "../../utils/common";
import { qase } from "playwright-qase-reporter";

import PrimeUsers from "../../pages/Users/primeUsersPO";

test.describe("Test Scenarios for Prime Users Page", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let primeUsers_Page: any;

  test.beforeAll(async () => {
    test.setTimeout(100000);
    browser = await chromium.launch();
    context = await browser.newContext();
    page = await context.newPage();
    primeUsers_Page = new PrimeUsers(page);
    await login(page);
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  });

  test(qase(732, "Verify the prime mode is active "), async () => {
    await primeUsers_Page.verifyPrimeMode();
  });

  test(qase(733, "Verify the User's Prime challenges"), async () => {
    await primeUsers_Page.primeUserChallenges();
  });
});
