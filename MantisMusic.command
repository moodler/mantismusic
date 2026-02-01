#!/bin/bash
#
# Mantis Music - A self-hosted artist discography player
# Copyright (C) 2026 Martin Dougiamas
#
# Launches the admin server and opens it in the default browser.
# Double-click this file to start, or run from Terminal.
#

cd "$(dirname "$0")"

# Check Python dependencies
python3 -c "import flask, yaml" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installing dependencies..."
    pip3 install flask pyyaml requests
fi

# Kill any existing instance on port 5001
lsof -ti:5001 | xargs kill 2>/dev/null

echo "Starting Mantis Music admin on http://localhost:5001"
echo "Close this window to stop the server."
echo ""

# Open browser after a short delay
(sleep 1 && open "http://localhost:5001") &

# Run the server (foreground — closing Terminal window stops it)
python3 admin.py
