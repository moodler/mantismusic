# Mantis Music

A self-hosted, Spotify-style artist discography player. Manage your music as simple files and folders, compile to JSON, and serve as a static site.

## Quickstart

```bash
# 1. Clone and enter the repo
git clone <repo-url> && cd mantismusic

# 2. Set up streaming auto-link credentials (optional, for Spotify/Tidal lookup)
cp config.example.json config.json
# Edit config.json with your Spotify client ID and secret (from developer.spotify.com)
# Tidal credentials are optional — the build script has built-in fallback credentials

# 3. Add your music to the /music folder (see structure below)
#    At minimum you need:
#      music/artist/artist.md    — artist name, bio, social links
#      music/tracks/my_song/    — one folder per track containing:
#        track.md               — title, duration, tags, credits, streaming URLs
#        my_song.mp3            — the audio file
#        my_song.jpg            — cover art (optional)
#        my_song.txt            — lyrics (optional)

# 4. Build the JSON database
pip install pyyaml requests
python3 build_music_json.py

# 5. Serve the site
python3 -m http.server 8000
# Open http://localhost:8000

# 6. (Optional) Run the admin UI for editing metadata in a browser
pip install flask
python3 admin.py
# Open http://localhost:5001
```

## How It Works

1. You manage music as files and folders under `/music`
2. `build_music_json.py` compiles everything into `data/discography.json`
3. The static frontend (`index.html` + `js/app.js` + `css/style.css`) loads the JSON and renders the player
4. Optionally, `admin.py` provides a browser-based editor for all metadata

## Music Folder Structure

```
music/
├── artist/
│   ├── artist.md                      # Artist name, bio, social links
│   ├── profile.jpg                    # Square profile image (used in header, about, player)
│   └── banner.png                     # Wide banner image (used in hero, background)
├── tracks/
│   └── song_name/
│       ├── track.md                   # Track metadata (YAML frontmatter + description)
│       ├── song_name.mp3              # Audio file
│       ├── song_name.jpg              # Cover art (optional)
│       └── song_name.txt              # Lyrics (optional, plain text)
└── collections/
    └── album_name/
        ├── collection.md              # Collection metadata + ordered track list
        └── album_name.jpg             # Collection cover art (optional)
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
tags:
- Pop
- Electronic
credits:
  Composer:
  - Artist Name
  Lyrics:
  - Artist Name
  Synthesiser:
  - Suno AI
  Producer:
  - Artist Name
spotify: https://open.spotify.com/track/...
apple_music: https://music.apple.com/...
tidal: https://tidal.com/track/...
deezer: https://www.deezer.com/track/...
---
Description text here. Blank lines create paragraphs.
```

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

Collections reference tracks by their folder name (slug). A track can belong to multiple collections, or none (displayed as a standalone single).

## Build Script

`build_music_json.py` reads `artist/artist.md`, every `track.md`, and `collection.md` under `/music` and compiles them into `data/discography.json`.

Features:
- **Streaming auto-link**: If a track or collection is missing Spotify, Apple Music, Tidal, or Deezer URLs, the script searches those platforms automatically and writes the URLs back into the `.md` files
- **Cover art detection**: Finds `.jpg`/`.png`/`.webp` images in each folder
- **Audio detection**: Finds `.mp3`/`.wav`/`.ogg`/`.flac` files
- **Duration calculation**: Totals track durations for collections

Config (`config.json`):
```json
{
  "spotify_client_id": "your_id",
  "spotify_client_secret": "your_secret"
}
```

Spotify credentials are required for Spotify auto-linking. Tidal uses built-in catalog credentials. Deezer and Apple Music APIs are public.

## Frontend

A vanilla JavaScript single-page application. No framework, no build step.

- **Views**: Tracks (default), Collections, About
- **Search**: Full-text search across titles, descriptions, lyrics, and tags
- **Filters**: By tag and year, with a reset button
- **Detail pages**: Track and collection detail views with lyrics, credits, streaming links, and playback controls
- **Audio player**: Persistent bottom player bar with play/pause, prev/next, progress seek, volume, repeat modes, and queue management
- **Branding**: Profile image in header and player fallback, banner as hero and subtle background texture, dynamic brand colors extracted from profile image
- **Streaming links**: SVG platform icons (Spotify, Apple Music, Tidal, Deezer, YouTube, etc.)

## Admin UI

`admin.py` is a Flask app for editing all metadata in a browser at `http://localhost:5001`.

- **Dashboard**: Overview stats and health report (missing audio, cover art, streaming links, etc.)
- **Track editor**: Edit metadata, tags, credits, streaming URLs; upload cover art; edit lyrics
- **Collection editor**: Edit metadata, reorder tracks with drag-and-drop, manage cover art
- **Artist editor**: Edit name, bio, and social links
- **Build button**: Run the build script from the browser and see output
- **Deploy button**: Rsync the static site to your public server

## Deployment

The intended workflow: run everything locally, then push the public site to a remote server.

### Setup

Add a `deploy` section to `config.json`:

```json
{
  "deploy": {
    "destination": "user@yourserver.com:/var/www/music.example.com/"
  }
}
```

The destination is an rsync SSH target. Trailing slash matters — it controls whether files go into the directory or alongside it. Make sure you have SSH key access configured for the target server.

### Workflow

1. Add or edit music locally (files in `/music`, or via the admin UI)
2. Click **Build JSON** in the admin sidebar to regenerate `data/discography.json`
3. Click **Deploy to Server** to rsync the public site to your server

### What gets deployed

Only the files needed to run the public site:
- `index.html`, `js/`, `css/` — the frontend
- `data/discography.json` — the compiled database
- `music/` — audio files, cover art, profile/banner images

Excluded automatically (via `.deployignore`): Python scripts, config files, templates, `.git`, and markdown metadata files.

## Project Files

```
mantismusic/
├── index.html              # Frontend entry point
├── js/app.js               # All frontend logic
├── css/style.css           # All styles
├── data/discography.json   # Compiled music database (generated)
├── music/                  # Source music files and metadata
├── build_music_json.py     # Compiler: music folder → JSON
├── admin.py                # Flask admin UI
├── templates/              # Admin UI HTML templates
├── config.json             # API credentials (gitignored)
├── config.example.json     # API credentials template
└── .deployignore           # Files excluded from deploy rsync
```
