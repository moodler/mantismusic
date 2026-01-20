// Global state
let discographyData = null;
let filteredAlbums = [];
let filteredSingles = [];
let currentView = 'all';

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await loadDiscography();
    initializeEventListeners();
    populateFilters();
    renderView();
});

// Load discography data
async function loadDiscography() {
    try {
        const response = await fetch('data/discography.json');
        discographyData = await response.json();
        filteredAlbums = discographyData.albums;
        filteredSingles = discographyData.singles;
    } catch (error) {
        console.error('Error loading discography:', error);
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentView = e.target.dataset.view;
            renderView();
        });
    });

    // Search input
    document.getElementById('search-input').addEventListener('input', handleSearch);

    // Filter selects
    document.getElementById('genre-filter').addEventListener('change', handleFilters);
    document.getElementById('mood-filter').addEventListener('change', handleFilters);
    document.getElementById('year-filter').addEventListener('change', handleFilters);

    // Modal close buttons
    document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
        el.addEventListener('click', closeModals);
    });
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

// Render current view
function renderView() {
    // Hide all sections
    document.getElementById('about-section').classList.add('hidden');
    document.getElementById('controls-section').classList.add('hidden');
    document.getElementById('albums-section').classList.add('hidden');
    document.getElementById('singles-section').classList.add('hidden');

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
            document.getElementById('albums-section').classList.remove('hidden');
            document.getElementById('singles-section').classList.remove('hidden');
            renderAlbums();
            renderSingles();
            break;
    }
}

// Render about section
function renderAbout() {
    document.getElementById('about-section').classList.remove('hidden');
    document.getElementById('artist-bio').textContent = discographyData.bio;

    const socialLinksContainer = document.getElementById('social-links');
    socialLinksContainer.innerHTML = '';

    Object.entries(discographyData.socialLinks).forEach(([platform, url]) => {
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

    const cover = document.createElement('div');
    cover.className = 'release-cover';
    cover.style.background = release.backgroundColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    cover.style.color = release.textColor || '#ffffff';
    cover.textContent = release.title.substring(0, 2).toUpperCase();

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

    card.appendChild(cover);
    card.appendChild(info);

    return card;
}

// Open release modal
function openReleaseModal(release) {
    const modal = document.getElementById('release-modal');

    // Set cover
    const cover = document.getElementById('release-modal-cover');
    cover.style.background = release.backgroundColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    cover.style.color = release.textColor || '#ffffff';
    cover.textContent = release.title.substring(0, 2).toUpperCase();

    // Set title and year
    document.getElementById('release-modal-title').textContent = release.title;
    document.getElementById('release-modal-year').textContent = release.releaseDate;
    document.getElementById('release-modal-description').textContent = release.description || '';

    // Set metadata
    const metaContainer = document.getElementById('release-modal-meta');
    metaContainer.innerHTML = '';

    const metaData = [
        { label: 'Type', value: release.type.toUpperCase() },
        { label: 'Label', value: release.label },
        { label: 'Producer', value: release.producer },
        { label: 'Catalog #', value: release.catalogNumber }
    ];

    if (release.totalDuration) {
        metaData.push({ label: 'Duration', value: release.totalDuration });
    } else if (release.duration) {
        metaData.push({ label: 'Duration', value: release.duration });
    }

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
    const tagsContainer = document.getElementById('release-modal-tags');
    tagsContainer.innerHTML = '';
    release.tags?.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag';
        tagEl.textContent = tag;
        tagsContainer.appendChild(tagEl);
    });

    // Set streaming links
    const streamingContainer = document.getElementById('release-modal-streaming');
    streamingContainer.innerHTML = '';
    if (release.streamingLinks && Object.keys(release.streamingLinks).length > 0) {
        const title = document.createElement('div');
        title.className = 'streaming-title';
        title.textContent = 'Listen Now';
        streamingContainer.appendChild(title);

        const links = document.createElement('div');
        links.className = 'streaming-links';
        Object.entries(release.streamingLinks).forEach(([platform, url]) => {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.className = 'streaming-link';
            link.textContent = platform.charAt(0).toUpperCase() + platform.slice(1).replace(/([A-Z])/g, ' $1');
            links.appendChild(link);
        });
        streamingContainer.appendChild(links);
    }

    // Set tracklist
    const tracksContainer = document.getElementById('release-modal-tracks');
    tracksContainer.innerHTML = '';

    if (release.tracks) {
        const trackList = document.createElement('div');
        trackList.className = 'track-list';

        release.tracks.forEach(track => {
            const trackItem = document.createElement('div');
            trackItem.className = 'track-item';
            trackItem.onclick = (e) => {
                e.stopPropagation();
                openTrackModal(track, release);
            };

            const number = document.createElement('span');
            number.className = 'track-number';
            number.textContent = track.trackNumber;

            const name = document.createElement('span');
            name.className = 'track-name';
            name.textContent = track.title;

            const duration = document.createElement('span');
            duration.className = 'track-duration';
            duration.textContent = track.duration || '';

            trackItem.appendChild(number);
            trackItem.appendChild(name);
            trackItem.appendChild(duration);
            trackList.appendChild(trackItem);
        });

        tracksContainer.appendChild(trackList);
    } else {
        // Single track release
        const trackItem = document.createElement('div');
        trackItem.className = 'track-item';
        trackItem.onclick = (e) => {
            e.stopPropagation();
            openTrackModal(release, release);
        };

        const number = document.createElement('span');
        number.className = 'track-number';
        number.textContent = '1';

        const name = document.createElement('span');
        name.className = 'track-name';
        name.textContent = release.title;

        const duration = document.createElement('span');
        duration.className = 'track-duration';
        duration.textContent = release.duration || '';

        trackItem.appendChild(number);
        trackItem.appendChild(name);
        trackItem.appendChild(duration);
        tracksContainer.appendChild(trackItem);
    }

    modal.classList.remove('hidden');
}

