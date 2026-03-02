#!/usr/bin/env bash

cd "$(dirname "$0")" || exit

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
  PLATFORM='linux'
  BINARY_NAME='gfx'
elif [[ "$OSTYPE" == "darwin"* ]]; then
  PLATFORM='darwin'
  BINARY_NAME='gfx.app'
else
  echo "Unsupported OS: $OSTYPE"
  exit 1
fi

UNAME_ARCH=$(uname -m)
if [[ "$UNAME_ARCH" == "x86_64" ]]; then
  ELECTRON_ARCH="x64"
elif [[ "$UNAME_ARCH" == "aarch64" || "$UNAME_ARCH" == "arm64" ]]; then
  ELECTRON_ARCH="arm64"
else
  echo "Unsupported Uarch: $UNAME_ARCH"
  exit 1
fi

GFX_BIN="../out/gfx-${PLATFORM}-${ELECTRON_ARCH}/${BINARY_NAME}"
BUILD_SCRIPT="./buildGFX.sh"
GFX_ROOT=".."

if [ ! -e "$GFX_BIN" ]; then
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