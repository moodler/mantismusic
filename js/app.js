// Configuration - point this to your data server
const CONFIG = {
    dataBaseUrl: ''  // Empty for local, or 'https://music.example.com/data' for remote
};

// Global state
let discographyData = null;
let filteredAlbums = [];
let filteredSingles = [];
let filteredReleases = [];
let currentView = 'all';

// Audio player state
let audioPlayer = null;
let currentTrack = null;
let currentRelease = null;
let isPlaying = false;

// Queue state
let queue = [];  // Array of { track, release } objects

// Playback mode: 'normal', 'repeat-one', 'repeat-all'
let playbackMode = 'normal';

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

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await loadDiscography();
    initializeEventListeners();
    initializeAudioPlayer();
    populateFilters();
    renderView();
    loadMostRecentTrack();
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
}

// Update play/pause button
function updatePlayPauseButton() {
    const btn = document.getElementById('play-pause-btn');
    btn.textContent = isPlaying ? '⏸' : '▶';
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
    } else {
        playbackMode = 'normal';
    }
    updatePlaybackModeButton();
}

// Update playback mode button appearance
function updatePlaybackModeButton() {
    const btn = document.getElementById('mode-btn');
    btn.classList.remove('active', 'repeat-one');

    if (playbackMode === 'normal') {
        btn.innerHTML = '🔁';
        btn.title = 'Repeat: Off';
    } else if (playbackMode === 'repeat-one') {
        btn.innerHTML = '🔂';
        btn.classList.add('active', 'repeat-one');
        btn.title = 'Repeat: One';
    } else {
        btn.innerHTML = '🔁';
        btn.classList.add('active');
        btn.title = 'Repeat: All';
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
    // First check if there's something in the queue
    if (queue.length > 0) {
        playNextFromQueue();
        return;
    }

    // Otherwise play next track in current album
    if (!currentRelease || !currentTrack) return;

    const tracks = currentRelease.tracks;
    if (!tracks) return;

    const currentIndex = tracks.findIndex(t => t.trackNumber === currentTrack.trackNumber);
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

    const currentIndex = tracks.findIndex(t => t.trackNumber === currentTrack.trackNumber);
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
        playerCover.style.backgroundImage = '';
        playerCover.style.background = currentRelease.backgroundColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        playerCover.textContent = currentTrack.title.substring(0, 2).toUpperCase();
    }

    const playerTitle = document.getElementById('player-title');
    const playerArtist = document.getElementById('player-artist');

    playerTitle.textContent = currentTrack.title;
    updatePlayPauseButton();

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
        const response = await fetch('data/discography.json');
        discographyData = await response.json();
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
    document.getElementById('genre-filter').addEventListener('change', handleFilters);
    document.getElementById('mood-filter').addEventListener('change', handleFilters);
    document.getElementById('year-filter').addEventListener('change', handleFilters);

    // Back buttons
    document.getElementById('back-btn').addEventListener('click', goBack);
    document.getElementById('track-back-btn').addEventListener('click', goBack);
}

