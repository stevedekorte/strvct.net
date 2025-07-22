#!/usr/bin/env bash
# Fix a stray commit made while on a detached HEAD, keeping the changes.
# Usage:  fix_detached_head.sh [target‑branch]   (default branch = master)
set -euo pipefail

DEFAULT_BRANCH=master
BRANCH="${1:-$DEFAULT_BRANCH}"

# ------- 1) sanity -----------------------------------------------------------
git rev-parse --git-dir > /dev/null 2>&1 \
  || { echo "Not inside a Git repo" >&2; exit 1; }

if git symbolic-ref -q HEAD >/dev/null; then
  echo "HEAD isn’t detached – nothing to fix." >&2
  exit 0
fi

DETACHED_SHA=$(git rev-parse --short HEAD)
echo "Detached commit: $DETACHED_SHA"

# ------- 2) pick sensible target branch -------------------------------------
# Try to recover the branch we were on before detaching.
PREV_BRANCH=$(git reflog | awk '/checkout: moving from / {print $6; exit}' || true)
if [[ -n "$PREV_BRANCH" ]]; then
  BRANCH="$PREV_BRANCH"
  echo "Using previous branch from reflog: $BRANCH"
else
  echo "Defaulting to branch: $BRANCH"
fi

# ------- 3) ensure that branch exists ----------------------------------------
if ! git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "Local branch '$BRANCH' doesn’t exist – creating it from HEAD@{1}"
  git checkout -q -b "$BRANCH" HEAD@{1}
else
  git checkout -q "$BRANCH"
fi

# ------- 4) replay the stray commit -----------------------------------------
echo "Cherry‑picking $DETACHED_SHA onto $BRANCH (ours ← base, theirs ← incoming)"
git cherry-pick -X theirs "$DETACHED_SHA" || {
  echo "Cherry‑pick halted by conflicts – resolve manually then run:"
  echo "    git cherry-pick --continue"
  exit 1
}

echo "✅ Done – commit $DETACHED_SHA is now part of branch '$BRANCH'."

