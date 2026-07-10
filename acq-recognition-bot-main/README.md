# ACQ Recognition — Friday Sender

Sends the weekly recognition Slack message to every email in `emails.txt`, every Friday at 1pm, via GitHub Actions. No server needed.

## Run it from your Mac (manual)

1. Open Terminal in this folder.
2. Run: `SLACK_BOT_TOKEN=xoxb-YOUR-TOKEN bash send.sh`
3. Each line prints SENT, FAILED, or NOT FOUND per email.

## Host it on GitHub (automatic every Friday)

1. Create a **private** repo on github.com (example name: acq-recognition-bot).
2. Upload these files keeping the folder structure (`.github/workflows/friday.yml` must keep its path).
3. In the repo: Settings → Secrets and variables → Actions → New repository secret.
   - Name: `SLACK_BOT_TOKEN`
   - Value: the xoxb token (use a freshly rotated one).
4. Done. It fires every Friday at 1pm Las Vegas time.
5. Test without waiting for Friday: Actions tab → Friday Recognition → Run workflow. Results show per email in the log.

## Change things

- **Who gets it**: edit `emails.txt`, one email per line, commit. `#` comments out a line.
- **What it says**: edit the text inside `send.sh`.
- **When it fires**: edit the cron line in `.github/workflows/friday.yml`. GitHub cron runs on UTC: `0 20 * * 5` = Friday 1pm Vegas in summer; switch to `0 21 * * 5` when clocks change in November.

## Rules

- The token lives ONLY in the GitHub secret and 1Password. Never in any file in this repo.
- Keep the repo private.
- If the token ever leaks: revoke in Slack (OAuth & Permissions → Revoke), reinstall the app, update the GitHub secret. Five minutes.

## Later (needs the platform)

The 5pm reminder to non-submitters needs the platform's database to know who submitted. When the platform exists, the developer adds a second workflow that asks the platform for the pending list and reuses this same send loop.
