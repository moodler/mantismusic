# Mantis Music - Custom "Spotify-style" Artist Player

An open script for creating a lovely private music site anywhere you like.

## Technical Specification

### 1. Project Overview

A single-artist music streaming web application designed for high performance, visual elegance, and mobile-first experience. The system uses a local-first management workflow where the artist manages a physical directory of files, which is then "compiled" into a JSON database and synced to a web server.

**Core Design Philosophy:**
- Mobile experience matching Spotify quality
- Direct sharing links to individual tracks
- Synced lyrics display
- Simple weekly update workflow
- Static deployment with CDN caching

## 2. Local Data Architecture (/music)

The source of truth is a hierarchical folder structure on the artist's computer.

### 2.1 Directory Structure

```
music/
├── artist.md (Artist Bio & Socials & colour/theme settings)
├── artist.jpg
├── artist_header.jpg
├── releases/
│   ├── album_name/
│   │   ├── release.md (Album Metadata)
│   │   ├── album_name.jpg
│   │   ├── tracks/
│   │   │   ├── 01_track_name/
│   │   │   │   ├── track.md (Track Metadata)
│   │   │   │   ├── track_name.txt (Plain lyrics - optional)
│   │   │   │   ├── track_name.srt (Synced lyrics - optional)
│   │   │   │   ├── track_name.mp3 (Required - streaming quality)
│   │   │   │   ├── track_name.wav (Optional - hi-res download)
│   │   │   │   ├── track_name.jpg (Track cover - optional, defaults to Album Cover)
│   │   │   │   ├── track_name.mp4 (Optional visualizer)
```

### 2.2 Metadata Schema (Markdown + YAML Frontmatter)

Each .md file contains a YAML block for machine-readable data and Markdown for human-readable content.

**Example track.md:**

```yaml
---
title: "Song Title"
index: 1
youtube_url: "https://youtube.com/..."
spotify_url: "https://open.spotify.com/..."
apple_music_url: "https://music.apple.com/..."
tags: ["Lo-fi", "Instrumental"]
has_synced_lyrics: true  # Auto-detected if .srt file exists
has_hires_download: true  # Auto-detected if .wav file exists
---

Optional markdown content describing the track's story, production notes, etc.
```

**Example release.md:**

```yaml
---
title: "Album Name"
release_date: "2024-01-15"
release_type: "album"  # album, single, EP
description: "Album description"
---

Extended album notes in markdown.
```

**Example artist.md:**

```yaml
---
name: "Artist Name"
bio: "Short bio"
socials:
  instagram: "https://instagram.com/..."
  twitter: "https://twitter.com/..."
  youtube: "https://youtube.com/..."
theme_color: "#1DB954"  # Primary brand color
---

Full artist biography in markdown.
```

## 3. The Python Compiler (`build_music_json.py`)

A script that acts as the bridge between the folder structure and the web app.

### 3.1 Core Functions

- **Validation**: Ensures every folder has required files (MP3, MD, JPG). Gives "FIXME" alerts if metadata is missing.
- **File Detection**: Auto-detects optional files (.wav, .srt, .txt, .mp4) and updates track metadata accordingly.
- **URL Mapping**: Converts local paths to absolute URLs using configurable base URL (environment variable or config file).
- **Compilation**: Merges all artist.md, release.md, and track.md data into a single, optimized `music.json`.
- **Image Processing**:
  - Generates responsive image sizes (thumbnail, medium, large)
  - Creates BlurHash strings for instant placeholder visuals
  - Outputs WebP format for modern browsers with JPEG fallback
- **Versioning**: Outputs versioned JSON (`music.v{timestamp}.json`) for cache busting on weekly updates.
- **Manifest Generation**: Creates PWA manifest.json with app metadata and icons.

### 3.2 Configuration

Create a `config.yaml` in the music/ directory:

```yaml
base_url: "https://music.dougiamas.com/music/"
site_name: "Mantis Music"
site_description: "Official music player"
theme_color: "#1DB954"
```

### 3.3 Output Structure

The compiler generates:
```
output/
├── music.v{timestamp}.json  # Main data file
├── manifest.json             # PWA manifest
├── images/                   # Processed images
│   ├── thumbnails/
│   ├── medium/
│   └── large/
```  

## 4. Frontend Architecture (Vite + React SPA)

The frontend is a Single Page Application to allow for a persistent, non-breaking audio player. **Vite + React** is chosen over Next.js because:
- Single-page apps are Vite's natural design (no workarounds needed)
- Faster dev server and build times
- Simpler configuration and deployment
- Better suited for hash-based routing
- Widely adopted industry standard

### 4.1 Technical Stack

