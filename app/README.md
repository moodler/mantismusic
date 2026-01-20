# Mantis Music - Artist Player

A beautiful, modern music player built with Next.js, featuring a persistent audio player, tag-based filtering, and AI metadata support.

## Features

### Home Page
- **Chronological Timeline**: All releases displayed from newest to oldest
- **Latest Badge**: The most recent release is highlighted with a "LATEST" badge
- **Unified View**: Albums and singles are displayed together without division
- **AI Metadata**: Tracks using AI are clearly marked with an AI badge and usage details
- **Interactive Tags**: Click any tag to filter songs with that tag
- **Rich Gradients**: Beautiful CSS gradients throughout the interface

### Search Page
- **Advanced Filtering**: Filter by tags, year, and release type
- **Multi-Tag Support**: Select multiple tags to find specific songs
- **Real-time Search**: Search tracks, albums, and tags instantly
- **AI Information**: See detailed AI usage information for each track

### Persistent Player
- **Gapless Playback**: Smooth transitions between tracks using Howler.js
- **Queue Management**: Automatic queue creation from release tracks
- **Playback Controls**: Play, pause, skip, shuffle, and repeat
- **Volume Control**: Adjustable volume slider
- **Progress Tracking**: Visual progress bar with seek capability
- **Album Art Display**: Shows current track's album artwork

## Getting Started

### Development

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
app/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with Navigation and Player
│   ├── page.tsx           # Home page with timeline view
│   └── search/            # Search page with filters
│       └── page.tsx
├── components/            # React components
│   ├── Navigation.tsx     # Top navigation bar
│   └── Player.tsx         # Persistent audio player
├── store/                 # State management
│   └── playerStore.ts     # Zustand store for player state
├── types/                 # TypeScript types
│   └── music.ts          # Music data types
└── public/               # Static files
    └── music.json        # Music database
```

## Music Data Format

The application reads from `public/music.json`. Here's the structure:

```json
{
  "artist": {
    "name": "Artist Name",
    "bio": "Artist bio",
    "social": {
      "youtube": "URL",
      "spotify": "URL",
      "instagram": "URL"
    },
    "image": "/path/to/image.jpg",
    "headerImage": "/path/to/header.jpg",
    "theme": {
      "primaryColor": "#6366f1",
      "secondaryColor": "#8b5cf6"
    }
  },
  "releases": [
    {
      "id": "release-id",
      "title": "Release Title",
      "type": "album|single|ep",
      "releaseDate": "2025-12-15",
      "cover": "/path/to/cover.jpg",
      "description": "Description",
      "tracks": [
        {
          "id": "01",
          "title": "Track Title",
          "index": 1,
          "duration": 245,
          "audioUrl": "/path/to/audio.mp3",
          "cover": "/path/to/cover.jpg",
          "lyrics": "Lyrics text",
          "tags": ["Ambient", "Chill"],
          "youtubeUrl": "https://youtube.com/...",
          "spotifyUrl": "https://spotify.com/...",
          "appleMusicUrl": "https://music.apple.com/...",
          "aiUsage": "Description of AI usage (optional)"
        }
      ]
    }
  ]
}
```

## AI Metadata Support

Tracks can include AI usage information:

1. **AI Tag**: Automatically added to tracks with `aiUsage` field
2. **AI Badge**: Visual indicator on track listings
3. **AI Details**: Detailed description of how AI was used in each track

Example:
```json
{
  "title": "My Song",
  "tags": ["Electronic"],
  "aiUsage": "AI-assisted composition and arrangement"
}
```

## Customization

### Colors and Gradients

Edit `app/globals.css` to customize the color scheme:

```css
:root {
  --gradient-start: #6366f1;
  --gradient-end: #8b5cf6;
  --gradient-accent: #ec4899;
}
```

### Theme

Colors can also be set per-artist in `music.json`:

```json
{
  "artist": {
    "theme": {
      "primaryColor": "#your-color",
      "secondaryColor": "#your-color"
    }
  }
}
```

## Technologies Used

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Howler.js** - Audio playback
- **Zustand** - State management

## License

See the LICENSE file in the root directory.
