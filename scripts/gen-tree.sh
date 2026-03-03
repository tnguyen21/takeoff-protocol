#!/bin/bash
# Regenerate TREE.md with current file structure
# Used by pre-commit hook to keep tree in sync

REPO_ROOT="$(git rev-parse --show-toplevel)"

tree "$REPO_ROOT" \
  -I 'node_modules|dist|.git|.hive|.worktrees|.claude|.vite|*.tsbuildinfo|bun.lock' \
  --dirsfirst \
  -L 4 \
  > "$REPO_ROOT/TREE.md"