- **Build Tool**: Vite (Lightning-fast dev server, optimized production builds)
- **Framework**: React 18+ (Hooks, Suspense, Concurrent features)
- **Routing**: React Router 6+ with hash-based routing (`/#/album/my-album`)
- **Styling**: Tailwind CSS (Dark mode by default, mobile-first)
- **Audio Engine**: Howler.js (Gapless playback, format fallback, Web Audio API)
- **State Management**: Zustand (Lightweight, performant for frequently updating audio state)
- **PWA**: Vite PWA Plugin (Service worker, offline support, installable)
- **Media Session API**: Native lock screen controls and media keys
- **Share API**: Native mobile sharing for tracks

### 4.2 Application Structure

```
src/
├── main.tsx                 # Entry point, PWA registration
├── App.tsx                  # Root component with persistent PlayerBar
├── router.tsx               # Hash-based route definitions
├── stores/
│   ├── playerStore.ts       # Zustand store (currentTrack, queue, playState)
│   └── musicStore.ts        # Music data loaded from music.json
├── components/
│   ├── PlayerBar/           # Persistent floating player
│   ├── LyricsPanel/         # Synced lyrics display with auto-scroll
│   ├── ShareButton/         # Native share + copy link
│   ├── TrackList/           # Virtualized long lists
│   └── SearchBar/           # Global search with keyboard shortcuts
├── views/
│   ├── HomeView.tsx         # Latest releases, organized by date
│   ├── AlbumView.tsx        # Album detail with track list
│   ├── AllTracksView.tsx    # All songs in release order
│   └── SearchView.tsx       # Search results
├── hooks/
│   ├── useAudioPlayer.ts    # Howler.js wrapper with Media Session API
│   ├── useKeyboardShortcuts.ts  # Global keyboard commands
│   └── useLyrics.ts         # SRT parser and sync engine
└── utils/
    ├── shareTrack.ts        # Generate shareable URLs
    └── colorThief.ts        # Extract colors from album art
```

### 4.3 Persistent Player Logic

