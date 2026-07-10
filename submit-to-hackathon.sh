#!/usr/bin/env bash
#
# Submit the ACQ Recognition site to the hackathon repo.
#
# Run this from a machine / session that has push access to
# acquisition-com/acq-hackathon (e.g. `gh auth login` done, or a
# Claude Code session initialized with that repo as its source).
#
# It is idempotent-ish: safe to re-run; it re-copies the current site.

set -euo pipefail

SITE_REPO="https://github.com/jairusleeson-bit/ACQ-Recognition.git"
HACK_REPO="git@github.com:acquisition-com/acq-hackathon.git"   # or https://... if you use a token
BRANCH="Team-25-ACQ-Team-Recognition"
TEAM_DIR="Team-25-ACQ-Team-Recognition"   # folder-per-team convention (adjust after inspecting the repo)

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "==> Cloning the public site (anonymous)"
git clone --depth 1 "$SITE_REPO" "$WORK/site"

echo "==> Cloning the hackathon repo"
git clone "$HACK_REPO" "$WORK/hack"
cd "$WORK/hack"

echo "==> Inspecting existing team-submission layout on the default branch:"
echo "    Top-level entries:"
ls -1 | sed 's/^/      /'
echo "    (If teams live in per-team folders, TEAM_DIR is correct."
echo "     If submissions go at the repo ROOT of a per-team branch, set TEAM_DIR=. below"
echo "     and remove the mkdir. If there is an index README listing teams, add our entry.)"
echo

echo "==> Checking out branch: $BRANCH"
if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
  git checkout -B "$BRANCH" "origin/$BRANCH"
else
  # branch off the default branch so we don't clobber other teams' files
  git checkout -B "$BRANCH"
fi

echo "==> Copying site files into: ${TEAM_DIR}/"
mkdir -p "$TEAM_DIR"
# Copy the self-contained static site + Slack automation. Keep .nojekyll so Pages serves as-is.
cp -v "$WORK/site/index.html"      "$TEAM_DIR/"
cp -v "$WORK/site/.nojekyll"       "$TEAM_DIR/"
cp -v "$WORK/site/apps-script.gs"  "$TEAM_DIR/"
cp -v "$WORK/site/README.md"       "$TEAM_DIR/"
cp -v "$WORK/site/send.sh"         "$TEAM_DIR/"
cp -v "$WORK/site/emails.txt"      "$TEAM_DIR/"
mkdir -p "$TEAM_DIR/.github/workflows"
cp -v "$WORK/site/.github/workflows/friday.yml" "$TEAM_DIR/.github/workflows/"

echo "==> Committing"
git add -A "$TEAM_DIR"
git commit -m "Add Team 25 ACQ Team Recognition site submission"

echo "==> Pushing"
git push -u origin "$BRANCH"

echo "==> Done. Submitted to $BRANCH in acquisition-com/acq-hackathon"
