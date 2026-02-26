export PACKAGE_LOCK="package-lock.json"
export NODE_MODULES="node_modules"

if [ -f "$PACKAGE_LOCK" ]; then
  echo "$PACKAGE_LOCK does exist."
  rm -rf $PACKAGE_LOCK
fi

if [ -d "$NODE_MODULES" ]; then
  echo "$NODE_MODULES does exist."
  rm -rf $NODE_MODULES
fi

unset OUTPUT_DIR
unset PACKAGE_LOCK
unset NODE_MODULES

npm i
npm run startDev

