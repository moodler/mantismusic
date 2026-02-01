# Mantis Music

A self-hosted, Spotify-style discography player for independent artists. Manage your music as simple files and folders, edit metadata through a visual admin interface, and publish your own streaming site as a STATIC site (this means it works anywhere and is very secure and fast).

Designed for use on a Mac, but may work elsewhere.

**Demo:** [mantisaudiogram.music](https://mantisaudiogram.music)

## Quick Start (macOS)

**Prerequisites:** Python 3 and pip.

```bash
# 1. Clone the repo
git clone <repo-url> && cd mantismusic

# 2. Install dependencies and build the app
pip install -r requirements.txt
bash build_app.sh
```

The build script creates **Mantis Music.app** and offers to copy it to `/Applications`. 

**First launch:** The app asks you to choose a data directory for your music. Pick any folder — if it's empty, the app creates the full directory structure for you with a starter template. From there, everything is managed through the app's admin interface: add music, edit metadata, build, and deploy.

You can edit the files and folders directly if you like, but it's easier through the app.

## How It Works

Mantis Music is a static site generator for music. Your source of truth is a folder of audio files and markdown metadata. A build step compiles that into a JSON database, and a vanilla JS frontend renders it as a player.

1. **You organize music as files and folders** — MP3s, cover art, and `.md` files with metadata (title, tags, credits, streaming links, lyrics)
2. **The build script compiles everything** into a JSON database, an RSS feed, and a deploy-ready `index.html` with social sharing tags
3. **The frontend loads the JSON** and renders a full player with search, filtering, queuing, and streaming link integration
4. **The admin UI** lets you edit all metadata visually, upload audio and images, and build/deploy with one click

The macOS app wraps the admin UI in a native window — it's the easiest way to manage everything. But you can also run each piece directly from the command line (see [Running Without the App](#running-without-the-app)).

## Music Folder Structure

This is what the app manages for you, but it's useful to understand since it's all just files:

```
music/
├── artist/
│   ├── artist.md           # Artist name, bio, social links (YAML frontmatter + markdown body)
│   ├── profile.jpg         # Square profile image (used as favicon, header, player art, OG image)
│   └── banner.png          # Wide banner image (hero area and background texture)
├── tracks/
│   └── song_name/
│       ├── track.md        # Title, duration, tags, credits, streaming URLs (YAML frontmatter + description)
│       ├── song_name.mp3   # Audio file for streaming
│       ├── song_name.wav   # Lossless version (optional — offered as download)
│       ├── song_name.jpg   # Cover art (optional — optimized to 1024x1024 if oversized)
│       └── song_name.txt   # Lyrics (optional — plain text)
└── collections/
    └── album_name/
        ├── collection.md   # Title, type (album/ep), ordered track list, streaming URLs
        └── album_name.jpg  # Collection cover art
```

Collections reference tracks by their folder name. A track can belong to multiple collections, or none (shown as a standalone single).

## Metadata Format

All metadata lives in `.md` files with YAML frontmatter. The admin UI edits these for you, but you can also edit them directly.

**artist.md:**
```yaml
---
name: "Artist Name"
spotify: "https://open.spotify.com/artist/..."
apple_music: "https://music.apple.com/..."
instagram: "https://www.instagram.com/..."
website: "https://..."
---
Bio text goes here. Supports **bold**, *italic*, [links](https://...), and paragraphs.
```

**track.md:**
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
  Producer:
  - Artist Name
spotify: https://open.spotify.com/track/...
apple_music: https://music.apple.com/...
---
Description text here.
```

**collection.md:**
```yaml
---
title: Album Name
type: album
release_date: 2025-08-13
tracks:
- track_slug_1
- track_slug_2
- track_slug_3
spotify: https://open.spotify.com/album/...
---
Album description here.
```

Duration is auto-detected from MP3 files. Streaming URLs can be auto-linked by the build script if you configure API credentials (see [Configuration](#configuration)).

## The Admin UI

The admin provides a browser-based interface for managing everything:

- **Dashboard** — overview stats and health report (missing audio, cover art, streaming links)
- **Track editor** — edit metadata, tags, credits, streaming URLs; upload audio and cover art; edit lyrics
- **Collection editor** — edit metadata, reorder tracks with drag-and-drop, manage cover art
- **Artist editor** — edit name, bio, social links, upload profile and banner images
- **Settings** — configure site title, URL, deploy destination, Spotify API credentials
- **Build & Deploy** — rebuild the site and push it to your server with one click

## The Frontend

A vanilla JavaScript single-page app. No framework, no build step.

- Search across titles, descriptions, lyrics, and tags
- Filter by tag and year
- Track and collection detail views with lyrics, credits, and streaming links
- Persistent audio player with queue, repeat modes, and progress seeking
- Dynamic branding from your profile image (colors, favicon, header)
- RSS feed with auto-discovery

## Configuration

The app creates a `config.json` in your data directory on first run. You can edit it via the admin Settings page or directly:

```json
{
  "site_title": "My Artist Name",
  "site_url": "https://music.example.com",
  "spotify_client_id": "",
  "spotify_client_secret": "",
  "deploy": {
    "destination": "user@server.com:/var/www/music.example.com/"
  }
}
```

| Field | Purpose |
|-------|---------|
| `site_title` | Page title and OpenGraph title. Falls back to artist name if empty. |
| `site_url` | Used in RSS feed, OpenGraph tags, and feed page links. |
| `spotify_client_id/secret` | Enables Spotify streaming auto-link. Get credentials at [developer.spotify.com](https://developer.spotify.com). |
| `deploy.destination` | rsync SSH target for deployment. |

Tidal uses built-in catalog credentials. Deezer and Apple Music APIs are public and need no credentials.

## Deployment

Deployment uses `rsync` over SSH to push your site to a remote server. Once set up, deploys happen with a single click in the admin UI — the build runs, then only changed files are synced.

### Setting Up Your Web Server

You need a Linux server (a cheap VPS from DigitalOcean, Hetzner, Linode, etc. works fine) with a web server like Nginx or Caddy.

**1. Create a site directory on your server:**

```bash
ssh you@yourserver.com
sudo mkdir -p /var/www/music.example.com
sudo chown you:you /var/www/music.example.com
```

**2. Set up SSH key access** so deploys don't prompt for a password:

```bash
# On your Mac — generate a key if you don't have one
ssh-keygen -t ed25519

# Copy it to your server
ssh-copy-id you@yourserver.com
```

Verify it works: `ssh you@yourserver.com` should log in without asking for a password.

**3. Configure your web server** to serve the directory. For Nginx:

```nginx
server {
    listen 80;
    server_name music.example.com;
    root /var/www/music.example.com;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Cache audio files aggressively
    location /music/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Then enable the site and set up HTTPS (Certbot makes this easy):

```bash
sudo ln -s /etc/nginx/sites-available/music.example.com /etc/nginx/sites-enabled/
sudo certbot --nginx -d music.example.com
sudo systemctl reload nginx
```

**4. Set the deploy destination** in the admin Settings page, or in `config.json`:

```json
{
  "deploy": {
    "destination": "you@yourserver.com:/var/www/music.example.com/"
  }
}
```

The trailing slash on the destination matters for rsync.

### Deploying

Click **Build & Deploy** in the admin sidebar. The build script runs first (compiling JSON, RSS, and OG tags), then rsync pushes only the changed files to your server. Subsequent deploys are fast since rsync transfers diffs.

Only public-facing files are deployed: the frontend, compiled data, audio files, images, and RSS feed. Source files (Python scripts, config, templates, markdown) are excluded automatically via `.deployignore`.

## Running Without the App

You don't need the macOS app. Everything works from the command line:

```bash
# Run the admin UI
python3 admin.py                # http://localhost:5001

# Or build and preview manually
python3 build_music_json.py     # Compile music folder to JSON, RSS, OG tags
python3 -m http.server 8000     # Preview at http://localhost:8000
```

## Build Script Details

`build_music_json.py` reads the `/music` folder and generates:

- `data/discography.json` — compiled music database
- `data/discography.js` — same data as a JS global (for `file://` protocol support)
- `data/index.html` — frontend with OpenGraph/Twitter meta tags injected
- `data/og-image.jpg` — profile image copy for social sharing
- `feed.rss` — RSS 2.0 feed
- `feed/*.html` — per-track pages for RSS readers

Additional features:
- **Streaming auto-link** — searches Spotify, Apple Music, Tidal, and Deezer APIs for matching tracks and writes URLs back into `.md` files
- **Duration detection** — reads MP3 duration and updates `track.md` automatically
- **Image optimization** — shrinks oversized cover art to 1024x1024 using macOS `sips`, preserving originals as `raw-{filename}`
- **Cache busting** — appends content hashes to JS/CSS/data references in `index.html`

## Project Files

```
mantismusic/
├── index.html              # Frontend entry point
├── js/app.js               # Frontend logic (player, rendering, navigation)
├── css/style.css           # Styles with CSS custom properties for theming
├── data/                   # Build output (generated)
├── music/                  # Source music files and metadata
├── feed.rss                # RSS feed (generated)
├── feed/                   # Per-track pages for RSS (generated)
├── build_music_json.py     # Build script: music folder -> JSON + RSS + OG
├── paths.py                # Path resolution (separates app code from user data)
├── admin.py                # Flask admin UI (port 5001)
├── mantis_app.py           # Native macOS app wrapper (pywebview)
├── build_app.sh            # Builds the macOS .app via PyInstaller
├── templates/              # Admin UI templates (Jinja2)
├── config.example.json     # Settings template
├── requirements.txt        # Python dependencies
├── .deployignore           # Files excluded from deploy
└── LICENSE                 # GPLv3
```

## License

GPLv3. See [LICENSE](LICENSE).
