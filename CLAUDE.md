# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mantis Music is a static "Spotify-style" artist discography web application. It displays album and track information from a JSON database with search, filtering, and modal detail views. The current implementation is a vanilla JavaScript frontend (not the Next.js SPA described in README.md's future vision).

## Architecture

**Static Site Structure:**
- `index.html` - Single page app entry point
- `js/app.js` - All application logic (data loading, rendering, filtering, modals)
- `css/style.css` - Complete styling with CSS custom properties for theming
- `data/discography.json` - Music catalog data (albums, singles, tracks with metadata)

**Data Flow:**
1. On load, fetches `data/discography.json`
2. Populates filter dropdowns from unique genres, moods, years
3. Renders release cards in a responsive grid
4. Clicking a release opens a modal with full details and tracklist
5. Clicking a track opens a nested modal with lyrics and credits

**Key State Variables in app.js:**
- `discographyData` - Raw loaded JSON
- `filteredAlbums`, `filteredSingles` - Current filtered subsets
- `currentView` - Active navigation view ('all', 'albums', 'singles', 'about')

## Development

This is a static site with no build process. Open `index.html` directly in a browser or serve with any static file server:

```bash
python3 -m http.server 8000
# or
npx serve .
```

## Data Schema

The `discography.json` structure:
- Top level: `artist`, `bio`, `socialLinks`, `albums[]`, `singles[]`
- Albums have: `id`, `title`, `year`, `releaseDate`, `type`, `description`, `tags`, `genres`, `tracks[]`, `streamingLinks`, `backgroundColor`, `textColor`
- Tracks have: `trackNumber`, `title`, `duration`, `bpm`, `key`, `mood[]`, `tags[]`, `lyrics`, `credits`
- Singles have the same structure as tracks but at the release level

## Future Vision (per README.md)

The README describes a more complete system not yet implemented:
- Python parser (`build_music_json.py`) to compile from folder structure to JSON
- Next.js SPA with persistent audio player (Howler.js)
- Zustand/Context for global player state
- Hash-based routing for deep linking
- Dynamic backgrounds from album art colors
