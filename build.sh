#!/usr/bin/env bash
# Build helper — workaround untuk path yang mengandung karakter '#'.
# Vite tidak bisa resolve index.html kalau absolute path punya '#',
# jadi kita stage source ke /tmp (path bersih), build di sana, lalu copy dist balik.
set -euo pipefail

PROJ="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLEAN="${TMPDIR:-/tmp}/kat-portal-build"

echo "→ staging ke $CLEAN"
rm -rf "$CLEAN" && mkdir -p "$CLEAN"
cp -r "$PROJ"/src "$PROJ"/public "$PROJ"/index.html \
      "$PROJ"/package.json "$PROJ"/tsconfig.json "$PROJ"/vite.config.ts \
      "$PROJ"/tailwind.config.ts "$PROJ"/postcss.config.js "$PROJ"/vite-env.d.ts \
      "$CLEAN"/
# pakai ulang node_modules & .env.local lewat symlink (hemat waktu)
ln -s "$PROJ/node_modules" "$CLEAN/node_modules"
[ -f "$PROJ/.env.local" ] && cp "$PROJ/.env.local" "$CLEAN/.env.local"

echo "→ building"
( cd "$CLEAN" && npx tsc -b && npx vite build )

echo "→ copy dist balik ke proyek"
rm -rf "$PROJ/dist" && cp -r "$CLEAN/dist" "$PROJ/dist"

echo "✓ selesai. Output: $PROJ/dist (copy isinya ke nginx root)"
