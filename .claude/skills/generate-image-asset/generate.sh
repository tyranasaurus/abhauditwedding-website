#!/usr/bin/env bash
# Generate an image asset with the Gemini API (Nano Banana / Nano Banana Pro).
#
# Usage:
#   generate.sh "<prompt>" [out.png] [aspectRatio] [imageSize]
#
# Defaults: out=./gemini-image.png  aspectRatio=3:4  imageSize=2K
# Model:    $GEMINI_MODEL (default gemini-3-pro-image-preview = Nano Banana Pro)
#           Use gemini-2.5-flash-image (Nano Banana) for cheaper/faster output.
# Key:      $GEMINI_API_KEY if set, else 1Password:
#           op://Private/Gemini Image API Key/credential
#
# Requires: curl, jq, base64, and (unless GEMINI_API_KEY is set) the 1Password
#           CLI signed in (desktop app integration or `op signin`).
# NOTE: Gemini image generation requires a BILLING-ENABLED project. The free tier
#       has limit:0 for all image models and returns HTTP 429.
set -euo pipefail

MODEL="${GEMINI_MODEL:-gemini-3-pro-image-preview}"
PROMPT="${1:?usage: generate.sh \"prompt\" [out.png] [aspectRatio] [imageSize]}"
OUT="${2:-./gemini-image.png}"
ASPECT="${3:-3:4}"   # 1:1 2:3 3:2 3:4 4:3 4:5 5:4 9:16 16:9 21:9
SIZE="${4:-2K}"      # 1K 2K 4K

KEY="${GEMINI_API_KEY:-}"
if [[ -z "$KEY" ]]; then
  KEY="$(op read "op://Private/Gemini Image API Key/credential")"
fi

REQ="$(mktemp /tmp/gem-req-XXXXXX)"
RESP="$(mktemp /tmp/gem-resp-XXXXXX)"
trap 'rm -f "$REQ" "$RESP"' EXIT

jq -n --arg p "$PROMPT" --arg a "$ASPECT" --arg s "$SIZE" '{
  contents: [{ parts: [{ text: $p }] }],
  generationConfig: {
    responseModalities: ["TEXT","IMAGE"],
    imageConfig: { aspectRatio: $a, imageSize: $s }
  }
}' > "$REQ"

HTTP=$(curl -sS -w '%{http_code}' -o "$RESP" \
  "https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent" \
  -H "x-goog-api-key: ${KEY}" \
  -H "Content-Type: application/json" \
  -X POST -d @"$REQ")

echo "HTTP $HTTP  (model: $MODEL)"
if [[ "$HTTP" != "200" ]]; then
  echo "ERROR body:"; cat "$RESP"; exit 1
fi

# Surface any text the model returned (notes / refusals).
jq -r '.candidates[0].content.parts[]?.text // empty' "$RESP"

DATA="$(jq -r '[.candidates[0].content.parts[]? | select(.inlineData) | .inlineData.data][0] // empty' "$RESP")"
if [[ -z "$DATA" ]]; then
  echo "No image returned. Full response:"; cat "$RESP"; exit 2
fi

echo "$DATA" | base64 -d > "$OUT"
echo "Saved: $OUT ($(wc -c < "$OUT") bytes)"
