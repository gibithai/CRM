import { expect, Locator, Page } from "@playwright/test";
import { pause } from "../../utils/common";

class Competitions {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ==================== Helper Functions ===================== //

  async navigateToCompetitionsPage() {
    if (
      await this.getCompetitionsLabel()
        .isVisible()
        .catch(() => false)
    ) {
      return;
    }

    await this.page.locator('[aria-label="More pages"]').click();
    await this.getCompetitionsTab().click();
    await expect(this.getCompetitionsLabel()).toBeVisible();
  }

  async selectDropdownOption(triggerButton: Locator, option: string) {
    await triggerButton.click();

    const searchInput = this.page.getByPlaceholder("Search...");
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(option);
    }

    const matchingOption = this.page.getByRole("option", { name: option, exact: true }).first();
    await matchingOption.waitFor({ state: "visible" });
    await matchingOption.click();
  }

  async pickDate(triggerButton: Locator, isoDate: string) {
    await triggerButton.click();

    const targetDate = new Date(`${isoDate}T00:00:00`);
    const dataDay = `${targetDate.getMonth() + 1}/${targetDate.getDate()}/${targetDate.getFullYear()}`;

    let dayButton = this.page.locator(`button[data-day="${dataDay}"]`);

    // The calendar shows only 2 months at a time - if the target month isn't
    // visible yet, keep clicking "next month" until it is.
    for (let i = 0; i < 12 && !(await dayButton.isVisible().catch(() => false)); i++) {
      await this.page.getByRole("button", { name: /next month/i }).click();
      dayButton = this.page.locator(`button[data-day="${dataDay}"]`);
    }

    await dayButton.waitFor({ state: "visible" });
    await dayButton.click();

    await this.page.mouse.click(0, 0);
  }

  // ===================== Locators ===================== //

  getCompetitionsTab() {
    return this.page.locator("a", { hasText: "Competitions" });
  }

  getCompetitionsLabel() {
    return this.page.locator("h2", { hasText: "Competitions" });
  }

  getCompetitionsList() {
    return this.page.locator("tbody tr");
  }

  getCreateCompetitionButton() {
    return this.page.locator("button span", { hasText: "Create Competition" });
  }

  getCompetitionTitleInput() {
    return this.page.locator('input[name="title"]');
  }

  getCompetitionTypeDropdown() {
    return this.page.locator('[role="dialog"]').first().getByRole("marquee").nth(0);
  }

  getCompetitionTemplateDropdown() {
    return this.page.locator('[role="dialog"]').first().getByRole("marquee").nth(1);
  }

  getCompetitionPlatformDropdown() {
    return this.page.locator('[role="dialog"]').first().getByRole("marquee").nth(2);
  }

  getStartsAtButton() {
    return this.page.locator('[role="dialog"]').first().locator("button", { hasText: "Select date" }).first();
  }

  getEndsAtButton() {
    return this.page.locator('[role="dialog"]').first().locator("button", { hasText: "Select date" }).last();
  }

  getCreateCompetitionSubmitButton() {
    return this.page.locator('[role="dialog"]').first().locator("button", { hasText: "Create Competition" });
  }

  getUpdateCompetitionSubmitButton() {
    return this.page.locator('[role="dialog"]').first().locator("button", { hasText: "Update Competition" });
  }

  getSuccessNotification() {
    return this.page.locator("[aria-label='Notifications alt+T']");
  }

  getSuccessNotificationCloseButton() {
    return this.page.locator('[aria-label="Close toast"]');
  }

  getRowByTitle(title: string) {
    return this.page.locator("tbody tr", { has: this.page.locator("td:nth-child(1)", { hasText: title }) }).first();
  }

  getEditCompetitionButton(title: string) {
    return this.getRowByTitle(title).locator("td:last-child button").nth(0);
  }

  getDeleteCompetitionButton(title: string) {
    return this.getRowByTitle(title).locator("td:last-child button").nth(1);
  }

  getConfirmDeleteButton() {
    return this.page.getByRole("dialog").getByRole("button", { name: "Confirm" });
  }

  getTitleColumnHeader() {
    return this.page.locator("th", { hasText: "Title" });
  }

  getStartsAtColumnHeader() {
    return this.page.locator("th", { hasText: "Starts At" });
  }

  // ===================== Actions ===================== //

  async verifyCompetitionsList() {
    await this.navigateToCompetitionsPage();
    await this.page.locator("th", { hasText: "Title" }).waitFor({ state: "visible" });
    const rows = this.page.locator("table tbody tr");
    const rowCount = await rows.count();

    if (rowCount > 0) {
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        const title = row.locator("td:nth-child(1)");
        const status = row.locator("td:nth-child(2)");
        await title.waitFor({ state: "visible" });
        expect(await title.textContent()).not.toBe("");
        expect(await status.textContent()).not.toBe("");
      }
    } else {
      await expect(this.getCompetitionsList()).toContainText("No data");
    }
  }

  async verifyCompetitionsPageVisibility() {
    await this.navigateToCompetitionsPage();

    await expect(this.getCompetitionsLabel()).toBeVisible();
    await expect(this.page.locator("th", { hasText: "Title" })).toBeVisible();
    await expect(this.page.locator("th", { hasText: "Status" })).toBeVisible();
    await expect(this.page.locator("th", { hasText: "Type" })).toBeVisible();
    await expect(this.page.locator("th", { hasText: "Platform" })).toBeVisible();
    await expect(this.page.locator("th", { hasText: "Starts At" })).toBeVisible();
    await expect(this.page.locator("th", { hasText: "Ends At" })).toBeVisible();
    await expect(this.page.locator("th", { hasText: "Max Participants" })).toBeVisible();
    await expect(this.page.locator("th", { hasText: "Published" })).toBeVisible();
    await expect(this.page.locator("th", { hasText: "Rewards Allowed" })).toBeVisible();
    await expect(this.page.locator("th", { hasText: "Actions" })).toBeVisible();
  }

  async createCompetition(title: string, type: string, template: string, platform: string, startsAt: string, endsAt: string) {
    await this.navigateToCompetitionsPage();
    await pause(this.page, 500);

    await this.getCreateCompetitionButton().click();
    await this.page.locator('h2:has-text("New Competition")').waitFor({ state: "visible" });

    await this.getCompetitionTitleInput().fill(title);

    await this.selectDropdownOption(this.getCompetitionTypeDropdown(), type);
    await pause(this.page, 200);

    await this.selectDropdownOption(this.getCompetitionTemplateDropdown(), template);
    await pause(this.page, 200);

    await this.selectDropdownOption(this.getCompetitionPlatformDropdown(), platform);
    await pause(this.page, 200);

    await this.pickDate(this.getStartsAtButton(), startsAt);
    await this.pickDate(this.getEndsAtButton(), endsAt);

    await expect(this.getCreateCompetitionSubmitButton()).toBeEnabled({ timeout: 10000 });
    await pause(this.page, 300);
    await this.getCreateCompetitionSubmitButton().click();

    await expect(this.getSuccessNotification()).toHaveText("Competition created successfully", { timeout: 15000 });
    await this.getSuccessNotificationCloseButton().click();
  }

  async verifyCreatedCompetition(title: string) {
    await this.navigateToCompetitionsPage();
    await pause(this.page);
    await expect(this.page.locator("tbody td:nth-child(1)", { hasText: title }).first()).toBeVisible();
  }

  async editCompetition(title: string, newTitle: string) {
    await this.navigateToCompetitionsPage();
    await pause(this.page);
    await this.getEditCompetitionButton(title).click();
    await pause(this.page);
    await this.page.locator('h2:has-text("Edit Competition")').waitFor({ state: "visible" });
    await this.getCompetitionTitleInput().click({ clickCount: 3 });
    await this.getCompetitionTitleInput().fill(newTitle);
    await expect(this.getUpdateCompetitionSubmitButton()).toBeEnabled();
    await this.getUpdateCompetitionSubmitButton().click();
    await expect(this.getSuccessNotification()).toHaveText("Competition updated successfully");
    await this.getSuccessNotificationCloseButton().click();
  }

  async verifyUpdatedCompetition(newTitle: string) {
    await this.navigateToCompetitionsPage();
    await pause(this.page);
    await expect(this.page.locator("tbody td:nth-child(1)", { hasText: newTitle }).first()).toBeVisible();
  }

  async deleteCompetition(title: string) {
    await this.navigateToCompetitionsPage();
    await pause(this.page);
    await this.getDeleteCompetitionButton(title).click();
    await this.getConfirmDeleteButton().click();
    await expect(this.getSuccessNotification()).toHaveText("Competition deleted successfully");
    await this.getSuccessNotificationCloseButton().click();

    await this.page.reload();
    await expect(this.page.locator("tbody tr", { hasText: title })).toHaveCount(0, { timeout: 15000 });
  }
}

export default Competitions;
