# ACQ Recognition Dashboard

Peer-to-peer employee recognition for Acquisition.com. Give a shoutout to a teammate
for one of the company values, watch a live leaderboard, and see how recognition breaks
down by department. Every submission is captured to a Google Sheet. A weekly Slack
reminder nudges the team to give recognition.

## What's in here

| File | Purpose |
|------|---------|
| `index.html` | The dashboard — self-contained HTML/CSS/JS, no build step |
| `apps-script.gs` | Google Apps Script that appends form submissions to the Sheet |
| `.nojekyll` | Tells GitHub Pages to serve the files as-is (no Jekyll processing) |
| `send.sh` | Weekly Slack sender — DMs everyone in `emails.txt` a link to the dashboard |
| `emails.txt` | Recipient list for the weekly Slack message |
| `.github/workflows/friday.yml` | Runs `send.sh` automatically every Friday |

## How the dashboard works

A static single-page app hosted on GitHub Pages.

- **Writes** — the "Give Recognition" form POSTs each shoutout to a Google Apps Script
  web app (`apps-script.gs`), which appends a row to the Sheet.
- **Reads** — the leaderboard, feed, and insights read the Sheet through its
  *Publish to web → CSV* feed, falling back to built-in sample data if unreachable.

## What it tracks

- **Values:** Sincere Candor · Competitive Greatness · Unimpeachable Character
- **Departments:** Media · People · Finance · Tech · Advisory · Sales
- **Tokens per recognition:** 5 / 10 / 15

## Dashboard setup

1. **Google Sheet** — one tab with this header row:
   `First Name | Last name | Sender_email | Recipient_email | Value | Note | Tokens | Department`
2. **Apps Script (writes)** — in the Sheet: *Extensions → Apps Script*, paste
   `apps-script.gs`, set `SHEET_ID`, Save. *Deploy → New deployment → Web app*
   (Execute as: **Me**, Who has access: **Anyone**). Copy the `/exec` URL.
3. **Publish CSV (reads)** — *File → Share → Publish to web → (the tab) → CSV → Publish.*
   Copy the link.
4. **Wire it up** — near the top of the `<script>` in `index.html`, set
   `SHEETS_WEBAPP_URL` (the `/exec` URL) and `SHEET_CSV_URL` (the published CSV link).
5. **Host** — enable GitHub Pages (*Deploy from a branch → `/root`*).

### Config (top of the `<script>` in `index.html`)

- `SHEETS_WEBAPP_URL` — Apps Script `/exec` URL for writes. Empty = local demo (nothing saved).
- `SHEET_CSV_URL` — published CSV link for reads. Empty = falls back to the Apps Script `doGet`, then to sample data.

## Weekly Slack reminder

`send.sh` DMs every address in `emails.txt` a message with a "Recognize someone" button
that opens the dashboard. `.github/workflows/friday.yml` runs it every Friday at 1 PM
Las Vegas time — no server needed.

### One-time setup

1. **Slack token secret** — repo *Settings → Secrets and variables → Actions →
   New repository secret*: name `SLACK_BOT_TOKEN`, value your Slack bot token (`xoxb-…`).
   The token needs the `users:lookupByEmail` and `chat:write` scopes.
2. **Test it** — *Actions* tab → *Friday Recognition* → *Run workflow*. The log prints
   `SENT` / `FAILED` / `NOT FOUND` per email.

### Changing things

- **Who gets it** — edit `emails.txt` (one email per line; `#` comments out a line).
- **What it says** — edit the message text in `send.sh`.
- **When it fires** — edit the `cron` line in `.github/workflows/friday.yml` (UTC).
  `0 20 * * 5` = Fri 1 PM Vegas in summer; use `0 21 * * 5` in winter.

## Security notes

- **The Slack token lives ONLY in the GitHub Actions secret** — never in any file here.
  If it leaks: revoke it in Slack (OAuth & Permissions → Revoke), reinstall, update the secret.
- This repo is **public** so GitHub Pages can serve the dashboard for free, which means
  `emails.txt` is publicly visible. That's fine for internal work addresses; if you'd
  rather not expose them, move the list into a private GitHub Actions variable and have
  `send.sh` read it from the environment instead of the file.
- Recognition data is only as private as the Sheet's *Publish to web* setting.
- Rows submitted before the `Department` column existed show as **Unassigned**.
