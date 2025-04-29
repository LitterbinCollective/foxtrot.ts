#!/bin/bash
echo ""
echo "DANGER: this script will kill the previously running process for debugging. it has NOT been tested."
echo "if everything works, good! if not, stop using the \"npm: build\" task."
echo ""

PID_FILE=".pid"

if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if ps -p $PID > /dev/null; then
    echo "killing process with PID: $PID"
    kill -9 "$PID" 2>/dev/null
    rm "$PID_FILE"
  else
    echo "no process found with PID: $PID"
  fi
else
  echo "PID file not found."
fi