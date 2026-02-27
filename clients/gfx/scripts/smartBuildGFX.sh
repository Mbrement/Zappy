#!/usr/bin/env bash

cd "$(dirname "$0")" || exit

GFX_BIN="../out/gfx-linux-x64/gfx"
BUILD_SCRIPT="./buildGFX.sh"
GFX_ROOT=".."

if [ ! -f "$GFX_BIN" ]; then
    "$BUILD_SCRIPT"
    exit $?
fi

CHANGED_FILE=""

for conf_file in "$GFX_ROOT/package.json" "$BUILD_SCRIPT"; do
    if [ "$conf_file" -nt "$GFX_BIN" ]; then
        CHANGED_FILE="$conf_file"
        break
    fi
done

if [ -z "$CHANGED_FILE" ]; then
    CHANGED_FILE=$(find "$GFX_ROOT" -type f \( -name "*.js" -o -name "*.mp3" -o -name "*.png" -o -name "*.jpg" \) ! -path "*/node_modules/*" ! -path "*/out/*" -newer "$GFX_BIN" -print -quit)
fi

if [ -n "$CHANGED_FILE" ]; then
    "$BUILD_SCRIPT"
else
    echo "make: 'gfx' is up to date."
fi