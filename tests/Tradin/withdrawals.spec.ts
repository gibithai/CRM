import { test, Page, Browser, BrowserContext, chromium } from "@playwright/test";
import Withdrawals from "../../pages/Tradin/Withdrawals/withdrawalsPO";
import { loginTradin } from "../../utils/common";
import { qase } from "playwright-qase-reporter";

test.describe("Withdrawals Page", () => {
  test.describe.configure({ mode: "serial" });
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let withdrawalsPage: Withdrawals;

  test.beforeAll(async () => {
    test.setTimeout(100000);
    browser = await chromium.launch();
    context = await browser.newContext();
    page = await context.newPage();
    withdrawalsPage = new Withdrawals(page);
    await loginTradin(page);
    await page.goto("/");
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  });

  test(qase(1, "Verify Index page"), async () => {
    await withdrawalsPage.verifyPageVisibility();
  });

  test(qase(2, "Verify Sorting"), async () => {
    await withdrawalsPage.verifyAmountSorting();
    await withdrawalsPage.verifyCreatedSorting();
  });

  test(qase(3, "Verify Statuses correctness"), async () => {
    await withdrawalsPage.verifyStatusesCorrectness();
  });

  test(qase(10, "Verify Hide sidebar button"), async () => {
    await withdrawalsPage.verifyHideSidebar();
  });
});
