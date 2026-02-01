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
admin.py - Local Flask admin UI for managing music metadata.

Reads/writes the YAML frontmatter .md files under music/ and provides
a web interface for editing tracks, collections, and artist info.

Usage:
    python3 admin.py
    # Open http://localhost:5001
"""

import base64
import json
import os
import re
import subprocess
import yaml
from pathlib import Path
from flask import Flask, render_template, request, jsonify, send_from_directory, Response

BASE_DIR = Path(os.environ.get('MANTIS_PROJECT_DIR', Path(__file__).parent))
app = Flask(__name__, template_folder=str(BASE_DIR / 'templates'))
MUSIC_DIR = BASE_DIR / "music"
TRACKS_DIR = MUSIC_DIR / "tracks"
COLLECTIONS_DIR = MUSIC_DIR / "collections"
ARTIST_DIR = MUSIC_DIR / "artist"

IMAGE_EXTS = ('.jpg', '.jpeg', '.png', '.gif', '.webp')
AUDIO_EXTS = ('.mp3', '.m4a', '.flac', '.wav')


# ---------------------------------------------------------------------------
# Data helpers
# ---------------------------------------------------------------------------

def parse_frontmatter(content):
    if not content.startswith('---'):
        return {}, content
    parts = content.split('---', 2)
    if len(parts) < 3:
        return {}, content
    try:
        fm = yaml.safe_load(parts[1])
        body = parts[2].strip()
        return fm or {}, body
    except yaml.YAMLError:
        return {}, content


def read_md_file(path):
    if not path.exists():
        return {}, ""
    content = path.read_text(encoding='utf-8')
    fm, body = parse_frontmatter(content)
    for key, val in fm.items():
        if hasattr(val, 'isoformat'):
            fm[key] = val.isoformat()
    return fm, body


def write_md_file(path, frontmatter, body=""):
    yaml_str = yaml.dump(frontmatter, default_flow_style=False,
                         allow_unicode=True, sort_keys=False)
    content = f"---\n{yaml_str}---\n"
    if body:
        content += body.strip() + "\n"
    path.write_text(content, encoding='utf-8')


def find_file(directory, extensions):
    for ext in extensions:
        for f in directory.glob(f"*{ext}"):
            if not f.name.startswith('.'):
                return f
    return None


def find_files(directory, extensions):
    found = []
    for ext in extensions:
        for f in directory.glob(f"*{ext}"):
            if not f.name.startswith('.'):
                found.append(f)
    return found


def load_all_tracks():
    tracks = {}
    if not TRACKS_DIR.exists():
        return tracks
    for track_dir in sorted(TRACKS_DIR.iterdir()):
        if not track_dir.is_dir() or track_dir.name.startswith('.'):
            continue
        slug = track_dir.name
        fm, body = read_md_file(track_dir / 'track.md')
        filenames = [f.name for f in track_dir.iterdir() if not f.name.startswith('.')]
        audio_files = [f for f in filenames if any(f.endswith(e) for e in AUDIO_EXTS)]
        cover_files = [f for f in filenames if any(f.endswith(e) for e in IMAGE_EXTS)]
        lyrics_files = [f for f in filenames if f.endswith('.txt')]

        tracks[slug] = {
            'slug': slug,
            'title': fm.get('title', slug.replace('_', ' ').title()),
            'frontmatter': fm,
            'description': body,
            'has_audio': len(audio_files) > 0,
            'has_cover': len(cover_files) > 0,
            'has_lyrics': len(lyrics_files) > 0,
            'audio_files': audio_files,
            'cover_files': cover_files,
            'lyrics_files': lyrics_files,
            'files': filenames,
        }
    return tracks


def load_all_collections():
    collections = {}
    if not COLLECTIONS_DIR.exists():
        return collections
    for coll_dir in sorted(COLLECTIONS_DIR.iterdir()):
        if not coll_dir.is_dir() or coll_dir.name.startswith('.'):
            continue
        slug = coll_dir.name
        fm, body = read_md_file(coll_dir / 'collection.md')
        filenames = [f.name for f in coll_dir.iterdir() if not f.name.startswith('.')]
        cover_files = [f for f in filenames if any(f.endswith(e) for e in IMAGE_EXTS)]

        collections[slug] = {
            'slug': slug,
            'title': fm.get('title', slug.replace('_', ' ').title()),
            'type': fm.get('type', 'album'),
            'release_date': str(fm.get('release_date', '')),
            'frontmatter': fm,
            'description': body,
            'track_slugs': fm.get('tracks', []),
            'has_cover': len(cover_files) > 0,
            'cover_files': cover_files,
        }
    return collections


def generate_health_report():
    tracks = load_all_tracks()
    collections = load_all_collections()

    used_slugs = set()
    for c in collections.values():
        used_slugs.update(c['track_slugs'])

    singles = {s: t for s, t in tracks.items() if s not in used_slugs}
    issues = []

    for slug, t in tracks.items():
        fm = t['frontmatter']
        if not t['has_audio']:
            issues.append({'type': 'error', 'scope': 'track', 'slug': slug,
                           'msg': f'Track "{t["title"]}" has no audio file'})
        if not t['has_cover']:
            issues.append({'type': 'warning', 'scope': 'track', 'slug': slug,
                           'msg': f'Track "{t["title"]}" has no cover art'})
        if not t['has_lyrics'] and 'Instrumental' not in (fm.get('tags') or []):
            issues.append({'type': 'info', 'scope': 'track', 'slug': slug,
                           'msg': f'Track "{t["title"]}" has no lyrics file'})
        if not fm.get('tags'):
            issues.append({'type': 'warning', 'scope': 'track', 'slug': slug,
                           'msg': f'Track "{t["title"]}" has no tags'})
        if not fm.get('duration'):
            issues.append({'type': 'warning', 'scope': 'track', 'slug': slug,
                           'msg': f'Track "{t["title"]}" has no duration'})
        if not fm.get('credits'):
            issues.append({'type': 'info', 'scope': 'track', 'slug': slug,
                           'msg': f'Track "{t["title"]}" has no credits'})
        if not t['description']:
            issues.append({'type': 'info', 'scope': 'track', 'slug': slug,
                           'msg': f'Track "{t["title"]}" has no description'})

    for slug, c in collections.items():
        fm = c['frontmatter']
        if not c['has_cover']:
            issues.append({'type': 'error', 'scope': 'collection', 'slug': slug,
                           'msg': f'Collection "{c["title"]}" has no cover art'})
        if not fm.get('release_date'):
            issues.append({'type': 'warning', 'scope': 'collection', 'slug': slug,
                           'msg': f'Collection "{c["title"]}" has no release date'})
        for ref in c['track_slugs']:
            if ref not in tracks:
                issues.append({'type': 'error', 'scope': 'collection', 'slug': slug,
                               'msg': f'Collection "{c["title"]}" references missing track "{ref}"'})
        if not fm.get('tags'):
            issues.append({'type': 'warning', 'scope': 'collection', 'slug': slug,
                           'msg': f'Collection "{c["title"]}" has no tags'})

    for slug, t in singles.items():
        fm = t['frontmatter']
        if not fm.get('spotify') and not fm.get('apple_music'):
            issues.append({'type': 'info', 'scope': 'track', 'slug': slug,
                           'msg': f'Single "{t["title"]}" has no streaming links'})
        if not fm.get('release_date'):
            issues.append({'type': 'warning', 'scope': 'track', 'slug': slug,
                           'msg': f'Single "{t["title"]}" has no release date'})

    return {
        'total_tracks': len(tracks),
        'total_collections': len(collections),
        'total_singles': len(singles),
        'issues': issues,
        'error_count': sum(1 for i in issues if i['type'] == 'error'),
        'warning_count': sum(1 for i in issues if i['type'] == 'warning'),
        'info_count': sum(1 for i in issues if i['type'] == 'info'),
    }


def remove_cover_images(directory):
    for ext in IMAGE_EXTS:
        for f in directory.glob(f"*{ext}"):
            if not f.name.startswith('.'):
                f.unlink()


def find_image_by_prefix(directory, prefix):
    """Find an image file matching a name prefix (e.g. 'profile' finds profile.jpg)."""
    for ext in IMAGE_EXTS:
        path = directory / f"{prefix}{ext}"
        if path.exists():
            return path
    return None


def remove_images_by_prefix(directory, prefix):
    """Remove all image files matching a name prefix."""
    for ext in IMAGE_EXTS:
        path = directory / f"{prefix}{ext}"
        if path.exists():
            path.unlink()


def capitalize_tags(tags):
    return [t[:1].upper() + t[1:] if t else t for t in tags]


def slugify(title):
    slug = title.lower().strip()
    slug = slug.replace(' ', '_')
    slug = ''.join(c for c in slug if c.isalnum() or c == '_')
    slug = '_'.join(part for part in slug.split('_') if part)
    return slug


# ---------------------------------------------------------------------------
# Page routes
# ---------------------------------------------------------------------------

@app.route('/')
def dashboard():
    tracks = load_all_tracks()
    collections = load_all_collections()
    report = generate_health_report()

    used_slugs = set()
    for c in collections.values():
        used_slugs.update(c['track_slugs'])

    return render_template('admin_dashboard.html',
                           tracks=tracks, collections=collections,
                           used_slugs=used_slugs, report=report)


@app.route('/track/new')
def new_track():
    return render_template('admin_track.html', track=None, slug=None,
                           collections=load_all_collections())


@app.route('/track/<slug>')
def edit_track(slug):
    track_dir = TRACKS_DIR / slug
    if not track_dir.exists():
        return "Track not found", 404
    fm, body = read_md_file(track_dir / 'track.md')

    # Load lyrics from .txt file
    lyrics = ""
    lyrics_file = find_file(track_dir, ['.txt'])
    if lyrics_file:
        lyrics = lyrics_file.read_text(encoding='utf-8')

    # Find audio and cover files
    audio_files = find_files(track_dir, AUDIO_EXTS)
    cover_file = find_file(track_dir, IMAGE_EXTS)

    # Build per-format audio info
    audio_by_format = {}
    for af in audio_files:
        ext = af.suffix.lstrip('.').lower()
        label = ext.upper()
        audio_by_format[label] = {
            'url': f'/music/tracks/{slug}/{af.name}',
            'filename': af.name,
        }

    # Determine prev/next tracks
    all_slugs = sorted(
        d.name for d in TRACKS_DIR.iterdir()
        if d.is_dir() and not d.name.startswith('.')
    ) if TRACKS_DIR.exists() else []
    idx = all_slugs.index(slug) if slug in all_slugs else -1
    prev_slug = all_slugs[idx - 1] if idx > 0 else None
    next_slug = all_slugs[idx + 1] if 0 <= idx < len(all_slugs) - 1 else None

    track_data = {
        'slug': slug,
        'frontmatter': fm,
        'description': body,
        'lyrics': lyrics,
        'audio_url': audio_by_format[next(iter(audio_by_format))]['url'] if audio_by_format else None,
        'cover_url': f'/music/tracks/{slug}/{cover_file.name}' if cover_file else None,
        'audio_files': [f.name for f in audio_files],
        'audio_by_format': audio_by_format,
        'has_lyrics': lyrics_file is not None,
    }
    return render_template('admin_track.html', track=track_data, slug=slug,
                           prev_slug=prev_slug, next_slug=next_slug,
                           collections=load_all_collections())


@app.route('/collection/new')
def new_collection():
    tracks = load_all_tracks()
    return render_template('admin_collection.html', collection=None, slug=None,
                           all_tracks=tracks)


@app.route('/collection/<slug>')
def edit_collection(slug):
    coll_dir = COLLECTIONS_DIR / slug
    if not coll_dir.exists():
        return "Collection not found", 404
    fm, body = read_md_file(coll_dir / 'collection.md')
    cover_file = find_file(coll_dir, IMAGE_EXTS)

    tracks = load_all_tracks()
    track_details = []
    for track_slug in fm.get('tracks', []):
        if track_slug in tracks:
            t = tracks[track_slug]
            track_details.append({
                'slug': track_slug,
                'title': t['title'],
                'duration': t['frontmatter'].get('duration', ''),
                'has_audio': t['has_audio'],
                'has_cover': t['has_cover'],
                'has_lyrics': t['has_lyrics'],
            })
        else:
            track_details.append({
                'slug': track_slug,
                'title': track_slug.replace('_', ' ').title(),
                'duration': '',
                'has_audio': False, 'has_cover': False, 'has_lyrics': False,
                'missing': True,
            })

    coll_data = {
        'slug': slug,
        'frontmatter': fm,
        'description': body,
        'cover_url': f'/music/collections/{slug}/{cover_file.name}' if cover_file else None,
        'track_details': track_details,
    }
    return render_template('admin_collection.html', collection=coll_data, slug=slug,
                           all_tracks=tracks)


@app.route('/artist')
def edit_artist():
    fm, body = read_md_file(ARTIST_DIR / 'artist.md')
    profile_img = find_image_by_prefix(ARTIST_DIR, 'profile')
    banner_img = find_image_by_prefix(ARTIST_DIR, 'banner')
    return render_template('admin_artist.html', frontmatter=fm, bio=body,
                           profile_url=f'/music/artist/{profile_img.name}' if profile_img else None,
                           banner_url=f'/music/artist/{banner_img.name}' if banner_img else None)


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------

@app.route('/api/track/<slug>/save', methods=['POST'])
def save_track(slug):
    track_dir = TRACKS_DIR / slug
    if not track_dir.exists():
        return jsonify(error="Track not found"), 404

    data = request.get_json()
    description = data.pop('description', '')

    # Build frontmatter from submitted data
    fm = {}
    if data.get('title'):
        fm['title'] = data['title']
    if data.get('duration'):
        fm['duration'] = data['duration']
    if data.get('release_date'):
        fm['release_date'] = data['release_date']
    if data.get('tags'):
        fm['tags'] = capitalize_tags(data['tags'])
    if data.get('bpm'):
        try:
            fm['bpm'] = int(data['bpm'])
        except (ValueError, TypeError):
            pass
    if data.get('key'):
        fm['key'] = data['key']
    if data.get('mood'):
        fm['mood'] = data['mood']
    if data.get('credits'):
        fm['credits'] = data['credits']

    # Streaming links
    for platform in ['spotify', 'apple_music', 'tidal', 'deezer']:
        if data.get(platform):
            fm[platform] = data[platform]

    write_md_file(track_dir / 'track.md', fm, description)
    return jsonify(ok=True)


@app.route('/api/track/create', methods=['POST'])
def create_track():
    data = request.get_json()
    title = data.get('title', '').strip()
    if not title:
        return jsonify(error="Title is required"), 400

    slug = data.get('slug') or slugify(title)
    track_dir = TRACKS_DIR / slug
    if track_dir.exists():
        return jsonify(error=f"Track '{slug}' already exists"), 409

    track_dir.mkdir(parents=True)
    fm = {'title': title}
    write_md_file(track_dir / 'track.md', fm)
    return jsonify(ok=True, slug=slug)


@app.route('/api/track/<slug>/lyrics', methods=['POST'])
def save_lyrics(slug):
    track_dir = TRACKS_DIR / slug
    if not track_dir.exists():
        return jsonify(error="Track not found"), 404

    data = request.get_json()
    lyrics = data.get('lyrics', '')
    lyrics_path = track_dir / f"{slug}.txt"

    if lyrics.strip():
        lyrics_path.write_text(lyrics, encoding='utf-8')
    elif lyrics_path.exists():
        lyrics_path.unlink()

    return jsonify(ok=True)


@app.route('/api/track/<slug>/cover', methods=['POST'])
def upload_track_cover(slug):
    track_dir = TRACKS_DIR / slug
    if not track_dir.exists():
        return jsonify(error="Track not found"), 404

    remove_cover_images(track_dir)

    if 'file' in request.files:
        file = request.files['file']
        ext = Path(file.filename).suffix or '.jpg'
        dest = track_dir / f"{slug}{ext}"
        file.save(str(dest))
    elif request.is_json and request.json.get('dataUrl'):
        data_url = request.json['dataUrl']
        header, data = data_url.split(',', 1)
        ext = '.png' if 'png' in header else '.jpg'
        dest = track_dir / f"{slug}{ext}"
        dest.write_bytes(base64.b64decode(data))
    else:
        return jsonify(error="No image provided"), 400

    return jsonify(ok=True, url=f'/music/tracks/{slug}/{dest.name}')


@app.route('/api/track/<slug>/audio/<fmt>', methods=['POST', 'DELETE'])
def manage_track_audio(slug, fmt):
    track_dir = TRACKS_DIR / slug
    if not track_dir.exists():
        return jsonify(error="Track not found"), 404

    fmt = fmt.lower()
    if fmt not in ('mp3', 'wav', 'm4a', 'flac'):
        return jsonify(error="Unsupported format"), 400

    if request.method == 'DELETE':
        for f in track_dir.glob(f'*.{fmt}'):
            f.unlink()
        return jsonify(ok=True)

    if 'file' not in request.files:
        return jsonify(error="No file provided"), 400

    file = request.files['file']
    # Remove any existing file of this format
    for f in track_dir.glob(f'*.{fmt}'):
        f.unlink()
    dest = track_dir / f"{slug}.{fmt}"
    file.save(str(dest))
    return jsonify(ok=True, url=f'/music/tracks/{slug}/{dest.name}', filename=dest.name)


@app.route('/api/collection/<slug>/save', methods=['POST'])
def save_collection(slug):
    coll_dir = COLLECTIONS_DIR / slug
    if not coll_dir.exists():
        return jsonify(error="Collection not found"), 404

    data = request.get_json()
    description = data.pop('description', '')

    fm = {}
    if data.get('title'):
        fm['title'] = data['title']
    if data.get('type'):
        fm['type'] = data['type']
    if data.get('release_date'):
        fm['release_date'] = data['release_date']
    if data.get('tags'):
        fm['tags'] = capitalize_tags(data['tags'])
    if data.get('tracks'):
        fm['tracks'] = data['tracks']

    for platform in ['spotify', 'apple_music', 'tidal', 'deezer']:
        if data.get(platform):
            fm[platform] = data[platform]

    write_md_file(coll_dir / 'collection.md', fm, description)
    return jsonify(ok=True)


@app.route('/api/collection/create', methods=['POST'])
def create_collection():
    data = request.get_json()
    title = data.get('title', '').strip()
    if not title:
        return jsonify(error="Title is required"), 400

    slug = data.get('slug') or slugify(title)
    coll_dir = COLLECTIONS_DIR / slug
    if coll_dir.exists():
        return jsonify(error=f"Collection '{slug}' already exists"), 409

    coll_dir.mkdir(parents=True)
    fm = {'title': title, 'type': data.get('type', 'album'), 'tracks': []}
    write_md_file(coll_dir / 'collection.md', fm)
    return jsonify(ok=True, slug=slug)


@app.route('/api/collection/<slug>/cover', methods=['POST'])
def upload_collection_cover(slug):
    coll_dir = COLLECTIONS_DIR / slug
    if not coll_dir.exists():
        return jsonify(error="Collection not found"), 404

    remove_cover_images(coll_dir)

    if 'file' in request.files:
        file = request.files['file']
        ext = Path(file.filename).suffix or '.jpg'
        dest = coll_dir / f"{slug}{ext}"
        file.save(str(dest))
    elif request.is_json and request.json.get('dataUrl'):
        data_url = request.json['dataUrl']
        header, data = data_url.split(',', 1)
        ext = '.png' if 'png' in header else '.jpg'
        dest = coll_dir / f"{slug}{ext}"
        dest.write_bytes(base64.b64decode(data))
    else:
        return jsonify(error="No image provided"), 400

    return jsonify(ok=True, url=f'/music/collections/{slug}/{dest.name}')


@app.route('/api/collection/<slug>/reorder', methods=['POST'])
def reorder_collection(slug):
    coll_dir = COLLECTIONS_DIR / slug
    md_path = coll_dir / 'collection.md'
    if not md_path.exists():
        return jsonify(error="Collection not found"), 404

    data = request.get_json()
    new_order = data.get('tracks', [])

    fm, body = read_md_file(md_path)
    fm['tracks'] = new_order
    write_md_file(md_path, fm, body)
    return jsonify(ok=True)


@app.route('/api/artist/save', methods=['POST'])
def save_artist():
    data = request.get_json()
    bio = data.pop('bio', '')

    fm = {}
    if data.get('name'):
        fm['name'] = data['name']
    for field in ['spotify', 'apple_music', 'tidal', 'deezer',
                  'youtube', 'website', 'soundcloud', 'instagram']:
        if data.get(field):
            fm[field] = data[field]

    write_md_file(ARTIST_DIR / 'artist.md', fm, bio)
    return jsonify(ok=True)


@app.route('/api/artist/profile', methods=['POST'])
def upload_artist_profile():
    remove_images_by_prefix(ARTIST_DIR, 'profile')

    if 'file' in request.files:
        file = request.files['file']
        ext = Path(file.filename).suffix or '.jpg'
        dest = ARTIST_DIR / f"profile{ext}"
        file.save(str(dest))
    elif request.is_json and request.json.get('dataUrl'):
        data_url = request.json['dataUrl']
        header, data = data_url.split(',', 1)
        ext = '.png' if 'png' in header else '.jpg'
        dest = ARTIST_DIR / f"profile{ext}"
        dest.write_bytes(base64.b64decode(data))
    else:
        return jsonify(error="No image provided"), 400

    return jsonify(ok=True, url=f'/music/artist/{dest.name}')


@app.route('/api/artist/banner', methods=['POST'])
def upload_artist_banner():
    remove_images_by_prefix(ARTIST_DIR, 'banner')

    if 'file' in request.files:
        file = request.files['file']
        ext = Path(file.filename).suffix or '.jpg'
        dest = ARTIST_DIR / f"banner{ext}"
        file.save(str(dest))
    elif request.is_json and request.json.get('dataUrl'):
        data_url = request.json['dataUrl']
        header, data = data_url.split(',', 1)
        ext = '.png' if 'png' in header else '.jpg'
        dest = ARTIST_DIR / f"banner{ext}"
        dest.write_bytes(base64.b64decode(data))
    else:
        return jsonify(error="No image provided"), 400

    return jsonify(ok=True, url=f'/music/artist/{dest.name}')


@app.route('/api/build', methods=['POST'])
def run_build():
    try:
        result = subprocess.run(
            ['python3', str(BASE_DIR / 'build_music_json.py')],
            capture_output=True, text=True, cwd=str(BASE_DIR), timeout=30
        )
        return jsonify(
            ok=result.returncode == 0,
            stdout=result.stdout,
            stderr=result.stderr,
            returncode=result.returncode
        )
    except subprocess.TimeoutExpired:
        return jsonify(ok=False, stdout='', stderr='Build timed out after 30s',
                       returncode=-1)


@app.route('/api/deploy', methods=['POST'])
def run_deploy():
    config_path = BASE_DIR / 'config.json'
    if not config_path.exists():
        return jsonify(ok=False, stderr='config.json not found', returncode=-1)

    try:
        config = json.loads(config_path.read_text())
    except Exception as e:
        return jsonify(ok=False, stderr=f'Invalid config.json: {e}', returncode=-1)
    deploy = config.get('deploy', {})
    destination = deploy.get('destination', '')

    if not destination or destination == 'user@server.com:/var/www/music.example.com/':
        return jsonify(ok=False,
                       stderr='Deploy destination not configured.\n\nAdd to config.json:\n  "deploy": {\n    "destination": "user@host:/path/to/site/"\n  }',
                       returncode=-1)

    deployignore = BASE_DIR / '.deployignore'
    cmd = [
        'rsync', '-avz', '--delete', '--progress',
        '-e', 'ssh -o StrictHostKeyChecking=accept-new -o BatchMode=yes',
    ]
    if deployignore.exists():
        cmd += ['--exclude-from', str(deployignore)]
    cmd += [
        str(BASE_DIR / 'index.html'),
        str(BASE_DIR / 'feed.rss'),
        str(BASE_DIR / 'feed'),
        str(BASE_DIR / 'js'),
        str(BASE_DIR / 'css'),
        str(BASE_DIR / 'data'),
        str(BASE_DIR / 'music'),
        destination
    ]

    # Pattern to match rsync xfer progress: (xfer#N, to-check=M/T)
    xfer_re = re.compile(r'\(xfer#(\d+),\s*to-check=(\d+)/(\d+)\)')

    def stream():
        try:
            # Run build first
            yield f"data: {json.dumps({'line': 'Building discography.json...'})}\n\n"
            build = subprocess.run(
                ['python3', str(BASE_DIR / 'build_music_json.py')],
                capture_output=True, text=True, cwd=str(BASE_DIR), timeout=30
            )
            if build.stdout:
                for bline in build.stdout.strip().splitlines():
                    yield f"data: {json.dumps({'line': bline})}\n\n"
            if build.returncode != 0:
                stderr = build.stderr or 'Build failed'
                yield f"data: {json.dumps({'done': True, 'ok': False, 'returncode': build.returncode, 'stderr': stderr})}\n\n"
                return
            yield f"data: {json.dumps({'line': ''})}\n\n"
            yield f"data: {json.dumps({'line': 'Deploying via rsync...'})}\n\n"

            proc = subprocess.Popen(
                cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                text=True, cwd=str(BASE_DIR)
            )
            files_done = 0
            total_files = 0
            current_file = None
            for line in iter(proc.stdout.readline, ''):
                line = line.rstrip()
                # Match transfer completion lines with xfer info
                m = xfer_re.search(line)
                if m:
                    files_done = int(m.group(1))
                    remaining = int(m.group(2))
                    total_files = int(m.group(3))
                    pct = round((total_files - remaining) / total_files * 100) if total_files else 0
                    yield f"data: {json.dumps({'xfer': files_done, 'total': total_files, 'pct': pct, 'file': current_file})}\n\n"
                # Skip partial progress lines (start with whitespace + numbers)
                elif line and not line[0].isspace():
                    # Store filename — it will be included in the next xfer event
                    current_file = line
            proc.stdout.close()
            stderr = proc.stderr.read()
            proc.stderr.close()
            rc = proc.wait()
            yield f"data: {json.dumps({'done': True, 'ok': rc == 0, 'returncode': rc, 'stderr': stderr, 'files': files_done})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'done': True, 'ok': False, 'returncode': -1, 'stderr': str(e)})}\n\n"

    return Response(stream(), mimetype='text/event-stream')


@app.route('/api/health')
def health_api():
    return jsonify(generate_health_report())


@app.route('/settings')
def settings_page():
    config_path = BASE_DIR / 'config.json'
    config = {}
    if config_path.exists():
        try:
            config = json.loads(config_path.read_text())
        except Exception:
            pass
    deploy = config.get('deploy', {})
    return render_template('admin_settings.html',
                           project_dir=str(BASE_DIR),
                           site_url=config.get('site_url', ''),
                           deploy_destination=deploy.get('destination', ''),
                           spotify_client_id=config.get('spotify_client_id', ''),
                           spotify_client_secret=config.get('spotify_client_secret', ''))


@app.route('/api/settings', methods=['GET', 'POST'])
def settings_api():
    config_path = BASE_DIR / 'config.json'
    if request.method == 'GET':
        return jsonify(project_dir=str(BASE_DIR))

    data = request.json or {}
    config = {}
    if config_path.exists():
        try:
            config = json.loads(config_path.read_text())
        except Exception:
            pass

    if 'site_url' in data:
        config['site_url'] = data['site_url']
    if 'deploy_destination' in data:
        config.setdefault('deploy', {})['destination'] = data['deploy_destination']
    if 'spotify_client_id' in data:
        config['spotify_client_id'] = data['spotify_client_id']
    if 'spotify_client_secret' in data:
        config['spotify_client_secret'] = data['spotify_client_secret']

    try:
        config_path.write_text(json.dumps(config, indent=2) + '\n')
        return jsonify(ok=True)
    except Exception as e:
        return jsonify(ok=False, error=str(e))


# Serve music files
@app.route('/music/<path:filename>')
def serve_music(filename):
    return send_from_directory(str(MUSIC_DIR), filename)


if __name__ == '__main__':
    app.run(debug=True, port=5001)
