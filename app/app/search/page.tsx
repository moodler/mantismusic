'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MusicData, Release, Track } from '@/types/music';
import { usePlayerStore } from '@/store/playerStore';

function SearchContent() {
  const [musicData, setMusicData] = useState<MusicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  const searchParams = useSearchParams();
  const router = useRouter();
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

  // Check for tag in URL params
  useEffect(() => {
    const tagParam = searchParams.get('tag');
    if (tagParam && !selectedTags.includes(tagParam)) {
      setSelectedTags([tagParam]);
    }
  }, [searchParams]);

  const playTrack = (track: Track, release: Release) => {
    setCurrentTrack(track, release);
    setQueue(release.tracks);
    play();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
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

  // Get all unique tags
  const allTags = Array.from(
    new Set(
      musicData.releases.flatMap(release =>
        release.tracks.flatMap(track => track.tags)
      )
    )
  ).sort();

  // Get all unique years
  const allYears = Array.from(
    new Set(
      musicData.releases.map(release =>
        new Date(release.releaseDate).getFullYear().toString()
      )
    )
  ).sort().reverse();

  // Get all unique types
  const allTypes = Array.from(
    new Set(musicData.releases.map(release => release.type))
  ).sort();

  // Filter tracks
  const filteredTracks: Array<{ track: Track; release: Release }> = [];

  musicData.releases.forEach(release => {
    release.tracks.forEach(track => {
      // Search query filter
      const matchesSearch = !searchQuery ||
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        release.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Tag filter
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.every(selectedTag => track.tags.includes(selectedTag));

      // Year filter
      const releaseYear = new Date(release.releaseDate).getFullYear().toString();
      const matchesYear = !selectedYear || releaseYear === selectedYear;

      // Type filter
      const matchesType = !selectedType || release.type === selectedType;

      if (matchesSearch && matchesTags && matchesYear && matchesType) {
        filteredTracks.push({ track, release });
      }
    });
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-6">Search & Filter</h1>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search tracks, albums, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 transition"
          />
        </div>

        {/* Filters */}
        <div className="space-y-6">
          {/* Tags Filter */}
          <div>
            <h3 className="text-sm font-semibold text-white/60 mb-3 uppercase">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm transition ${
                    selectedTags.includes(tag)
                      ? 'gradient-bg text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Year Filter */}
          <div>
            <h3 className="text-sm font-semibold text-white/60 mb-3 uppercase">Year</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedYear('')}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  !selectedYear
                    ? 'gradient-bg text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                }`}
              >
                All Years
              </button>
              {allYears.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-4 py-2 rounded-full text-sm transition ${
                    selectedYear === year
                      ? 'gradient-bg text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <h3 className="text-sm font-semibold text-white/60 mb-3 uppercase">Type</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedType('')}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  !selectedType
                    ? 'gradient-bg text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                }`}
              >
                All Types
              </button>
              {allTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-full text-sm transition ${
                    selectedType === type
                      ? 'gradient-bg text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mb-4">
        <p className="text-white/60">
          {filteredTracks.length} {filteredTracks.length === 1 ? 'track' : 'tracks'} found
        </p>
      </div>

      <div className="space-y-2">
        {filteredTracks.map(({ track, release }) => (
          <div
            key={`${release.id}-${track.id}`}
            onClick={() => playTrack(track, release)}
            className="gradient-card rounded-lg p-4 gradient-hover cursor-pointer group flex items-center gap-4"
          >
            {/* Album Art */}
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
              <img
                src={track.cover || release.cover}
                alt={track.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold truncate">{track.title}</div>
              <div className="text-white/60 text-sm truncate">{release.title}</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {track.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`text-xs px-2 py-1 rounded-full transition ${
                      selectedTags.includes(tag)
                        ? 'gradient-bg text-white'
                        : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
                {track.aiUsage && (
                  <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 border border-pink-500/30">
                    AI
                  </span>
                )}
              </div>
              {track.aiUsage && (
                <div className="text-xs text-white/40 mt-1">
                  AI Usage: {track.aiUsage}
                </div>
              )}
            </div>

            {/* Duration and Play Button */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-white/40 text-sm">{formatDuration(track.duration)}</div>
              <button className="opacity-0 group-hover:opacity-100 transition p-2 hover:bg-white/10 rounded-full">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTracks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-2xl text-white/40">No tracks found</p>
          <p className="text-white/30 mt-2">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl gradient-text animate-pulse">Loading...</div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
