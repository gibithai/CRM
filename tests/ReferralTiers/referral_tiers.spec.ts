import { test, Page, Browser, BrowserContext, chromium } from "@playwright/test";
import ReferralTiers from "../../pages/ReferralTiers/referral_tiersPO";
import { login } from "../../utils/common";
import { qase } from "playwright-qase-reporter";

const RUN_ID = Date.now();

test.describe.serial("Referral Tiers CRUD", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let referralTiersPage: ReferralTiers;

  const baseName = `tier-${RUN_ID}`;
  const updatedName = `tier-upd-${RUN_ID}`;

  test.beforeAll(async () => {
    test.setTimeout(100000);
    browser = await chromium.launch();
    context = await browser.newContext();
    page = await context.newPage();
    referralTiersPage = new ReferralTiers(page);
    await login(page);
    await page.goto("/");
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  });

  test(qase(589, "Verify All table columns on the page"), async () => {
    await referralTiersPage.VerifyPageVisibility();
  });

  test(qase(592, "Verify Sorting"), async () => {
    await referralTiersPage.VerifySorting();
  });

  test(qase(591, "Verify Create Referral Tier"), async () => {
    await referralTiersPage.createReferralTier(baseName);
  });

  test(qase(590, "Verify Edit Referral Tier"), async () => {
    await referralTiersPage.editReferralTier(baseName, updatedName);
  });

  test(qase(593, "Verify Delete Referral Tier"), async () => {
    await referralTiersPage.deleteReferralTier(updatedName);
  });
});
