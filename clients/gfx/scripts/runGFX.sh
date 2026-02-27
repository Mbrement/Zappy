cd $(dirname "$0")

export EXECUTABLE="../out/gfx-linux-x64/gfx"

if [ -f "$EXECUTABLE" ]; then
  chmod +x $EXECUTABLE
  ./$EXECUTABLE
else
  echo "Zappy GFX executable not found, please make sure you ran make build_gfx"
fi

unset EXECUTABLE
