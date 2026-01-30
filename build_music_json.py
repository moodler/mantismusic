#!/usr/bin/env python3
"""
build_music_json.py - The Compiler

Reads the music/ folder structure and compiles it into data/discography.json
for the web application.

Structure:
  music/
  ├── artist.md
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


BASE_DIR = Path(__file__).parent
MUSIC_DIR = BASE_DIR / "music"
TRACKS_DIR = MUSIC_DIR / "tracks"
COLLECTIONS_DIR = MUSIC_DIR / "collections"
OUTPUT_PATH = BASE_DIR / "data" / "discography.json"

BASE_URL = ""


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
    artist_md = MUSIC_DIR / "artist.md"
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
    config_path = BASE_DIR / 'config.json'
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
            'slug': track_slug,
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
            for field in ['slug', 'releaseDate', 'year']:
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


def main():
    global BASE_URL

    args = sys.argv[1:]
    if '--base-url' in args:
        idx = args.index('--base-url')
        if idx + 1 < len(args):
            BASE_URL = args[idx + 1]
            print(f"Using base URL: {BASE_URL}")

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

    print(f"\n✓ Generated: {OUTPUT_PATH}")
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
