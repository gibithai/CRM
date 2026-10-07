import { expect, Page, Locator } from "@playwright/test";

export default class emailTemplates {
  private page: Page;

  private readonly EXISTING_TITLE = "Kostya";
  private readonly EXISTING_SUBJECT = "xxx";
  private readonly WRONG_TITLE = "xxx12356";
  private readonly RESET_DATA = "Kostya Reset Data";

  constructor(page: Page) {
    this.page = page;
  }

  getTableRows() {
    return this.page.locator("tbody tr");
  }

  getNoDataLabel() {
    return this.page.getByText(/no data/i);
  }

  getFirstRow() {
    return this.getTableRows().first();
  }

  getFirstRowTitleCell() {
    return this.getFirstRow().locator("td").nth(1);
  }

  getTemplateIdCells() {
    return this.page.locator("tbody tr td:nth-child(1)");
  }

  getNumericTemplateIdCells() {
    return this.getTemplateIdCells().filter({ hasText: /^\d+$/ });
  }

  getEmailTemplatesTab() {
    return this.page.getByRole("link", { name: "Email Templates" });
  }

  getEmailTemplatesHeading() {
    return this.page.getByRole("heading", { name: "Email Templates" });
  }

  getTemplateId() {
    return this.page.locator("th.py-1", { hasText: "Template ID" });
  }

  getTemplateTitle() {
    return this.page.locator("th.py-1", { hasText: "Title" });
  }

  getTemplateSubject() {
    return this.page.locator("th.py-1", { hasText: "Subject" });
  }

  getTemplateCreatedAt() {
    return this.page.locator("th.py-1", { hasText: "Created At" });
  }

  getTemplateUpdatedAt() {
    return this.page.locator("th.py-1", { hasText: "Updated At" });
  }

  getTemplateActions() {
    return this.page.locator("th.py-1", { hasText: "Actions" });
  }

  getSearchField() {
    return this.page.getByPlaceholder(/filter by email templates/i);
  }

  getSearchClearButton(): Locator {
    return this.getSearchField().locator("xpath=ancestor::div[1]").locator("button:has(svg.lucide-x)").first();
  }

  getEditButtonInRow(row: Locator): Locator {
    return row.locator("button:has(svg.lucide-pencil)").first();
  }

  getDeleteButtonInRow(row: Locator): Locator {
    return row.locator("td").last().locator("button").nth(1);
  }

  getCreateButton() {
    return this.page.getByRole("button", { name: "Create Template" });
  }

  getCreationTitle() {
    return this.page.locator("#title");
  }

  getCreationSubject() {
    return this.page.locator("#subject");
  }

  getBodyEditor() {
    return this.page.getByPlaceholder("Paste full email HTML…");
  }

  getSaveTemplateButton() {
    return this.page.getByRole("button", { name: "Save" });
  }

  getCreatedToast() {
    return this.page.getByText("Email template created successfully").first();
  }

  getDeletedToast() {
    return this.page.getByText("Email template deleted successfully").first();
  }

  getUpdatedToast() {
    return this.page.getByText("Email template updated successfully").first();
  }

  getDialogDeleteButton() {
    return this.page.getByRole("button", { name: /delete/i });
  }

  getRowsByText(text: string) {
    return this.page.locator("tbody tr", { hasText: text });
  }

  getTemplateRowByText(text: string) {
    return this.getRowsByText(text).first();
  }

  getConfirmButton() {
    return this.page.getByRole("button", { name: "Confirm" });
  }

  async waitForMinRows(min: number, timeout = 5000) {
    await expect.poll(async () => await this.getTableRows().count(), { timeout }).toBeGreaterThanOrEqual(min);
  }

