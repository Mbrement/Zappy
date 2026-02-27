#!/usr/bin/env bash

CLIENT_BIN="../../client"
BUILD_SCRIPT="./buildSea.sh"

if [ ! -f "$CLIENT_BIN" ]; then
    "$BUILD_SCRIPT"
    exit 0
fi

CHANGED_FILE=""

for conf_file in "package.json" "seaConfig.json" "buildSea.sh"; do
    if [ "$conf_file" -nt "$CLIENT_BIN" ]; then
        CHANGED_FILE="$conf_file"
        break
    fi
done

if [ -z "$CHANGED_FILE" ]; then
    CHANGED_FILE=$(find . -type f -name "*.js" ! -path "*/node_modules/*" ! -name "main.bundle.js" -newer "$CLIENT_BIN" -print -quit)
fi

if [ -n "$CHANGED_FILE" ]; then
    "$BUILD_SCRIPT"
else
    echo "make: 'client' is up to date."
fi