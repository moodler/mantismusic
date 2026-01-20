import { create } from 'zustand';
import { Track, Release } from '@/types/music';
import { Howl } from 'howler';

interface PlayerStore {
  currentTrack: Track | null;
  currentRelease: Release | null;
  queue: Track[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  howl: Howl | null;

  // Actions
  setCurrentTrack: (track: Track, release: Release) => void;
  setQueue: (queue: Track[]) => void;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  playNext: () => void;
  playPrevious: () => void;
  setHowl: (howl: Howl | null) => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  currentRelease: null,
  queue: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  shuffle: false,
  repeat: 'none',
  howl: null,

  setCurrentTrack: (track, release) => set({ currentTrack: track, currentRelease: release }),

  setQueue: (queue) => set({ queue }),

  play: () => {
    const { howl } = get();
    if (howl) {
      howl.play();
      set({ isPlaying: true });
    }
  },

  pause: () => {
    const { howl } = get();
    if (howl) {
      howl.pause();
      set({ isPlaying: false });
    }
  },

  togglePlayPause: () => {
    const { isPlaying, play, pause } = get();
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  },

  setVolume: (volume) => {
    const { howl } = get();
    if (howl) {
      howl.volume(volume);
    }
    set({ volume });
  },

  setCurrentTime: (time) => set({ currentTime: time }),

  setDuration: (duration) => set({ duration }),

  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

  toggleRepeat: () => set((state) => ({
    repeat: state.repeat === 'none' ? 'all' : state.repeat === 'all' ? 'one' : 'none'
  })),

  playNext: () => {
    const { queue, currentTrack, repeat, shuffle } = get();
    if (!currentTrack || queue.length === 0) return;

    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    let nextIndex = currentIndex + 1;

    if (repeat === 'one') {
      nextIndex = currentIndex;
    } else if (nextIndex >= queue.length) {
      if (repeat === 'all') {
        nextIndex = 0;
      } else {
        return;
      }
    }

    const nextTrack = queue[nextIndex];
    // This will be handled by the player component
  },

  playPrevious: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack || queue.length === 0) return;

    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    const prevIndex = currentIndex - 1;

    if (prevIndex < 0) return;

    const prevTrack = queue[prevIndex];
    // This will be handled by the player component
  },

  setHowl: (howl) => set({ howl }),
}));
