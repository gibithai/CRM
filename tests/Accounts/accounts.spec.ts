import { test } from "@playwright/test";
import { qase } from "playwright-qase-reporter";

import { Page, Browser, BrowserContext, chromium } from "@playwright/test";

import Accounts from "../../pages/Accounts/accountsPO";
import { login } from "../../utils/common";

test.describe("Test Scenarios for Accounts Page", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let account_Page: any;

  test.beforeAll(async () => {
    test.setTimeout(100000);
    browser = await chromium.launch();
    context = await browser.newContext();
    page = await context.newPage();
    account_Page = new Accounts(page);
    await login(page);
    await page.goto("/");
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  });

  test(qase(224, "Verify the list of accounts"), async () => {
    await account_Page.verifyAccountsList();
  });

  test(qase(245, "Verify the search filter functionality"), async () => {
    await account_Page.verifySearchFilter();
  });

  test(qase(246, "Verify the account type filter functionality"), async () => {
    await account_Page.verifyAccountTypeFilter();
  });

  test(qase([247, 248, 249, 250, 251, 252, 253], "Verify the combined filters functionality"), async () => {
    await account_Page.verifyCombinedFilters();
  });

  test(qase(254, "Verify the save filters functionality"), async () => {
    await account_Page.verifySaveFilters();
  });

  test(qase(255, "Verify the delete saved filter functionality"), async () => {
    await account_Page.deleteSavedFilter();
  });
});
