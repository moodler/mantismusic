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


def validate_project_dir(path):
    """Check if a directory looks like a Mantis Music project."""
    p = Path(path)
    return (p / 'admin.py').exists() and (p / 'templates').is_dir()


def pick_project_dir():
    """Show a native folder picker dialog to choose the project directory."""
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
        'Mantis Music — Choose Project Folder',
        html='''<!DOCTYPE html><html><body style="
            font-family: -apple-system, system-ui, sans-serif;
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; height: 90vh; background: #1a1a2e; color: #e0e0e0;
            margin: 0;">
            <h1 style="margin-bottom: 8px;">Mantis Music</h1>
            <p style="color: #999; margin-bottom: 24px;">Select your Mantis Music project folder</p>
            <p style="color: #666; font-size: 13px;">
                The folder should contain admin.py, templates/, music/, etc.
            </p>
        </body></html>''',
        width=500,
        height=280,
    )
    webview.start(choose_folder, window)

    return result[0] if result else None


def get_project_dir():
    """Determine the project directory from prefs, dialog, or defaults."""
    # Running from source — use the script's own directory
    if not getattr(sys, 'frozen', False):
        return Path(__file__).parent

    # Running as bundled .app — check preferences
    prefs = load_prefs()
    project_dir = prefs.get('project_dir', '')

    if project_dir and validate_project_dir(project_dir):
        return Path(project_dir)

    # No valid preference — ask the user to pick
    chosen = pick_project_dir()
    if not chosen:
        sys.exit(0)  # User cancelled

    if not validate_project_dir(chosen):
        # Try again with an error? For now just use it anyway
        pass

    # Save the choice
    prefs['project_dir'] = chosen
    save_prefs(prefs)
    return Path(chosen)


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

    project_dir = get_project_dir()

    os.environ['MANTIS_PROJECT_DIR'] = str(project_dir)
    os.chdir(project_dir)

    # Import the Flask app (after setting env var and cwd)
    sys.path.insert(0, str(project_dir))
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
                 f'<p>Could not start Flask server from:<br><code>{project_dir}</code></p></body>',
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
