#!/usr/bin/env bash
set -euo pipefail

# First-time Fly.io setup for Takeoff Protocol.
# Run once to go from zero to a deployed app.

REGION="sjc"
VOLUME_SIZE=3  # GB

# ── Prerequisites ──────────────────────────────────────────────────────────────

if ! command -v fly &>/dev/null; then
  echo "flyctl not found. Installing via Homebrew..."
  brew install flyctl
fi

echo "Fly CLI version: $(fly version)"

if ! fly auth whoami &>/dev/null; then
  echo "Not logged in. Opening browser for auth..."
  fly auth login
fi

echo "Authenticated as: $(fly auth whoami)"

# ── Launch app ─────────────────────────────────────────────────────────────────

echo ""
echo "Launching app (using existing fly.toml)..."
echo "When prompted: accept defaults, say NO to 'deploy now'."
echo ""
fly launch --no-deploy

# ── Create volume ──────────────────────────────────────────────────────────────

echo ""
echo "Creating ${VOLUME_SIZE}GB volume for game logs in ${REGION}..."
fly volumes create game_logs --region "$REGION" --size "$VOLUME_SIZE" -y

# ── Set secrets ────────────────────────────────────────────────────────────────

echo ""
echo "Setting secrets..."

read -rsp "Site password (shared passphrase for access gate): " SITE_PASSWORD
echo ""

read -rsp "Anthropic API key (leave blank to skip): " ANTHROPIC_API_KEY
echo ""

fly secrets set SITE_PASSWORD="$SITE_PASSWORD" GEN_ENABLED=false

if [[ -n "$ANTHROPIC_API_KEY" ]]; then
  fly secrets set ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"
  echo "Anthropic key set. Generation is OFF — enable later with: fly secrets set GEN_ENABLED=true"
else
  echo "No API key set. Generation will use fallback content."
fi

# ── Deploy ─────────────────────────────────────────────────────────────────────

echo ""
echo "Ready to deploy. Running pre-flight checks..."
echo ""

cd "$(dirname "$0")/.."
bash scripts/deploy.sh

echo ""
echo "Setup complete! Your app is live at: https://takeoff-protocol.fly.dev"