// Open track modal
function openTrackModal(track, release) {
    const modal = document.getElementById('track-modal');

    // Set cover
    const cover = document.getElementById('modal-cover');
    cover.style.background = release.backgroundColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    cover.style.color = release.textColor || '#ffffff';
    cover.textContent = (track.title || release.title).substring(0, 2).toUpperCase();

    // Set title and album
    document.getElementById('modal-title').textContent = track.title || release.title;
    document.getElementById('modal-album').textContent = `From "${release.title}" (${release.year})`;

    // Set metadata
    const metaContainer = document.getElementById('modal-meta');
    metaContainer.innerHTML = '';

    const metaData = [];
    if (track.duration) metaData.push({ label: 'Duration', value: track.duration });
    if (track.bpm) metaData.push({ label: 'BPM', value: track.bpm });
    if (track.key) metaData.push({ label: 'Key', value: track.key });
    if (track.isrc) metaData.push({ label: 'ISRC', value: track.isrc });

    metaData.forEach(meta => {
        const item = document.createElement('div');
        item.className = 'meta-item';
        item.innerHTML = `
            <span class="meta-label">${meta.label}</span>
            <span class="meta-value">${meta.value}</span>
        `;
        metaContainer.appendChild(item);
    });

    // Set tags
    const tagsContainer = document.getElementById('modal-tags');
    tagsContainer.innerHTML = '';

    const allTags = [...(track.mood || []), ...(track.tags || [])];
    allTags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag';
        tagEl.textContent = tag;
        tagsContainer.appendChild(tagEl);
    });

    // Set lyrics
    const lyricsContainer = document.getElementById('modal-lyrics');
    const lyrics = track.lyrics || release.lyrics || 'Lyrics not available';
    lyricsContainer.innerHTML = `<pre>${lyrics}</pre>`;

    // Set credits
    const creditsContainer = document.getElementById('modal-credits');
    creditsContainer.innerHTML = '';

    const credits = track.credits || release.credits;
    if (credits && Object.keys(credits).length > 0) {
        const creditsList = document.createElement('div');
        creditsList.className = 'credits-list';

        Object.entries(credits).forEach(([role, names]) => {
            const creditItem = document.createElement('div');
            creditItem.className = 'credit-item';

            const roleEl = document.createElement('div');
            roleEl.className = 'credit-role';
            roleEl.textContent = role.replace(/([A-Z])/g, ' $1').trim();

            const namesEl = document.createElement('div');
            namesEl.className = 'credit-names';
            namesEl.textContent = Array.isArray(names) ? names.join(', ') : names;

            creditItem.appendChild(roleEl);
            creditItem.appendChild(namesEl);
            creditsList.appendChild(creditItem);
        });

        creditsContainer.appendChild(creditsList);
    } else {
        creditsContainer.innerHTML = '<p>Credits not available</p>';
    }

    // Close release modal if open
    document.getElementById('release-modal').classList.add('hidden');

    modal.classList.remove('hidden');
}

// Close modals
function closeModals(e) {
    if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal-overlay')) {
        document.getElementById('track-modal').classList.add('hidden');
        document.getElementById('release-modal').classList.add('hidden');
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModals({ target: { classList: ['modal-close'] } });
    }
});
