'use client';

import { usePlayerStore } from '@/store/playerStore';
import { useEffect, useRef } from 'react';
import { Howl } from 'howler';

export default function Player() {
  const {
    currentTrack,
    currentRelease,
    isPlaying,
    currentTime,
    duration,
    volume,
    shuffle,
    repeat,
    play,
    pause,
    togglePlayPause,
    setVolume,
    setCurrentTime,
    setDuration,
    toggleShuffle,
    toggleRepeat,
    setHowl,
  } = usePlayerStore();

  const progressRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!currentTrack) return;

    // Clean up previous howl instance
    const currentHowl = usePlayerStore.getState().howl;
    if (currentHowl) {
      currentHowl.unload();
    }

    // Create new howl instance
    const howl = new Howl({
      src: [currentTrack.audioUrl],
      html5: true,
      volume: volume,
      onplay: () => {
        setDuration(howl.duration());
        updateProgress();
      },
      onend: () => {
        // Handle track end
        pause();
      },
      onload: () => {
        setDuration(howl.duration());
      },
    });

    setHowl(howl);

    return () => {
      howl.unload();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentTrack]);

  const updateProgress = () => {
    const howl = usePlayerStore.getState().howl;
    if (howl && usePlayerStore.getState().isPlaying) {
      const seek = howl.seek() as number;
      setCurrentTime(seek);
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      updateProgress();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  }, [isPlaying]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;

    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    const howl = usePlayerStore.getState().howl;
    if (howl) {
      howl.seek(newTime);
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-24 gradient-bg border-t border-white/10 backdrop-blur-lg z-50">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center gap-4">
        {/* Album Art */}
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
          <img
            src={currentTrack.cover || '/placeholder.jpg'}
            alt={currentTrack.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Track Info */}
        <div className="flex-shrink-0 min-w-0 w-48">
          <div className="font-semibold text-white truncate">{currentTrack.title}</div>
          <div className="text-sm text-white/60 truncate">{currentRelease?.title}</div>
        </div>

        {/* Controls */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-full transition ${shuffle ? 'text-white bg-white/20' : 'text-white/60 hover:text-white'}`}
              title="Shuffle"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
              </svg>
            </button>

            <button
              className="p-2 text-white/60 hover:text-white transition"
              title="Previous"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>

            <button
              onClick={togglePlayPause}
              className="p-3 bg-white text-black rounded-full hover:scale-110 transition shadow-lg"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            <button
              className="p-2 text-white/60 hover:text-white transition"
              title="Next"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>

            <button
              onClick={toggleRepeat}
              className={`p-2 rounded-full transition ${repeat !== 'none' ? 'text-white bg-white/20' : 'text-white/60 hover:text-white'}`}
              title={`Repeat: ${repeat}`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
              </svg>
              {repeat === 'one' && (
                <span className="absolute text-xs font-bold">1</span>
              )}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60 w-12 text-right">
              {formatTime(currentTime)}
            </span>
            <div
              ref={progressRef}
              onClick={handleProgressClick}
              className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer group"
            >
              <div
                className="h-full bg-white rounded-full transition-all group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            <span className="text-xs text-white/60 w-12">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <svg className="w-5 h-5 text-white/60" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
          </svg>
          <input
            type="range"
            min="0"
            max="100"
            value={volume * 100}
            onChange={(e) => setVolume(parseFloat(e.target.value) / 100)}
            className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>
      </div>
    </div>
  );
}