- **Player Bar Component**: Rendered in App.tsx outside `<Outlet />` (React Router's page container)
- **Navigation**: Route changes update view content without unmounting the player
- **State Preservation**: Zustand store persists across route changes (no localStorage - fresh session each visit)
- **Audio Context**: Howler.js instance lives in a singleton hook, never destroyed

### 4.4 Core Features (Prioritized)

#### **Priority 1: Track Sharing** 🔗
- **Deep Linking**: Every track has a unique URL: `/#/track/{album-slug}/{track-slug}`
- **Native Share Button**: Uses Web Share API on mobile (fallback to copy-to-clipboard on desktop)
- **Shareable State**: Opening a track link loads player to that exact song
- **Ghost Integration**: Blog posts can link directly to tracks using anchor tags

**Example share URL:** `https://music.dougiamas.com/#/track/my-album/song-title`

#### **Priority 2: Lyrics Display** 📝
- **Format Support**: Parses `.srt` (synced) and `.txt` (plain) files
- **Auto-Scroll**: Lyrics follow playback position
- **Click-to-Seek**: Clicking a lyric line jumps to that timestamp
- **Mobile UI**: Swipe-up lyrics panel (like Spotify)
- **Desktop UI**: Side panel or overlay toggle

#### **Priority 3: Lock Screen Controls** 📱
- **Media Session API**: Shows album art, track info on lock screen
- **Hardware Keys**: Play/pause, skip, previous work from phone buttons
- **Lock Screen Widget**: Displays current track with playback controls
- **Notification Controls**: Android notification drawer controls

#### **Priority 4: Offline Playback** 💾
- **Service Worker**: Caches music.json and recently played tracks
- **Manual Downloads**: "Download album" button for offline access
- **Storage Management**: Shows storage usage, allows clearing cache

#### **Priority 5: PWA Install** 📲
- **Add to Home Screen**: Installable as standalone app
- **App Manifest**: Custom icon, splash screen, theme colors
- **Standalone Mode**: Hides browser chrome when installed
- **iOS Support**: Works with Safari "Add to Home Screen"

### 4.5 Additional Features

#### **Keyboard Shortcuts** ⌨️
```
Spacebar       → Play / Pause
Arrow Left     → Previous track
Arrow Right    → Next track
Arrow Up       → Volume up
Arrow Down     → Volume down
M              → Mute / Unmute
S              → Shuffle toggle
R              → Repeat toggle
L              → Toggle lyrics
/              → Focus search
Esc            → Close overlays
```

#### **Search** 🔍
- **Global Search Bar**: Searches tracks, albums, lyrics
- **Keyboard Shortcut**: `/` focuses search
- **Instant Results**: Debounced search with highlighted matches
- **Recent Searches**: Shows last 5 searches (session only)

#### **Navigation Views** 🗂️
- **Home**: Latest releases in reverse chronological order
- **Albums**: Grid view of all albums
- **All Tracks**: Flat list of every song sorted by release date (newest first)
- **Search Results**: Filtered tracks/albums

#### **Queue Management** 🎵
- **View Queue**: "Up Next" panel shows upcoming tracks
- **Add to Queue**: Right-click or long-press to add tracks
- **No Reordering**: Simple queue (user requirement)
- **Shuffle/Repeat**: Standard playback modes

#### **Dynamic Theming** 🎨
- **Color Extraction**: Uses color-thief.js to extract palette from album art
- **Subtle Backgrounds**: Blurred album art or gradient backgrounds
- **Smooth Transitions**: Colors fade between tracks

#### **Hi-Res Downloads** 💿
- **WAV Download Links**: Shows download button when `.wav` file exists
- **File Size Display**: Shows download size before starting
- **Direct Downloads**: No authentication required

### 4.6 Mobile-First Design

- **Touch Gestures**: Swipe album art to skip tracks
- **Large Touch Targets**: 44px minimum for mobile buttons
- **Bottom Navigation**: Key controls within thumb reach
- **Responsive Typography**: Scales from mobile to desktop
- **Landscape Mode**: Optimized layout for horizontal orientation

## 5. Deployment Workflow

### 5.1 Weekly Update Process

```bash
# 1. Add new music to /music/releases/
# 2. Run compiler
python build_music_json.py

# 3. Deploy to web server
./deploy.sh
```

**deploy.sh script:**
```bash
#!/bin/bash
# Sync music files and generated JSON to web server
rsync -avz --delete ./output/ user@server:/var/www/music.dougiamas.com/music/
rsync -avz ./music/ user@server:/var/www/music.dougiamas.com/music/files/

# Update "latest" symlink for the app to always fetch newest version
ssh user@server "ln -sf music.v$(date +%s).json /var/www/music.dougiamas.com/music/music.json"

echo "✅ Deployed successfully"
```

### 5.2 Hosting Setup

**Music Server (Your Web Server):**
```
/var/www/music.dougiamas.com/
├── music/
│   ├── music.json           → Symlink to latest versioned file
│   ├── music.v1234567890.json
│   ├── manifest.json
│   ├── files/               # Original music files
│   │   ├── releases/
│   │   │   ├── album_name/
│   │   │   │   ├── tracks/
│   │   │   │   │   ├── 01_track/
│   │   │   │   │   │   ├── track.mp3
│   │   │   │   │   │   ├── track.wav
```

**Frontend App Hosting:**
- **Option A (Recommended)**: Vercel/Netlify for free hosting + CDN + auto-deployments
- **Option B**: Your web server with nginx serving static build

**Build and deploy frontend:**
```bash
# Build static site
npm run build

# Deploy to Vercel (one-time setup)
vercel --prod

# OR deploy to your server
rsync -avz ./dist/ user@server:/var/www/music.dougiamas.com/app/
```

### 5.3 Ghost Integration

**Direct Track Links from Blog Posts:**

In any Ghost blog post, link to specific tracks:
```html
<a href="https://music.dougiamas.com/#/track/album-slug/track-slug">
  Listen to My New Song
</a>
```

**Embedding Full Player (Optional):**
```html
<iframe
  src="https://music.dougiamas.com/"
  width="100%"
  height="800px"
  frameborder="0"
  allow="autoplay; encrypted-media">
</iframe>
```

**Ghost Code Injection (Theme Integration):**

Add to Ghost Settings → Code Injection → Site Header:
```html
<script>
  // Open music links in embedded player or new tab
  document.addEventListener('click', (e) => {
    if (e.target.href && e.target.href.includes('music.dougiamas.com')) {
      e.preventDefault();
      window.open(e.target.href, '_blank');
    }
  });
</script>
```

### 5.4 Caching Strategy

**Server-side (nginx config):**
```nginx
location /music/music.json {
    expires 1h;  # Cache for 1 hour (weekly updates)
}

location /music/files/ {
    expires 1y;  # Cache music files forever (immutable)
    add_header Cache-Control "public, immutable";
}
```

**Client-side:**
- Service worker caches music.json for offline access
- Recently played tracks cached automatically
- Manual "Download album" for explicit offline storage

## 6. music.json Schema

The Python compiler outputs a single JSON file with this structure:

```json
{
  "version": "1.0.0",
  "generated_at": "2024-01-15T10:30:00Z",
  "artist": {
    "name": "Artist Name",
    "bio": "Artist biography...",
    "avatar_url": "https://music.example.com/artist.jpg",
    "header_url": "https://music.example.com/artist_header.jpg",
    "socials": {
      "instagram": "https://instagram.com/...",
      "twitter": "https://twitter.com/...",
      "youtube": "https://youtube.com/..."
    },
    "theme_color": "#1DB954"
  },
  "releases": [
    {
      "id": "album-slug",
      "title": "Album Name",
      "release_date": "2024-01-15",
      "release_type": "album",
      "description": "Album description",
      "cover_url": "https://music.example.com/releases/album/cover.jpg",
      "cover_blurhash": "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
      "tracks": [
        {
          "id": "track-slug",
          "title": "Track Name",
          "index": 1,
          "duration": 245,
          "file_url": "https://music.example.com/releases/album/tracks/01_track/track.mp3",
          "hires_download_url": "https://music.example.com/.../track.wav",
          "cover_url": "https://music.example.com/.../track.jpg",
          "lyrics_plain": "Full lyrics text...",
          "lyrics_synced": [
            {"start": 0, "end": 3.5, "text": "First line"},
            {"start": 3.5, "end": 7.2, "text": "Second line"}
          ],
          "youtube_url": "https://youtube.com/...",
          "spotify_url": "https://open.spotify.com/...",
          "apple_music_url": "https://music.apple.com/...",
          "tags": ["Lo-fi", "Instrumental"]
        }
      ]
    }
  ]
}
```

## 7. Technology Choices & Rationale

### Why Vite over Next.js?
- **Purpose-built for SPAs**: No workarounds needed for persistent audio player
- **Simpler mental model**: No server-side concerns, just a static app
- **Faster development**: Instant HMR, sub-second cold starts
- **Smaller bundle**: No React Server Components overhead
- **Better for music apps**: Hash routing works naturally with audio playback

### Why Zustand over Context API?
- **Performance**: No re-render issues when audio position updates (60 times/second)
- **Simpler syntax**: Less boilerplate than Context + useReducer
- **DevTools**: Better debugging with Redux DevTools integration
- **Persistent state**: Easy integration with localStorage if needed later

### Why Howler.js?
- **Gapless playback**: Essential for album listening experience
- **Format fallback**: Tries MP3, then OGG, then M4A automatically
- **Cross-browser**: Works everywhere including iOS Safari
- **Web Audio API**: Modern audio processing and visualization support

### Why Hash Routing?
- **Embedded compatibility**: Works inside iframes without CORS issues
- **Static hosting**: No server-side routing configuration needed
- **Deep linking**: Users can share URLs to specific tracks
- **Navigation without refresh**: Essential for persistent audio playback

### Why Local-First Workflow?
- **Version control**: All music metadata is Git-trackable
- **Offline management**: Artist doesn't need internet to organize music
- **Backup-friendly**: Just backup the /music directory
- **Portable**: Can regenerate entire site from local files
- **No database**: No MySQL, Postgres, or MongoDB to maintain

## 8. Development Roadmap

### Phase 1: Core Infrastructure ✅ (Specification Complete)
- [x] Define data architecture
- [x] Design compilation workflow
- [x] Choose technology stack
- [x] Plan feature priorities

### Phase 2: Python Compiler
- [ ] Build file scanner and validator
- [ ] Implement YAML + Markdown parser
- [ ] Create image processor (thumbnails, WebP, BlurHash)
- [ ] Generate music.json with versioning
- [ ] Create deployment script

### Phase 3: Frontend Foundation
- [ ] Set up Vite + React + TypeScript project
- [ ] Configure Tailwind CSS + dark mode
- [ ] Implement Zustand stores (player, music data)
- [ ] Build routing structure with React Router
- [ ] Create responsive layout shell

### Phase 4: Audio Player
- [ ] Integrate Howler.js with Zustand
- [ ] Build persistent PlayerBar component
- [ ] Implement play/pause, seek, volume controls
- [ ] Add queue management (shuffle, repeat)
- [ ] Integrate Media Session API (lock screen controls)

### Phase 5: Priority Features
- [ ] **Track Sharing** (Priority 1): Deep linking + Web Share API
- [ ] **Lyrics Display** (Priority 2): SRT parser + auto-scroll
- [ ] **Lock Screen Controls** (Priority 3): Media Session API
- [ ] **Offline Playback** (Priority 4): Service worker + cache
- [ ] **PWA Install** (Priority 5): Manifest + install prompt

### Phase 6: Navigation & Search
- [ ] Home view (latest releases)
- [ ] Album view (track list)
- [ ] All tracks view (chronological)
- [ ] Global search with keyboard shortcuts

### Phase 7: Polish & Deployment
- [ ] Keyboard shortcuts (spacebar, arrows, etc.)
- [ ] Dynamic theming (color extraction)
- [ ] Hi-res WAV download links
- [ ] Mobile gesture controls
- [ ] Ghost integration examples
- [ ] Production deployment

### Phase 8: Testing & Launch
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile testing (iOS, Android)
- [ ] Performance optimization
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Documentation for artist workflow
- [ ] Launch 🚀