  async getColumnTexts(colIndex: number, limit = 10) {
    const cells = this.page.locator(`tbody tr td:nth-child(${colIndex})`);
    const count = Math.min(await cells.count(), limit);

    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      values.push((await cells.nth(i).innerText()).trim());
    }
    return values;
  }

  async openEmailTemplates() {
    await this.getEmailTemplatesTab().click();
    await expect(this.getEmailTemplatesHeading()).toBeVisible();
  }

  async verifyEmailPageVisibility() {
    await this.openEmailTemplates();

    await expect(this.getEmailTemplatesHeading()).toBeVisible();
    await expect(this.getTemplateId()).toBeVisible();
    await expect(this.getTemplateTitle()).toBeVisible();
    await expect(this.getTemplateSubject()).toBeVisible();
    await expect(this.getTemplateCreatedAt()).toBeVisible();
    await expect(this.getTemplateUpdatedAt()).toBeVisible();
    await expect(this.getTemplateActions()).toBeVisible();
  }

  async search(text: string) {
    const input = this.getSearchField();
    await input.fill(text);
    await this.page.waitForTimeout(1500); // debounce window for auto-search + table re-render (no reliable loading indicator)
  }

  // moved up (only reorder, logic unchanged)
  async deleteEmailTemplate(title: string) {
    await this.openEmailTemplates();

    await this.search(title);

    const row = this.getTemplateRowByText(title);
    await expect(row).toHaveCount(1, { timeout: 15000 });

    const r = row.first();
    await r.scrollIntoViewIfNeeded();
    await r.hover();

    const deleteBtn = this.getDeleteButtonInRow(r);
    await expect(deleteBtn).toBeVisible({ timeout: 15000 });
    await deleteBtn.click();

    const dialog = this.page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15000 });

    const confirmBtn = dialog.getByRole("button", { name: "Confirm" });
    await expect(confirmBtn).toBeVisible({ timeout: 15000 });
    await confirmBtn.click();

    const deleteToast = this.getDeletedToast();
    await expect(deleteToast).toBeVisible({ timeout: 15000 });

    await this.page.waitForTimeout(2000);

    await this.search(title);
    await expect(this.getNoDataLabel()).toBeVisible({ timeout: 15000 });
  }

  async verifySearchTemplate() {
    await this.openEmailTemplates();

    const query = this.EXISTING_TITLE;

    await this.search(query);

    const rows = this.getTableRows();
    const count = await rows.count();

    if (count === 0) {
      throw new Error(`Zero results found for search query: ${query}`);
    }

    for (let i = 0; i < count; i++) {
      const title = (await rows.nth(i).locator("td").nth(1).innerText()).trim();
      const subject = (await rows.nth(i).locator("td").nth(2).innerText()).trim();

      const matches = title.includes(query) || subject.includes(query);

      if (!matches) {
        throw new Error(`Search mismatch. Query "${query}" not found in row.\nTitle: "${title}"\nSubject: "${subject}"`);
      }
    }

    // UPDATED: reset via clear (X) icon
    await expect(this.getSearchClearButton()).toBeVisible({ timeout: 15000 });
    await this.getSearchClearButton().click();

    await this.search(this.WRONG_TITLE);
    await expect(this.getNoDataLabel()).toBeVisible({ timeout: 15000 });
    await expect(this.getNumericTemplateIdCells()).toHaveCount(0, { timeout: 15000 });

    // UPDATED: reset via clear (X) icon
    await expect(this.getSearchClearButton()).toBeVisible({ timeout: 15000 });
    await this.getSearchClearButton().click();
  }

  async verifySorting() {
    await this.openEmailTemplates();

    await expect
      .poll(async () => await this.getTableRows().count(), {
        timeout: 15000,
      })
      .toBeGreaterThanOrEqual(2);

    await this.getTemplateId().click();
    await this.waitForMinRows(2);

    const idAsc = await this.getColumnTexts(1, 10);

    await this.getTemplateId().click();
    await this.waitForMinRows(2);

    const idDesc = await this.getColumnTexts(1, 10);

    expect(idAsc.length).toBeGreaterThanOrEqual(2);
    expect(idDesc.length).toBeGreaterThanOrEqual(2);
    expect(idDesc).not.toEqual(idAsc);

    await this.getTemplateCreatedAt().click();
    await this.waitForMinRows(2);

    const createdAsc = await this.getColumnTexts(4, 10);

    await this.getTemplateCreatedAt().click();
    await this.waitForMinRows(2);

    const createdDesc = await this.getColumnTexts(4, 10);

    expect(createdAsc.length).toBeGreaterThanOrEqual(2);
    expect(createdDesc.length).toBeGreaterThanOrEqual(2);
    expect(createdDesc).not.toEqual(createdAsc);
  }

  async createTemplate(title: string, subject: string, body = "Automation body text") {
    await this.openEmailTemplates();

    const createBtn = this.getCreateButton();
    await expect(createBtn).toBeVisible({ timeout: 15000 });
    await createBtn.click({ trial: true, timeout: 15000 });
    await createBtn.click();

    const titleInput = this.getCreationTitle();
    try {
      await expect(titleInput).toBeVisible({ timeout: 8000 });
    } catch {
      await createBtn.click();
      await expect(titleInput).toBeVisible({ timeout: 15000 });
    }

    await this.getCreationTitle().fill(title);
    await this.getCreationSubject().fill(subject);

    await this.getBodyEditor().click();
    await this.page.keyboard.type(body);
    await this.page.keyboard.press("Tab");

    await expect(this.getSaveTemplateButton()).toBeEnabled({ timeout: 15000 });
    await Promise.all([this.page.waitForLoadState("networkidle").catch(() => {}), this.getSaveTemplateButton().dispatchEvent("click")]);

    const toast = this.getCreatedToast();
    if (await toast.isVisible().catch(() => false)) {
      await toast.click().catch(() => {});
    }

    await this.search(title);
    await expect(this.getRowsByText(title).first()).toBeVisible({ timeout: 15000 });
  }

  async editEmailTemplate(oldTitle: string, newTitle: string) {
    await this.openEmailTemplates();

    await this.search(oldTitle);

    const row = this.getTemplateRowByText(oldTitle);
    await expect(row).toBeVisible({ timeout: 15000 });

    await row.hover();
    await this.getEditButtonInRow(row).click();

    await expect(this.getCreationTitle()).toBeVisible({ timeout: 15000 });

    await this.getCreationTitle().fill(newTitle);

    await expect(this.getSaveTemplateButton()).toBeEnabled({ timeout: 15000 });
    await Promise.all([this.page.waitForLoadState("networkidle").catch(() => {}), this.getSaveTemplateButton().dispatchEvent("click")]);

    const toast = this.getUpdatedToast();
    await expect(toast).toBeVisible({ timeout: 15000 });
    await toast.click().catch(() => {});

    await this.page.waitForTimeout(2000);

    await this.search(newTitle);
    await expect(this.getRowsByText(newTitle).first()).toBeVisible({ timeout: 20000 });
  }

  async verifyEditAndDeleteFlow(createdTitle: string, subject: string, editedTitle: string) {
    await this.editEmailTemplate(createdTitle, editedTitle);
    await this.deleteEmailTemplate(editedTitle);
  }
}
