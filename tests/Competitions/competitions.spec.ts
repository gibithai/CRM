import { test } from "@playwright/test";
import { Page, Browser, BrowserContext, chromium } from "@playwright/test";
import Competitions from "../../pages/Competitions/competitionsPO";
import { login, getTag } from "../../utils/common";

const competitionTitle = getTag("qa_competition");
const updatedCompetitionTitle = getTag("qa_competition_updated");

const formatDate = (date: Date) => date.toISOString().split("T")[0];

const startsAt = formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // +7 days
const endsAt = formatDate(new Date(Date.now() + 37 * 24 * 60 * 60 * 1000)); // +37 days

test.describe("Competitions Page Tests", () => {
  test.setTimeout(100000);
  let page: Page;
  let context: BrowserContext;
  let browser: Browser;
  let competitions: Competitions;

  test.beforeAll(async () => {
    browser = await chromium.launch();
    context = await browser.newContext();
    page = await context.newPage();
    competitions = new Competitions(page);
    await login(page);
  });

  test.afterAll(async () => {
    await context.close();
    await browser.close();
  });

  test("Verify the list of competitions", async () => {
    await competitions.verifyCompetitionsList();
  });

  test("Verify all table columns on the page", async () => {
    await competitions.verifyCompetitionsPageVisibility();
  });

  test("Create a new competition and verify it appears in the list", async () => {
    await competitions.createCompetition(competitionTitle, "Community", "100K Two Step Prime", "MatchTrader", startsAt, endsAt);
    await competitions.verifyCreatedCompetition(competitionTitle);
  });

  test("Edit the created competition and verify the updated title", async () => {
    await competitions.editCompetition(competitionTitle, updatedCompetitionTitle);
    await competitions.verifyUpdatedCompetition(updatedCompetitionTitle);
  });

  test("Delete the competition and verify it's removed from the list", async () => {
    await competitions.deleteCompetition(updatedCompetitionTitle);
  });
});
