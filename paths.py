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
paths.py - Central path resolution for Mantis Music.

Two key directories:
  APP_DIR  - Where app code lives (templates, js, css, scripts).
             When frozen (PyInstaller): sys._MEIPASS
             When from source: this file's parent directory.

  DATA_DIR - Where user data lives (music, config, generated output).
             When frozen: MANTIS_DATA_DIR env var (set by mantis_app.py).
             When from source: this file's parent directory (same as APP_DIR).
"""

import os
import sys
from pathlib import Path


def is_frozen():
    """True when running as a PyInstaller bundle."""
    return getattr(sys, 'frozen', False)


def get_app_dir():
    """Directory containing app code."""
    if is_frozen():
        return Path(sys._MEIPASS)
    return Path(__file__).parent


def get_data_dir():
    """Directory containing user data."""
    data_dir = os.environ.get('MANTIS_DATA_DIR')
    if data_dir:
        return Path(data_dir)
    return Path(__file__).parent


# Resolve once at import time
APP_DIR = get_app_dir()
DATA_DIR = get_data_dir()

# App code paths (bundled in .app)
TEMPLATES_DIR = APP_DIR / 'templates'
JS_DIR = APP_DIR / 'js'
CSS_DIR = APP_DIR / 'css'
INDEX_HTML = APP_DIR / 'index.html'
BUILD_SCRIPT = APP_DIR / 'build_music_json.py'

# User data paths
MUSIC_DIR = DATA_DIR / 'music'
TRACKS_DIR = MUSIC_DIR / 'tracks'
COLLECTIONS_DIR = MUSIC_DIR / 'collections'
ARTIST_DIR = MUSIC_DIR / 'artist'
CONFIG_PATH = DATA_DIR / 'config.json'
DATA_OUTPUT_DIR = DATA_DIR / 'data'
OUTPUT_PATH = DATA_OUTPUT_DIR / 'discography.json'
RSS_PATH = DATA_DIR / 'feed.rss'
FEED_PAGES_DIR = DATA_DIR / 'feed'
