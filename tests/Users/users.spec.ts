import { test, Page, expect, Browser, BrowserContext, chromium } from "@playwright/test";
import Users from "../../pages/Users/usersPO";
import { login } from "../../utils/common";
import { qase } from "playwright-qase-reporter";

test.describe("Test Scenarios for Users Page", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let usersPage: Users;

  test.beforeAll(async () => {
    test.setTimeout(100000);
    browser = await chromium.launch();
    context = await browser.newContext();
    page = await context.newPage();
    usersPage = new Users(page);
    await login(page);
    await page.goto("/");
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  });

  test(qase(262, "Verify Users Page"), async () => {
    await usersPage.openUsersTab();
    await usersPage.verifyUsersPageVisibility();
  });

  test(qase(265, "Show user details"), async () => {
    await usersPage.openUsersTab();
    await usersPage.openUserDetails();
    await usersPage.clickShowIfPresent();
    await usersPage.returnToUsersPage();
  });

  test(qase(271, "Payment Details flow"), async () => {
    await usersPage.openUsersTab();
    await usersPage.openUserDetails();
    await usersPage.openPaymentDetails();
    await usersPage.returnToUsersPage();
  });

  test(qase(290, "Users table sorting"), async () => {
    await usersPage.openUsersTab();
    await usersPage.verifySortBy();
  });

  test(qase(263, "Edit User: edit first user dynamically"), async () => {
    await usersPage.openUsersTab();
    await usersPage.openBackEditAndUpdateLastNameFirstUser();
  });

  test(qase(266, "User Details - Challenges tab"), async () => {
    await page.goto("/users/7");
    await usersPage.openChallengesTab();
  });

  test(qase(291, "User Details - IP Activity Log tab"), async () => {
    await page.goto("/users/7");
    await usersPage.openIPActivityLogTab();
  });

  test(qase(306, "User Details - Transactions tab"), async () => {
    await page.goto("/users/7");
    await usersPage.openTransactionsTab();
  });

  test(qase(315, "User Details - Email Logs tab"), async () => {
    await page.goto("/users/7");
    await usersPage.openEmailLogsTab();
  });

  test(qase(692, "User Details - Saved Methods tab"), async () => {
    await page.goto("/users/7");
    await usersPage.openSavedMethodsTab();
  });

  test(qase([301, 302, 303], "Users Notes CRUD"), async () => {
    await page.goto("/users/7");
    await expect(page).toHaveURL(/\/users\/7/, { timeout: 15000 });
    await usersPage.openNotesTabInDetails();
    await usersPage.userNotesCrudFlow();
    await usersPage.returnToUsersPage();
  });
});
