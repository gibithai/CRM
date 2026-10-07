import { test } from "@playwright/test";
import { qase } from "playwright-qase-reporter";

import { Page, Browser, BrowserContext, chromium } from "@playwright/test";
import AccountDetails from "../../pages/Accounts/accountDetailsPO";
import { login } from "../../utils/common";

test.describe("Test Scenarios for AccountsDetails Page", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let accountDetails_Page: any;

  test.beforeAll(async () => {
    test.setTimeout(100000);
    browser = await chromium.launch();
    context = await browser.newContext();
    page = await context.newPage();
    accountDetails_Page = new AccountDetails(page);
    await login(page);
    await page.goto("/");
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  });

  test(qase(256, "Delete all the created notes"), async () => {
    await accountDetails_Page.deleteAllNotes();
  });

  test(qase([225, 226, 227], "Verify the edit account functionality"), async () => {
    await accountDetails_Page.editAccountInfo();
  });

  test(qase(228, "Verify that User can add account notes"), async () => {
    await accountDetails_Page.addAccountNotes();
  });

  test(qase(229, "Verify that User can edit account notes"), async () => {
    await accountDetails_Page.editAccountNotes();
  });

  test(qase(230, "Verify that User can delete account notes"), async () => {
    await accountDetails_Page.deleteAllNotes();
  });

  test(qase(791, "Delete all existing risk parameters"), async () => {
    await accountDetails_Page.deleteAllRiskParameters();
  });

  test(qase(792, "Verify that risk parameter attributes update when switching Risk Parameter Type"), async () => {
    await accountDetails_Page.verifyRiskParameterAttributesUpdateOnTypeChange();
  });

  test(qase([786, 787], "Verify that User can create risk parameter"), async () => {
    await accountDetails_Page.createRiskParameter();
  });

  test(qase(788, "Verify that the created risk parameter is displayed correctly"), async () => {
    await accountDetails_Page.verifyCreatedRiskParameter();
  });

  test(qase(789, "Verify that User can edit risk parameter"), async () => {
    await accountDetails_Page.editRiskParameter("EodTrailingLoss");
  });

  test(qase(790, "Verify that the edited risk parameter is displayed correctly"), async () => {
    await accountDetails_Page.verifyEditedRiskParameter();
  });

  test(qase(791, "Verify that User can delete risk parameter"), async () => {
    await accountDetails_Page.deleteRiskParameter("EodTrailingLoss");
  });

  test(qase(235, "Verify that the Open positions list"), async () => {
    await accountDetails_Page.verifyOpenPositionsList();
  });

  test(qase(801, "Verify that the open positions list can be filtered by action"), async () => {
    await accountDetails_Page.verifyOpenPositionsFilterByAction("Sell");
  });

  test(qase([802, 803, 804], "Verify the combined filters functionality for open positions"), async () => {
    await accountDetails_Page.verifyOpenPositionsCombinedFilters();
  });

  test(qase([799, 805], "Verify the save and delete saved filter functionality for open positions"), async () => {
    await accountDetails_Page.verifyOpenPositionsSaveFilters();
  });

  test(qase(800, "Verify the delete saved filter functionality for open positions"), async () => {
    await accountDetails_Page.deleteOpenPositionsSavedFilter();
  });

  test(qase(236, "Verify the Trades per IP list"), async () => {
    await accountDetails_Page.verifyTradesPerIPList();
  });

  test(qase(816, "Verify that the Trades per IP list can be filtered by IP"), async () => {
    await accountDetails_Page.verifyTradesPerIPFilterByIP();
  });

  test(qase(817, "Verify that the Trades per IP list can be filtered by VPN"), async () => {
    await accountDetails_Page.verifyTradesPerIPFilterByVPN("Yes");
  });

  test(qase(815, "Verify that the Trades per IP list can be filtered by date range"), async () => {
    await accountDetails_Page.verifyTradesPerIPFilterByDateRange();
  });
});
