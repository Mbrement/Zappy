#!/bin/bash
cd "$(dirname "$0")"

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

EXECUTABLE_DIR="../out/gfx-${PLATFORM}-${ELECTRON_ARCH}/"

if [ -d "$EXECUTABLE_DIR" ]; then
  cd "$EXECUTABLE_DIR" || exit
  
  if [[ "$PLATFORM" == "linux" ]]; then
    ./"$BINARY_NAME"
  elif [[ "$PLATFORM" == "darwin" ]]; then
    open "$BINARY_NAME"
  fi
else
  echo "Zappy GFX executable not found, please make sure you ran make build_gfx"
fi
