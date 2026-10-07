import { test, Page, Browser, BrowserContext, chromium } from "@playwright/test";
import { login } from "../../utils/common";
import PrimeTemplates from "../../pages/Templates/primeTemplatesPO";
import { qase } from "playwright-qase-reporter";

test.describe("Test Scenarios for Prime Templates Page", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let primeTemplates: any;

  test.beforeAll(async () => {
    test.setTimeout(100000);
    browser = await chromium.launch();
    context = await browser.newContext();
    page = await context.newPage();
    primeTemplates = new PrimeTemplates(page);
    await login(page);
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  });

  test(qase(730, "Verify the prime mode is active "), async () => {
    await primeTemplates.verifyPrimeMode();
  });

  test(qase(731, "Verify the prime template from list (Phase)"), async () => {
    await primeTemplates.verifyPrimeTemplateFromList();
  });
});
