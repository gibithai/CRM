import { expect, Page } from "@playwright/test";

const FE_BASE_URL = "https://qa.tradin.dev";
const TEST_CARD = {
  number: "5519283812030000",
  expiry: "12/27",
  cvv: "123",
  cardholderName: "Muhammad QA",
};

class DepositFE {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ==================== Helper Functions ===================== //

  async login() {
    if (!process.env.TRADIN_EMAIL || !process.env.TRADIN_PASSWORD) {
      throw new Error("TRADIN_EMAIL and TRADIN_PASSWORD must be set");
    }
    await this.page.goto(`${FE_BASE_URL}/login`);
    if (this.page.url().includes("/dashboard")) {
      return;
    }
    await this.getEmailField().fill(process.env.TRADIN_EMAIL);
    await this.getPasswordField().fill(process.env.TRADIN_PASSWORD);
    await this.getSignInButton().click();
    await expect(this.page).toHaveURL(`${FE_BASE_URL}/dashboard`);
  }

  async createDeposit(amount = "100") {
    await this.login();
    await this.page.goto(`${FE_BASE_URL}/deposit`);
    await this.getAmountField().fill(amount);

    await this.getDepositToField().click();
    await this.getWalletDestinationOption().click();

    await this.getVisaMastercardRadio().click();
    await this.getTermsCheckbox().click();
    await this.getContinueButton().click();

    await this.getCardNumberField().fill(TEST_CARD.number);
    await this.getExpiryDateField().fill(TEST_CARD.expiry);
    await this.getCvvField().fill(TEST_CARD.cvv);
    await this.getCardholderNameField().fill(TEST_CARD.cardholderName);
    await this.getPayNowButton().click();

    // Sandbox 3D Secure simulation step.
    await this.getPaymentGatewayFrame().getByRole("button", { name: "Submit" }).click({ timeout: 15000 });
    await expect(this.getPaymentReceivedHeading()).toBeVisible({ timeout: 15000 });
  }

  // ===================== Locators ===================== //

  getEmailField() {
    return this.page.getByRole("textbox", { name: "Email" });
  }

  getPasswordField() {
    return this.page.getByRole("textbox", { name: "Password" });
  }

  getSignInButton() {
    return this.page.getByRole("button", { name: "Sign in" });
  }

  getAmountField() {
    return this.page.getByRole("textbox", { name: "Deposit amount" });
  }

  getDepositToField() {
    return this.page.getByRole("combobox", { name: "Deposit To *" });
  }

  getWalletDestinationOption() {
    return this.page.getByRole("option", { name: "My Wallet" });
  }

  getVisaMastercardRadio() {
    return this.page.getByRole("radio", { name: "Visa / Mastercard" });
  }

  getTermsCheckbox() {
    return this.page.getByRole("checkbox", { name: "I have read and agree to the" });
  }

  getContinueButton() {
    return this.page.getByRole("button", { name: "Continue" });
  }

  getCardNumberField() {
    return this.page.frameLocator("#deposit-hf-card-number iframe").getByRole("textbox", { name: "Card number" });
  }

  getExpiryDateField() {
    return this.page.frameLocator("#deposit-hf-expiry-date iframe").getByRole("textbox", { name: "Expiry date" });
  }

  getCvvField() {
    return this.page.frameLocator("#deposit-hf-cvv iframe").getByRole("textbox", { name: "CVV" });
  }

  getCardholderNameField() {
    return this.page.frameLocator("#deposit-hf-cardholder-name iframe").getByRole("textbox", { name: "Cardholder name" });
  }

  getPayNowButton() {
    return this.page.getByRole("button", { name: "Pay now" });
  }

  getPaymentGatewayFrame() {
    return this.page.frameLocator('iframe[title="Payment gateway"]');
  }

  getPaymentReceivedHeading() {
    return this.page.getByRole("heading", { name: "Payment received" });
  }
}

export default DepositFE;
