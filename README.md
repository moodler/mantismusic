# Mantis Music

A self-hosted, Spotify-style artist discography player. Manage your music as simple files and folders, compile to JSON, and serve as a static site. Includes a browser-based admin UI, RSS feed generation, and a native macOS app.

## Demo 

See my site at https://mantisaudiogram.music 

## Quickstart

```bash
# 1. Clone and enter the repo
git clone <repo-url> && cd mantismusic

# 2. Install Python dependencies
pip install -r requirements.txt
pip install flask       # for the admin UI
pip install requests    # for streaming auto-link (optional)

# 3. Add your music to the /music folder (see structure below)
#    At minimum you need:
#      music/artist/artist.md    — artist name, bio, social links
#      music/tracks/my_song/     — one folder per track containing:
#        track.md                — title, duration, tags, credits
#        my_song.mp3             — the audio file

# 4. Build the JSON database
python3 build_music_json.py

# 5. Preview the site
python3 -m http.server 8000
# Open http://localhost:8000

# 6. Run the admin UI for editing metadata in a browser
python3 admin.py
# Open http://localhost:5001
```

On macOS you can also double-click `MantisMusic.command` to launch the admin UI and open it in your browser automatically.

## How It Works

1. You manage music as files and folders under `/music`
2. `build_music_json.py` compiles everything into `data/discography.json`, generates an RSS feed (`feed.rss`), static feed pages (`feed/`), and a deploy-ready `data/index.html` with OpenGraph/Twitter meta tags
3. The static frontend (`index.html` + `js/app.js` + `css/style.css`) loads the JSON and renders the player
4. `admin.py` provides a browser-based editor for all metadata, with build and deploy buttons

## Music Folder Structure

```
music/
├── artist/
│   ├── artist.md                      # Artist name, bio, social links
│   ├── profile.jpg                    # Square profile image (header, about, player, favicon)
│   └── banner.png                     # Wide banner image (hero, background)
├── tracks/
│   └── song_name/
│       ├── track.md                   # Track metadata (YAML frontmatter + description)
│       ├── song_name.mp3              # Audio file (MP3 for streaming)
│       ├── song_name.wav              # Lossless audio (optional, offered as download)
│       ├── song_name.jpg              # Cover art (optional)
│       └── song_name.txt              # Lyrics (optional, plain text)
└── collections/
    └── album_name/
        ├── collection.md              # Collection metadata + ordered track list
        └── album_name.jpg             # Collection cover art
```

### artist.md

```yaml
---
name: "Artist Name"
spotify: "https://open.spotify.com/artist/..."
apple_music: "https://music.apple.com/..."
tidal: "https://tidal.com/artist/..."
deezer: "https://www.deezer.com/artist/..."
youtube: "https://www.youtube.com/..."
soundcloud: "https://soundcloud.com/..."
instagram: "https://www.instagram.com/..."
website: "https://..."
---
Bio text goes here. Blank lines create separate paragraphs.
```

### track.md

```yaml
---
title: Song Title
duration: '3:45'
release_date: 2025-01-15
bpm: 120
key: Am
mood:
- Upbeat
- Reflective
tags:
- Pop
- Electronic
- AI
credits:
  Composer:
  - Artist Name
  Lyrics:
  - Artist Name
  Producer:
  - Artist Name
spotify: https://open.spotify.com/track/...
apple_music: https://music.apple.com/...
tidal: https://tidal.com/track/...
deezer: https://www.deezer.com/track/...
---
Description text here. Blank lines create paragraphs.
```

Duration is auto-detected from MP3 files and written back to the frontmatter. Streaming URLs can also be auto-linked by the build script (see below).

### collection.md

```yaml
---
title: Album Name
type: album
release_date: 2025-08-13
tags:
- Love Songs
- Pop
tracks:
- track_slug_1
- track_slug_2
- track_slug_3
spotify: https://open.spotify.com/album/...
apple_music: https://music.apple.com/...
tidal: https://tidal.com/album/...
deezer: https://www.deezer.com/album/...
---
Album description here.
```

The `type` field can be `album` or `ep`. Collections reference tracks by their folder name (slug). A track can belong to multiple collections, or none (displayed as a standalone single).

## Configuration

Copy the example config and edit it:

```bash
cp config.example.json config.json
```

```json
{
  "site_title": "My Artist Name",
  "site_url": "https://music.example.com",
  "spotify_client_id": "your_spotify_client_id",
  "spotify_client_secret": "your_spotify_client_secret",
  "deploy": {
    "destination": "user@server.com:/var/www/music.example.com/"
  }
}
```

