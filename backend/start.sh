#!/bin/bash
# ── CareerAI Backend Startup ──────────────────────────────────────────────────
set -e

echo ""
echo "  ⬡  CareerAI — Backend Setup"
echo "  ────────────────────────────"
echo ""

# Check Python
if ! command -v python3 &>/dev/null; then
  echo "  ❌  Python 3 not found. Please install Python 3.9+"
  exit 1
fi

# Create & activate venv if not exists
if [ ! -d "venv" ]; then
  echo "  📦  Creating virtual environment..."
  python3 -m venv venv
fi

source venv/bin/activate

echo "  📦  Installing dependencies..."
pip install -q -r requirements.txt

echo ""
echo "  🚀  Starting Flask API on http://localhost:5000"
echo "  ℹ️   First run trains the model (~30s). Subsequent runs load from pkl."
echo ""

python app.py
