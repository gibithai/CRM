import { test, Page, Browser, BrowserContext, chromium } from "@playwright/test";

import Deposits from "../../pages/Tradin/depositsPO";
import DepositFE from "../../pages/Tradin/depositFEPO";
import { loginTradin } from "../../utils/common";

test.describe("Test Scenarios for Deposits Page", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let deposits_Page: any;
  let depositFE_Page: any;

  test.beforeAll(async () => {
    test.setTimeout(100000);
    browser = await chromium.launch();
    context = await browser.newContext();
    page = await context.newPage();
    deposits_Page = new Deposits(page);
    depositFE_Page = new DepositFE(page);
    await loginTradin(page);
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  });

  test("Verify the list of deposits and table columns", async () => {
    await deposits_Page.verifyDepositsList();
  });

  test("Verify the search filter functionality", async () => {
    await deposits_Page.verifySearchFilter();
  });

  test("Verify the status filter functionality", async () => {
    await deposits_Page.verifyStatusFilter();
  });

  test("Verify the amount range filter functionality", async () => {
    await deposits_Page.verifyAmountRangeFilter();
  });

  test("Verify the created at date range filter functionality", async () => {
    await deposits_Page.verifyDateRangeFilter();
  });

  test("Verify the save filters functionality", async () => {
    await deposits_Page.verifySaveFilters();
  });

  test("Verify the delete saved filter functionality", async () => {
    await deposits_Page.deleteSavedFilter();
  });

  test("Verify the deposit details dialog", async () => {
    await deposits_Page.verifyDepositDetails();
  });

  test("Verify approving a deposit", async () => {
    test.setTimeout(120000);
    await depositFE_Page.createDeposit();
    await page.goto("/");
    await deposits_Page.verifyApproveDeposit();
  });

  test("Verify rejecting a deposit", async () => {
    test.setTimeout(120000);
    await depositFE_Page.createDeposit();
    await page.goto("/");
    await deposits_Page.verifyRejectDeposit();
  });
});
