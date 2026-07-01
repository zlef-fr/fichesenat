#!/usr/bin/env bash
# Downloads the latest official Sénat open data and rebuilds the served JSON.
# Run periodically (e.g. daily) — Dosleg is updated every night.
set -euo pipefail
cd "$(dirname "$0")/.."
ODSEN="https://data.senat.fr/data/senateurs/ODSEN_GENERAL.csv"
DOSLEG="https://data.senat.fr/data/dosleg/dosleg.zip"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p pipeline/raw-senat
echo "· downloading senators (ODSEN) …"
curl -fsSL -o pipeline/raw-senat/odsen.csv "$ODSEN"
echo "· downloading Dosleg dump …"
# NB: the Sénat serves this over HTTP/1.1 more reliably than HTTP/2 for large files
curl -fsSL --http1.1 -o "$TMP/dosleg.zip" "$DOSLEG"
unzip -qo "$TMP/dosleg.zip" -d pipeline/raw-senat

echo "· rebuilding data …"
python3 pipeline/build_senat.py
echo "✓ data refreshed"
