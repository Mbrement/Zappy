cd $(dirname "$0")

export OUTPUT_DIR="../out"

if [ -d "$OUTPUT_DIR" ]; then
  echo "Deleting: $OUTPUT_DIR"
  rm -rf $OUTPUT_DIR
fi

unset OUTPUT_DIR
