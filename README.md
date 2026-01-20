# Mantis Music - Custom "Spotify-style" Artist Player

An open script for creating a lovely private music site anywhere you like.

Technical Specification: 

1. Project Overview
A single-artist music streaming web application designed for high performance and visual elegance. The system uses a local-first management workflow where the artist manages a physical directory of files, which is then "compiled" into a JSON database and synced to a web server.

2. Local Data Architecture (/music)

The source of truth is a hierarchical folder structure on the artist's computer.

2.1 Directory Structure

music/
├── artist.md (Artist Bio & Socials & colour/theme settings)
├── artist.jpg
├── artist_header.jpg
├── releases/
│   ├── album_name
│   │   ├── release.md (Album Metadata)
│   │   ├── album_name.jpg
│   │   ├── tracks/
│   │   │   ├── 01_track_name/
│   │   │   │   ├── track.md (Track Metadata)
│   │   │   │   ├── track_name.txt (Plain lyrics)
│   │   │   │   ├── track_name.srt (Timed lyrics)
│   │   │   │   ├── track_name.mp3
│   │   │   │   ├── track_name.jpg (Track cover - Optional, defaults to Album Cover)
│   │   │   │   ├── track_name.mp4 (Optional visualizer)

2.2 Metadata Schema (Markdown + YAML Frontmatter)

Each .md file contains a YAML block for machine-readable data and Markdown for human-readable content.

Example track.md:
---
title: "Song Title"
index: 1
youtube_url: "[https://youtube.com/](https://youtube.com/)..."
spotify_url: "[https://open.spotify.com/](https://open.spotify.com/)..."
apple_music_url: "[https://music.apple.com/](https://music.apple.com/)..."
tags: ["Lo-fi", "Instrumental"]

3. The Python Parser ("The Compiler")

A script (build_music_json.py) that acts as the bridge between the folder structure and the web app.

3.1 Core Functions

Validation: Ensures every folder has required files (MP3, MD, JPG). Gives "FIXME" alerts if metadata is missing.URL 
Mapping: Converts local paths to absolute URLs based on a hardcoded base (e.g., https://music.dougiamas.com/music/).
Compilation: Merges all artist.md, release.md, and track.md data into a single, optimized music.json.Image 
Processing: Generates low-res blurred placeholders for "instant-load" visuals.  

4. Frontend Architecture (Next.js SPA)
The frontend must be a Single Page Application to allow for a persistent, non-breaking audio player.

4.1 Technical Stack

Framework: Next.js (App Router) using a single-page hash-routing strategy.
Styling: Tailwind CSS (Dark Mode by default).
Audio Engine: Howler.js for robust queue management and gapless playback.
State Management: Zustand or React Context for global player state.

4.2 The Persistent Player Logic
Root Layout: The PlayerBar component is placed in the layout.tsx file outside the page transition wrapper.
Navigation: Clicking an album or artist link updates the main view content without a full browser refresh, preventing the audio context from closing.
State Preservation: The currentTrack, queue, currentTime, and volume are stored in global state.

4.3 Key UI Features
The "Floating" Player: Sticky footer with play/pause, seek bar, volume, shuffle, and repeat.
Queue System: Users can view and reorder the "Up Next" list.
Dynamic Backgrounds: Site colors subtly shift based on the current track's album art (using color-thief).
Deep Linking: Support for URLs like dougiamas.com/music/#/album/my-album to navigate within the Ghost-embedded app.

5. Deployment Workflow
Manage: Artist adds a new folder to /music and runs the Python script.
Compile: music.json is generated.
Sync: rsync -avz ./music/ user@server:/var/www/music.dougiamas.com/
Host: The Next.js app is hosted on Vercel or as a static export, hardcoded to fetch https://music.dougiamas.com/music/music.json.
Embed: The app is embedded into the Ghost page via an iFrame or custom code injection.
