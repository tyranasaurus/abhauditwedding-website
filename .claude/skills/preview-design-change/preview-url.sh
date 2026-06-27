#!/usr/bin/env bash
# Resolve the Vercel Preview URL for a pushed git commit.
#
# Vercel's GitHub integration auto-builds a Preview deployment for every push to
# a non-production branch. This polls the GitHub Deployments API for that commit's
# Preview deployment and prints its URL once Vercel reports a state.
#
# Usage:  preview-url.sh [commit-sha]   (defaults to current HEAD)
# Requires: gh (GitHub CLI), authenticated.
set -euo pipefail

REPO="tyranasaurus/abhauditwedding-website"
SHA="${1:-$(git rev-parse HEAD)}"
SHORT="${SHA:0:7}"

echo "Waiting for Vercel Preview for $SHORT ..." >&2

# Stable branch alias Vercel also publishes (handy even before the build finishes).
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
SLUG="$(printf '%s' "$BRANCH" | tr '[:upper:]/_.' '[:lower:]---' | tr -cd 'a-z0-9-')"
echo "Branch alias (once built): https://abhauditwedding-git-${SLUG}-arpit-ranasarias-projects.vercel.app" >&2

for _ in $(seq 1 40); do  # ~4 min max
  read -r STATE URL < <(
    gh api "repos/${REPO}/deployments?sha=${SHA}&environment=Preview&per_page=1" \
      --jq '.[0].id // empty' 2>/dev/null | while read -r DID; do
      [ -n "$DID" ] || continue
      gh api "repos/${REPO}/deployments/${DID}/statuses?per_page=1" \
        --jq '"\(.[0].state // "pending") \(.[0].environment_url // .[0].target_url // "")"'
    done
  ) || true

  if [ "${STATE:-}" = "success" ] && [ -n "${URL:-}" ]; then
    echo "$URL"
    exit 0
  fi
  if [ "${STATE:-}" = "failure" ] || [ "${STATE:-}" = "error" ]; then
    echo "Vercel build ${STATE}. Check the dashboard or 'vercel logs'." >&2
    [ -n "${URL:-}" ] && echo "$URL"
    exit 1
  fi
  sleep 6
done

echo "Timed out waiting for the Preview build. Check https://vercel.com/arpit-ranasarias-projects/abhauditwedding" >&2
exit 2
