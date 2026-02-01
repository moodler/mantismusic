/*
 * Mantis Music - A self-hosted artist discography player
 * Copyright (C) 2026 Martin Dougiamas
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// Streaming platform SVG icons
const PLATFORM_ICONS = {
    spotify: '<svg viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.52 17.28c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.7 1.32.36.22.48.66.24 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-.99-.12-1.14-.6-.12-.48.12-.99.6-1.14 4.38-1.32 9.78-.66 13.5 1.62.36.18.54.78.24 1.2zm.12-3.36C15.24 8.4 8.88 8.16 5.16 9.3c-.6.18-1.2-.18-1.38-.78-.18-.6.18-1.2.78-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3z"/></svg>',
    appleMusic: '<svg viewBox="0 0 24 24"><path d="M23.99 6.73c0-.13-.01-.27-.01-.4a5.85 5.85 0 0 0-.48-2.18c-.43-.94-1.07-1.76-1.88-2.38A6.17 6.17 0 0 0 19.44.5 10.7 10.7 0 0 0 18.1.2c-.44-.07-.87-.1-1.31-.13-.12 0-.24-.01-.36-.02H7.56c-.12.01-.24.02-.36.02-.44.03-.87.06-1.31.13-.51.09-1 .23-1.47.44A5.9 5.9 0 0 0 2.06 2.3 5.89 5.89 0 0 0 .68 4.73c-.14.5-.24 1.02-.3 1.54-.04.31-.06.63-.07.94v9.58c.01.31.03.63.07.94.06.52.16 1.04.3 1.54.29.97.78 1.84 1.47 2.58a5.73 5.73 0 0 0 2.4 1.59c.47.18.96.31 1.46.39.44.07.88.1 1.32.13.12.01.24.02.36.02h8.91c.12-.01.24-.01.36-.02.44-.03.88-.06 1.32-.13a6.1 6.1 0 0 0 1.46-.4 5.62 5.62 0 0 0 2.39-1.83 5.82 5.82 0 0 0 1.04-2.34c.14-.5.24-1.02.3-1.54.04-.31.06-.63.07-.94V6.73zm-6.72 5.2v4.81c0 .48-.06.95-.28 1.38a2.12 2.12 0 0 1-1.24 1.05c-.36.13-.73.2-1.11.22-.84.06-1.61-.42-1.86-1.2a1.76 1.76 0 0 1 .82-2.06c.35-.2.73-.33 1.12-.42.4-.1.8-.17 1.19-.29.32-.1.48-.32.5-.65V10.4c0-.1-.04-.2-.13-.24-.09-.05-.19-.03-.28 0l-4.88 1.04c-.08.02-.15.05-.2.11-.05.07-.07.15-.07.23v6.27c.01.46-.04.93-.24 1.36a2.13 2.13 0 0 1-1.15 1.1c-.38.15-.78.23-1.18.26-.84.06-1.61-.42-1.86-1.2a1.76 1.76 0 0 1 .82-2.06c.35-.2.73-.33 1.12-.42.4-.1.8-.18 1.19-.29.32-.1.49-.32.5-.65V7.67c0-.3.1-.55.36-.72.17-.11.36-.18.56-.23l5.72-1.23c.24-.05.49-.1.74-.1.34 0 .63.14.78.47.07.16.1.33.1.5z"/></svg>',
    tidal: '<svg viewBox="0 0 24 24"><polygon points="1,8 5,4 9,8 5,12"/><polygon points="8,8 12,4 16,8 12,12"/><polygon points="15,8 19,4 23,8 19,12"/><polygon points="8,15 12,11 16,15 12,19"/></svg>',
    deezer: '<svg viewBox="0 0 24 24"><rect x="0" y="18.1" width="3.6" height="1.8"/><rect x="0" y="15.5" width="3.6" height="1.8"/><rect x="0" y="12.9" width="3.6" height="1.8"/><rect x="4.8" y="18.1" width="3.6" height="1.8"/><rect x="4.8" y="15.5" width="3.6" height="1.8"/><rect x="4.8" y="12.9" width="3.6" height="1.8"/><rect x="4.8" y="10.3" width="3.6" height="1.8"/><rect x="4.8" y="7.7" width="3.6" height="1.8"/><rect x="9.6" y="18.1" width="3.6" height="1.8"/><rect x="9.6" y="15.5" width="3.6" height="1.8"/><rect x="9.6" y="12.9" width="3.6" height="1.8"/><rect x="9.6" y="10.3" width="3.6" height="1.8"/><rect x="14.4" y="18.1" width="3.6" height="1.8"/><rect x="14.4" y="15.5" width="3.6" height="1.8"/><rect x="14.4" y="12.9" width="3.6" height="1.8"/><rect x="14.4" y="10.3" width="3.6" height="1.8"/><rect x="14.4" y="7.7" width="3.6" height="1.8"/><rect x="14.4" y="5.1" width="3.6" height="1.8"/><rect x="14.4" y="2.5" width="3.6" height="1.8"/><rect x="19.2" y="18.1" width="3.6" height="1.8"/><rect x="19.2" y="15.5" width="3.6" height="1.8"/><rect x="19.2" y="12.9" width="3.6" height="1.8"/><rect x="19.2" y="10.3" width="3.6" height="1.8"/><rect x="19.2" y="7.7" width="3.6" height="1.8"/></svg>',
    youtube: '<svg viewBox="0 0 24 24"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.54 15.57V8.43L15.82 12l-6.28 3.57z"/></svg>',
    bandcamp: '<svg viewBox="0 0 24 24"><path d="M0 18.75l7.44-13.5H24l-7.44 13.5z"/></svg>',
    website: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85 0 3.2-.01 3.58-.07 4.85-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07-3.2 0-3.58-.01-4.85-.07-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85 0-3.2.01-3.58.07-4.85C2.38 3.86 3.9 2.31 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.7.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"/></svg>',
    soundcloud: '<svg viewBox="0 0 24 24"><path d="M1.18 13.87c-.07 0-.13.06-.14.13l-.35 2.01.35 1.97c.01.07.07.13.14.13s.13-.06.14-.13l.42-1.97-.42-2.01c-.01-.07-.07-.13-.14-.13zm1.78-1.37c-.07 0-.14.06-.15.14l-.37 3.38.37 3.28c.01.08.08.14.15.14s.14-.06.15-.14l.43-3.28-.43-3.38c-.01-.08-.08-.14-.15-.14zm1.81-.52c-.08 0-.15.07-.16.15l-.32 3.9.32 3.48c.01.08.08.15.16.15s.15-.07.16-.15l.37-3.48-.37-3.9c-.01-.08-.08-.15-.16-.15zm1.81-.16c-.09 0-.16.07-.17.16l-.3 4.06.3 3.56c.01.09.08.16.17.16s.16-.07.17-.16l.34-3.56-.34-4.06c-.01-.09-.08-.16-.17-.16zm1.83-.52c-.1 0-.17.08-.18.17l-.27 4.58.27 3.58c.01.09.08.17.18.17s.17-.08.18-.17l.31-3.58-.31-4.58c-.01-.09-.08-.17-.18-.17zm1.83.1c-.1 0-.18.08-.19.18l-.24 4.48.24 3.54c.01.1.09.18.19.18s.18-.08.19-.18l.28-3.54-.28-4.48c-.01-.1-.09-.18-.19-.18zm1.84-.82c-.11 0-.19.09-.2.19l-.24 5.3.24 3.46c.01.1.09.19.2.19s.19-.09.2-.19l.27-3.46-.27-5.3c-.01-.1-.09-.19-.2-.19zm1.85-.1c-.11 0-.2.09-.21.2l-.22 5.4.22 3.44c.01.11.1.2.21.2s.2-.09.21-.2l.25-3.44-.25-5.4c-.01-.11-.1-.2-.21-.2zm3.57-2.17c-.2 0-.38.03-.57.08a7.54 7.54 0 0 0-7.3-5.87c-.65 0-1.29.1-1.88.27-.22.07-.28.14-.28.28v11.56c.01.14.11.25.25.27h9.78a3.3 3.3 0 0 0 3.3-3.3 3.3 3.3 0 0 0-3.3-3.29z"/></svg>'
};

// Build a streaming link element with platform icon
function createStreamingLink(platform, url) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.className = 'streaming-link';
    const label = platform.charAt(0).toUpperCase() + platform.slice(1).replace(/([A-Z])/g, ' $1');
    link.title = label;
    link.innerHTML = PLATFORM_ICONS[platform] || `<span style="font-size:0.7rem">${label}</span>`;
    return link;
}

// Configuration - point this to your data server
const CONFIG = {
    dataBaseUrl: ''  // Empty for local, or 'https://music.example.com/data' for remote
};

// Global state
let discographyData = null;
let filteredAlbums = [];
let filteredSingles = [];
let filteredReleases = [];
let allTracks = [];       // Flattened list of { track, release } for the Tracks view
let currentView = 'tracks';

// Audio player state
let audioPlayer = null;
let currentTrack = null;
let currentRelease = null;
let isPlaying = false;

// Queue state
let queue = [];  // Array of { track, release } objects

// Playback mode: 'normal', 'repeat-one', 'repeat-all'
let playbackMode = 'normal';

// Track detail play button state
let trackDetailPlayBtn = null;
let trackDetailTrack = null;

function syncTrackDetailPlayBtn() {
    if (!trackDetailPlayBtn || !trackDetailTrack) return;
    const isCurrentlyPlaying = currentTrack === trackDetailTrack && isPlaying;
    if (isCurrentlyPlaying) {
        trackDetailPlayBtn.innerHTML = '&#9654; Playing now';
        trackDetailPlayBtn.disabled = true;
        trackDetailPlayBtn.classList.add('playing-now');
    } else {
        trackDetailPlayBtn.innerHTML = '&#9654; Play';
        trackDetailPlayBtn.disabled = false;
        trackDetailPlayBtn.classList.remove('playing-now');
    }
}

// Resolve a data path to full URL
function resolveDataUrl(path) {
    if (!path) return null;
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    if (CONFIG.dataBaseUrl) {
        return `${CONFIG.dataBaseUrl}/${cleanPath}`;
    }
    return cleanPath;
}

// Hash routing guard — prevents navigateFromHash from firing
// when we programmatically set the hash
let hashChangeFromCode = false;

// Update the URL hash without triggering navigateFromHash
function updateHash(hash) {
    hashChangeFromCode = true;
    window.location.hash = hash;
    // Reset the guard after the synchronous hashchange fires
    hashChangeFromCode = false;
}

// Look up a release (album or single) by its id
function findReleaseById(id) {
    if (!discographyData) return null;
    return discographyData.albums.find(a => a.id === id)
        || discographyData.singles.find(s => s.id === id)
        || null;
}

// Find a track by slug across all releases; returns { track, release } or null
function findTrackBySlug(slug) {
    if (!discographyData) return null;
    // Check singles first (their id IS the slug)
    const single = discographyData.singles.find(s => s.id === slug);
    if (single) return { track: single, release: single };
    // Check tracks within all releases (albums and EPs)
    for (const release of [...discographyData.albums, ...discographyData.singles]) {
        if (!release.tracks) continue;
        const track = release.tracks.find(t => t.slug === slug);
        if (track) return { track, release };
    }
    return null;
}

// Read the current hash and navigate to the matching view
function navigateFromHash() {
    const hash = window.location.hash.replace(/^#\/?/, ''); // strip leading #/ or #

    if (!hash) {
        currentView = 'tracks';
        navigationHistory = [];
        syncNavButton();
        renderView();
        return;
    }

    const parts = hash.split('/');

    if (parts[0] === 'collections') {
        currentView = 'collections';
        navigationHistory = [];
        syncNavButton();
        renderView();
    } else if (parts[0] === 'tracks') {
        currentView = 'tracks';
        navigationHistory = [];
        syncNavButton();
        renderView();
    } else if (parts[0] === 'about') {
        currentView = 'about';
        navigationHistory = [];
        syncNavButton();
        renderView();
    } else if ((parts[0] === 'collection' || parts[0] === 'release') && parts[1]) {
        const release = findReleaseById(parts[1]);
        if (release) {
            navigationHistory = [{ type: 'list' }];
            syncNavButton();
            showReleaseDetail(release);
        } else {
            renderView();
        }
    } else if (parts[0] === 'track' && parts[1]) {
        const result = findTrackBySlug(parts[1]);
        if (result) {
            const isSingle = result.track === result.release;
            navigationHistory = isSingle
                ? [{ type: 'list' }]
                : [{ type: 'list' }, { type: 'release', release: result.release }];
            syncNavButton();
            showTrackDetail(result.track, result.release);
        } else {
            renderView();
        }
    } else {
        currentView = 'tracks';
        navigationHistory = [];
        syncNavButton();
        renderView();
    }
}

// Sync the active nav button to match currentView
function syncNavButton() {
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.view === currentView);
    });
}

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await loadDiscography();
    initializeEventListeners();
    initializeAudioPlayer();
    populateFilters();

    // Route from the URL hash, or fall back to default view
    window.addEventListener('hashchange', () => {
        if (!hashChangeFromCode) {
            navigateFromHash();
        }
    });

    if (window.location.hash && window.location.hash !== '#' && window.location.hash !== '#/') {
        navigateFromHash();
    } else {
        renderView();
    }

    loadMostRecentTrack();
    applyBrandColors();
});

// Initialize audio player
function initializeAudioPlayer() {
    audioPlayer = document.getElementById('audio-element');

    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', handleTrackEnd);
    audioPlayer.addEventListener('loadedmetadata', updateDuration);
    audioPlayer.addEventListener('error', handleAudioError);

    // Player controls
    document.getElementById('play-pause-btn').addEventListener('click', togglePlayPause);
    document.getElementById('prev-btn').addEventListener('click', playPrevious);
    document.getElementById('next-btn').addEventListener('click', playNext);

    // Progress bar
    const progressBar = document.getElementById('progress-bar');
    progressBar.addEventListener('click', seekTo);

    // Volume
    const volumeSlider = document.getElementById('volume-slider');
    volumeSlider.addEventListener('input', setVolume);

    // Queue button
    document.getElementById('queue-btn').addEventListener('click', toggleQueuePopup);
    document.getElementById('clear-queue-btn').addEventListener('click', clearQueue);

    // Mode button
    document.getElementById('mode-btn').addEventListener('click', cyclePlaybackMode);

    // Close queue popup when clicking outside
    document.addEventListener('click', (e) => {
        const popup = document.getElementById('queue-popup');
        const queueBtn = document.getElementById('queue-btn');
        if (!popup.contains(e.target) && !queueBtn.contains(e.target)) {
            popup.classList.add('hidden');
        }
    });
}

// Load a track into the player without playing it
function loadTrackIntoPlayer(track, release) {
    const audioFile = track.audioFile || release.audioFile;
    if (!audioFile) return;

    currentTrack = track;
    currentRelease = release;

    const audioUrl = resolveDataUrl(audioFile);
    audioPlayer.src = audioUrl;
    isPlaying = false;

    updatePlayerUI();
}

// Load the most recently released track into the player
function loadMostRecentTrack() {
    if (!discographyData) return;

    // All releases sorted by date (newest first)
    const allReleases = [...discographyData.albums, ...discographyData.singles].sort((a, b) => {
        return new Date(b.releaseDate) - new Date(a.releaseDate);
    });

    for (const release of allReleases) {
        if (release.tracks && release.tracks.length > 0) {
            // Album/EP - load first track
            const track = release.tracks[0];
            if (track.audioFile) {
                loadTrackIntoPlayer(track, release);
                return;
            }
        } else if (release.audioFile) {
            // Single
            loadTrackIntoPlayer(release, release);
            return;
        }
    }
}

// Play a track
function playTrack(track, release) {
    const audioFile = track.audioFile || release.audioFile;
    if (!audioFile) {
        console.error('No audio file for track:', track.title);
        return;
    }

    currentTrack = track;
    currentRelease = release;

    const audioUrl = resolveDataUrl(audioFile);
    audioPlayer.src = audioUrl;
    audioPlayer.play();
    isPlaying = true;

    updatePlayerUI();
}

// Toggle play/pause
function togglePlayPause() {
    if (!audioPlayer.src) return;

    if (isPlaying) {
        audioPlayer.pause();
        isPlaying = false;
    } else {
        audioPlayer.play();
        isPlaying = true;
    }
    updatePlayPauseButton();
    syncTrackDetailPlayBtn();
}

// Update play/pause button
function updatePlayPauseButton() {
    const btn = document.getElementById('play-pause-btn');
    btn.innerHTML = isPlaying
        ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
        : '<svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>';
}

// Update progress bar
function updateProgress() {
    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;
    document.getElementById('current-time').textContent = formatTime(audioPlayer.currentTime);
}

// Update duration display
function updateDuration() {
    document.getElementById('total-time').textContent = formatTime(audioPlayer.duration);
}

// Seek to position
function seekTo(e) {
    const progressBar = document.getElementById('progress-bar');
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioPlayer.currentTime = percent * audioPlayer.duration;
}

// Set volume
function setVolume(e) {
    audioPlayer.volume = e.target.value / 100;
}

// Handle track end
function handleTrackEnd() {
    isPlaying = false;
    updatePlayPauseButton();

    if (playbackMode === 'repeat-one') {
        // Repeat current track
        audioPlayer.currentTime = 0;
        audioPlayer.play();
        isPlaying = true;
        updatePlayPauseButton();
    } else if (playbackMode === 'repeat-all') {
        // If queue is empty, re-add current album tracks and play from start
        if (queue.length === 0 && currentRelease && currentRelease.tracks) {
            currentRelease.tracks.forEach(track => {
                queue.push({ track, release: currentRelease });
            });
            updateQueueBadge();
        }
        playNextFromQueue();
    } else if (playbackMode === 'shuffle') {
        if (queue.length > 0) {
            const idx = Math.floor(Math.random() * queue.length);
            const next = queue.splice(idx, 1)[0];
            updateQueueBadge();
            playTrack(next.track, next.release);
            renderQueueList();
        }
    } else {
        // Normal mode - just play next
        playNextFromQueue();
    }
}

// Cycle playback mode
function cyclePlaybackMode() {
    if (playbackMode === 'normal') {
        playbackMode = 'repeat-one';
    } else if (playbackMode === 'repeat-one') {
        playbackMode = 'repeat-all';
    } else if (playbackMode === 'repeat-all') {
        playbackMode = 'shuffle';
        shuffleQueue();
    } else {
        playbackMode = 'normal';
    }
    updatePlaybackModeButton();
}

function shuffleQueue() {
    for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
    }
    renderQueueList();
}

// Update playback mode button appearance
function updatePlaybackModeButton() {
    const btn = document.getElementById('mode-btn');
    btn.classList.remove('active');

    const svgRepeat = '<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>';
    const svgRepeatOne = '<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/><text x="12" y="15" text-anchor="middle" font-size="8" font-weight="bold" fill="white">1</text></svg>';
    const svgShuffle = '<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>';

    if (playbackMode === 'normal') {
        btn.innerHTML = svgRepeat;
        btn.title = 'Repeat: Off';
    } else if (playbackMode === 'repeat-one') {
        btn.innerHTML = svgRepeatOne;
        btn.classList.add('active');
        btn.title = 'Repeat: One';
    } else if (playbackMode === 'repeat-all') {
        btn.innerHTML = svgRepeat;
        btn.classList.add('active');
        btn.title = 'Repeat: All';
    } else if (playbackMode === 'shuffle') {
        btn.innerHTML = svgShuffle;
        btn.classList.add('active');
        btn.title = 'Shuffle';
    }
}

// Add track to queue
function addToQueue(track, release) {
    queue.push({ track, release });
    updateQueueBadge();
    showQueueNotification(`Added "${track.title}" to queue`);
}

// Add all tracks from a release to queue
function addReleaseToQueue(release) {
    if (release.tracks) {
        release.tracks.forEach(track => {
            queue.push({ track, release });
        });
        showQueueNotification(`Added ${release.tracks.length} tracks to queue`);
    } else {
        queue.push({ track: release, release });
        showQueueNotification(`Added "${release.title}" to queue`);
    }
    updateQueueBadge();
}

// Remove track from queue by index
function removeFromQueue(index) {
    queue.splice(index, 1);
    updateQueueBadge();
    renderQueueList();
}

// Clear the queue
function clearQueue() {
    queue = [];
    updateQueueBadge();
    renderQueueList();
}

// Move queue item up
function moveQueueItemUp(index) {
    if (index > 0) {
        [queue[index - 1], queue[index]] = [queue[index], queue[index - 1]];
        renderQueueList();
    }
}

// Move queue item down
function moveQueueItemDown(index) {
    if (index < queue.length - 1) {
        [queue[index], queue[index + 1]] = [queue[index + 1], queue[index]];
        renderQueueList();
    }
}

// Play next from queue
function playNextFromQueue() {
    if (queue.length > 0) {
        const next = queue.shift();
        updateQueueBadge();
        playTrack(next.track, next.release);
        renderQueueList();
    }
}

// Update queue badge count
function updateQueueBadge() {
    const badge = document.getElementById('queue-badge');
    if (queue.length > 0) {
        badge.textContent = queue.length;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// Show queue notification
function showQueueNotification(message) {
    const notification = document.getElementById('queue-notification');
    notification.textContent = message;
    notification.classList.remove('hidden');
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 2000);
}

// Toggle queue popup
function toggleQueuePopup() {
    const popup = document.getElementById('queue-popup');
    popup.classList.toggle('hidden');
    if (!popup.classList.contains('hidden')) {
        renderQueueList();
    }
}

// Render queue list in popup
function renderQueueList() {
    const container = document.getElementById('queue-list');
    container.innerHTML = '';

    if (queue.length === 0) {
        container.innerHTML = '<p class="queue-empty">Queue is empty</p>';
        return;
    }

    queue.forEach((item, index) => {
        const queueItem = document.createElement('div');
        queueItem.className = 'queue-item';

        const info = document.createElement('div');
        info.className = 'queue-item-info';

        const title = document.createElement('div');
        title.className = 'queue-item-title';
        title.textContent = item.track.title;

        const artist = document.createElement('div');
        artist.className = 'queue-item-artist';
        artist.textContent = item.release.title;

        info.appendChild(title);
        info.appendChild(artist);

        const controls = document.createElement('div');
        controls.className = 'queue-item-controls';

        const upBtn = document.createElement('button');
        upBtn.className = 'queue-control-btn';
        upBtn.textContent = '↑';
        upBtn.onclick = () => moveQueueItemUp(index);
        upBtn.disabled = index === 0;

        const downBtn = document.createElement('button');
        downBtn.className = 'queue-control-btn';
        downBtn.textContent = '↓';
        downBtn.onclick = () => moveQueueItemDown(index);
        downBtn.disabled = index === queue.length - 1;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'queue-control-btn remove';
        removeBtn.textContent = '×';
        removeBtn.onclick = () => removeFromQueue(index);

        controls.appendChild(upBtn);
        controls.appendChild(downBtn);
        controls.appendChild(removeBtn);

        queueItem.appendChild(info);
        queueItem.appendChild(controls);
        container.appendChild(queueItem);
    });
}

// Handle audio error
function handleAudioError(e) {
    console.error('Audio error:', e);
    // Try alternative format
    if (currentTrack && audioPlayer.src.endsWith('.mp3')) {
        const wavUrl = audioPlayer.src.replace('.mp3', '.wav');
        console.log('Trying WAV format:', wavUrl);
        audioPlayer.src = wavUrl;
        audioPlayer.play();
    } else if (currentTrack && audioPlayer.src.endsWith('.wav')) {
        const mp3Url = audioPlayer.src.replace('.wav', '.mp3');
        console.log('Trying MP3 format:', mp3Url);
        audioPlayer.src = mp3Url;
        audioPlayer.play();
    }
}

// Play next track
function playNext() {
    // Shuffle mode: pick random from queue
    if (playbackMode === 'shuffle' && queue.length > 0) {
        const idx = Math.floor(Math.random() * queue.length);
        const next = queue.splice(idx, 1)[0];
        updateQueueBadge();
        playTrack(next.track, next.release);
        renderQueueList();
        return;
    }

    // First check if there's something in the queue
    if (queue.length > 0) {
        playNextFromQueue();
        return;
    }

    // Otherwise play next track in current album
    if (!currentRelease || !currentTrack) return;

    const tracks = currentRelease.tracks;
    if (!tracks) return;

    const currentIndex = tracks.indexOf(currentTrack);
    if (currentIndex < tracks.length - 1) {
        playTrack(tracks[currentIndex + 1], currentRelease);
    }
}

// Play previous track
function playPrevious() {
    if (!currentRelease || !currentTrack) return;

    // If more than 3 seconds in, restart current track
    if (audioPlayer.currentTime > 3) {
        audioPlayer.currentTime = 0;
        return;
    }

    const tracks = currentRelease.tracks;
    if (!tracks) return;

    const currentIndex = tracks.indexOf(currentTrack);
    if (currentIndex > 0) {
        playTrack(tracks[currentIndex - 1], currentRelease);
    }
}

// Update player UI
function updatePlayerUI() {
    const coverArt = currentTrack.coverArt || currentRelease.coverArt;
    const playerCover = document.getElementById('player-cover');

    if (coverArt) {
        playerCover.style.backgroundImage = `url(${resolveDataUrl(coverArt)})`;
        playerCover.style.backgroundSize = 'cover';
        playerCover.style.backgroundPosition = 'center';
        playerCover.textContent = '';
    } else {
        playerCover.style.backgroundImage = 'url(music/artist/profile.jpg)';
        playerCover.style.backgroundSize = 'cover';
        playerCover.style.backgroundPosition = 'center';
        playerCover.textContent = '';
    }

    const playerTitle = document.getElementById('player-title');
    const playerArtist = document.getElementById('player-artist');

    playerTitle.textContent = currentTrack.title;
    updatePlayPauseButton();
    syncTrackDetailPlayBtn();

    const isSingle = !currentRelease.tracks;

    // For singles, hide the album line; for albums, show it
    if (isSingle) {
        playerArtist.textContent = '';
        playerArtist.style.display = 'none';
        playerArtist.onclick = null;
    } else {
        playerArtist.textContent = currentRelease.title;
        playerArtist.style.display = '';
        // Album/release name → release detail page
        playerArtist.onclick = () => {
            navigationHistory.push({ type: 'list' });
            showReleaseDetail(currentRelease);
        };
    }

    // Cover and track title → track detail page
    const goToTrack = () => {
        if (currentTrack && currentRelease) {
            navigationHistory.push({ type: 'list' });
            showTrackDetail(currentTrack, currentRelease);
        }
    };
    playerCover.onclick = goToTrack;
    playerTitle.onclick = goToTrack;
}

// Extract two dominant color clusters from the profile image and apply
// as a gradient to all branded text elements (.logo, .about-content h2)
function applyBrandColors() {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 50;
        canvas.height = 50;
        ctx.drawImage(img, 0, 0, 50, 50);

        const imageData = ctx.getImageData(0, 0, 50, 50).data;
        const pixels = [];

        // Collect saturated, mid-brightness pixels
        for (let i = 0; i < imageData.length; i += 4) {
            const r = imageData[i], g = imageData[i + 1], b = imageData[i + 2];
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            const brightness = (r + g + b) / 3;
            const saturation = max === 0 ? 0 : (max - min) / max;
            // Only keep colorful pixels (not too dark, not too bright, reasonably saturated)
            if (brightness > 40 && brightness < 220 && saturation > 0.2) {
                pixels.push([r, g, b]);
            }
        }

        if (pixels.length < 2) return; // not enough data

        // Simple 2-means clustering: split pixels by hue into warm vs cool
        const warm = []; // hue 0-60 or 300-360 (reds, oranges, yellows)
        const cool = []; // hue 60-300 (greens, blues, purples)

        pixels.forEach(([r, g, b]) => {
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let hue = 0;
            if (max !== min) {
                const d = max - min;
                if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) * 60;
                else if (max === g) hue = ((b - r) / d + 2) * 60;
                else hue = ((r - g) / d + 4) * 60;
            }
            if (hue < 80 || hue > 300) {
                warm.push([r, g, b]);
            } else {
                cool.push([r, g, b]);
            }
        });

        function avgColor(arr) {
            if (arr.length === 0) return null;
            const sum = arr.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]], [0, 0, 0]);
            return sum.map(v => Math.round(v / arr.length));
        }

        // Boost saturation slightly to make text gradient vivid
        function boost([r, g, b]) {
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            const mid = (max + min) / 2;
            const factor = 1.3;
            return [
                Math.min(255, Math.round(mid + (r - mid) * factor)),
                Math.min(255, Math.round(mid + (g - mid) * factor)),
                Math.min(255, Math.round(mid + (b - mid) * factor))
            ];
        }

        let color1 = avgColor(warm.length > 0 ? warm : pixels.slice(0, Math.floor(pixels.length / 2)));
        let color2 = avgColor(cool.length > 0 ? cool : pixels.slice(Math.floor(pixels.length / 2)));

        if (!color1 || !color2) return;

        color1 = boost(color1);
        color2 = boost(color2);

        const gradient = `linear-gradient(135deg, rgb(${color1.join(',')}) 0%, rgb(${color2.join(',')}) 100%)`;

        // Apply to all branded text elements
        document.querySelectorAll('.logo, .about-content h2').forEach(el => {
            el.style.background = gradient;
            el.style.webkitBackgroundClip = 'text';
            el.style.webkitTextFillColor = 'transparent';
            el.style.backgroundClip = 'text';
        });
    };
    img.src = 'music/artist/profile.jpg';
}

// Extract dominant color from an image and apply gradient to an element
function applyGradientFromCover(imageUrl, gradientElement) {
    if (!imageUrl || !gradientElement) {
        gradientElement.style.background = '';
        return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        // Sample at small size for performance
        canvas.width = 50;
        canvas.height = 50;
        ctx.drawImage(img, 0, 0, 50, 50);

        const imageData = ctx.getImageData(0, 0, 50, 50).data;
        let r = 0, g = 0, b = 0, count = 0;

        // Sample pixels, skipping very dark and very bright ones
        for (let i = 0; i < imageData.length; i += 16) { // every 4th pixel
            const pr = imageData[i];
            const pg = imageData[i + 1];
            const pb = imageData[i + 2];
            const brightness = (pr + pg + pb) / 3;
            if (brightness > 30 && brightness < 220) {
                r += pr;
                g += pg;
                b += pb;
                count++;
            }
        }

        if (count > 0) {
            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);
        } else {
            r = 80; g = 80; b = 100; // fallback muted color
        }

        // Darken the color slightly for a richer gradient
        r = Math.round(r * 0.7);
        g = Math.round(g * 0.7);
        b = Math.round(b * 0.7);

        gradientElement.style.background = `linear-gradient(to bottom, rgba(${r},${g},${b},0.8) 0%, var(--bg-primary) 100%)`;
    };
    img.onerror = () => {
        gradientElement.style.background = '';
    };
    img.src = imageUrl;
}

// Format a date string (YYYY-MM-DD) as "13 August 2025"
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    if (isNaN(date)) return dateStr;
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Convert text with blank-line paragraphs to HTML paragraphs (supports basic Markdown)
function textToHtml(text) {
    if (!text) return '';
    return text.split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p)
        .map(p => {
            let html = p.replace(/\n/g, '<br>');
            // Markdown links: [text](url)
            html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
            // Bold: **text**
            html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            // Italic: *text*
            html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
            // Bare URLs (not already inside an href)
            html = html.replace(/(?<!="|'>)(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
            return `<p>${html}</p>`;
        })
        .join('');
}

// Format time in MM:SS
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Load discography data
async function loadDiscography() {
    try {
        // Use pre-loaded data (from discography.js script tag) if available,
        // otherwise fetch JSON. This allows the site to work from file:// URLs.
        if (window._discographyData) {
            discographyData = window._discographyData;
        } else {
            const response = await fetch('data/discography.json');
            discographyData = await response.json();
        }
        filteredAlbums = discographyData.albums;
        filteredSingles = discographyData.singles;
        updateFilteredReleases();
    } catch (error) {
        console.error('Error loading discography:', error);
    }
}

// Combine and sort all releases by date
function updateFilteredReleases() {
    filteredReleases = [...filteredAlbums, ...filteredSingles].sort((a, b) => {
        return new Date(b.releaseDate) - new Date(a.releaseDate);
    });

    // Build flattened track list from all releases (not just filtered ones,
    // so track-level tags work even when the parent release doesn't match)
    const activeTag = document.getElementById('tag-filter')?.value || '';
    const activeYear = document.getElementById('year-filter')?.value || '';
    const searchQuery = (document.getElementById('search-input')?.value || '').toLowerCase();
    const allReleases = discographyData
        ? [...discographyData.albums, ...discographyData.singles].filter(r => {
            if (activeYear && r.year != activeYear) return false;
            return true;
          })
        : [];

    allTracks = [];
    allReleases.forEach(release => {
        if (release.tracks) {
            release.tracks.forEach(track => {
                // Match tag on track or parent release
                if (activeTag && !track.tags?.includes(activeTag) && !release.tags?.includes(activeTag)) return;
                // Match search query on track
                if (searchQuery && !trackSearchMatches(track, release, searchQuery)) return;
                allTracks.push({ track, release });
            });
        } else {
            // Single — the release itself is the track
            if (activeTag && !release.tags?.includes(activeTag)) return;
            if (searchQuery && !trackSearchMatches(release, release, searchQuery)) return;
            allTracks.push({ track: release, release });
        }
    });
    // Sort by release date (newest first), preserving track order within a release
    allTracks.sort((a, b) => {
        return new Date(b.release.releaseDate) - new Date(a.release.releaseDate);
    });
}

// Navigation history for back button
let navigationHistory = [];
let currentDetailRelease = null;

// Initialize event listeners
function initializeEventListeners() {
    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentView = e.target.dataset.view;
            navigationHistory = [];
            renderView();
        });
    });

    // Search input
    document.getElementById('search-input').addEventListener('input', handleSearch);

    // Filter selects
    document.getElementById('tag-filter').addEventListener('change', handleFilters);
    document.getElementById('year-filter').addEventListener('change', handleFilters);

    // Reset filters button
    document.getElementById('reset-filters').addEventListener('click', () => {
        document.getElementById('search-input').value = '';
        document.getElementById('tag-filter').value = '';
        document.getElementById('year-filter').value = '';
        handleSearch();
        handleFilters();
    });

    // Back buttons
    document.getElementById('back-btn').addEventListener('click', goBack);
    document.getElementById('track-back-btn').addEventListener('click', goBack);
}

// Populate filter dropdowns
function populateFilters() {
    const tags = new Set();
    const years = new Set();

    // Collect all unique tags from releases and their tracks
    [...discographyData.albums, ...discographyData.singles].forEach(release => {
        release.tags?.forEach(t => tags.add(t));
        release.tracks?.forEach(track => track.tags?.forEach(t => tags.add(t)));
        years.add(release.year);
    });

    // Populate tag filter
    const tagFilter = document.getElementById('tag-filter');
    Array.from(tags).sort().forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagFilter.appendChild(option);
    });

    // Populate year filter
    const yearFilter = document.getElementById('year-filter');
    Array.from(years).sort((a, b) => b - a).forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
}

// Handle search
function trackSearchMatches(track, release, query) {
    if (track.title.toLowerCase().includes(query)) return true;
    if (track.description?.toLowerCase().includes(query)) return true;
    if (track.tags?.some(tag => tag.toLowerCase().includes(query))) return true;
    if (track.lyrics?.toLowerCase().includes(query)) return true;
    if (release.title.toLowerCase().includes(query)) return true;
    return false;
}

function handleSearch(e) {
    const query = (e?.target?.value ?? document.getElementById('search-input').value).toLowerCase();

    if (!query) {
        filteredAlbums = discographyData.albums;
        filteredSingles = discographyData.singles;
    } else {
        filteredAlbums = discographyData.albums.filter(album =>
            searchMatches(album, query)
        );
        filteredSingles = discographyData.singles.filter(single =>
            searchMatches(single, query)
        );
    }

    updateFilteredReleases();
    renderView();
}

// Check if search matches
function searchMatches(release, query) {
    // Search in title
    if (release.title.toLowerCase().includes(query)) return true;

    // Search in description
    if (release.description?.toLowerCase().includes(query)) return true;

    // Search in tags
    if (release.tags?.some(tag => tag.toLowerCase().includes(query))) return true;

    // Search in tracks
    if (release.tracks) {
        return release.tracks.some(track => {
            return track.title.toLowerCase().includes(query) ||
                   track.lyrics?.toLowerCase().includes(query) ||
                   track.tags?.some(tag => tag.toLowerCase().includes(query));
        });
    }

    // Search in lyrics for singles
    if (release.lyrics?.toLowerCase().includes(query)) return true;

    return false;
}

// Handle filters
function handleFilters() {
    const tag = document.getElementById('tag-filter').value;
    const year = document.getElementById('year-filter').value;

    filteredAlbums = discographyData.albums.filter(album =>
        filterMatches(album, tag, year)
    );
    filteredSingles = discographyData.singles.filter(single =>
        filterMatches(single, tag, year)
    );

    updateFilteredReleases();
    renderView();
}

// Check if release matches filters
function filterMatches(release, tag, year) {
    if (tag && !release.tags?.includes(tag)) return false;
    if (year && release.year != year) return false;
    return true;
}

// Create a clickable tag element that navigates to Tracks view filtered by that tag
function createTagLink(tagText) {
    const tagEl = document.createElement('span');
    tagEl.className = 'tag tag-link';
    tagEl.textContent = tagText;
    tagEl.onclick = (e) => {
        e.stopPropagation();
        // Set the tag filter dropdown and navigate to tracks view
        document.getElementById('tag-filter').value = tagText;
        currentView = 'tracks';
        navigationHistory = [];
        syncNavButton();
        handleFilters();
    };
    return tagEl;
}

// Hide all content sections
function hideAllSections() {
    document.getElementById('hero-section').classList.add('hidden');
    document.getElementById('about-section').classList.add('hidden');
    document.getElementById('controls-section').classList.add('hidden');
    document.getElementById('discography-section').classList.add('hidden');
    document.getElementById('collections-section').classList.add('hidden');
    document.getElementById('tracks-section').classList.add('hidden');
    const releaseDetail = document.getElementById('release-detail-section');
    const trackDetail = document.getElementById('track-detail-section');
    releaseDetail.classList.add('hidden');
    releaseDetail.setAttribute('hidden', '');
    trackDetail.classList.add('hidden');
    trackDetail.setAttribute('hidden', '');
}

// Render current view
function renderView() {
    hideAllSections();

    // Update hash to reflect the current list view
    // For the default tracks view, use a clean URL with no hash
    if (currentView === 'tracks') {
        hashChangeFromCode = true;
        history.replaceState(null, '', window.location.pathname);
        hashChangeFromCode = false;
    } else {
        const viewHashMap = { collections: '#/collections', about: '#/about' };
        updateHash(viewHashMap[currentView] || '');
    }

    switch(currentView) {
        case 'about':
            renderAbout();
            break;
        case 'collections':
            document.getElementById('hero-section').classList.remove('hidden');
            document.getElementById('controls-section').classList.remove('hidden');
            document.getElementById('collections-section').classList.remove('hidden');
            renderCollections();
            break;
        case 'tracks':
        default:
            document.getElementById('hero-section').classList.remove('hidden');
            document.getElementById('controls-section').classList.remove('hidden');
            document.getElementById('tracks-section').classList.remove('hidden');
            renderTracks();
            break;
    }
}

// Go back in navigation
function goBack() {
    if (navigationHistory.length > 0) {
        const previous = navigationHistory.pop();
        if (previous.type === 'release') {
            showReleaseDetail(previous.release);
        } else {
            renderView();
        }
    } else {
        renderView();
    }
}

// Render combined discography (sorted by date)
function renderDiscography() {
    const grid = document.getElementById('discography-grid');
    grid.innerHTML = '';

    filteredReleases.forEach(release => {
        const card = createReleaseCard(release);
        grid.appendChild(card);
    });
}

// Render about section
function renderAbout() {
    const aboutContent = document.querySelector('.about-content');

    // Inject banner + profile if not already present
    if (!document.querySelector('.about-banner')) {
        const banner = document.createElement('div');
        banner.className = 'about-banner';
        banner.style.backgroundImage = 'url(music/artist/banner.png)';
        aboutContent.insertBefore(banner, aboutContent.firstChild);

        const profile = document.createElement('img');
        profile.className = 'about-profile';
        profile.src = 'music/artist/profile.jpg';
        profile.alt = 'Mantis Audiogram';
        banner.insertAdjacentElement('afterend', profile);
    }

    document.getElementById('about-section').classList.remove('hidden');
    document.getElementById('artist-bio').innerHTML = textToHtml(discographyData.bio);

    const socialLinksContainer = document.getElementById('social-links');
    socialLinksContainer.innerHTML = '';

    Object.entries(discographyData.socialLinks).forEach(([platform, url]) => {
        if (!url) return;
        socialLinksContainer.appendChild(createStreamingLink(platform, url));
    });
}

// Render collections (albums and EPs — any release with a tracks array)
function renderCollections() {
    const grid = document.getElementById('collections-grid');
    grid.innerHTML = '';

    filteredReleases
        .filter(r => r.tracks)
        .forEach(release => {
            const card = createReleaseCard(release);
            grid.appendChild(card);
        });
}

// Render all tracks (flattened from every release, sorted by release date)
function renderTracks() {
    const grid = document.getElementById('tracks-grid');
    grid.innerHTML = '';

    // Show/hide Play All button in section header
    const playAllBtn = document.getElementById('play-all-btn');
    if (allTracks.length > 0) {
        playAllBtn.classList.remove('hidden');
        playAllBtn.onclick = () => playAllVisible();
    } else {
        playAllBtn.classList.add('hidden');
    }

    allTracks.forEach(({ track, release }) => {
        const card = createTrackCard(track, release);
        grid.appendChild(card);
    });
}

function playAllVisible() {
    if (allTracks.length === 0) return;
    const first = allTracks[0];
    queue = allTracks.slice(1).map(({ track, release }) => ({ track, release }));
    updateQueueBadge();
    renderQueueList();
    playTrack(first.track, first.release);
    showQueueNotification(`Playing ${allTracks.length} tracks`);
}

// Create release card
function createReleaseCard(release) {
    const card = document.createElement('div');
    card.className = 'release-card';
    card.onclick = () => openReleaseModal(release);

    const coverContainer = document.createElement('div');
    coverContainer.className = 'release-cover-container';

    const cover = document.createElement('div');
    cover.className = 'release-cover';

    if (release.coverArt) {
        cover.style.backgroundImage = `url(${resolveDataUrl(release.coverArt)})`;
        cover.style.backgroundSize = 'cover';
        cover.style.backgroundPosition = 'center';
        cover.textContent = '';
    } else {
        cover.style.background = release.backgroundColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        cover.style.color = release.textColor || '#ffffff';
        cover.textContent = release.title.substring(0, 2).toUpperCase();
    }

    // Add play + queue button overlay on cover
    const btnGroup = document.createElement('div');
    btnGroup.className = 'card-btn-group';

    const playBtn = document.createElement('button');
    playBtn.className = 'card-play-btn';
    playBtn.innerHTML = '&#9654;';
    playBtn.title = 'Play';
    playBtn.onclick = (e) => {
        e.stopPropagation();
        if (release.tracks) {
            queue = release.tracks.slice(1).map(t => ({ track: t, release }));
            updateQueueBadge();
            renderQueueList();
            playTrack(release.tracks[0], release);
        } else {
            playTrack(release, release);
        }
    };

    const queueBtn = document.createElement('button');
    queueBtn.className = 'card-queue-btn';
    queueBtn.innerHTML = '+';
    queueBtn.title = 'Add to queue';
    queueBtn.onclick = (e) => {
        e.stopPropagation();
        addReleaseToQueue(release);
    };

    btnGroup.appendChild(playBtn);
    btnGroup.appendChild(queueBtn);
    coverContainer.appendChild(cover);
    coverContainer.appendChild(btnGroup);

    const info = document.createElement('div');
    info.className = 'release-info';

    const title = document.createElement('h3');
    title.className = 'release-title';
    title.textContent = release.title;

    const meta = document.createElement('div');
    meta.className = 'release-meta';
    meta.textContent = `${release.year} • ${release.type.toUpperCase()}`;
    if (release.totalDuration) {
        meta.textContent += ` • ${release.totalDuration}`;
    } else if (release.duration) {
        meta.textContent += ` • ${release.duration}`;
    }

    const description = document.createElement('p');
    description.className = 'release-description';
    description.textContent = release.description || '';

    const tags = document.createElement('div');
    tags.className = 'release-tags';
    release.tags?.slice(0, 3).forEach(tag => {
        tags.appendChild(createTagLink(tag));
    });

    info.appendChild(title);
    info.appendChild(meta);
    info.appendChild(description);
    info.appendChild(tags);

    card.appendChild(coverContainer);
    card.appendChild(info);

    return card;
}

// Create a card for an individual track (used in the Tracks view)
function createTrackCard(track, release) {
    const card = document.createElement('div');
    card.className = 'release-card';
    card.onclick = () => {
        navigationHistory.push({ type: 'list' });
        showTrackDetail(track, release);
    };

    const coverContainer = document.createElement('div');
    coverContainer.className = 'release-cover-container';

    const cover = document.createElement('div');
    cover.className = 'release-cover';

    const coverArt = track.coverArt || release.coverArt;
    if (coverArt) {
        cover.style.backgroundImage = `url(${resolveDataUrl(coverArt)})`;
        cover.style.backgroundSize = 'cover';
        cover.style.backgroundPosition = 'center';
    } else {
        cover.style.background = release.backgroundColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        cover.style.color = release.textColor || '#ffffff';
        cover.textContent = (track.title || release.title).substring(0, 2).toUpperCase();
    }

    const btnGroup = document.createElement('div');
    btnGroup.className = 'card-btn-group';

    const playBtn = document.createElement('button');
    playBtn.className = 'card-play-btn';
    playBtn.innerHTML = '&#9654;';
    playBtn.title = 'Play';
    playBtn.onclick = (e) => {
        e.stopPropagation();
        playTrack(track, release);
    };

    const queueBtn = document.createElement('button');
    queueBtn.className = 'card-queue-btn';
    queueBtn.innerHTML = '+';
    queueBtn.title = 'Add to queue';
    queueBtn.onclick = (e) => {
        e.stopPropagation();
        addToQueue(track, release);
    };

    btnGroup.appendChild(playBtn);
    btnGroup.appendChild(queueBtn);
    coverContainer.appendChild(cover);
    coverContainer.appendChild(btnGroup);

    const info = document.createElement('div');
    info.className = 'release-info';

    const title = document.createElement('h3');
    title.className = 'release-title';
    title.textContent = track.title || release.title;

    const meta = document.createElement('div');
    meta.className = 'release-meta';
    const isSingle = !release.tracks;
    const parts = [];
    if (!isSingle) parts.push(release.title);
    parts.push(release.year);
    if (track.duration || release.duration) parts.push(track.duration || release.duration);
    meta.textContent = parts.join(' \u2022 ');

    const tags = document.createElement('div');
    tags.className = 'release-tags';
    const allTags = [...(track.mood || []), ...(track.tags || [])];
    allTags.slice(0, 3).forEach(tag => {
        tags.appendChild(createTagLink(tag));
    });

    info.appendChild(title);
    info.appendChild(meta);
    info.appendChild(tags);

    card.appendChild(coverContainer);
    card.appendChild(info);

    return card;
}

// Show release detail page
function showReleaseDetail(release) {
    hideAllSections();
    currentDetailRelease = release;
    updateHash(`#/collection/${release.id}`);

    // Set cover
    const cover = document.getElementById('detail-cover');
    cover.style.backgroundImage = '';
    cover.style.backgroundColor = '';
    if (release.coverArt) {
        cover.style.backgroundImage = `url(${resolveDataUrl(release.coverArt)})`;
        cover.style.backgroundSize = 'cover';
        cover.style.backgroundPosition = 'center';
        cover.textContent = '';
    } else {
        cover.style.background = release.backgroundColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        cover.style.color = release.textColor || '#ffffff';
        cover.textContent = release.title.substring(0, 2).toUpperCase();
    }

    // Set title and year
    document.getElementById('detail-title').textContent = release.title;
    document.getElementById('detail-year').textContent = formatDate(release.releaseDate);
    document.getElementById('detail-description').innerHTML = textToHtml(release.description);

    // Set metadata
    const metaContainer = document.getElementById('detail-meta');
    metaContainer.innerHTML = '';

    const isSingleRelease = !release.tracks;

    const metaData = [
        { label: 'Catalog #', value: release.catalogNumber },
        { label: 'Duration', value: !isSingleRelease ? (release.totalDuration || release.duration) : '' }
    ];

    metaData.forEach(meta => {
        if (meta.value) {
            const item = document.createElement('div');
            item.className = 'meta-item';
            item.innerHTML = `
                <span class="meta-label">${meta.label}</span>
                <span class="meta-value">${meta.value}</span>
            `;
            metaContainer.appendChild(item);
        }
    });

    // Set tags
    const tagsContainer = document.getElementById('detail-tags');
    tagsContainer.innerHTML = '';
    release.tags?.forEach(tag => {
        tagsContainer.appendChild(createTagLink(tag));
    });

    // Set streaming links
    const streamingContainer = document.getElementById('detail-streaming');
    streamingContainer.innerHTML = '';

    const isSingle = !release.tracks;

    // For singles, show play/queue buttons here
    if (isSingle) {
        const singleControls = document.createElement('div');
        singleControls.className = 'single-controls';

        const playBtn = document.createElement('button');
        playBtn.className = 'single-play-btn';
        playBtn.innerHTML = '▶ Play';
        playBtn.onclick = (e) => {
            e.stopPropagation();
            playTrack(release, release);
        };

        const queueBtn = document.createElement('button');
        queueBtn.className = 'single-queue-btn';
        queueBtn.innerHTML = '+ Add to Queue';
        queueBtn.onclick = (e) => {
            e.stopPropagation();
            addToQueue(release, release);
        };

        const duration = document.createElement('span');
        duration.className = 'single-duration';
        duration.textContent = release.duration || '';

        singleControls.appendChild(playBtn);
        singleControls.appendChild(queueBtn);

        // Download WAV button for singles
        if (release.wavFile) {
            const downloadBtn = document.createElement('a');
            downloadBtn.className = 'single-download-btn';
            downloadBtn.href = resolveDataUrl(release.wavFile);
            downloadBtn.download = '';
            downloadBtn.innerHTML = '↓ Download WAV';
            singleControls.appendChild(downloadBtn);
        }

        singleControls.appendChild(duration);
        streamingContainer.appendChild(singleControls);
    }

    if (release.streamingLinks && Object.keys(release.streamingLinks).length > 0) {
        const title = document.createElement('div');
        title.className = 'streaming-title';
        title.textContent = 'Listen on other platforms';
        streamingContainer.appendChild(title);

        const links = document.createElement('div');
        links.className = 'streaming-links';
        Object.entries(release.streamingLinks).forEach(([platform, url]) => {
            if (!url) return;
            links.appendChild(createStreamingLink(platform, url));
        });
        streamingContainer.appendChild(links);
    }

    // Set tracklist (hide for singles)
    const tracklistSection = document.querySelector('.detail-tracklist');
    const tracksContainer = document.getElementById('detail-tracks');
    tracksContainer.innerHTML = '';

    if (isSingle) {
        tracklistSection.classList.add('hidden');
    } else {
        tracklistSection.classList.remove('hidden');
        const queueAllBtn = document.getElementById('tracklist-queue-btn');
        queueAllBtn.onclick = () => addReleaseToQueue(release);
    }

    if (release.tracks) {
        const trackList = document.createElement('div');
        trackList.className = 'track-list';

        release.tracks.forEach((track, index) => {
            const trackItem = document.createElement('div');
            trackItem.className = 'track-item';

            const playBtn = document.createElement('button');
            playBtn.className = 'track-play-btn';
            playBtn.textContent = '▶';
            playBtn.title = 'Play now';
            playBtn.onclick = (e) => {
                e.stopPropagation();
                playTrack(track, release);
            };

            const queueBtn = document.createElement('button');
            queueBtn.className = 'track-queue-btn';
            queueBtn.textContent = '+';
            queueBtn.title = 'Add to queue';
            queueBtn.onclick = (e) => {
                e.stopPropagation();
                addToQueue(track, release);
            };

            const number = document.createElement('span');
            number.className = 'track-number';
            number.textContent = index + 1;

            const name = document.createElement('span');
            name.className = 'track-name';
            name.textContent = track.title;
            name.onclick = (e) => {
                e.stopPropagation();
                navigationHistory.push({ type: 'release', release: release });
                showTrackDetail(track, release);
            };

            const duration = document.createElement('span');
            duration.className = 'track-duration';
            duration.textContent = track.duration || '';

            trackItem.appendChild(playBtn);
            trackItem.appendChild(queueBtn);
            trackItem.appendChild(number);
            trackItem.appendChild(name);
            trackItem.appendChild(duration);
            trackList.appendChild(trackItem);
        });

        tracksContainer.appendChild(trackList);
    }

    // Lyrics section (for singles only)
    const lyricsSection = document.getElementById('detail-lyrics-section');
    const lyricsContainer = document.getElementById('detail-lyrics');
    lyricsContainer.innerHTML = '';

    if (isSingle && release.lyrics && release.lyrics.trim()) {
        lyricsSection.classList.remove('hidden');
        const lyricsText = document.createElement('pre');
        lyricsText.className = 'lyrics-text';
        lyricsText.textContent = release.lyrics;
        lyricsContainer.appendChild(lyricsText);
    } else {
        lyricsSection.classList.add('hidden');
    }

    // Credits section (for singles only)
    const creditsSection = document.getElementById('detail-credits-section');
    const creditsContainer = document.getElementById('detail-credits');
    creditsContainer.innerHTML = '';

    if (isSingle && release.credits && Object.keys(release.credits).length > 0) {
        creditsSection.classList.remove('hidden');
        Object.entries(release.credits).forEach(([role, people]) => {
            const creditItem = document.createElement('div');
            creditItem.className = 'credit-item';
            const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
            const peopleList = Array.isArray(people) ? people.join(', ') : people;
            creditItem.innerHTML = `<span class="credit-role">${roleLabel}:</span> <span class="credit-people">${peopleList}</span>`;
            creditsContainer.appendChild(creditItem);
        });
    } else {
        creditsSection.classList.add('hidden');
    }

    // Apply gradient background from cover art
    const gradientEl = document.getElementById('release-detail-gradient');
    const coverArtUrl = release.coverArt ? resolveDataUrl(release.coverArt) : null;
    applyGradientFromCover(coverArtUrl, gradientEl);

    const releaseEl = document.getElementById('release-detail-section');
    releaseEl.classList.remove('hidden');
    releaseEl.removeAttribute('hidden');
    window.scrollTo(0, 0);
}

// Legacy function name for compatibility
function openReleaseModal(release) {
    navigationHistory.push({ type: 'list' });
    // Singles go directly to track detail page
    if (!release.tracks) {
        showTrackDetail(release, release);
    } else {
        showReleaseDetail(release);
    }
}

// Show track detail page
function showTrackDetail(track, release) {
    hideAllSections();

    // Set hash: use track slug for all tracks
    const trackSlug = track.slug || release.id;
    updateHash(`#/track/${trackSlug}`);

    // Set cover (use track cover if available, otherwise release cover)
    const cover = document.getElementById('track-detail-cover');
    const coverArt = track.coverArt || release.coverArt;
    cover.style.backgroundImage = '';
    cover.style.backgroundColor = '';
    if (coverArt) {
        cover.style.backgroundImage = `url(${resolveDataUrl(coverArt)})`;
        cover.style.backgroundSize = 'cover';
        cover.style.backgroundPosition = 'center';
        cover.textContent = '';
    } else {
        cover.style.background = release.backgroundColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        cover.style.color = release.textColor || '#ffffff';
        cover.textContent = (track.title || release.title).substring(0, 2).toUpperCase();
    }

    // Set title, date, and description
    document.getElementById('track-detail-title').textContent = track.title || release.title;
    document.getElementById('track-detail-year').textContent = formatDate(track.releaseDate || release.releaseDate);
    document.getElementById('track-detail-description').innerHTML = textToHtml(track.description || release.description);

    // Set metadata (minimal, like singles)
    const metaContainer = document.getElementById('track-detail-meta');
    metaContainer.innerHTML = '';

    const metaItems = [];
    if (track.duration) metaItems.push(track.duration);
    if (track.bpm) metaItems.push(`${track.bpm} BPM`);
    if (track.key) metaItems.push(track.key);

    if (metaItems.length > 0) {
        const item = document.createElement('div');
        item.className = 'track-meta-line';
        item.textContent = metaItems.join(' • ');
        metaContainer.appendChild(item);
    }

    // Set tags
    const tagsContainer = document.getElementById('track-detail-tags');
    tagsContainer.innerHTML = '';

    const allTags = [...(track.mood || []), ...(track.tags || [])];
    allTags.forEach(tag => {
        tagsContainer.appendChild(createTagLink(tag));
    });

    // Set play/queue controls
    const controlsContainer = document.getElementById('track-detail-controls');
    controlsContainer.innerHTML = '';

    const singleControls = document.createElement('div');
    singleControls.className = 'single-controls';

    const playBtn = document.createElement('button');
    playBtn.className = 'single-play-btn';
    playBtn.innerHTML = '&#9654; Play';
    playBtn.onclick = (e) => {
        e.stopPropagation();
        playTrack(track, release);
    };

    trackDetailPlayBtn = playBtn;
    trackDetailTrack = track;
    syncTrackDetailPlayBtn();

    const queueBtn = document.createElement('button');
    queueBtn.className = 'single-queue-btn';
    queueBtn.innerHTML = '+ Add to Queue';
    queueBtn.onclick = (e) => {
        e.stopPropagation();
        addToQueue(track, release);
    };

    singleControls.appendChild(playBtn);
    singleControls.appendChild(queueBtn);

    // Download WAV button
    const wavFile = track.wavFile || release.wavFile;
    if (wavFile) {
        const downloadBtn = document.createElement('a');
        downloadBtn.className = 'single-download-btn';
        downloadBtn.href = resolveDataUrl(wavFile);
        downloadBtn.download = '';
        downloadBtn.innerHTML = '↓ Download WAV';
        singleControls.appendChild(downloadBtn);
    }

    controlsContainer.appendChild(singleControls);

    // Set streaming links
    const streamingContainer = document.getElementById('track-detail-streaming');
    streamingContainer.innerHTML = '';

    const streamingLinks = track.streamingLinks || release.streamingLinks;
    if (streamingLinks && Object.keys(streamingLinks).length > 0) {
        const title = document.createElement('div');
        title.className = 'streaming-title';
        title.textContent = 'Listen on other platforms';
        streamingContainer.appendChild(title);

        const links = document.createElement('div');
        links.className = 'streaming-links';
        Object.entries(streamingLinks).forEach(([platform, url]) => {
            if (!url) return;
            links.appendChild(createStreamingLink(platform, url));
        });
        streamingContainer.appendChild(links);
    }

    // Find collections this track appears on
    const appearsOnSection = document.getElementById('track-appears-on-section');
    const appearsOnContainer = document.getElementById('track-appears-on');
    appearsOnContainer.innerHTML = '';

    const collections = [];
    // Check albums
    discographyData.albums.forEach(album => {
        if (album.tracks && album.tracks.some(t => t.title === track.title)) {
            collections.push(album);
        }
    });
    // Check EPs in singles
    discographyData.singles.forEach(single => {
        if (single.tracks && single.tracks.some(t => t.title === track.title)) {
            collections.push(single);
        }
    });

    if (collections.length > 0) {
        appearsOnSection.classList.remove('hidden');
        collections.forEach(collection => {
            const collectionItem = document.createElement('div');
            collectionItem.className = 'appears-on-item';
            collectionItem.onclick = () => {
                navigationHistory.push({ type: 'track', track: track, release: release });
                showReleaseDetail(collection);
            };

            const thumb = document.createElement('div');
            thumb.className = 'appears-on-thumb';
            if (collection.coverArt) {
                thumb.style.backgroundImage = `url(${resolveDataUrl(collection.coverArt)})`;
            } else {
                thumb.style.background = collection.backgroundColor || '#333';
            }

            const info = document.createElement('div');
            info.className = 'appears-on-info';
            info.innerHTML = `
                <span class="appears-on-title">${collection.title}</span>
                <span class="appears-on-type">${collection.type} • ${formatDate(collection.releaseDate) || collection.year}</span>
            `;

            collectionItem.appendChild(thumb);
            collectionItem.appendChild(info);
            appearsOnContainer.appendChild(collectionItem);
        });
    } else {
        appearsOnSection.classList.add('hidden');
    }

    // Set lyrics
    const lyricsSection = document.getElementById('track-lyrics-section');
    const lyricsContainer = document.getElementById('track-detail-lyrics');
    const lyrics = track.lyrics || release.lyrics;

    if (lyrics && lyrics.trim() && lyrics !== '[Instrumental]') {
        lyricsSection.classList.remove('hidden');
        const lyricsText = document.createElement('pre');
        lyricsText.className = 'lyrics-text';
        lyricsText.textContent = lyrics;
        lyricsContainer.innerHTML = '';
        lyricsContainer.appendChild(lyricsText);
    } else {
        lyricsSection.classList.add('hidden');
    }

    // Set credits
    const creditsSection = document.getElementById('track-credits-section');
    const creditsContainer = document.getElementById('track-detail-credits');
    creditsContainer.innerHTML = '';

    const credits = track.credits || release.credits;
    if (credits && Object.keys(credits).length > 0) {
        creditsSection.classList.remove('hidden');
        Object.entries(credits).forEach(([role, names]) => {
            const creditItem = document.createElement('div');
            creditItem.className = 'credit-item';
            const roleLabel = role.charAt(0).toUpperCase() + role.slice(1).replace(/([A-Z])/g, ' $1');
            const peopleList = Array.isArray(names) ? names.join(', ') : names;
            creditItem.innerHTML = `<span class="credit-role">${roleLabel}:</span> <span class="credit-people">${peopleList}</span>`;
            creditsContainer.appendChild(creditItem);
        });
    } else {
        creditsSection.classList.add('hidden');
    }

    // Apply gradient background from cover art
    const trackGradientEl = document.getElementById('track-detail-gradient');
    const trackCoverUrl = (track.coverArt || release.coverArt) ? resolveDataUrl(track.coverArt || release.coverArt) : null;
    applyGradientFromCover(trackCoverUrl, trackGradientEl);

    const trackEl = document.getElementById('track-detail-section');
    trackEl.classList.remove('hidden');
    trackEl.removeAttribute('hidden');
    window.scrollTo(0, 0);
}

// Legacy function name for compatibility
function openTrackModal(track, release) {
    navigationHistory.push({ type: 'release', release: release });
    showTrackDetail(track, release);
}
