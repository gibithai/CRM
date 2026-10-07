import { test, Page, Browser, BrowserContext, chromium } from "@playwright/test";
import WithdrawalsFilters from "../../pages/Tradin/Withdrawals/withdrawalsFiltersPO";
import { loginTradin } from "../../utils/common";
import { qase } from "playwright-qase-reporter";

test.describe("Withdrawals Filters", () => {
  test.describe.configure({ mode: "serial" });
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let filtersPage: WithdrawalsFilters;

  test.beforeAll(async () => {
    test.setTimeout(100000);
    browser = await chromium.launch();
    context = await browser.newContext();
    page = await context.newPage();
    filtersPage = new WithdrawalsFilters(page);
    await loginTradin(page);
    await page.goto("/");
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  });

  test(qase(4, "Verify Search by user filter"), async () => {
    await filtersPage.verifySearchByUserFilter("Josh");
  });

  test(qase(5, "Verify Status filter"), async () => {
    await filtersPage.verifyStatusFilter("Processed");
  });

  test(qase(6, "Verify Status filter search"), async () => {
    await filtersPage.verifyStatusFilterSearch("Proc", "Processed");
  });

  test(qase(7, "Verify Filter results button"), async () => {
    await filtersPage.verifyFilterResultsButton("Manuel P");
  });

  test(qase(8, "Verify Clear Filters"), async () => {
    await filtersPage.verifyClearFilters("Andrii T");
  });

  test(qase(9, "Verify Save filters"), async () => {
    await filtersPage.verifySaveFilters("Chitresh", "QA_Withdrawals_Filter");
    await filtersPage.deleteSavedFilter();
  });

  test(qase(21, "Verify Combined Filters"), async () => {
    await filtersPage.verifyCombinedFilters("Josh", "Processed");
  });

  test(qase(22, "Verify Amount Range"), async () => {
    await filtersPage.verifyAmountRangeFilter("10", "500");
  });

  test(qase(23, "Verify Date Range"), async () => {
    await filtersPage.verifyDateRangeFilter();
  });
});
