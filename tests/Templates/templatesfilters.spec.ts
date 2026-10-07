import { test, Page, Browser, BrowserContext, chromium } from "@playwright/test";
import TemplatesFilters from "../../pages/Templates/templatesfiltersPO";
import { login } from "../../utils/common";
import { qase } from "playwright-qase-reporter";

test.describe("Templates Filters", () => {
  test.describe.configure({ mode: "serial" });
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let filtersPage: TemplatesFilters;

  test.beforeAll(async () => {
    test.setTimeout(100000);
    browser = await chromium.launch();
    context = await browser.newContext();
    page = await context.newPage();
    filtersPage = new TemplatesFilters(page);
    await login(page);
    await page.goto("/");
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  });

  test(qase(689, "Verify Account type dropdown"), async () => {
    await filtersPage.verifyAccountTypeFilter("Competition", "competition");
  });

  test(qase(690, "Verify Account size dropdown"), async () => {
    await filtersPage.verifyAccountSizeFilter("5000");
  });

  test(qase(691, "Verify Multiple Filters Selection"), async () => {
    await filtersPage.verifyMultipleFilters("Competition", "competition", "5000");
  });
});
