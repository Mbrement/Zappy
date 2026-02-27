cd $(dirname "$0")

export OUTPUT_DIR="../out"
export PACKAGE_LOCK="../package-lock.json"
export NODE_MODULES="../node_modules"

if [ -d "$OUTPUT_DIR" ]; then
  echo "Deleting: $OUTPUT_DIR"
  rm -rf $OUTPUT_DIR
fi

if [ -f "$PACKAGE_LOCK" ]; then
  echo "Deleting: $PACKAGE_LOCK"
  rm -rf $PACKAGE_LOCK
fi

if [ -d "$NODE_MODULES" ]; then
  echo "Deleting: $NODE_MODULES"
  rm -rf $NODE_MODULES
fi

unset OUTPUT_DIR
unset PACKAGE_LOCK
unset NODE_MODULES