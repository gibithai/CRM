import { test, Page, Browser, BrowserContext, chromium } from "@playwright/test";
import Templates from "../../pages/Templates/templatesPO";
import { login } from "../../utils/common";
import { qase } from "playwright-qase-reporter";

const gen = (p: string) => `${p}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

test.describe("Templates CRUD", () => {
  test.describe.configure({ mode: "serial" });
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let templatesPage: Templates;
  let templateName: string;
  let updatedTemplateName: string;

  test.beforeAll(async () => {
    test.setTimeout(100000);
    browser = await chromium.launch();
    context = await browser.newContext();
    page = await context.newPage();
    templatesPage = new Templates(page);
    await login(page);
    await page.goto("/");
    templateName = gen("template");
    updatedTemplateName = `${templateName}-upd`;
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  });

  test(qase(684, "Verify All table columns on the page"), async () => {
    await templatesPage.verifyPageVisibility();
  });

  test(qase([685, 688], "Template Create + Search"), async () => {
    await templatesPage.verifyTemplateCreation(templateName);
    await templatesPage.verifyTemplateSearch(templateName);
  });

  test(qase(687, "Template Edit"), async () => {
    await templatesPage.verifyTemplateEdit(templateName, updatedTemplateName);
  });

  test(qase(686, "Template Delete"), async () => {
    await templatesPage.verifyTemplateDelete(updatedTemplateName);
  });
});
