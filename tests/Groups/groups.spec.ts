import { test } from "@playwright/test";
import { Page, Browser, BrowserContext, chromium } from "@playwright/test";
import Groups from "../../pages/Groups/groupsPO";
import { login, getTag } from "../../utils/common";
import { qase } from "playwright-qase-reporter";

const groupName = getTag("qa_group");
const externalIdentifier = getTag("qa_ext_id");
const updatedGroupName = getTag("qa_group_updated");

test.describe("Groups Page Tests", () => {
  test.setTimeout(100000);
  let page: Page;
  let context: BrowserContext;
  let browser: Browser;
  let groups: Groups;

  test.beforeAll(async () => {
    browser = await chromium.launch();
    context = await browser.newContext();
    page = await context.newPage();
    groups = new Groups(page);
    await login(page);
  });

  test.afterAll(async () => {
    await context.close();
    await browser.close();
  });

  test(qase(757, "Verify the list of groups / external identifiers"), async () => {
    await groups.verifyGroupsList();
  });

  test(qase(758, "Verify the search by name filter"), async () => {
    await groups.searchGroupsByName();
  });

  test(qase(759, "Verify filtering groups by account type"), async () => {
    await groups.filterByAccountType("Competition");
  });

  test(qase([760, 761, 762, 763], "Verify filtering groups by combined filters (Platform, Phase, Currency)"), async () => {
    await groups.filterByCombinedFilters("MetaTrader 5", "Master", "USD");
  });

  test(qase([764, 767], "Verify filtering groups by account size (Min=5000, Max=50000)"), async () => {
    await groups.filterByAccountSize("5000", "50000");
  });

  test(qase(765, "Verify filtering groups by swap free (Yes)"), async () => {
    await groups.filterBySwapFree("Yes");
  });

  test(qase(766, "Verify filtering groups by close only (No)"), async () => {
    await groups.filterByCloseOnly("No");
  });

  test(qase([782, 783], "Create a new group and verify it appears in the list"), async () => {
    await groups.createGroup(groupName, externalIdentifier, "MetaTrader 5", "Test", "Phase 1", "USD", "100");
    await groups.verifyCreatedGroup(groupName);
  });

  test(qase([784, 785], "Edit the created group and verify the updated group name"), async () => {
    await groups.editGroup(groupName, updatedGroupName);
    await groups.verifyUpdatedGroup(updatedGroupName);
  });

  test(qase([768, 770], "Verify saving a filter"), async () => {
    await groups.verifySaveFilters();
  });

  test(qase(769, "Verify deleting a saved filter"), async () => {
    await groups.deleteSavedFilter();
  });
});
