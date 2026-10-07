require("dotenv").config();
import { expect, Page, Locator } from "@playwright/test";
import fs from "fs";
const Papa = require("papaparse");
interface PlaywrightFilePayload {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

export async function login(page: Page) {
  await page.goto("/");
  await page.waitForTimeout(2000);
  await page.getByText("FP CRM").waitFor({ state: "visible" });
  await expect(page.locator("label", { hasText: "Email" })).toBeVisible();
  await expect(page.locator("label", { hasText: "Password" })).toBeVisible();

  if (!process.env.EMAIL || !process.env.PASSWORD) {
    throw new Error("EMAIL and PASSWORD must be set");
  }

  await page.fill("#email", process.env.EMAIL);
  await page.fill("#password", process.env.PASSWORD);

  await page.waitForTimeout(2000);
  await page.click('button:has-text("Login")');
  await page.locator("button", { hasText: "super_user" }).waitFor({ state: "visible" });
}

export async function loginTradin(page: Page) {
  await page.goto("/");
  await page.waitForTimeout(2000);
  await expect(page.locator("label", { hasText: "Email" })).toBeVisible();
  await expect(page.locator("label", { hasText: "Password" })).toBeVisible();

  if (!process.env.TRADIN_EMAIL || !process.env.TRADIN_PASSWORD) {
    throw new Error("TRADIN_EMAIL and TRADIN_PASSWORD must be set");
  }

  await page.fill("#email", process.env.TRADIN_EMAIL);
  await page.fill("#password", process.env.TRADIN_PASSWORD);

  await page.waitForTimeout(2000);
  await page.click('button:has-text("Login")');
  // Same CRM UI as fundingpips, but the logged-in username differs per env,
  // so wait for the login form to disappear instead of a specific username.
  await page.locator("#email").waitFor({ state: "hidden" });
}

export function getTag(prefix = "tag") {
  const letter = String.fromCharCode(97 + Math.floor(Math.random() * 26)); // a–z
  const randomNumber = Math.floor(1000 + Math.random() * 900);
  return `${prefix}-${letter}${randomNumber}`;
}

export function validateExportCSVHeaders(payoutCSV: string, expectedHeaders: string[]): void {
  const csvContent = fs.readFileSync(payoutCSV, "utf-8");

  expect(csvContent.trim().length).toBeGreaterThan(0);

  const [headerLine] = csvContent.split("\n");

  const actualHeaders = headerLine.split(",").map((header) => header.trim());

  expect(actualHeaders).toEqual(expectedHeaders);
}

export function parseCsvToObjects(filePath: string): Record<string, string>[] {
  const csvContent = fs.readFileSync(filePath, "utf-8");
  const [headerLine, ...rows] = csvContent.split("\n").filter(Boolean);

  const headers = headerLine.split(",").map((h) => h.trim());

  return rows.map((row) => {
    const values = row.split(",").map((v) => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] || "";
    });
    return obj;
  });
}

export function validateUsersFromCSV(data: Record<string, string>[], column: string, allowedValues: string[]) {
  data.forEach((row) => {
    expect(allowedValues).toContain(row[column]);
  });
}

export function deleteFileIfExists(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export async function validateTaskDatesWithinTimeline(page: Page, getSelectedTimeLine: string | null, columnNo: string) {
  if (!getSelectedTimeLine) {
    throw new Error("Selected Timeline not found");
  }
  const [startStr, endStr] = getSelectedTimeLine.trim().split(" - ");
  const startDate = new Date(startStr);
  const endDate = new Date(endStr);
  const tasksRows = await page.$$("table tbody tr");
  if (tasksRows.length > 0) {
    for (const task of tasksRows) {
      const selectedDate = await task.$(`td:nth-child(${columnNo})`);
      const selectedDateText = await selectedDate?.innerText();
      if (selectedDateText) {
        const taskDateObj = new Date(selectedDateText);
        const formattedTaskDate = taskDateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        expect(formattedTaskDate).toBeGreaterThanOrEqual(startDate.getTime());
        expect(formattedTaskDate).toBeLessThanOrEqual(endDate.getTime());
      }
    }
  } else {
    await expect(page.locator("tbody tr")).toContainText("No tasks available");
  }
}

export async function refreshUntilVisible(page: Page, locator: Locator, maxRetries = 5, waitBetweenRetriesMs = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    const isVisible = await locator.isVisible();
    if (isVisible) {
      return true;
    }

    // Wait a bit before refreshing (e.g., 3 seconds) to give the backend time
    await page.waitForTimeout(waitBetweenRetriesMs);
    await page.reload();

    // Optional: Wait for a specific element to ensure the page loaded
    await page.waitForLoadState("networkidle");
  }
  throw new Error(`Element retry button did not appear after ${maxRetries} refreshes.`);
}

export function createCsvFileFromJSON(jsonData: any, fileName: string = "upload.csv"): PlaywrightFilePayload {
  const csvString = Papa.unparse(jsonData);
  return {
    name: fileName,
    mimeType: "text/csv",
    buffer: Buffer.from(csvString, "utf-8"),
  };
}

export async function pause(page: Page, ms = 2000) {
  await page.waitForTimeout(ms);
}

export function getScheduleAt(daysFromNow = 30): { datePart: string; hours: string; minutes: string } {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return { datePart: `${year}-${month}-${day}`, hours, minutes };
}

export function getDisplayDate(daysFromNow = 30): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
