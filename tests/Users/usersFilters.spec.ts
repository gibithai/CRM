import { test, Page, Browser, BrowserContext, chromium } from "@playwright/test";
import UsersFilters from "../../pages/Users/usersFiltersPO";
import { login } from "../../utils/common";
import { qase } from "playwright-qase-reporter";

test.describe("Test Scenarios for Users Filters", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let usersFiltersPage: UsersFilters;

  test.beforeAll(async () => {
    test.setTimeout(100000);

    browser = await chromium.launch();

    context = await browser.newContext();
    page = await context.newPage();

    usersFiltersPage = new UsersFilters(page);

    await login(page);
    await page.goto("/");
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  });

  test(qase(320, "Verify Search filter functionality"), async () => {
    await usersFiltersPage.verifySearchFilter();
  });

  test(qase(319, "Verify Email filter functionality"), async () => {
    await usersFiltersPage.verifyEmailFilter();
  });

  test(qase(318, "Verify KYC name"), async () => {
    await usersFiltersPage.verifyKYCname();
  });

  test(qase(321, "Verify KYC Status filter functionality"), async () => {
    await usersFiltersPage.verifyKycStatusFilter();
  });

  test(qase(322, "Verify Country filter functionality"), async () => {
    await usersFiltersPage.verifyCountryFilter();
  });

  test(qase(584, "Verify Tags filter functionality"), async () => {
    await usersFiltersPage.verifyTagsFilter();
  });

  test(qase(585, "Verify Combined filters functionality"), async () => {
    await usersFiltersPage.verifyCombinedFilters();
  });

  test(qase(325, "Verify Save filters functionality"), async () => {
    await usersFiltersPage.verifySaveFilters();
  });

  test(qase(326, "Verify Delete saved filter functionality"), async () => {
    await usersFiltersPage.deleteSavedFilter();
  });
});
