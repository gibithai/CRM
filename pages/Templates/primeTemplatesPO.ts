import { expect, Page } from "@playwright/test";
import { pause } from "../../utils/common";

class PrimeTemplates {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ==================== Helper Functions ===================== //

  async navigateToTemplatePage() {
    await this.getTemplatesTab().nth(1).click();
    await expect(this.getTemplatesLabel()).toBeVisible();
  }

  // ===================== Locators ===================== //

  getTemplatesTab() {
    return this.page.locator("a", { hasText: "Templates" });
  }

  getTemplatesLabel() {
    return this.page.locator("h2", { hasText: "Templates" });
  }

  getPrimeToggle() {
    return this.page.locator("button", { hasText: "Prime" });
  }

  getPrimeTemplatesList() {
    return this.page.locator("tbody tr");
  }

  // ===================== Actions ===================== //

  async verifyPrimeMode() {
    await this.navigateToTemplatePage();
    await this.getPrimeToggle().click();
    const accountTypeDropdown = this.page
      .locator('label:has-text("Account Type (locked to Prime)")')
      .locator("..")
      .getByRole("button", { name: "Prime" });
    await expect(accountTypeDropdown).toBeDisabled();
    await expect(accountTypeDropdown).toContainText("Prime");
  }

  async verifyPrimeTemplateFromList() {
    await this.navigateToTemplatePage();
    await this.page.reload();
    await pause(this.page);
    const rows = this.page.locator("table tbody tr");
    const rowCount = await rows.count();
    const firstRowText = await rows.first().textContent();
    if (firstRowText?.includes("No data")) {
      await expect(this.getPrimeTemplatesList()).toContainText("No data");
    } else {
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        const phase = (await row.locator("td:nth-child(3)").textContent())?.trim();
        expect(phase).toBe("Prime");
      }
    }
  }
}
export default PrimeTemplates;
