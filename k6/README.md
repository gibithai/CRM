# K6 WebSocket Load Tests for Admin::PayoutsChannel

This folder contains **WebSocket performance tests** for the `Admin::PayoutsChannel` using **k6**.  
The goal is to simulate how the CRM admin panel behaves under realistic load: many browser tabs, many payout detail views, and repeated `retrieve_resource` messages.

---

## ✅ What this test verifies

- WebSocket **connection stability** (ActionCable)
- Correct **subscription** to `Admin::PayoutsChannel`
- **Response latency** after `retrieve_resource` requests
- **No extra / duplicate updates** (one response per request)
- **Unauthorized / disconnect** behaviour
- Realistic **multi-tab admin usage** (each VU ≈ one browser tab)

---

## 📁 Files

| File | Purpose |
|------|---------|
| `login_and_save_cookie.js` | Logs into the admin panel using Playwright and saves the authenticated Rails session cookie for k6. |
| `ws_payouts_load.js` | Main k6 WebSocket load test for `Admin::PayoutsChannel`. Sends repeated `retrieve_resource` messages for multiple payout IDs. |
| `k6_cookie.txt` | Auto-generated file with the current session cookie (not committed to git). |

> **Note:** All comments inside `ws_payouts_load.js` are in English, so the whole test is readable by the team.

---

## 🔐 1. Login and generate session cookie

Before running k6, we need a valid authenticated cookie.  
This is done via a small Playwright-based Node script.

From the repo root:

```bash
node ./k6/login_and_save_cookie.js
