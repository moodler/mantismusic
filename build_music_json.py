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
build_music_json.py - The Compiler

Reads the music/ folder structure and compiles it into data/discography.json
for the web application.

Structure:
  music/
  ├── artist/
  │   ├── artist.md
  │   ├── profile.jpg
  │   └── banner.png
  ├── tracks/           # All songs (flat structure)
  │   ├── song_name/
  │   │   ├── track.md
  │   │   ├── song_name.mp3
  │   │   ├── song_name.txt (lyrics)
  │   │   └── song_name.jpg (cover - for singles)
  └── collections/      # Albums and EPs only (reference tracks)
      ├── album_name/
      │   ├── collection.md  # includes tracks: [song1, song2, ...]
      │   └── album_name.jpg

  Singles are tracks not referenced by any collection.

Usage:
    python3 build_music_json.py [--base-url URL]
"""

import base64
import json
import os
import re
import sys
import time
import yaml
from pathlib import Path
from datetime import datetime
from email.utils import format_datetime
from html import escape
from xml.sax.saxutils import escape as xml_escape


from paths import (APP_DIR, DATA_DIR, MUSIC_DIR, TRACKS_DIR, COLLECTIONS_DIR,
                    ARTIST_DIR, INDEX_HTML, OUTPUT_PATH, RSS_PATH,
                    FEED_PAGES_DIR, CONFIG_PATH, DATA_OUTPUT_DIR)

# BASE_DIR is used for relative asset path computation in build_asset_path()
BASE_DIR = DATA_DIR

BASE_URL = ""
SITE_URL = ""
SITE_TITLE = ""


def parse_frontmatter(content):
    """Parse YAML frontmatter from a markdown file."""
    if not content.startswith('---'):
        return {}, content
    parts = content.split('---', 2)
    if len(parts) < 3:
        return {}, content
    try:
        frontmatter = yaml.safe_load(parts[1])
        body = parts[2].strip()
        return frontmatter or {}, body
    except yaml.YAMLError as e:
        print(f"WARNING: YAML parse error: {e}")
        return {}, content


def read_md_file(path):
    """Read a markdown file and return frontmatter + body."""
    if not path.exists():
        return {}, ""
    content = path.read_text(encoding='utf-8')
    frontmatter, body = parse_frontmatter(content)
    # Convert any date objects to strings for JSON serialization
    for key, val in frontmatter.items():
        if hasattr(val, 'isoformat'):
            frontmatter[key] = val.isoformat() if hasattr(val, 'isoformat') else str(val)
    return frontmatter, body


def get_release_id(folder_name):
    """Generate a release ID from folder name."""
    return folder_name.replace('_', '-')


def calculate_duration(duration_str):
    """Parse duration string (MM:SS) and return total seconds."""
    if not duration_str:
        return 0
    try:
        parts = str(duration_str).split(':')
        if len(parts) == 2:
            return int(parts[0]) * 60 + int(parts[1])
        return 0
    except (ValueError, IndexError):
        return 0


def format_duration(seconds):
    """Format seconds as MM:SS."""
    mins = seconds // 60
    secs = seconds % 60
    return f"{mins}:{secs:02d}"


def get_mp3_duration(mp3_path):
    """Read duration from an MP3 file using mutagen. Returns formatted string or None."""
    try:
        from mutagen.mp3 import MP3
        audio = MP3(str(mp3_path))
        if audio.info:
            total_secs = audio.info.length
            mins = int(total_secs // 60)
            secs = int(total_secs % 60)
            return f"{mins}:{secs:02d}"
    except Exception as e:
        print(f"  WARNING: Could not read MP3 duration from {mp3_path.name}: {e}")
    return None


def update_track_md_duration(track_md_path, new_duration):
    """Update the duration field in a track.md frontmatter."""
    content = track_md_path.read_text(encoding='utf-8')
    frontmatter, body = parse_frontmatter(content)

    old_duration = str(frontmatter.get('duration', ''))
    if old_duration == new_duration:
        return False

    frontmatter['duration'] = new_duration

    # Rebuild the file
    yaml_str = yaml.dump(frontmatter, default_flow_style=False, allow_unicode=True, sort_keys=False)
    new_content = f"---\n{yaml_str}---\n"
    if body:
        new_content += body + "\n"

    track_md_path.write_text(new_content, encoding='utf-8')
    print(f"  Updated duration in {track_md_path.parent.name}/track.md: {old_duration or '(empty)'} -> {new_duration}")
    return True


def find_file(directory, extensions):
    """Find first file matching any of the extensions."""
    for ext in extensions:
        for f in directory.glob(f"*{ext}"):
            if not f.name.startswith('.'):
                return f
    return None


def build_asset_path(local_path, asset_type):
    """Convert local path to web-accessible path."""
    rel_path = local_path.relative_to(BASE_DIR)
    if BASE_URL:
        return f"{BASE_URL.rstrip('/')}/{rel_path}"
    return str(rel_path)


def parse_artist():
    """Parse artist.md and return artist data."""
    artist_md = MUSIC_DIR / "artist" / "artist.md"
    frontmatter, bio = read_md_file(artist_md)

    social_links = {}
    social_fields = ['spotify', 'apple_music', 'tidal', 'deezer', 'bandcamp',
                     'soundcloud', 'youtube', 'instagram', 'website']

    for field in social_fields:
        if frontmatter.get(field):
            json_key = 'appleMusic' if field == 'apple_music' else field.replace('_', '')
            social_links[json_key] = frontmatter[field]

    return {
        'artist': frontmatter.get('name', 'Unknown Artist'),
        'bio': bio,
        'socialLinks': social_links
    }


# ---------------------------------------------------------------------------
# Streaming link auto-lookup
# ---------------------------------------------------------------------------

ARTIST_NAME = "Mantis Audiogram"


def _titles_match(search_title, result_title):
    """Check if titles match: exact match preferred, substring only if lengths are similar."""
    a = search_title.lower().strip()
    b = result_title.split('(')[0].strip().lower()
    if a == b:
        return True
    # Only allow substring match if the shorter string is at least 60% of the longer
    if a in b or b in a:
        longer = max(len(a), len(b))
        shorter = min(len(a), len(b))
        return shorter >= longer * 0.6
    return False

def load_config():
    """Load config from config.json, falling back to env vars."""
    config = {}
    config_path = CONFIG_PATH
    if config_path.exists():
        try:
            config = json.loads(config_path.read_text(encoding='utf-8'))
        except Exception as e:
            print(f"  WARNING: Could not read config.json: {e}")
    return config


def get_spotify_token():
    """Get Spotify API token from config.json or env vars. Returns None if not configured."""
    config = load_config()
    client_id = config.get('spotify_client_id') or os.environ.get('SPOTIFY_CLIENT_ID', '')
    client_secret = config.get('spotify_client_secret') or os.environ.get('SPOTIFY_CLIENT_SECRET', '')
    if not client_id or not client_secret:
        return None
    try:
        import requests
        auth = base64.b64encode(f'{client_id}:{client_secret}'.encode()).decode()
        resp = requests.post('https://accounts.spotify.com/api/token',
            headers={'Authorization': f'Basic {auth}'},
            data={'grant_type': 'client_credentials'}, timeout=10)
        return resp.json().get('access_token')
    except Exception as e:
        print(f"  WARNING: Could not get Spotify token: {e}")
        return None


def lookup_spotify(token, title):
    """Search Spotify for a track. Returns URL or None."""
    try:
        import requests
        r = requests.get('https://api.spotify.com/v1/search',
            headers={'Authorization': f'Bearer {token}'},
            params={'q': f'track:{title} artist:{ARTIST_NAME}', 'type': 'track', 'limit': 5},
            timeout=10)
        for item in r.json().get('tracks', {}).get('items', []):
            if ARTIST_NAME.lower() in [a['name'].lower() for a in item['artists']]:
                return item['external_urls']['spotify']
    except Exception as e:
        print(f"  WARNING: Spotify lookup failed for '{title}': {e}")
    return None


def lookup_apple_music(title):
    """Search iTunes/Apple Music for a track. Returns URL or None."""
    try:
        import requests
        r = requests.get('https://itunes.apple.com/search',
            params={'term': f'{title} {ARTIST_NAME}', 'media': 'music', 'limit': 10},
            timeout=10)
        for item in r.json().get('results', []):
            if ARTIST_NAME.lower() in item.get('artistName', '').lower():
                if _titles_match(title, item['trackName']):
                    url = item.get('trackViewUrl', '')
                    if '&uo=' in url:
                        url = url[:url.index('&uo=')]
                    return url
    except Exception as e:
        print(f"  WARNING: Apple Music lookup failed for '{title}': {e}")
    return None


def lookup_deezer(title):
    """Search Deezer for a track. Returns URL or None."""
    try:
        import requests
        r = requests.get('https://api.deezer.com/search/track',
            params={'q': f'{title} {ARTIST_NAME}', 'limit': 10},
            timeout=10)
        for item in r.json().get('data', []):
            if ARTIST_NAME.lower() in item.get('artist', {}).get('name', '').lower():
                if _titles_match(title, item['title']):
                    return item['link']
    except Exception as e:
        print(f"  WARNING: Deezer lookup failed for '{title}': {e}")
    return None


def lookup_deezer_album(title):
    """Search Deezer for an album/EP. Returns URL or None."""
    try:
        import requests
        r = requests.get('https://api.deezer.com/search/album',
            params={'q': f'{title} {ARTIST_NAME}', 'limit': 10},
            timeout=10)
        for item in r.json().get('data', []):
            if ARTIST_NAME.lower() in item.get('artist', {}).get('name', '').lower():
                if _titles_match(title, item['title']):
                    return item['link']
    except Exception as e:
        print(f"  WARNING: Deezer album lookup failed for '{title}': {e}")
    return None


def lookup_spotify_album(token, title):
    """Search Spotify for an album/EP. Returns URL or None."""
    try:
        import requests
        r = requests.get('https://api.spotify.com/v1/search',
            headers={'Authorization': f'Bearer {token}'},
            params={'q': f'album:{title} artist:{ARTIST_NAME}', 'type': 'album', 'limit': 5},
            timeout=10)
        for item in r.json().get('albums', {}).get('items', []):
            if ARTIST_NAME.lower() in [a['name'].lower() for a in item['artists']]:
                return item['external_urls']['spotify']
    except Exception as e:
        print(f"  WARNING: Spotify album lookup failed for '{title}': {e}")
    return None


def lookup_apple_music_album(title):
    """Search iTunes/Apple Music for an album/EP. Returns URL or None."""
    try:
        import requests
        r = requests.get('https://itunes.apple.com/search',
            params={'term': f'{title} {ARTIST_NAME}', 'media': 'music',
                    'entity': 'album', 'limit': 10},
            timeout=10)
        for item in r.json().get('results', []):
            if ARTIST_NAME.lower() in item.get('artistName', '').lower():
                if _titles_match(title, item['collectionName']):
                    url = item.get('collectionViewUrl', '')
                    if '&uo=' in url:
                        url = url[:url.index('&uo=')]
                    return url
    except Exception as e:
        print(f"  WARNING: Apple Music album lookup failed for '{title}': {e}")
    return None


def get_tidal_token():
    """Get Tidal API token. Uses config.json/env credentials if available, otherwise
    falls back to built-in credentials for catalog search access."""
    config = load_config()
    client_id = config.get('tidal_client_id') or os.environ.get('TIDAL_CLIENT_ID', '')
    client_secret = config.get('tidal_client_secret') or os.environ.get('TIDAL_CLIENT_SECRET', '')
    if not client_id or not client_secret:
        # Fallback: use public catalog credentials (read-only search)
        client_id = 'fX2JxdmntZWK0ixT'
        client_secret = '1Nn9AfDAjxrgJFJbKNWLeAyKGVGmINuXPPLHVXAvxAg='
    try:
        import requests
        auth = base64.b64encode(f'{client_id}:{client_secret}'.encode()).decode()
        resp = requests.post('https://auth.tidal.com/v1/oauth2/token',
            headers={'Authorization': f'Basic {auth}'},
            data={'grant_type': 'client_credentials'}, timeout=10)
        return resp.json().get('access_token')
    except Exception as e:
        print(f"  WARNING: Could not get Tidal token: {e}")
        return None


_tidal_artist_tracks = None  # cached artist top-tracks


def _get_tidal_artist_tracks(token):
    """Get all tracks for the artist from Tidal (cached)."""
    global _tidal_artist_tracks
    if _tidal_artist_tracks is not None:
        return _tidal_artist_tracks
    _tidal_artist_tracks = {}
    try:
        import requests
        r = requests.get('https://api.tidal.com/v1/search/artists',
            headers={'Authorization': f'Bearer {token}'},
            params={'query': ARTIST_NAME, 'countryCode': 'US', 'limit': 1},
            timeout=10)
        items = r.json().get('items', [])
        if not items:
            return _tidal_artist_tracks
        artist_id = items[0]['id']
        r2 = requests.get(f'https://api.tidal.com/v1/artists/{artist_id}/toptracks',
            headers={'Authorization': f'Bearer {token}'},
            params={'countryCode': 'US', 'limit': 100},
            timeout=10)
        for t in r2.json().get('items', []):
            key = t['title'].split('(')[0].strip().lower()
            _tidal_artist_tracks[key] = t['id']
    except Exception as e:
        print(f"  WARNING: Could not fetch Tidal artist tracks: {e}")
    return _tidal_artist_tracks


def lookup_tidal(token, title):
    """Search Tidal for a track. Returns URL or None."""
    try:
        import requests
        r = requests.get('https://api.tidal.com/v1/search/tracks',
            headers={'Authorization': f'Bearer {token}'},
            params={'query': f'{title} {ARTIST_NAME}', 'countryCode': 'US', 'limit': 20},
            timeout=10)
        for item in r.json().get('items', []):
            artists = [a['name'].lower() for a in item.get('artists', [])]
            if ARTIST_NAME.lower() in artists:
                if _titles_match(title, item['title']):
                    return f'https://tidal.com/track/{item["id"]}'
        # Fallback: check artist's top tracks catalog
        catalog = _get_tidal_artist_tracks(token)
        for key, track_id in catalog.items():
            if _titles_match(title, key):
                return f'https://tidal.com/track/{track_id}'
    except Exception as e:
        print(f"  WARNING: Tidal lookup failed for '{title}': {e}")
    return None


def lookup_tidal_album(token, title):
    """Search Tidal for an album/EP. Returns URL or None."""
    try:
        import requests
        r = requests.get('https://api.tidal.com/v1/search/albums',
            headers={'Authorization': f'Bearer {token}'},
            params={'query': f'{title} {ARTIST_NAME}', 'countryCode': 'US', 'limit': 10},
            timeout=10)
        for item in r.json().get('items', []):
            artists = [a['name'].lower() for a in item.get('artists', [])]
            if ARTIST_NAME.lower() in artists:
                if _titles_match(title, item['title']):
                    return f'https://tidal.com/album/{item["id"]}'
    except Exception as e:
        print(f"  WARNING: Tidal album lookup failed for '{title}': {e}")
    return None


def auto_link_collection_streaming(md_path, frontmatter, title, spotify_token, tidal_token=None):
    """Look up missing Spotify/Apple Music/Tidal links for a collection."""
    updated = False

    if not frontmatter.get('spotify') and spotify_token:
        url = lookup_spotify_album(spotify_token, title)
        if url:
            if update_track_md_streaming(md_path, 'spotify', url):
                print(f"  Linked Spotify: {title} -> {url}")
                updated = True

    if not frontmatter.get('apple_music'):
        url = lookup_apple_music_album(title)
        if url:
            if update_track_md_streaming(md_path, 'apple_music', url):
                print(f"  Linked Apple Music: {title} -> {url}")
                updated = True
        time.sleep(0.3)

    if not frontmatter.get('tidal') and tidal_token:
        url = lookup_tidal_album(tidal_token, title)
        if url:
            if update_track_md_streaming(md_path, 'tidal', url):
                print(f"  Linked Tidal: {title} -> {url}")
                updated = True

    if not frontmatter.get('deezer'):
        url = lookup_deezer_album(title)
        if url:
            if update_track_md_streaming(md_path, 'deezer', url):
                print(f"  Linked Deezer: {title} -> {url}")
                updated = True
        time.sleep(0.3)

    return updated


def update_track_md_streaming(track_md_path, field, url):
    """Add a streaming link field to a .md frontmatter."""
    content = track_md_path.read_text(encoding='utf-8')
    frontmatter, body = parse_frontmatter(content)

    if frontmatter.get(field):
        return False  # already has it

    frontmatter[field] = url
    yaml_str = yaml.dump(frontmatter, default_flow_style=False, allow_unicode=True, sort_keys=False)
    new_content = f"---\n{yaml_str}---\n"
    if body:
        new_content += body + "\n"
    track_md_path.write_text(new_content, encoding='utf-8')
    return True


def auto_link_streaming(track_md_path, frontmatter, title, spotify_token, tidal_token=None):
    """Look up missing Spotify/Apple Music/Tidal links and write them to track.md."""
    updated = False

    if not frontmatter.get('spotify') and spotify_token:
        url = lookup_spotify(spotify_token, title)
        if url:
            if update_track_md_streaming(track_md_path, 'spotify', url):
                print(f"  Linked Spotify: {title} -> {url}")
                updated = True

    if not frontmatter.get('apple_music'):
        url = lookup_apple_music(title)
        if url:
            if update_track_md_streaming(track_md_path, 'apple_music', url):
                print(f"  Linked Apple Music: {title} -> {url}")
                updated = True
        time.sleep(0.3)  # iTunes API rate limit

    if not frontmatter.get('tidal') and tidal_token:
        url = lookup_tidal(tidal_token, title)
        if url:
            if update_track_md_streaming(track_md_path, 'tidal', url):
                print(f"  Linked Tidal: {title} -> {url}")
                updated = True

    if not frontmatter.get('deezer'):
        url = lookup_deezer(title)
        if url:
            if update_track_md_streaming(track_md_path, 'deezer', url):
                print(f"  Linked Deezer: {title} -> {url}")
                updated = True
        time.sleep(0.3)

    return updated


def load_all_tracks(spotify_token=None, tidal_token=None):
    """Load all tracks from the tracks/ directory into a lookup dict."""
    tracks = {}

    if not TRACKS_DIR.exists():
        return tracks

    for track_dir in TRACKS_DIR.iterdir():
        if not track_dir.is_dir() or track_dir.name.startswith('.'):
            continue

        track_slug = track_dir.name
        track_md = track_dir / 'track.md'
        frontmatter, description = read_md_file(track_md)

        # Auto-link missing streaming URLs
        title = frontmatter.get('title', track_slug.replace('_', ' ').title())
        if not frontmatter.get('spotify') or not frontmatter.get('apple_music') or not frontmatter.get('tidal') or not frontmatter.get('deezer'):
            if auto_link_streaming(track_md, frontmatter, title, spotify_token, tidal_token):
                frontmatter, description = read_md_file(track_md)

        # Find audio file (MP3 preferred for streaming)
        audio_file = find_file(track_dir, ['.mp3', '.m4a', '.flac', '.wav'])
        audio_path = build_asset_path(audio_file, 'audio') if audio_file else ""

        # Find WAV file specifically for download
        wav_file = find_file(track_dir, ['.wav'])
        wav_path = build_asset_path(wav_file, 'audio') if wav_file else ""

        # Get duration from MP3 and update track.md if needed
        mp3_file = find_file(track_dir, ['.mp3'])
        if mp3_file:
            mp3_duration = get_mp3_duration(mp3_file)
            if mp3_duration:
                if update_track_md_duration(track_md, mp3_duration):
                    # Re-read frontmatter after update
                    frontmatter, description = read_md_file(track_md)
                else:
                    frontmatter['duration'] = mp3_duration

        # Find lyrics file
        lyrics = ""
        lyrics_file = find_file(track_dir, ['.txt'])
        if lyrics_file:
            lyrics = lyrics_file.read_text(encoding='utf-8').strip()

        # Find track cover (optional)
        track_cover = find_file(track_dir, ['.jpg', '.jpeg', '.png', '.gif', '.webp'])
        track_cover_path = build_asset_path(track_cover, 'image') if track_cover else ""

        # Handle BPM
        bpm = frontmatter.get('bpm', '')
        if bpm is None or bpm == '':
            bpm = None
        else:
            try:
                bpm = int(bpm)
            except (ValueError, TypeError):
                bpm = None

        tracks[track_slug] = {
            'slug': track_slug.replace('_', '-'),
            'title': frontmatter.get('title', track_slug.replace('_', ' ').title()),
            'duration': str(frontmatter.get('duration', '')),
            'bpm': bpm,
            'key': frontmatter.get('key', ''),
            'mood': frontmatter.get('mood', []),
            'tags': frontmatter.get('tags', []),
            'description': description,
            'lyrics': lyrics if lyrics else frontmatter.get('lyrics', ''),
            'credits': frontmatter.get('credits', {}),
            'audioFile': audio_path,
            'wavFile': wav_path,
            'coverArt': track_cover_path,
            # Single-specific fields (used when track is a standalone single)
            'releaseDate': frontmatter.get('release_date', ''),
            'year': str(frontmatter.get('release_date', ''))[:4] if frontmatter.get('release_date') else '',
            'streamingLinks': {
                'spotify': frontmatter.get('spotify', ''),
                'appleMusic': frontmatter.get('apple_music', ''),
                'bandcamp': frontmatter.get('bandcamp', ''),
                'tidal': frontmatter.get('tidal', ''),
                'deezer': frontmatter.get('deezer', ''),
            },
        }

        if audio_path:
            tracks[track_slug]['waveform'] = audio_path.rsplit('.', 1)[0] + '.json'

    return tracks


def validate_release(release_dir, all_tracks):
    """Validate a release. Returns list of warnings."""
    warnings = []

    release_md = release_dir / 'collection.md'
    if not release_md.exists():
        warnings.append(f"FIXME: Missing collection.md in {release_dir.name}")
        return warnings

    frontmatter, _ = read_md_file(release_md)

    # Check for cover image
    cover = find_file(release_dir, ['.jpg', '.jpeg', '.png', '.gif', '.webp'])
    if not cover:
        placeholder_path = release_dir / f"{release_dir.name}.jpg"
        placeholder_path.touch()
        warnings.append(f"FIXME: Created placeholder cover: {release_dir.name}/{placeholder_path.name}")

    # Check track references
    track_refs = frontmatter.get('tracks', [])
    for track_ref in track_refs:
        if track_ref not in all_tracks:
            # Check if track directory exists but missing files
            track_dir = TRACKS_DIR / track_ref
            if track_dir.exists():
                audio = find_file(track_dir, ['.wav', '.flac', '.m4a', '.mp3'])
                if not audio:
                    placeholder = track_dir / f"{track_ref}.mp3"
                    placeholder.touch()
                    warnings.append(f"FIXME: Created placeholder audio: tracks/{track_ref}/{placeholder.name}")
            else:
                # Create track directory with placeholder
                track_dir.mkdir(parents=True, exist_ok=True)
                (track_dir / 'track.md').write_text(f"---\ntitle: \"{track_ref}\"\n---\n")
                (track_dir / f"{track_ref}.mp3").touch()
                warnings.append(f"FIXME: Created placeholder track: tracks/{track_ref}/")

    return warnings


def parse_release(release_dir, all_tracks):
    """Parse a release directory and return release data."""
    release_md = release_dir / 'collection.md'
    frontmatter, description = read_md_file(release_md)

    release_id = get_release_id(release_dir.name)
    release_type = frontmatter.get('type', 'album')

    # Find cover image
    cover = find_file(release_dir, ['.jpg', '.jpeg', '.png', '.gif', '.webp'])
    cover_path = build_asset_path(cover, 'image') if cover else ""

    # Build streaming links
    streaming_links = {}
    for platform in ['spotify', 'apple_music', 'bandcamp', 'tidal', 'deezer']:
        if frontmatter.get(platform):
            json_key = 'appleMusic' if platform == 'apple_music' else platform.replace('_', '')
            streaming_links[json_key] = frontmatter[platform]

    # Derive year from release_date
    release_date = frontmatter.get('release_date', '')
    year = str(release_date)[:4] if release_date else ''

    # Build base release data
    release_data = {
        'id': release_id,
        'title': frontmatter.get('title', release_dir.name),
        'year': year,
        'releaseDate': release_date,
        'type': release_type,
        'description': description,
        'coverArt': cover_path,
        'coverArtHigh': (cover_path.rsplit('.', 1)[0] + '-hires.' + cover_path.rsplit('.', 1)[1]) if cover_path else '',
        'tags': frontmatter.get('tags', []),
        'streamingLinks': streaming_links,
    }

    # Get tracks from references
    track_refs = frontmatter.get('tracks', [])
    tracks = []
    total_duration_secs = 0

    for idx, track_ref in enumerate(track_refs, 1):
        if track_ref in all_tracks:
            track_data = all_tracks[track_ref].copy()
            track_data['trackNumber'] = idx
            # Remove single-specific fields from track when part of collection
            for field in ['releaseDate', 'year']:
                track_data.pop(field, None)
            # Use track's own cover if available, otherwise release cover
            if not track_data.get('coverArt'):
                track_data['coverArt'] = cover_path
            tracks.append(track_data)
            total_duration_secs += calculate_duration(track_data['duration'])
        else:
            print(f"  WARNING: Track not found: {track_ref}")

    release_data['tracks'] = tracks
    release_data['totalDuration'] = format_duration(total_duration_secs)

    return release_data, release_type


def generate_rss(discography, all_tracks):
    """Generate an RSS feed with all tracks in chronological order."""
    if not SITE_URL:
        print("⚠ Skipping RSS: site_url not set in config.json")
        return
    artist = discography['artist']
    bio = discography.get('bio', '')
    # Extract domain for display (e.g. "https://example.com" -> "example.com")
    site_domain = SITE_URL.split('://', 1)[-1]

    # Flatten all tracks with their release info and date
    feed_items = []
    for release in discography['albums']:
        for track in release.get('tracks', []):
            feed_items.append({
                'track': track,
                'release': release,
                'date': track.get('releaseDate') or release.get('releaseDate', ''),
            })
    for release in discography['singles']:
        if release.get('tracks'):
            # EP
            for track in release['tracks']:
                feed_items.append({
                    'track': track,
                    'release': release,
                    'date': track.get('releaseDate') or release.get('releaseDate', ''),
                })
        else:
            feed_items.append({
                'track': release,
                'release': release,
                'date': release.get('releaseDate', ''),
            })

    # Sort by date, newest first
    def sort_key(item):
        try:
            return datetime.strptime(str(item['date']), '%Y-%m-%d')
        except (ValueError, TypeError):
            return datetime.min
    feed_items.sort(key=sort_key, reverse=True)

    # Build date for channel
    if feed_items and feed_items[0]['date']:
        try:
            build_dt = datetime.strptime(str(feed_items[0]['date']), '%Y-%m-%d')
        except ValueError:
            build_dt = datetime.now()
    else:
        build_dt = datetime.now()

    now_rfc = format_datetime(datetime.now().astimezone())
    feed_url = f"{SITE_URL}/feed.rss"

    # Clean and recreate feed pages directory
    import shutil
    if FEED_PAGES_DIR.exists():
        shutil.rmtree(FEED_PAGES_DIR)
    FEED_PAGES_DIR.mkdir(parents=True)

    items_xml = []
    for item in feed_items:
        track = item['track']
        release = item['release']
        title = xml_escape(track.get('title', ''))
        slug = track.get('slug') or track.get('id', '')
        player_link = f"{SITE_URL}/#/track/{slug}"
        feed_link = f"{SITE_URL}/feed/{slug}.html"
        description = track.get('description') or release.get('description') or ''
        lyrics = track.get('lyrics', '')
        cover = track.get('coverArt') or release.get('coverArt', '')
        cover_url = f"{SITE_URL}/{cover}" if cover else ''

        # Build content for RSS
        content_parts = []
        if cover:
            content_parts.append(f'<p><img src="{xml_escape(cover_url)}" alt="{title}" style="max-width:300px" /></p>')
        if description:
            content_parts.append(f'<p>{xml_escape(description)}</p>')
        if lyrics and lyrics.strip() and lyrics.strip() != '[Instrumental]':
            content_parts.append(f'<h3>Lyrics</h3><pre>{xml_escape(lyrics)}</pre>')
        content_parts.append(f'<p><a href="{xml_escape(player_link)}">Listen to {title} on {xml_escape(site_domain)}</a></p>')

        content_html = '\n'.join(content_parts)

        # Generate static HTML page for this track
        tags_list = track.get('tags', []) + track.get('mood', [])
        page_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} — {xml_escape(artist)}</title>
<meta name="description" content="{xml_escape(description)}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{xml_escape(description)}">
<meta property="og:type" content="music.song">
<meta property="og:url" content="{xml_escape(feed_link)}">
{f'<meta property="og:image" content="{xml_escape(cover_url)}">' if cover_url else ''}
<style>
body {{ font-family: -apple-system, system-ui, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem 1rem; background: #121212; color: #e0e0e0; }}
img {{ max-width: 300px; border-radius: 8px; }}
a {{ color: #1db954; }}
h1 {{ margin-bottom: 0.25rem; }}
.meta {{ color: #999; font-size: 0.9rem; margin-bottom: 1.5rem; }}
.tags {{ display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1.5rem; }}
.tag {{ background: #282828; padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.8rem; color: #aaa; }}
pre {{ white-space: pre-wrap; color: #ccc; line-height: 1.6; }}
.listen {{ display: inline-block; margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: #1db954; color: #000; text-decoration: none; border-radius: 24px; font-weight: 600; }}
.listen:hover {{ background: #1ed760; }}
</style>
</head>
<body>
{f'<img src="{xml_escape(cover_url)}" alt="{title}">' if cover_url else ''}
<h1>{title}</h1>
<p class="meta">{xml_escape(artist)}{f" &middot; {xml_escape(str(item['date'])[:4])}" if item['date'] else ''}{f" &middot; {xml_escape(track.get('duration', ''))}" if track.get('duration') else ''}</p>
{f"<p>{xml_escape(description)}</p>" if description else ''}
{f"<h2>Lyrics</h2><pre>{xml_escape(lyrics)}</pre>" if lyrics and lyrics.strip() and lyrics.strip() != '[Instrumental]' else ''}
<a class="listen" href="{xml_escape(player_link)}">Listen on {xml_escape(site_domain)}</a>
</body>
</html>"""
        page_path = FEED_PAGES_DIR / f"{slug}.html"
        page_path.write_text(page_html, encoding='utf-8')

        # Date
        pub_date = ''
        if item['date']:
            try:
                dt = datetime.strptime(str(item['date']), '%Y-%m-%d').astimezone()
                pub_date = format_datetime(dt)
            except (ValueError, TypeError):
                pass

        # Tags as categories
        categories = ''.join(f'        <category>{xml_escape(t)}</category>\n' for t in tags_list)

        # Duration
        duration = track.get('duration', '')

        item_xml = f"""    <item>
      <title>{title}</title>
      <link>{xml_escape(feed_link)}</link>
      <guid isPermaLink="true">{xml_escape(feed_link)}</guid>
      <description>{xml_escape(description)}</description>
      <content:encoded><![CDATA[{content_html}]]></content:encoded>
{categories}"""
        if pub_date:
            item_xml += f'      <pubDate>{pub_date}</pubDate>\n'
        if cover:
            item_xml += f'      <enclosure url="{xml_escape(cover_url)}" type="image/jpeg" length="0" />\n'
        if duration:
            item_xml += f'      <itunes:duration>{xml_escape(duration)}</itunes:duration>\n'
        item_xml += '    </item>'
        items_xml.append(item_xml)

    rss = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>{xml_escape(artist)}</title>
    <link>{SITE_URL}</link>
    <description>{xml_escape(bio[:500])}</description>
    <language>en</language>
    <lastBuildDate>{now_rfc}</lastBuildDate>
    <atom:link href="{xml_escape(feed_url)}" rel="self" type="application/rss+xml" />
{chr(10).join(items_xml)}
  </channel>
