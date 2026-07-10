#!/bin/bash
# Sends the weekly recognition message to every email in emails.txt
# Usage local:  SLACK_BOT_TOKEN=xoxb-... bash send.sh
# On GitHub Actions the token comes from the repo secret automatically.

TOKEN="${SLACK_BOT_TOKEN:?Missing SLACK_BOT_TOKEN}"

while IFS= read -r EMAIL || [ -n "$EMAIL" ]; do
  # skip empty lines and lines starting with #
  [ -z "$EMAIL" ] && continue
  case "$EMAIL" in \#*) continue ;; esac

  ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "https://slack.com/api/users.lookupByEmail?email=$EMAIL" \
    | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -z "$ID" ]; then
    echo "NOT FOUND: $EMAIL"
    continue
  fi

  OK=$(curl -s -X POST https://slack.com/api/chat.postMessage \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"channel\":\"$ID\",\"text\":\"Who lived the values this week?\",\"blocks\":[{\"type\":\"section\",\"text\":{\"type\":\"mrkdwn\",\"text\":\"Hey <@$ID>! *Who lived the values this week?*\\nSubmit your pick before the day ends.\"}},{\"type\":\"actions\",\"elements\":[{\"type\":\"button\",\"text\":{\"type\":\"plain_text\",\"text\":\"Recognize someone\"},\"url\":\"https://jairusleeson-bit.github.io/ACQ-Recognition/\"}]}]}" \
    | grep -o '"ok":true')

  if [ -n "$OK" ]; then echo "SENT: $EMAIL"; else echo "FAILED: $EMAIL"; fi
  sleep 1
done < emails.txt
