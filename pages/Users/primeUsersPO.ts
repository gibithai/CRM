import { expect, Page } from "@playwright/test";
import { pause } from "../../utils/common";

const userEmail = "erkan@fundingpips.com";

class PrimeUsers {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ==================== Helper Functions ===================== //

  async navigateToUsersPage() {
    await this.getUsersTab().click();
    await expect(this.getUsersLabel()).toBeVisible();
  }

  // ===================== Locators ===================== //

  getUsersTab() {
    return this.page.locator("a", { hasText: "Users" });
  }

  getUsersLabel() {
    return this.page.locator("h2", { hasText: "Users" });
  }

  getUsersList() {
    return this.page.locator("tbody tr");
  }

  getPrimeToggle() {
    return this.page.locator("button", { hasText: "Prime" });
  }

  getPrimeStatusLabel() {
    return this.page.locator('div[role="status"]', { hasText: "Prime accounts" });
  }

  getEmailInputField() {
    return this.page.locator('input[name="email"]');
  }

  getFilterResultButton() {
    return this.page.locator('[type="submit"]');
  }

  getViewDetailsActionButton() {
    return this.page.locator("button:has(.lucide-chevron-right)");
  }

  getAccountTypeFilter() {
    return this.page.locator('.space-y-2 [type="button"]');
  }
  // ===================== Actions ===================== //

  async verifyPrimeMode() {
    await this.navigateToUsersPage();
    await this.getPrimeToggle().click();
    await expect(this.getPrimeStatusLabel()).toBeVisible();
  }

  async primeUserChallenges() {
    await this.navigateToUsersPage();
    await this.getEmailInputField().fill(userEmail);
    await this.getFilterResultButton().click();
    await pause(this.page);

    await this.getViewDetailsActionButton().first().click({ force: true });
    await pause(this.page);
    await this.page.locator("button span", { hasText: "Filter" }).click();

    const phaseDropdown = this.page.locator('label:has-text("Phase (locked to Prime)")').locator("..").getByRole("button", { name: "Prime" });
    const accountTypeDropdown = this.page.locator('label:has-text("Account Type")').locator("..").getByRole("button", { name: "Prime" });

    await expect(phaseDropdown).toBeDisabled();
    await expect(phaseDropdown).toContainText("Prime");
    await expect(accountTypeDropdown).toBeDisabled();
    await expect(accountTypeDropdown).toContainText("Prime");

    await this.getFilterResultButton().click();
    await pause(this.page);
    const cards = this.page.locator('[data-slot="card"]').filter({ has: this.page.locator("tbody tr td") });
    const cardCount = await cards.count();

    if (cardCount > 0) {
      await cards.first().waitFor({ state: "visible" });
      for (let i = 0; i < cardCount; i++) {
        let foundPrimeAccount = false;
        const rows = cards.nth(i).locator("tbody tr");
        const rowCount = await rows.count();
        for (let j = 0; j < rowCount; j++) {
          const row = rows.nth(j);
          const type = (await row.locator("td").nth(2).textContent())?.trim().toLowerCase();
          const phase = (await row.locator("td").nth(4).textContent())?.trim().toLowerCase();
          if (type === "prime account" && phase === "prime") {
            foundPrimeAccount = true;
            break;
          }
        }
        expect(foundPrimeAccount, `Card ${i + 1} does not contain a prime_account/prime row`).toBe(true);
      }
    } else {
      await expect(this.page.getByText("No data found")).toBeVisible();
    }
  }
}
export default PrimeUsers;
