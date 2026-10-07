import { expect, Page } from "@playwright/test";
import { pause } from "../../utils/common";

class PrimePayouts {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ==================== Helper Functions ===================== //

  async navigateToPayoutPage() {
    await this.getPayoutsTab().click();
    await expect(this.getPayoutsLabel()).toBeVisible();
  }

  // ===================== Locators ===================== //

  getPayoutsTab() {
    return this.page.locator("a", { hasText: "Payouts" });
  }

  getPayoutsLabel() {
    return this.page.locator("h2", { hasText: "History" });
  }

  getPrimeToggle() {
    return this.page.locator("button", { hasText: "Prime" });
  }

  getPrimeStatusLabel() {
    return this.page.locator('div[role="status"]', { hasText: "Prime accounts" });
  }

  getPrimePayoutList() {
    return this.page.locator("td:nth-child(5)");
  }

  getPrimeTag() {
    return this.page.getByText("Prime");
  }

  // ===================== Actions ===================== //

  async verifyPrimeMode() {
    await this.navigateToPayoutPage();
    await this.getPrimeToggle().click();
    await expect(this.getPrimeStatusLabel()).toBeVisible();
    const accountTypeDropdown = this.page
      .locator('label:has-text("Account Type (locked to Prime)")')
      .locator("..")
      .getByRole("button", { name: "Prime" });
    await expect(accountTypeDropdown).toBeDisabled();
    await expect(accountTypeDropdown).toContainText("Prime");
  }

  async verifyPrimePayoutFromList() {
    await this.navigateToPayoutPage();
    await this.page.reload();
    await pause(this.page);
    await this.getPrimePayoutList().first().click();
    await expect(this.getPrimeTag()).toBeVisible();
  }
}
export default PrimePayouts;
