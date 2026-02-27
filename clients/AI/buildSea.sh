#!/usr/bin/env bash

TARGET_VERSION="25.6.0"

export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  echo "Installing nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  . "$NVM_DIR/nvm.sh"
fi

if nvm use "$TARGET_VERSION" &> /dev/null; then
    echo "Node v$TARGET_VERSION activated."
else
    echo "Node v$TARGET_VERSION not found. Installing..."
    nvm install "$TARGET_VERSION"
    nvm use "$TARGET_VERSION"
fi

current_ver=$(node --version)
echo "Running on: $current_ver"

npm install

npx esbuild Main.js --bundle --platform=node --outfile=main.bundle.js

NODE_PATH=$(which node)

"$NODE_PATH" --build-sea seaConfig.json