</rss>
"""
    RSS_PATH.write_text(rss, encoding='utf-8')
    print(f"✓ Generated: {RSS_PATH}")
    print(f"  Feed items: {len(feed_items)}")
    print(f"  Feed pages: {FEED_PAGES_DIR}/ ({len(feed_items)} pages)")


def generate_index_html(discography):
    """Generate data/index.html with OpenGraph meta tags and favicon."""
    import shutil

    artist = discography['artist']
    title = SITE_TITLE or artist
    bio = discography.get('bio', '')
    # Truncate bio for OG description
    og_desc = bio[:200].replace('\n', ' ').strip()
    if len(bio) > 200:
        og_desc += '...'

    # Copy artist profile image to data/og-image.jpg for a stable OG image URL
    profile_img = find_file(ARTIST_DIR, ['.jpg', '.jpeg', '.png', '.gif', '.webp'])
    og_image_path = ''
    og_image_url = ''
    if profile_img:
        ext = profile_img.suffix
        dest = DATA_OUTPUT_DIR / f"og-image{ext}"
        shutil.copy2(str(profile_img), str(dest))
        og_image_path = f"data/og-image{ext}"
        if SITE_URL:
            og_image_url = f"{SITE_URL}/{og_image_path}"

    import re as _re

    # Read source index.html and replace hardcoded titles with configured values
    source_html = INDEX_HTML.read_text(encoding='utf-8')
    source_html = _re.sub(r'<title>[^<]*</title>', f'<title>{escape(title)}</title>', source_html)
    source_html = _re.sub(r'(rel="alternate"[^>]*title=")[^"]*(")', rf'\g<1>{escape(title)}\2', source_html)

    # Write updated root index.html
    INDEX_HTML.write_text(source_html, encoding='utf-8')
    print(f"✓ Updated: {INDEX_HTML}")

    # Build OG meta tags for the deploy version
    og_tags = []
    og_tags.append(f'    <meta property="og:type" content="website">')
    og_tags.append(f'    <meta property="og:title" content="{escape(title)}">')
    if og_desc:
        og_tags.append(f'    <meta property="og:description" content="{escape(og_desc)}">')
    if SITE_URL:
        og_tags.append(f'    <meta property="og:url" content="{escape(SITE_URL)}">')
    if og_image_url:
        og_tags.append(f'    <meta property="og:image" content="{escape(og_image_url)}">')
        og_tags.append(f'    <meta property="og:image:width" content="512">')
        og_tags.append(f'    <meta property="og:image:height" content="512">')
    og_tags.append(f'    <meta name="description" content="{escape(og_desc)}">')
    # Twitter card
    og_tags.append(f'    <meta name="twitter:card" content="summary">')
    og_tags.append(f'    <meta name="twitter:title" content="{escape(title)}">')
    if og_desc:
        og_tags.append(f'    <meta name="twitter:description" content="{escape(og_desc)}">')
    if og_image_url:
        og_tags.append(f'    <meta name="twitter:image" content="{escape(og_image_url)}">')

    og_block = '\n'.join(og_tags) + '\n'

    # Inject OG tags into a copy for deployment
    deploy_html = source_html.replace(
        '    <title>',
        og_block + '    <title>'
    )

    # Write to data/index.html (for deploy)
    output_path = DATA_OUTPUT_DIR / 'index.html'
    output_path.write_text(deploy_html, encoding='utf-8')
    print(f"✓ Generated: {output_path}")


def main():
    global BASE_URL, SITE_URL, SITE_TITLE

    args = sys.argv[1:]
    if '--base-url' in args:
        idx = args.index('--base-url')
        if idx + 1 < len(args):
            BASE_URL = args[idx + 1]
            print(f"Using base URL: {BASE_URL}")

    # Load site_url from config.json
    config_path = CONFIG_PATH
    if config_path.exists():
        try:
            config = json.loads(config_path.read_text())
            SITE_URL = config.get('site_url', '').rstrip('/')
            SITE_TITLE = config.get('site_title', '')
        except Exception:
            pass

    if not MUSIC_DIR.exists():
        print(f"ERROR: Music directory not found: {MUSIC_DIR}")
        sys.exit(1)

    print(f"Building discography from: {MUSIC_DIR}")

    # Get API tokens once for all lookups
    spotify_token = get_spotify_token()
    if spotify_token:
        print("  Spotify API: authenticated")

    tidal_token = get_tidal_token()
    if tidal_token:
        print("  Tidal API: authenticated")

    # Load all tracks first
    print("  Loading tracks...")
    all_tracks = load_all_tracks(spotify_token, tidal_token)
    print(f"  Found {len(all_tracks)} tracks")

    all_warnings = []

    # Parse artist
    artist_data = parse_artist()

    # Parse releases (albums and EPs only)
    albums = []
    eps = []
    used_tracks = set()

    if COLLECTIONS_DIR.exists():
        release_dirs = sorted([d for d in COLLECTIONS_DIR.iterdir()
                              if d.is_dir() and not d.name.startswith('.')])

        for release_dir in release_dirs:
            # Skip if no collection.md
            if not (release_dir / 'collection.md').exists():
                continue

            print(f"  Processing collection: {release_dir.name}")

            # Validate
            warnings = validate_release(release_dir, all_tracks)
            all_warnings.extend(warnings)

            # Reload tracks if we created placeholders
            if warnings:
                all_tracks = load_all_tracks(spotify_token, tidal_token)

            # Auto-link missing streaming URLs for collection
            coll_md = release_dir / 'collection.md'
            coll_fm, _ = read_md_file(coll_md)
            coll_title = coll_fm.get('title', release_dir.name)
            if not coll_fm.get('spotify') or not coll_fm.get('apple_music') or not coll_fm.get('tidal') or not coll_fm.get('deezer'):
                auto_link_collection_streaming(coll_md, coll_fm, coll_title, spotify_token, tidal_token)

            # Parse
            release_data, release_type = parse_release(release_dir, all_tracks)

            # Track which tracks are used
            frontmatter, _ = read_md_file(coll_md)
            for track_ref in frontmatter.get('tracks', []):
                used_tracks.add(track_ref)

            if release_type == 'album':
                albums.append(release_data)
            elif release_type == 'ep':
                eps.append(release_data)

    # Singles are tracks not used by any album/EP
    singles = []
    for track_slug, track_data in all_tracks.items():
        if track_slug not in used_tracks:
            print(f"  Processing single: {track_slug}")
            single = {
                'id': track_slug.replace('_', '-'),
                'title': track_data['title'],
                'year': track_data.get('year', ''),
                'releaseDate': track_data.get('releaseDate', ''),
                'type': 'single',
                'description': track_data['description'],
                'coverArt': track_data.get('coverArt', ''),
                'coverArtHigh': (track_data['coverArt'].rsplit('.', 1)[0] + '-hires.' + track_data['coverArt'].rsplit('.', 1)[1]) if track_data.get('coverArt') else '',
                'tags': track_data.get('tags', []),
                'streamingLinks': {k: v for k, v in track_data.get('streamingLinks', {}).items() if v},
                'duration': track_data['duration'],
                'bpm': track_data['bpm'],
                'key': track_data['key'],
                'mood': track_data['mood'],
                'lyrics': track_data['lyrics'],
                'credits': track_data['credits'],
                'audioFile': track_data['audioFile'],
                'wavFile': track_data.get('wavFile', ''),
                'waveform': track_data.get('waveform', ''),
            }
            singles.append(single)

    # Combine EPs with singles (both go in singles array)
    singles.extend(eps)

    # Sort by release date (newest first)
    def get_release_date(r):
        date_str = r.get('releaseDate', '')
        if date_str:
            try:
                return datetime.strptime(str(date_str), '%Y-%m-%d')
            except ValueError:
                pass
        return datetime.min

    albums.sort(key=get_release_date, reverse=True)
    singles.sort(key=get_release_date, reverse=True)

    # Build final JSON
    discography = {
        'artist': artist_data['artist'],
        'bio': artist_data['bio'],
        'socialLinks': artist_data['socialLinks'],
        'albums': albums,
        'singles': singles
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(discography, f, indent=2, ensure_ascii=False)

    # Also generate discography.js for file:// access (no fetch needed)
    js_path = OUTPUT_PATH.parent / 'discography.js'
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write('window._discographyData = ')
        json.dump(discography, f, indent=2, ensure_ascii=False)
        f.write(';\n')

    print(f"\n✓ Generated: {OUTPUT_PATH}")
    print(f"✓ Generated: {js_path}")

    # Generate RSS feed
    generate_rss(discography, all_tracks)

    # Generate index.html with OG tags and favicon
    generate_index_html(discography)

    print(f"  Albums: {len(albums)}")
    print(f"  Singles/EPs: {len(singles)}")
    print(f"  Total tracks: {len(all_tracks)}")

    if all_warnings:
        print(f"\n⚠ Warnings ({len(all_warnings)}):")
        for warning in all_warnings:
            print(f"  - {warning}")

    return 0 if not all_warnings else 1


if __name__ == "__main__":
    sys.exit(main())
