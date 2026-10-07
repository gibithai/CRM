# 🧪 Automation Testing

![Playwright](https://img.shields.io/badge/Framework-Playwright-green)
![K6](https://img.shields.io/badge/Load%20Testing-K6-purple)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)

This repository contains **Playwright automation scripts and configurations** for the **FundingPips** project. The tests are written using **TypeScript/JavaScript**.

It also includes **K6 WebSocket load tests** for the Admin CRM.

---

## 📑 Table of Contents

1. [Introduction](#introduction)
2. [Technologies Used](#technologies-used)
3. [Setup Instructions](#setup-instructions)
4. [Running Playwright Tests](#running-playwright-tests)
5. [Running K6 Load Tests](#running-k6-load-tests)
6. [QASE Integration](#qase-integration)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Directory Structure](#directory-structure)
9. [Best Practices](#notes-for-the-team)
10. [Support](#support)

---

## Introduction

This repository is contains to **UI automation using Playwright** for the FundingPips project.

It also contains **WebSocket load testing using K6**.

K6 tests simulate real admin behaviour and stress-test WebSocket channels (ActionCable).

---

## Technologies Used

- **TypeScript / JavaScript** – Test scripting language
- **Playwright** – E2E testing framework
- **Playwright Test Runner** – Built-in test runner
- **Node.js 24** – Runtime environment
- **dotenv** – For managing environment variables
- **GitHub Actions** – CI/CD automation
- **QASE** - For Test Reporting
- **K6 (WebSocket load testing)**

---

## Setup Instructions

1. **Clone the repository**:

```bash
git clone https://github.com/fundingpips/e2e-crm-testing.git
cd e2e-crm-testing
```

2. **Install dependencies**:

```bash
npm install
npx playwright install --with-deps
```

3. **Configure environment variables**:

   1. Duplicate .env.example and rename to .env:
   2. Add your Credentials in the file.

```
    EMAIL=
    PASSWORD=
    QASE_TOKEN=
```

---

## Running Playwright Tests

**UI mode**

```bash
npx playwright test --ui
```

**Headless**

```bash
npx playwright test
```

**Headed**

```bash
npx playwright test --headed
```

**Debug**

```bash
npx playwright test --debug
```

**Run a specific file:**

You can also run specific tests or test suites by specifying the test file or directory:

```bash
npx playwright test tests/path/to/file.spec.ts
```

---

## Running K6 Load Tests

K6 tests live in the **`k6/`** folder.

---

## 1️⃣ Install K6 (required!)

### Windows:

Download from  
https://k6.io/docs/get-started/installation/

### macOS:

```bash
brew install k6
```

### Linux:

```bash
sudo apt install k6
```

---

## 2️⃣ Generate the authenticated session cookie

Run:

```bash
node ./k6/login_and_save_cookie.js
```

After successful login, this script creates:

```
./k6/k6_cookie.txt
```

---

## 3️⃣ Export COOKIE to environment

⚠️ **Different commands for Windows vs macOS/Linux**

### ✅ Windows PowerShell:

```powershell
$env:COOKIE = Get-Content .\k6\k6_cookie.txt
```

### ✅ macOS / Linux (bash/zsh):

```bash
export COOKIE=$(cat ./k6/k6_cookie.txt)
```

---

## 4️⃣ Run the WebSocket load test

```bash
k6 run ./k6/ws_payouts_load.js
```

---

## QASE Integration

This project is integrated with **QASE** for test reporting. By default, QASE reporting is **disabled** to avoid cluttering the test runs. Additionally, when a test run completes, Qase dispatches a notification to Slack.

### Enabling QASE Reporting

To run tests with QASE reporting enabled, you must set the `QASE` environment variable to `true`.

You can use the dedicated script:

```bash
npm run test:qase
```

Or run it manually:

```bash
QASE=true npx playwright test
```

> **Note:** Ensure you have `QASE_TOKEN` set in your `.env` file.

### Disabling QASE Reporting

Standard Playwright commands **do not** generate QASE reports by default.

Running the following command will **NOT** send results to QASE:

```bash
npx playwright test
```

---

## CI/CD Pipeline

This project uses **GitHub Actions** for automated testing with the following features:

### Workflow Triggers

- **Push Events**: Tests run automatically on every push to the `main` branch
- **Scheduled Runs**: Daily automated test execution at 6:00 AM UTC
- **Manual Trigger**: Can be manually triggered via GitHub Actions UI

### Required GitHub Secrets

To run the pipeline, configure the following secrets in your repository:

- `PLAYWRIGHT_CRM_TEST_ENV` – Environment variables for test execution
- `SLACK_WEBHOOK_URL` – Webhook URL for Slack notifications

## Directory Structure

```
e2e-crm-testing/
├── tests/
├── pages/
├── utils/
├── k6/
│   ├── login_and_save_cookie.js
│   ├── ws_payouts_load.js
│   ├── k6_cookie.txt (auto-generated)
│   └── payouts_list.json (optional test data)
├── playwright-report/
├── test-results/
├── playwright.config.ts
├── .env
├── package.json
└── README.md
```

---

# Notes for the Team

- All K6 test comments are in English
- Load test simulates real admin behaviour
- p95 latency on QA: **~100ms at 10 users, ~480ms at 100 users**
- No unauthorized disconnects under load
- WebSocket behaviour is stable: **1 request = 1 response**

---

## Support

For help, contact the QA or Automation team.
