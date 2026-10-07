import { test, Page, Browser, BrowserContext, chromium } from "@playwright/test";
import TransactionsFilters from "../../pages/Transactions/TransactionsFiltersPO";
import { login } from "../../utils/common";
import { qase } from "playwright-qase-reporter";

test.describe("Transactions Filters", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let transactionsPage: TransactionsFilters;

  test.beforeAll(async () => {
    test.setTimeout(100000);
    browser = await chromium.launch();
    context = await browser.newContext();
    page = await context.newPage();
    transactionsPage = new TransactionsFilters(page);
    await login(page);
    await page.goto("/");
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  });

  test("Delete all saved filters", async () => {
    await transactionsPage.deleteAllSavedFilters();
  });

  test(qase([613, 620, 621], "Verify Search filter"), async () => {
    await transactionsPage.verifySearchFilter();
  });

  test(qase(614, "Verify PSPs filter"), async () => {
    await transactionsPage.verifyPSPsFilter();
  });

  test(qase(615, "Verify Status filter"), async () => {
    await transactionsPage.verifyStatusFilter();
  });

  test(qase(616, "Verify SubType filter"), async () => {
    await transactionsPage.verifySubTypeFilter();
  });

  test(qase(617, "Verify Transaction Type filter"), async () => {
    await transactionsPage.verifyTransactionTypeFilter();
  });

  test(qase(618, "Verify Started At From"), async () => {
    await transactionsPage.verifyStartedAtFilter();
  });

  test(qase(619, "Verify Amount from To"), async () => {
    await transactionsPage.verifyAmountFilter();
  });

  test(qase(623, "Verify Combined Filters"), async () => {
    await transactionsPage.verifyMultipleFilters();
  });

  test(qase([622, 625], "Verify Save And Delete Filters"), async () => {
    const filterName = await transactionsPage.verifySaveFilters();
    await transactionsPage.VerifyDeleteSavedFilter(filterName);
  });

  test(qase(623, "Verify Hide side Bar"), async () => {
    await transactionsPage.verifyHideButton();
  });
});
