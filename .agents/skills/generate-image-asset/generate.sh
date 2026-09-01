#!/usr/bin/env bash
# Generate an image asset with the Gemini API (Nano Banana / Nano Banana Pro).
#
# Usage:
#   generate.sh "<prompt>" [out.png] [aspectRatio] [imageSize]
#
# Defaults: out=./gemini-image.png  aspectRatio=3:4  imageSize=2K
# Ref:      $REF_IMAGE — optional reference image(s) sent alongside the prompt,
#           for restyling a photo into the site's look. Comma-separate several
#           and they arrive in order, so a prompt can say "IMAGE 1 … IMAGE 2 …":
#           REF_IMAGE="photo.png,existing-art.webp" (geometry source, then the
#           style authority). PNG/JPEG/WebP.
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

# A reference image, when given, rides in the same turn as the prompt — that is
# how Nano Banana restyles an existing picture rather than inventing one.
if [[ -n "${REF_IMAGE:-}" ]]; then
  PARTS="$(mktemp /tmp/gem-parts-XXXXXX)"
  B64="$(mktemp /tmp/gem-b64-XXXXXX)"
  trap 'rm -f "$REQ" "$RESP" "$PARTS" "$B64"' EXIT
  : > "$PARTS"
  # Images ride in prompt order, so "IMAGE 1 … IMAGE 2 …" in the text lines up
  # with REF_IMAGE="first.png,second.webp".
  OLD_IFS="$IFS"; IFS=','
  for REF in $REF_IMAGE; do
    IFS="$OLD_IFS"
    [[ -f "$REF" ]] || { echo "REF_IMAGE not found: $REF" >&2; exit 1; }
    # tr rather than ${x,,}: macOS ships bash 3.2, which has no case expansion.
    case "$(printf '%s' "$REF" | tr '[:upper:]' '[:lower:]')" in
      *.png) MIME="image/png" ;;
      *.jpg|*.jpeg) MIME="image/jpeg" ;;
      *.webp) MIME="image/webp" ;;
      *) echo "REF_IMAGE must be .png, .jpg, .jpeg, or .webp: $REF" >&2; exit 1 ;;
    esac
    # --rawfile, not --arg: a 4K reference encodes to megabytes of base64, which
    # blows past the argv limit ("Argument list too long").
    base64 < "$REF" | tr -d '\n' > "$B64"
    jq -n --arg m "$MIME" --rawfile d "$B64" \
      '{ inlineData: { mimeType: $m, data: ($d | gsub("\\s";"")) } }' >> "$PARTS"
    IFS=','
  done
  IFS="$OLD_IFS"
  # Text first, then the images in order: that is what makes "IMAGE 1 … IMAGE 2"
  # in a prompt bind to the right reference. Leading with the images instead
  # makes the model paint the prompt's words and ignore the first picture's
  # geometry — it invents a plausible estate rather than repainting yours.
  jq -n --arg p "$PROMPT" --arg a "$ASPECT" --arg s "$SIZE" \
        --slurpfile imgs "$PARTS" '{
    contents: [{ parts: ([{ text: $p }] + $imgs) }],
    generationConfig: {
      responseModalities: ["TEXT","IMAGE"],
      imageConfig: { aspectRatio: $a, imageSize: $s }
    }
  }' > "$REQ"
else
  jq -n --arg p "$PROMPT" --arg a "$ASPECT" --arg s "$SIZE" '{
    contents: [{ parts: [{ text: $p }] }],
    generationConfig: {
      responseModalities: ["TEXT","IMAGE"],
      imageConfig: { aspectRatio: $a, imageSize: $s }
    }
  }' > "$REQ"
fi

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
