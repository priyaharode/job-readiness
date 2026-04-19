#!/bin/bash
# ── CareerAI Frontend Startup ─────────────────────────────────────────────────
set -e

echo ""
echo "  ⬡  CareerAI — Frontend Setup"
echo "  ─────────────────────────────"
echo ""

if ! command -v node &>/dev/null; then
  echo "  ❌  Node.js not found. Install from https://nodejs.org"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "  📦  Installing npm packages..."
  npm install
fi

echo ""
echo "  🚀  Starting Vite dev server on http://localhost:3000"
echo "  ℹ️   Make sure the backend is running on :5000 first!"
echo ""

npm run dev
