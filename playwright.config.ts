import { defineConfig, devices, ReporterDescription } from "@playwright/test";
require("dotenv").config();

const enableQaseReporting = process.env.QASE === "true";

const reporters: ReporterDescription[] = [["list"], ["junit", { outputFile: "test-results/results.xml" }]];

// Add Qase reporter only when QASE=true
if (enableQaseReporting) {
  reporters.push([
    "playwright-qase-reporter",
    {
      mode: "testops",
      debug: false,
      testops: {
        project: "FP",
        runTitle: "Playwright Auto Test Run",

        uploadAttachments: true,
        api: {
          token: process.env.QASE_TOKEN,
        },
        run: {
          complete: true,
        },
      },
    },
  ]);
}

export default defineConfig({
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,

  reporter: reporters,

  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "CRM",
      testDir: "./tests",
      testIgnore: "**/Tradin/**",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1600, height: 900 },
        baseURL: "https://admin.fundingpips.dev/",
      },
    },
    {
      name: "tradin",
      testDir: "./tests/Tradin",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1600, height: 900 },
        baseURL: "https://backoffice.tradin.dev/",
      },
    },
  ],
});
