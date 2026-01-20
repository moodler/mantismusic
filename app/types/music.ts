export interface Artist {
  name: string;
  bio: string;
  social: {
    youtube?: string;
    spotify?: string;
    instagram?: string;
    twitter?: string;
  };
  image: string;
  headerImage: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
  };
}

export interface Track {
  id: string;
  title: string;
  index: number;
  duration: number;
  audioUrl: string;
  cover: string;
  lyrics?: string;
  timedLyrics?: string;
  tags: string[];
  youtubeUrl?: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  videoUrl?: string;
  aiUsage?: string;
}

export interface Release {
  id: string;
  title: string;
  type: 'album' | 'single' | 'ep';
  releaseDate: string;
  cover: string;
  description: string;
  tracks: Track[];
}

export interface MusicData {
  artist: Artist;
  releases: Release[];
}

export interface PlayerState {
  currentTrack: Track | null;
  currentRelease: Release | null;
  queue: Track[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
}
