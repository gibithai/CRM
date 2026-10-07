import { test, Page, Browser, BrowserContext, chromium } from "@playwright/test";
import EmailTemplates from "../../pages/EmailTemplates/emailtemplatesPO";
import { login } from "../../utils/common";
import { qase } from "playwright-qase-reporter";

const generateRandomName = (prefix: string) => `${prefix}-${Date.now()}`;

test.describe("Test Scenarios for Email Templates Page", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let EmailTemplatesPage: EmailTemplates;

  const createdTitle = generateRandomName("KostyaTitle");
  const subject = generateRandomName("KostyaSubject");
  const editedTitle = generateRandomName("KostyaEditedTitle");

  test.beforeAll(async () => {
    test.setTimeout(100000);

    browser = await chromium.launch();
    context = await browser.newContext();
    page = await context.newPage();

    EmailTemplatesPage = new EmailTemplates(page);

    await login(page);
    await page.goto("/");
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  });

  test(qase(398, "Verify All table columns on the page"), async () => {
    await EmailTemplatesPage.verifyEmailPageVisibility();
  });

  test(qase([397, 396], "Verify Search and Reset Template"), async () => {
    await EmailTemplatesPage.verifySearchTemplate();
  });

  test(qase(587, "Verify Sorting on the Page"), async () => {
    await EmailTemplatesPage.verifySorting();
  });

  test(qase(393, "Verify Creation of Template"), async () => {
    await EmailTemplatesPage.createTemplate(createdTitle, subject);
  });

  test(qase([394, 395], "Verify Edit and Delete the Template"), async () => {
    await EmailTemplatesPage.verifyEditAndDeleteFlow(createdTitle, subject, editedTitle);
  });
});
