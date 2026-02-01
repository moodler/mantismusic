#!/usr/bin/env python3
#
# Mantis Music - A self-hosted artist discography player
# Copyright (C) 2026 Martin Dougiamas
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see <https://www.gnu.org/licenses/>.
#
"""
mantis_app.py - Native macOS app wrapper for Mantis Music admin.

Starts the Flask admin server in a background thread and opens
a native macOS window using pywebview.
"""

import json
import os
import sys
import threading
import time
import urllib.request
from pathlib import Path

APP_NAME = 'Mantis Music'
PORT = 5001

# App Support directory for storing preferences
APP_SUPPORT = Path.home() / 'Library' / 'Application Support' / APP_NAME
PREFS_FILE = APP_SUPPORT / 'preferences.json'

DEFAULT_CONFIG = {
    "site_url": "",
    "spotify_client_id": "",
    "spotify_client_secret": "",
    "deploy": {
        "destination": ""
    }
}

DEFAULT_ARTIST_MD = """---
name: My Artist Name
---
Write your artist bio here.
"""


def load_prefs():
    """Load preferences from disk."""
    if PREFS_FILE.exists():
        try:
            return json.loads(PREFS_FILE.read_text())
        except Exception:
            pass
    return {}


def save_prefs(prefs):
    """Save preferences to disk."""
    APP_SUPPORT.mkdir(parents=True, exist_ok=True)
    PREFS_FILE.write_text(json.dumps(prefs, indent=2))


def validate_data_dir(path):
    """Check if a directory looks like a Mantis Music data directory."""
    p = Path(path)
    return (p / 'music').is_dir() or (p / 'config.json').exists()


def initialize_data_dir(path):
    """Create the data directory structure for first-time use."""
    p = Path(path)
    (p / 'music' / 'artist').mkdir(parents=True, exist_ok=True)
    (p / 'music' / 'tracks').mkdir(parents=True, exist_ok=True)
    (p / 'music' / 'collections').mkdir(parents=True, exist_ok=True)
    (p / 'data').mkdir(parents=True, exist_ok=True)
    (p / 'feed').mkdir(parents=True, exist_ok=True)

    config_path = p / 'config.json'
    if not config_path.exists():
        config_path.write_text(json.dumps(DEFAULT_CONFIG, indent=2) + '\n')

    artist_md = p / 'music' / 'artist' / 'artist.md'
    if not artist_md.exists():
        artist_md.write_text(DEFAULT_ARTIST_MD.lstrip())


def pick_data_dir():
    """Show a native folder picker dialog to choose the data directory."""
    import webview

    result = []

    def choose_folder(window):
        dirs = window.create_file_dialog(
            webview.FOLDER_DIALOG,
            directory=str(Path.home()),
        )
        if dirs and len(dirs) > 0:
            result.append(dirs[0])
        window.destroy()

    window = webview.create_window(
        'Mantis Music — Choose Data Folder',
        html='''<!DOCTYPE html><html><body style="
            font-family: -apple-system, system-ui, sans-serif;
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; height: 90vh; background: #1a1a2e; color: #e0e0e0;
            margin: 0;">
            <h1 style="margin-bottom: 8px;">Mantis Music</h1>
            <p style="color: #999; margin-bottom: 24px;">Select a folder for your music data</p>
            <p style="color: #666; font-size: 13px;">
                Choose an empty folder or an existing Mantis Music data folder.
            </p>
        </body></html>''',
        width=500,
        height=280,
    )
    webview.start(choose_folder, window)

    return result[0] if result else None


def get_data_dir():
    """Determine the data directory from prefs, dialog, or defaults."""
    # Running from source — use the script's own directory
    if not getattr(sys, 'frozen', False):
        return Path(__file__).parent

    # Running as bundled .app — check preferences
    prefs = load_prefs()

    # Migrate old project_dir preference
    if 'project_dir' in prefs and 'data_dir' not in prefs:
        prefs['data_dir'] = prefs.pop('project_dir')
        save_prefs(prefs)

    data_dir = prefs.get('data_dir', '')

    if data_dir and validate_data_dir(data_dir):
        return Path(data_dir)

    # No valid preference — ask the user to pick
    chosen = pick_data_dir()
    if not chosen:
        sys.exit(0)  # User cancelled

    chosen_path = Path(chosen)

    # Initialize if empty or new
    if not validate_data_dir(chosen_path):
        initialize_data_dir(chosen_path)

    # Save the choice
    prefs['data_dir'] = chosen
    save_prefs(prefs)
    return chosen_path


def start_flask(app):
    """Start Flask server in background."""
    app.run(host='127.0.0.1', port=PORT, debug=False, use_reloader=False)


def wait_for_server(timeout=10):
    """Wait until the Flask server is responding."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            urllib.request.urlopen(f'http://127.0.0.1:{PORT}/api/health')
            return True
        except Exception:
            time.sleep(0.1)
    return False


def main():
    import webview

    data_dir = get_data_dir()

    # Set env var so paths.py resolves DATA_DIR correctly
    os.environ['MANTIS_DATA_DIR'] = str(data_dir)

    # Import the Flask app (after setting env var)
    from admin import app

    # Start Flask in daemon thread
    server = threading.Thread(target=start_flask, args=(app,), daemon=True)
    server.start()

    # Wait for server to be ready
    if not wait_for_server():
        webview.create_window(
            'Mantis Music — Error',
            html='<body style="font-family:system-ui;padding:40px;background:#1a1a2e;color:#e0e0e0;">'
                 '<h2>Server failed to start</h2>'
                 f'<p>Could not start Flask server with data at:<br><code>{data_dir}</code></p></body>',
            width=500, height=250,
        )
        webview.start()
        sys.exit(1)

    # Create native window
    webview.create_window(
        'Mantis Music',
        f'http://127.0.0.1:{PORT}',
        width=1200,
        height=800,
    )
    webview.start()


if __name__ == '__main__':
    main()
