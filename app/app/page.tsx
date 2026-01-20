'use client';

import { useEffect, useState } from 'react';
import { MusicData, Release, Track } from '@/types/music';
import { usePlayerStore } from '@/store/playerStore';
import Link from 'next/link';

export default function Home() {
  const [musicData, setMusicData] = useState<MusicData | null>(null);
  const [loading, setLoading] = useState(true);
  const { setCurrentTrack, setQueue, play } = usePlayerStore();

  useEffect(() => {
    fetch('/music.json')
      .then(res => res.json())
      .then(data => {
        setMusicData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load music data:', err);
        setLoading(false);
      });
  }, []);

  const playTrack = (track: Track, release: Release) => {
    setCurrentTrack(track, release);
    setQueue(release.tracks);
    play();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl gradient-text animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!musicData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-white/60">Failed to load music data</div>
      </div>
    );
  }

  // Sort releases by date (newest first)
  const sortedReleases = [...musicData.releases].sort((a, b) => {
    return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12 gradient-card rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 gradient-bg blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <h2 className="text-5xl font-bold text-white mb-4">{musicData.artist.name}</h2>
          <p className="text-xl text-white/80 mb-6">{musicData.artist.bio}</p>
          <div className="flex gap-4">
            {musicData.artist.social.youtube && (
              <a
                href={musicData.artist.social.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 gradient-bg rounded-lg text-white hover:opacity-80 transition"
              >
                YouTube
              </a>
            )}
            {musicData.artist.social.spotify && (
              <a
                href={musicData.artist.social.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 gradient-bg rounded-lg text-white hover:opacity-80 transition"
              >
                Spotify
              </a>
            )}
            {musicData.artist.social.instagram && (
              <a
                href={musicData.artist.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 gradient-bg rounded-lg text-white hover:opacity-80 transition"
              >
                Instagram
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {sortedReleases.map((release, releaseIndex) => (
          <div key={release.id} className="relative">
            {/* Latest Label */}
            {releaseIndex === 0 && (
              <div className="mb-4">
                <span className="inline-block px-4 py-2 gradient-bg rounded-full text-white font-bold text-sm">
                  LATEST
                </span>
              </div>
            )}

            {/* Release Card */}
            <div className="gradient-card rounded-xl p-6 gradient-hover">
              <div className="flex gap-6 mb-6">
                {/* Album Art */}
                <div className="w-48 h-48 rounded-lg overflow-hidden flex-shrink-0 shadow-2xl">
                  <img
                    src={release.cover}
                    alt={release.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Release Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-3xl font-bold text-white mb-2">{release.title}</h3>
                      <p className="text-white/60 uppercase text-sm mb-2">
                        {release.type} • {formatDate(release.releaseDate)}
                      </p>
                    </div>
                  </div>
                  <p className="text-white/80 mb-4">{release.description}</p>
                  <div className="text-white/60 text-sm">
                    {release.tracks.length} {release.tracks.length === 1 ? 'track' : 'tracks'}
                  </div>
                </div>
              </div>

              {/* Track List */}
              <div className="space-y-2">
                {release.tracks.map((track, trackIndex) => (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track, release)}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 cursor-pointer group transition"
                  >
                    <div className="w-8 text-white/40 text-sm text-center group-hover:text-white">
                      {track.index}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">{track.title}</div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {track.tags.map((tag) => (
                          <Link
                            key={tag}
                            href={`/search?tag=${encodeURIComponent(tag)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition"
                          >
                            {tag}
                          </Link>
                        ))}
                        {track.aiUsage && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 border border-pink-500/30">
                            AI
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-white/40 text-sm">{formatDuration(track.duration)}</div>
                    <button className="opacity-0 group-hover:opacity-100 transition p-2 hover:bg-white/10 rounded-full">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* AI Usage Info */}
              {release.tracks.some(t => t.aiUsage) && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-white/40 mb-2">AI Usage Details:</p>
                  {release.tracks.filter(t => t.aiUsage).map(track => (
                    <div key={track.id} className="text-xs text-white/60 mb-1">
                      <span className="text-white/80">{track.title}:</span> {track.aiUsage}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
