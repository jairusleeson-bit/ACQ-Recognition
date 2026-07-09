# ACQ Recognition Dashboard

Peer-to-peer employee recognition for Acquisition.com. Give a shoutout to a teammate
for one of the company values, watch a live leaderboard, and see how recognition breaks
down by department. Every submission is captured to a Google Sheet.

## What's in here

| File | Purpose |
|------|---------|
| `index.html` | The entire dashboard — self-contained HTML/CSS/JS, no build step |
| `apps-script.gs` | Google Apps Script that appends form submissions to the Sheet |
| `.nojekyll` | Tells GitHub Pages to serve the files as-is (no Jekyll processing) |

## How it works

A static single-page app (host it on GitHub Pages or any static host).

- **Writes** — the "Give Recognition" form POSTs each shoutout to a Google Apps Script
  web app (`apps-script.gs`), which appends a row to the Sheet.
- **Reads** — the leaderboard, feed, and insights read the Sheet through its
  *Publish to web → CSV* feed. If that feed can't be reached, the dashboard falls back
  to built-in sample data so it never looks broken.

## What it tracks

- **Values:** Sincere Candor · Competitive Greatness · Unimpeachable Character
- **Departments:** Media · People · Finance · Tech · Advisory · Sales
- **Tokens per recognition:** 5 / 10 / 15

## Setup

1. **Google Sheet** — one tab with this header row:
   `First Name | Last name | Sender_email | Recipient_email | Value | Note | Tokens | Department`
2. **Apps Script (writes)** — in the Sheet: *Extensions → Apps Script*, paste
   `apps-script.gs`, set `SHEET_ID` to your spreadsheet id, Save.
   *Deploy → New deployment → Web app* (Execute as: **Me**, Who has access: **Anyone**).
   Copy the `/exec` URL.
3. **Publish CSV (reads)** — *File → Share → Publish to web → (the tab) → CSV → Publish.*
   Copy the link.
4. **Wire it up** — near the top of the `<script>` in `index.html`, set:
   - `SHEETS_WEBAPP_URL` → the Apps Script `/exec` URL
   - `SHEET_CSV_URL` → the published CSV link
5. **Host** — enable GitHub Pages (*Deploy from a branch → `/root`*). The dashboard
   serves at the Pages URL.

## Config (top of the `<script>` in `index.html`)

- `SHEETS_WEBAPP_URL` — Apps Script `/exec` URL for writes. Empty = local demo (nothing is saved).
- `SHEET_CSV_URL` — published CSV link for reads. Empty = falls back to the Apps Script `doGet`, then to sample data.

## Notes

- Live data works on the **hosted site**, not a sandboxed preview — reads/writes need real network access to Google.
- Recognition data is as private as the Sheet's *Publish to web* setting: the CSV feed is
  readable by anyone who has the link.
- Rows submitted before the `Department` column existed will show as **Unassigned**.
