import { expect, Page } from "@playwright/test";
import { pause } from "../../utils/common";

class PrimeAccounts {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ==================== Helper Functions ===================== //

  async navigateToAccountPage() {
    await this.getAccountsTab().click();
    await expect(this.getAccountsLabel()).toBeVisible();
  }

  // ===================== Locators ===================== //

  getAccountsTab() {
    return this.page.locator("a", { hasText: "Accounts" });
  }

  getAccountsLabel() {
    return this.page.locator("h2", { hasText: "Accounts" });
  }

  getAccountList() {
    return this.page.locator("tbody tr");
  }

  getPrimeToggle() {
    return this.page.locator("button", { hasText: "Prime" });
  }

  getPrimeStatusLabel() {
    return this.page.locator('div[role="status"]', { hasText: "Prime accounts" });
  }

  // ===================== Actions ===================== //

  async verifyPrimeMode() {
    await this.navigateToAccountPage();
    await this.getPrimeToggle().click();
    await expect(this.getPrimeStatusLabel()).toBeVisible();

    const phaseDropdown = this.page.locator('label:has-text("Phase (locked to Prime)")').locator("..").getByRole("button", { name: "Prime" });
    const accountTypeDropdown = this.page.locator('label:has-text("Account Type")').locator("..").getByRole("button", { name: "Prime" });

    await expect(accountTypeDropdown).toBeDisabled();
    await expect(phaseDropdown).toBeDisabled();
    await expect(accountTypeDropdown).toContainText("Prime");
    await expect(phaseDropdown).toContainText("Prime");
  }

  async verifyPrimeAccountsList() {
    await this.navigateToAccountPage();
    await this.getPrimeStatusLabel().waitFor({ state: "visible" });
    await this.page.reload();
    await pause(this.page);
    const rows = this.page.locator("table tbody tr");
    const rowCount = await rows.count();
    const firstRowText = await rows.first().textContent();
    if (firstRowText?.includes("No data")) {
      await expect(this.getAccountList()).toContainText("No data");
    } else {
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        const phase = (await row.locator("td:nth-child(5)").textContent())?.trim();
        const accountType = (await row.locator("td:nth-child(4)").textContent())?.trim();

        expect(accountType).toBe("Prime Account");
        expect(phase).toBe("Prime");
      }
    }
  }
}
export default PrimeAccounts;
