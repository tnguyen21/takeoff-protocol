#!/usr/bin/env bash
set -euo pipefail

# Deploy Takeoff Protocol to Fly.io.
#
# Usage:
#   ./scripts/deploy.sh              # remote build (default)
#   ./scripts/deploy.sh --local      # local docker build (if remote hangs)
#   ./scripts/deploy.sh --skip-checks  # skip typecheck/test (for hotfixes)

cd "$(dirname "$0")/.."

LOCAL=false
SKIP_CHECKS=false

for arg in "$@"; do
  case "$arg" in
    --local) LOCAL=true ;;
    --skip-checks) SKIP_CHECKS=true ;;
    *) echo "Unknown flag: $arg"; exit 1 ;;
  esac
done

# ── Pre-flight checks ─────────────────────────────────────────────────────────

if [[ "$SKIP_CHECKS" == false ]]; then
  echo "==> Typechecking..."
  bun run typecheck

  echo "==> Running tests..."
  bun run test

  echo "==> Building..."
  bun run build

  echo "==> Pre-flight passed."
else
  echo "==> Skipping pre-flight checks."
fi

# ── Deploy ─────────────────────────────────────────────────────────────────────

echo ""
if [[ "$LOCAL" == true ]]; then
  echo "==> Deploying (local Docker build)..."
  fly deploy --local-only
else
  echo "==> Deploying (remote build)..."
  fly deploy
fi

# ── Post-deploy verification ──────────────────────────────────────────────────

echo ""
echo "==> Verifying health..."
sleep 5

HEALTH=$(curl -sf https://takeoff-protocol.fly.dev/api/health 2>/dev/null || echo "FAILED")
echo "Health check: $HEALTH"

echo ""
fly status