| Field | Purpose |
|-------|---------|
| `site_title` | Page title and OpenGraph title. Falls back to artist name if empty. |
| `site_url` | Public URL. Used in RSS feed, OpenGraph tags, and feed page links. |
| `spotify_client_id/secret` | For Spotify streaming auto-link. Get credentials at [developer.spotify.com](https://developer.spotify.com). |
| `deploy.destination` | rsync SSH target for deployment. |

Tidal uses built-in catalog credentials. Deezer and Apple Music APIs are public and need no credentials.

## Build Script

`build_music_json.py` reads the `/music` folder structure and generates:

- `data/discography.json` — the compiled music database
- `data/index.html` — a copy of index.html with OpenGraph and Twitter Card meta tags injected
- `data/og-image.jpg` — a copy of the artist profile image for social sharing
- `feed.rss` — an RSS 2.0 feed with all tracks in chronological order
- `feed/*.html` — static HTML pages for each track (linked from RSS items)

Features:
- **Streaming auto-link**: Searches Spotify, Apple Music, Tidal, and Deezer for missing URLs and writes them back into `.md` files
- **Duration detection**: Reads MP3 duration via mutagen and updates `track.md` if needed
- **Cover art detection**: Finds `.jpg`/`.png`/`.webp` images in each folder
- **Audio detection**: Finds `.mp3`/`.wav`/`.m4a`/`.flac` files
- **Duration calculation**: Totals track durations for collections

## Frontend

A vanilla JavaScript single-page application. No framework, no build step.

- **Views**: Tracks (default), Collections, About
- **Search**: Full-text search across titles, descriptions, lyrics, and tags
- **Filters**: By tag and year, with a reset button
- **Detail pages**: Track and collection detail views with lyrics, credits, streaming links, and playback controls
- **Audio player**: Persistent bottom player bar with play/pause, prev/next, progress seek, volume, repeat modes, and queue management
- **Branding**: Profile image as favicon and header avatar, banner as hero and subtle background texture, dynamic brand colors extracted from profile image
- **RSS**: Auto-discovery link and RSS icon in navigation
- **Streaming links**: SVG platform icons (Spotify, Apple Music, Tidal, Deezer, YouTube, etc.)

## Admin UI

`admin.py` is a Flask app for editing all metadata in a browser at `http://localhost:5001`.

- **Dashboard**: Overview stats and health report (missing audio, cover art, streaming links, etc.)
- **Track editor**: Edit metadata, tags, credits, streaming URLs; upload MP3 and WAV audio; upload cover art; edit lyrics; prev/next navigation between tracks
- **Collection editor**: Edit metadata, reorder tracks with drag-and-drop, manage cover art
- **Artist editor**: Edit name, bio, social links, upload profile and banner images
- **Settings**: Configure site title, site URL, deploy destination, and Spotify API credentials
- **Build button**: Run the build script from the browser and see output
- **Deploy button**: Build and rsync the static site to your server with live progress

## Deployment

The intended workflow: manage everything locally, then push the public site to a remote server.

### Setup

Set the `deploy.destination` in `config.json` (or in the admin Settings page) to an rsync SSH target:

```json
{
  "deploy": {
    "destination": "user@yourserver.com:/var/www/music.example.com/"
  }
}
```

Make sure you have SSH key access configured for the target server. The trailing slash on the destination matters for rsync.

### Workflow

1. Add or edit music locally (files in `/music`, or via the admin UI)
2. Click **Build & Deploy** in the admin sidebar — this rebuilds the JSON, RSS feed, and OpenGraph metadata, then rsyncs to your server

### What gets deployed

Only the files needed to run the public site:
- `index.html` — the frontend (build-generated version with OG tags)
- `js/`, `css/` — frontend assets
- `data/` — compiled database, OG image
- `music/` — audio files, cover art, profile/banner images
- `feed.rss`, `feed/` — RSS feed and per-track feed pages

Excluded automatically (via `.deployignore`): Python scripts, config files, templates, `.git`, and markdown metadata files.

## macOS App

A native macOS app wraps the admin UI in a standalone window. The app bundles all code; you only need to point it at a data directory containing your music files.

### Building the app

```bash
pip install pyinstaller pywebview
bash build_app.sh
```

This creates `dist/Mantis Music.app` and offers to copy it to `/Applications`. Place an `icon.png` in the project root before building to use a custom app icon.

### First run

On first launch, the app asks you to select a data directory. If you pick an empty folder, it creates the directory structure automatically (`music/`, `data/`, `feed/`, `config.json`, and a starter `artist.md`). On subsequent launches it remembers your choice.

## Project Files

```
mantismusic/
├── index.html              # Frontend entry point
├── js/app.js               # All frontend logic
├── css/style.css           # All styles
├── data/                   # Build output (generated)
│   ├── discography.json    # Compiled music database
│   ├── index.html          # Frontend with OG tags injected
│   └── og-image.jpg        # Profile image copy for social sharing
├── music/                  # Source music files and metadata
├── feed.rss                # RSS feed (generated)
├── feed/                   # Per-track HTML pages for RSS (generated)
├── build_music_json.py     # Compiler: music folder → JSON + RSS + OG
├── paths.py                # Central path resolution (APP_DIR vs DATA_DIR)
├── admin.py                # Flask admin UI
├── mantis_app.py           # Native macOS app wrapper (pywebview)
├── build_app.sh            # Build script for macOS .app
├── MantisMusic.command     # Double-click launcher for admin UI (macOS)
├── templates/              # Admin UI HTML templates (Jinja2)
├── config.json             # Settings and API credentials (gitignored)
├── config.example.json     # Settings template
├── requirements.txt        # Python dependencies
├── .deployignore           # Files excluded from deploy rsync
└── LICENSE                 # GPLv3
```
