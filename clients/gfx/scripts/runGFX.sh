export EXECUTABLE="out/zappy-linux-x64/zappy"

if [ -f "$EXECUTABLE" ]; then
  chmod +x $EXECUTABLE
  ./$EXECUTABLE
fi

unset EXECUTABLE
