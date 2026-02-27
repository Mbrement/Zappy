cd $(dirname "$0")

export PACKAGE_LOCK="../package-lock.json"
export NODE_MODULES="../node_modules"

if [ -f "$PACKAGE_LOCK" ]; then
  echo "Deleting: $PACKAGE_LOCK"
  rm -rf $PACKAGE_LOCK
fi

if [ -d "$NODE_MODULES" ]; then
  echo "Deleting: $NODE_MODULES"
  rm -rf $NODE_MODULES
fi

unset PACKAGE_LOCK
unset NODE_MODULES