// Populate filter dropdowns
function populateFilters() {
    const genres = new Set();
    const moods = new Set();
    const years = new Set();

    // Collect all unique values
    [...discographyData.albums, ...discographyData.singles].forEach(release => {
        release.genres?.forEach(g => genres.add(g));
        years.add(release.year);

        if (release.tracks) {
            release.tracks.forEach(track => {
                track.mood?.forEach(m => moods.add(m));
            });
        } else {
            release.mood?.forEach(m => moods.add(m));
        }
    });

    // Populate genre filter
    const genreFilter = document.getElementById('genre-filter');
    Array.from(genres).sort().forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreFilter.appendChild(option);
    });

    // Populate mood filter
    const moodFilter = document.getElementById('mood-filter');
    Array.from(moods).sort().forEach(mood => {
        const option = document.createElement('option');
        option.value = mood;
        option.textContent = mood.charAt(0).toUpperCase() + mood.slice(1);
        moodFilter.appendChild(option);
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
function handleSearch(e) {
    const query = e.target.value.toLowerCase();

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
    const genre = document.getElementById('genre-filter').value;
    const mood = document.getElementById('mood-filter').value;
    const year = document.getElementById('year-filter').value;

    filteredAlbums = discographyData.albums.filter(album =>
        filterMatches(album, genre, mood, year)
    );
    filteredSingles = discographyData.singles.filter(single =>
        filterMatches(single, genre, mood, year)
    );

    updateFilteredReleases();
    renderView();
}

// Check if release matches filters
function filterMatches(release, genre, mood, year) {
    if (genre && !release.genres?.includes(genre)) return false;
    if (year && release.year != year) return false;

    if (mood) {
        if (release.tracks) {
            const hasMood = release.tracks.some(track =>
                track.mood?.includes(mood)
            );
            if (!hasMood) return false;
        } else {
            if (!release.mood?.includes(mood)) return false;
        }
    }

    return true;
}

// Hide all content sections
function hideAllSections() {
    document.getElementById('about-section').classList.add('hidden');
    document.getElementById('controls-section').classList.add('hidden');
    document.getElementById('discography-section').classList.add('hidden');
    document.getElementById('albums-section').classList.add('hidden');
    document.getElementById('singles-section').classList.add('hidden');
    document.getElementById('release-detail-section').classList.add('hidden');
    document.getElementById('track-detail-section').classList.add('hidden');
}

// Render current view
function renderView() {
    hideAllSections();

    switch(currentView) {
        case 'about':
            renderAbout();
            break;
        case 'albums':
            document.getElementById('controls-section').classList.remove('hidden');
            document.getElementById('albums-section').classList.remove('hidden');
            renderAlbums();
            break;
        case 'singles':
            document.getElementById('controls-section').classList.remove('hidden');
            document.getElementById('singles-section').classList.remove('hidden');
            renderSingles();
            break;
        case 'all':
        default:
            document.getElementById('controls-section').classList.remove('hidden');
            document.getElementById('discography-section').classList.remove('hidden');
            renderDiscography();
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
    document.getElementById('about-section').classList.remove('hidden');
    document.getElementById('artist-bio').textContent = discographyData.bio;

    const socialLinksContainer = document.getElementById('social-links');
    socialLinksContainer.innerHTML = '';

    Object.entries(discographyData.socialLinks).forEach(([platform, url]) => {
        if (!url) return; // Skip empty links
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.className = 'social-link';
        link.textContent = platform.charAt(0).toUpperCase() + platform.slice(1).replace(/([A-Z])/g, ' $1');
        socialLinksContainer.appendChild(link);
    });
}

// Render albums
function renderAlbums() {
    const grid = document.getElementById('albums-grid');
    grid.innerHTML = '';

    filteredAlbums.forEach(album => {
        const card = createReleaseCard(album);
        grid.appendChild(card);
    });
}

// Render singles
function renderSingles() {
    const grid = document.getElementById('singles-grid');
    grid.innerHTML = '';

    filteredSingles.forEach(single => {
        const card = createReleaseCard(single);
        grid.appendChild(card);
    });
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

    // Add queue button overlay on cover
    const queueBtn = document.createElement('button');
    queueBtn.className = 'card-queue-btn';
    queueBtn.innerHTML = '+';
    queueBtn.title = 'Add to queue';
    queueBtn.onclick = (e) => {
        e.stopPropagation();
        addReleaseToQueue(release);
    };

    coverContainer.appendChild(cover);
    coverContainer.appendChild(queueBtn);

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
        const tagEl = document.createElement('span');
        tagEl.className = 'tag';
        tagEl.textContent = tag;
        tags.appendChild(tagEl);
    });

    info.appendChild(title);
    info.appendChild(meta);
    info.appendChild(description);
    info.appendChild(tags);

    card.appendChild(coverContainer);
    card.appendChild(info);

    return card;
}

// Show release detail page
function showReleaseDetail(release) {
    hideAllSections();
    currentDetailRelease = release;

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
    document.getElementById('detail-description').textContent = release.description || '';

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
        const tagEl = document.createElement('span');
        tagEl.className = 'tag';
        tagEl.textContent = tag;
        tagsContainer.appendChild(tagEl);
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
    } else {
        // Add queue all button for albums/EPs only
        const queueAllBtn = document.createElement('button');
        queueAllBtn.className = 'queue-all-btn';
        queueAllBtn.innerHTML = '+ Add All to Queue';
        queueAllBtn.onclick = () => addReleaseToQueue(release);
        streamingContainer.appendChild(queueAllBtn);
    }

    if (release.streamingLinks && Object.keys(release.streamingLinks).length > 0) {
        const title = document.createElement('div');
        title.className = 'streaming-title';
        title.textContent = 'Listen on other platforms';
        streamingContainer.appendChild(title);

        const links = document.createElement('div');
        links.className = 'streaming-links';
        Object.entries(release.streamingLinks).forEach(([platform, url]) => {
            if (!url) return; // Skip empty links
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.className = 'streaming-link';
            link.textContent = platform.charAt(0).toUpperCase() + platform.slice(1).replace(/([A-Z])/g, ' $1');
            links.appendChild(link);
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
    }

    if (release.tracks) {
        const trackList = document.createElement('div');
        trackList.className = 'track-list';

        release.tracks.forEach(track => {
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
            number.textContent = track.trackNumber;

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

    document.getElementById('release-detail-section').classList.remove('hidden');
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

    // Set title and date
    document.getElementById('track-detail-title').textContent = track.title || release.title;
    document.getElementById('track-detail-year').textContent = formatDate(track.releaseDate || release.releaseDate);

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
        const tagEl = document.createElement('span');
        tagEl.className = 'tag';
        tagEl.textContent = tag;
        tagsContainer.appendChild(tagEl);
    });

    // Set play/queue controls
    const controlsContainer = document.getElementById('track-detail-controls');
    controlsContainer.innerHTML = '';

    const singleControls = document.createElement('div');
    singleControls.className = 'single-controls';

    const playBtn = document.createElement('button');
    playBtn.className = 'single-play-btn';
    playBtn.innerHTML = '▶ Play';
    playBtn.onclick = (e) => {
        e.stopPropagation();
        playTrack(track, release);
    };

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

    document.getElementById('track-detail-section').classList.remove('hidden');
    window.scrollTo(0, 0);
}

// Legacy function name for compatibility
function openTrackModal(track, release) {
    navigationHistory.push({ type: 'release', release: release });
    showTrackDetail(track, release);
}
