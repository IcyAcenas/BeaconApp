const map = L.map('map').setView([8.485983, 124.649128], 13);
window.map = map;

const MAPBOX_TOKEN = 'pk.eyJ1IjoiaWNlejc3NzciLCJhIjoiY213MjdjdmF2MDBhcjMwb241Y2Vsbng0byJ9.6bH3-ZjfMblsBG0dnsCv-w';

const styleId = 'mapbox/dark-v11';

L.tileLayer(`https://api.mapbox.com/styles/v1/${styleId}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`, {
    tileSize: 512,
    zoomOffset: -1,
    maxZoom: 19,
    attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

window.addEventListener('load', () => map.invalidateSize());
window.addEventListener('resize', () => map.invalidateSize());

const pullUpSection = document.getElementById('PullUpSection');
const pullUpHandle = document.getElementById('PullUpHandle');
const pullUpSectionTitle = document.getElementById('PullUpSectionTitle');
const expandedFeedList = document.getElementById('expandedFeedList');
const warningTitle = document.getElementById('warningtitle');
const warningText = document.getElementById('warningtext');
const searchInput = document.querySelector('.searchbar input');
const reportModal = document.getElementById('reportModal');
const reportPanelTitle = document.getElementById('reportPanelTitle');
const hazardReportForm = document.getElementById('hazardReportForm');
const hazardTypeInput = document.getElementById('hazardType');
const hazardLocationInput = document.getElementById('hazardLocation');
const locationPinSvg = document.getElementById('locationPinSvg');
const locationSuggestionsList = document.getElementById('locationSuggestions');
const currentLocationBtnText = document.getElementById('currentLocationBtnText');

const openCameraBtn = document.getElementById('openCameraBtn');
const liveCameraBox = document.getElementById('liveCameraBox');
const cameraStreamVideo = document.getElementById('cameraStreamVideo');
const capturedPhotoBox = document.getElementById('capturedPhotoBox');
const hazardPhotoPreview = document.getElementById('hazardPhotoPreview');
const cameraOnlyFallbackInput = document.getElementById('cameraOnlyFallbackInput');

const hazardData = {
    flashfloods: {
        displayName: 'Flash Floods',
        label: 'Flash Flood reported within 300 meters',
        title: 'WARNING!',
        position: [8.4867, 124.6491],
        color: '#1E88E5',
        status: 'active'
    },
    accidents: {
        displayName: 'Accidents',
        label: 'Road accident reported nearby',
        title: 'WARNING!',
        position: [8.4824, 124.6458],
        color: '#E53935',
        status: 'active'
    },
    fires: {
        displayName: 'Fires',
        label: 'Fire emergency reported nearby',
        title: 'WARNING!',
        position: [8.4895, 124.6549],
        color: '#FB8C00',
        status: 'active'
    },
    landslides: {
        displayName: 'Landslides',
        label: 'Landslide cleared and monitored',
        title: 'STATUS',
        position: [8.4802, 124.6417],
        color: '#4CAF50',
        status: 'resolved'
    }
};

const defaultHazards = [
    {
        id: 'default-flood-1',
        hazardKey: 'flashfloods',
        label: 'Flash Flood reported within 300 meters',
        title: 'WARNING!',
        position: [8.4867, 124.6491],
        color: '#1E88E5',
        status: 'active'
    },
    {
        id: 'default-flood-2',
        hazardKey: 'flashfloods',
        label: 'Riverbank overflow reported near Carmen',
        title: 'WARNING!',
        position: [8.4815, 124.6432],
        color: '#1E88E5',
        status: 'active'
    },
    {
        id: 'default-accident-1',
        hazardKey: 'accidents',
        label: 'Road accident reported nearby',
        title: 'WARNING!',
        position: [8.4824, 124.6458],
        color: '#E53935',
        status: 'active'
    },
    {
        id: 'default-fire-1',
        hazardKey: 'fires',
        label: 'Fire emergency reported nearby',
        title: 'WARNING!',
        position: [8.4895, 124.6549],
        color: '#FB8C00',
        status: 'active'
    },
    {
        id: 'default-landslide-1',
        hazardKey: 'landslides',
        label: 'Landslide cleared and monitored',
        title: 'STATUS',
        position: [8.4802, 124.6417],
        color: '#4CAF50',
        status: 'resolved'
    }
];

const categoryCardElements = {
    flashfloods: {
        imageId: 'floodlatest',
        statusId: 'floodstatus',
        descId: 'flooddescriptioncard',
        reporterId: 'floodreportername',
        timeId: 'floodreporttime',
        defaultImage: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=900&q=80',
        defaultReporter: 'Euan Mercado',
        defaultTime: '5 minutes ago'
    },
    accidents: {
        imageId: 'accidentlatest',
        statusId: 'accidentstatus',
        descId: 'accidentdescriptioncard',
        reporterId: 'accidentreportername',
        timeId: 'accidentreporttime',
        defaultImage: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
        defaultReporter: 'Icy Acenas',
        defaultTime: '12 minutes ago'
    },
    fires: {
        imageId: 'firelatest',
        statusId: 'firestatus',
        descId: 'firedescriptioncard',
        reporterId: 'firereportername',
        timeId: 'firereporttime',
        defaultImage: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=900&q=80',
        defaultReporter: 'Mitchie Bagaporo',
        defaultTime: '30 minutes ago'
    },
    landslides: {
        imageId: 'landslidelatest',
        statusId: 'landslidestatus',
        descId: 'landslidedescriptioncard',
        reporterId: 'landslidereportername',
        timeId: 'landslidereporttime',
        defaultImage: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
        defaultReporter: 'Francis King Uyguangco',
        defaultTime: '2 hours ago'
    }
};

const cdoLocalPlaces = [
    { name: 'Corrales Avenue, Cagayan de Oro City', sub: 'City Proper, Cagayan de Oro', position: [8.4812, 124.6488] },
    { name: 'Barangay 8, Cagayan de Oro City', sub: 'Poblacion, Cagayan de Oro', position: [8.4853, 124.6497] },
    { name: 'Masterson Avenue, Cagayan de Oro City', sub: 'Upper Carmen / Uptown CDO', position: [8.4855, 124.6524] },
    { name: 'Carmen, Cagayan de Oro City', sub: 'West Poblacion, Cagayan de Oro', position: [8.4820, 124.6410] },
    { name: 'Cugman, Cagayan de Oro City', sub: 'East Highway, Cagayan de Oro', position: [8.4728, 124.6825] },
    { name: 'Lapasan, Cagayan de Oro City', sub: 'CM Recto Avenue, Cagayan de Oro', position: [8.4847, 124.6612] },
    { name: 'Divisoria, Cagayan de Oro City', sub: 'City Proper, Cagayan de Oro', position: [8.4772, 124.6459] },
    { name: 'Nazareth, Cagayan de Oro City', sub: 'South Poblacion, Cagayan de Oro', position: [8.4694, 124.6485] },
    { name: 'Macasandig, Cagayan de Oro City', sub: 'Cagayan de Oro', position: [8.4631, 124.6468] },
    { name: 'Gusa, Cagayan de Oro City', sub: 'National Highway, Cagayan de Oro', position: [8.4765, 124.6710] },
    { name: 'Puerto, Cagayan de Oro City', sub: 'East CDO Junction', position: [8.4876, 124.7186] },
    { name: 'Bulua, Cagayan de Oro City', sub: 'West Highway, Cagayan de Oro', position: [8.5082, 124.6194] },
    { name: 'Kauswagan, Cagayan de Oro City', sub: 'North Poblacion, Cagayan de Oro', position: [8.4979, 124.6422] }
];

const cagayanDeOroBounds = {
    south: 8.2,
    north: 8.7,
    west: 124.4,
    east: 125.0
};

const geocodedLocationCache = new Map();

let startY = 0;
let currentY = 0;
let isDragging = false;
let suppressNextHandleClick = false;
let selectedHazardFilter = null;
let capturedPhotoDataUrl = '';
let activeCameraStream = null;
let selectedPinPosition = null;
let draftPinMarker = null;
let suggestionDebounceTimer = null;

const hazardMarkers = {};
const hazardReports = [];
let hazardReportCounter = 0;
window.hazardReports = hazardReports;
window.hazardData = hazardData;

function getAllHazards() {
    return [
        ...defaultHazards,
        ...hazardReports.map((report) => ({
            id: `report-${report.id}`,
            hazardKey: report.hazardKey,
            label: report.label,
            title: report.title,
            position: report.position,
            color: report.color,
            status: report.status
        }))
    ];
}

function renderExpandedFeed() {
    if (!expandedFeedList) return;
    expandedFeedList.innerHTML = '';

    const items = [...getAllHazards()].reverse();
    items.forEach((item) => {
        const typeTitle = hazardData[item.hazardKey]?.displayName || item.hazardKey;
        const row = document.createElement('div');
        row.className = 'expanded-feed-item';
        row.innerHTML = `
            <div class="expanded-feed-left">
                <span class="expanded-feed-dot" style="background:${item.color};"></span>
                <div class="expanded-feed-text">
                    <strong>${typeTitle}</strong>
                    <span>${item.label}</span>
                </div>
            </div>
            <span class="expanded-feed-badge">${item.status === 'resolved' ? 'Resolved' : 'Active'}</span>
        `;
        row.addEventListener('click', () => {
            warningText.textContent = item.label;
            warningTitle.textContent = item.title;
            pullUpSection.classList.remove('expanded');
            map.flyTo(item.position, 16, { duration: 1.0 });
        });
        expandedFeedList.appendChild(row);
    });
}

function updateCategoryCards() {
    const allHazards = getAllHazards();

    Object.entries(categoryCardElements).forEach(([hazardKey, config]) => {
        const activeItems = allHazards.filter(
            (item) => item.hazardKey === hazardKey && item.status !== 'resolved'
        );
        const userActiveReports = hazardReports.filter(
            (report) => report.hazardKey === hazardKey && report.status !== 'resolved'
        );

        const statusDot = document.getElementById(config.statusId);
        const descEl = document.getElementById(config.descId);
        const reporterEl = document.getElementById(config.reporterId);
        const timeEl = document.getElementById(config.timeId);
        const imageEl = document.getElementById(config.imageId);

        if (activeItems.length > 0) {
            if (statusDot) statusDot.className = 'status-dot dot-red';
            if (descEl) descEl.textContent = `${activeItems.length} active`;
        } else {
            if (statusDot) statusDot.className = 'status-dot dot-green';
            if (descEl) descEl.textContent = 'Resolved';
        }

        if (reporterEl && timeEl) {
            if (userActiveReports.length > 0) {
                const latestReport = userActiveReports[userActiveReports.length - 1];
                reporterEl.textContent = 'You';
                timeEl.textContent = 'Just now';
                if (imageEl && latestReport.photoUrl) {
                    imageEl.src = latestReport.photoUrl;
                }
            } else {
                reporterEl.textContent = config.defaultReporter;
                timeEl.textContent = config.defaultTime;
                if (imageEl) {
                    imageEl.src = config.defaultImage;
                }
            }
        }
    });

    renderExpandedFeed();
}

function toggleSheet() {
    if (suppressNextHandleClick) {
        suppressNextHandleClick = false;
        return;
    }
    pullUpSection.classList.toggle('expanded');
}

function clearSearch() {
    searchInput.value = '';
    searchInput.focus();
    selectedHazardFilter = null;
    document.querySelectorAll('.hazardcard').forEach((card) => card.classList.remove('selected'));
    filterHazards();
    renderHazardMarkers();
}

function filterHazards() {
    const query = searchInput.value.trim().toLowerCase();
    const cards = document.querySelectorAll('.hazardcard');

    cards.forEach((card) => {
        const text = card.textContent.toLowerCase();
        const visible = !query || text.includes(query);
        card.style.display = visible ? 'flex' : 'none';
    });
}

function setDefaultImages() {
    const logo = document.querySelector('.beaconlogo img');
    const profileIcon = document.querySelector('.profile-button img');

    if (logo) {
        logo.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="120" height="34" viewBox="0 0 120 34">
                <rect width="120" height="34" rx="8" fill="#F6F3E9"/>
                <text x="16" y="22" font-size="18" font-family="Arial, sans-serif" font-weight="700" fill="#12261E">Beacon</text>
            </svg>
        `);
    }

    if (profileIcon) {
        profileIcon.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" fill="#12261E"/>
                <path d="M4 19c1.5-3 5-4.5 8-4.5s6.5 1.5 8 4.5" fill="none" stroke="#12261E" stroke-width="2.4" stroke-linecap="round"/>
            </svg>
        `);
    }

    const imageMap = [
        ['#floodlatest', categoryCardElements.flashfloods.defaultImage],
        ['#accidentlatest', categoryCardElements.accidents.defaultImage],
        ['#firelatest', categoryCardElements.fires.defaultImage],
        ['#landslidelatest', categoryCardElements.landslides.defaultImage],
        ['#flooduserphoto', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'],
        ['#accidentuserphoto', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'],
        ['#fireuserphoto', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80'],
        ['#landslideuserphoto', 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=200&q=80']
    ];

    imageMap.forEach(([selector, url]) => {
        const image = document.querySelector(selector);
        if (image) image.src = url;
    });
}

function createPointyPinIcon(color) {
    return L.divIcon({
        className: 'hazard-map-pin',
        html: `
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42" style="display:block;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.45));">
                <path d="M16 1C8.268 1 2 7.268 2 15c0 10.5 14 25.5 14 25.5S30 25.5 30 15C30 7.268 23.732 1 16 1z" fill="${color}" stroke="#FFFFFF" stroke-width="2.2"/>
                <circle cx="16" cy="15" r="5.5" fill="#FFFFFF"/>
            </svg>
        `,
        iconSize: [32, 42],
        iconAnchor: [16, 41],
        popupAnchor: [0, -38]
    });
}

function createDraftPinIcon(color = '#B88456') {
    return L.divIcon({
        className: 'hazard-map-pin',
        html: `
            <div class="draft-pin-wrapper">
                <span class="draft-pin-label" style="color:${color};">Pin</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 32 42" style="display:block;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.5));">
                    <path d="M16 1C8.268 1 2 7.268 2 15c0 10.5 14 25.5 14 25.5S30 25.5 30 15C30 7.268 23.732 1 16 1z" fill="${color}" stroke="#12261E" stroke-width="2"/>
                    <circle cx="16" cy="15" r="5" fill="#12261E"/>
                </svg>
            </div>
        `,
        iconSize: [44, 62],
        iconAnchor: [22, 61]
    });
}

function renderHazardMarkers() {
    Object.values(hazardMarkers).forEach((marker) => marker.remove());
    Object.keys(hazardMarkers).forEach((key) => delete hazardMarkers[key]);

    const visibleHazards = getAllHazards().filter((details) => {
        if (details.status === 'resolved') return false;
        if (selectedHazardFilter && details.hazardKey !== selectedHazardFilter) return false;
        return true;
    });

    visibleHazards.forEach((details) => {
        const marker = L.marker(details.position, {
            icon: createPointyPinIcon(details.color)
        }).addTo(map);

        marker.bindPopup(`<strong>${details.hazardKey.toUpperCase()}</strong><br>${details.label}`);
        marker.on('click', () => {
            if (reportModal.classList.contains('active')) return;
            warningText.textContent = details.label;
            warningTitle.textContent = details.title;
            selectHazard(details.hazardKey, true);
        });
        hazardMarkers[details.id] = marker;
    });
}

function selectHazard(hazardKey, forceSelect = false) {
    const isSameSelection = !forceSelect && selectedHazardFilter === hazardKey;
    const cards = document.querySelectorAll('.hazardcard');

    if (isSameSelection) {
        selectedHazardFilter = null;
        cards.forEach((card) => card.classList.remove('selected'));
        renderHazardMarkers();
        return;
    }

    selectedHazardFilter = hazardKey;

    cards.forEach((card) => {
        card.classList.toggle('selected', card.dataset.hazard === hazardKey);
    });

    const activeMatching = getAllHazards().filter(
        (item) => item.hazardKey === hazardKey && item.status !== 'resolved'
    );
    const latestHazard = activeMatching[activeMatching.length - 1] || hazardData[hazardKey];

    if (latestHazard) {
        warningText.textContent = latestHazard.label;
        warningTitle.textContent = latestHazard.title;
    }

    renderHazardMarkers();

    if (activeMatching.length === 1) {
        map.flyTo(activeMatching[0].position, 15, { duration: 1.2 });
    } else if (activeMatching.length > 1) {
        const bounds = L.latLngBounds(activeMatching.map((item) => item.position));
        map.flyToBounds(bounds, { padding: [90, 90], maxZoom: 15, duration: 1.2 });
    } else if (hazardData[hazardKey]) {
        map.flyTo(hazardData[hazardKey].position, 15, { duration: 1.2 });
    }
}

function setSelectedReportType(typeKey) {
    hazardTypeInput.value = typeKey || '';

    document.querySelectorAll('.hazard-type-pill').forEach((pill) => {
        pill.classList.toggle('active', pill.dataset.type === typeKey);
    });

    const info = hazardData[typeKey];
    reportPanelTitle.textContent = info ? `Report ${info.displayName}` : 'Report Hazard';

    const pinColor = info ? info.color : '#B88456';
    if (locationPinSvg) {
        locationPinSvg.setAttribute('fill', pinColor);
    }

    if (draftPinMarker) {
        draftPinMarker.setIcon(createDraftPinIcon(pinColor));
    }
}

function updateDraftPinOnMap(position, shouldPan = true) {
    if (!isInsideCagayanDeOroBounds(position)) {
        window.alert('Please select a point within Cagayan de Oro City.');
        return false;
    }

    selectedPinPosition = [...position];
    const info = hazardData[hazardTypeInput.value];
    const pinColor = info ? info.color : '#B88456';

    if (!draftPinMarker) {
        draftPinMarker = L.marker(position, {
            draggable: true,
            icon: createDraftPinIcon(pinColor)
        }).addTo(map);

        draftPinMarker.on('dragend', async () => {
            const pos = draftPinMarker.getLatLng();
            if (!isInsideCagayanDeOroBounds([pos.lat, pos.lng])) {
                draftPinMarker.setLatLng(selectedPinPosition);
                return;
            }
            selectedPinPosition = [pos.lat, pos.lng];
            const street = await reverseGeocodeCdo(pos.lat, pos.lng);
            hazardLocationInput.value = street || `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
        });
    } else {
        draftPinMarker.setLatLng(position);
        draftPinMarker.setIcon(createDraftPinIcon(pinColor));
    }

    if (shouldPan) {
        const isMobile = window.innerWidth < 768;
        const targetPoint = map.project(position, 16);
        if (isMobile) {
            targetPoint.y += 140;
        } else {
            targetPoint.x += 180;
        }
        const offsetLatLng = map.unproject(targetPoint, 16);
        map.flyTo(offsetLatLng, 16, { duration: 0.7 });
    }

    return true;
}

function removeDraftPin() {
    if (draftPinMarker) {
        draftPinMarker.remove();
        draftPinMarker = null;
    }
}

map.on('click', async (e) => {
    if (!reportModal.classList.contains('active')) return;
    const coords = [e.latlng.lat, e.latlng.lng];
    if (!updateDraftPinOnMap(coords, false)) return;

    hideLocationSuggestions();
    hazardLocationInput.value = 'Pinpointing address...';
    const address = await reverseGeocodeCdo(coords[0], coords[1]);
    hazardLocationInput.value = address || `${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`;
});

function useCurrentLocation() {
    if (!navigator.geolocation) {
        window.alert('Geolocation is not supported by your browser.');
        return;
    }

    currentLocationBtnText.textContent = 'Locating...';
    hideLocationSuggestions();

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            currentLocationBtnText.textContent = 'Use Current Location';
            const coords = [pos.coords.latitude, pos.coords.longitude];

            if (!isInsideCagayanDeOroBounds(coords)) {
                window.alert('Your current GPS location is outside Cagayan de Oro City. You can tap the map or search a CDO street instead.');
                return;
            }

            updateDraftPinOnMap(coords, true);
            const address = await reverseGeocodeCdo(coords[0], coords[1]);
            hazardLocationInput.value = address || `${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`;
        },
        () => {
            currentLocationBtnText.textContent = 'Use Current Location';
            window.alert('Unable to access your GPS location. Please allow location permission, tap the map directly, or search below.');
        },
        { enableHighAccuracy: true, timeout: 8000 }
    );
}

function clearLocationField() {
    hazardLocationInput.value = '';
    selectedPinPosition = null;
    removeDraftPin();
    hideLocationSuggestions();
    hazardLocationInput.focus();
}

async function reverseGeocodeCdo(lat, lng) {
    try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&country=ph&limit=1`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        const feature = data.features?.[0];
        if (!feature) return null;
        return feature.place_name.replace(/,\s*Philippines$/i, '');
    } catch {
        return null;
    }
}

function handleLocationInput() {
    selectedPinPosition = null;
    const query = hazardLocationInput.value.trim();

    clearTimeout(suggestionDebounceTimer);
    if (!query) {
        hideLocationSuggestions();
        return;
    }

    suggestionDebounceTimer = setTimeout(() => {
        fetchLocationSuggestions(query);
    }, 220);
}

async function fetchLocationSuggestions(query) {
    const qLower = query.toLowerCase();

    const localMatches = cdoLocalPlaces
        .filter((place) => place.name.toLowerCase().includes(qLower) || place.sub.toLowerCase().includes(qLower))
        .map((place) => ({
            title: place.name,
            subtitle: place.sub,
            position: place.position
        }));

    let apiMatches = [];
    try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=ph&bbox=124.4,8.2,125.0,8.7&proximity=124.6491,8.4859&autocomplete=true&limit=5`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            apiMatches = (data.features || [])
                .filter((f) => isCagayanDeOroFeature(f, query))
                .map((f) => ({
                    title: f.text,
                    subtitle: f.place_name.replace(/,\s*Philippines$/i, ''),
                    position: [f.center[1], f.center[0]]
                }));
        }
    } catch (err) {
        console.warn('Autocomplete lookup failed:', err);
    }

    const seen = new Set();
    const combined = [...localMatches, ...apiMatches].filter((item) => {
        const key = item.title.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    }).slice(0, 5);

    renderLocationSuggestions(combined);
}

function renderLocationSuggestions(suggestions) {
    locationSuggestionsList.innerHTML = '';

    if (!suggestions.length) {
        hideLocationSuggestions();
        return;
    }

    suggestions.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'location-suggestion-item';
        li.innerHTML = `<strong>${item.title}</strong><span>${item.subtitle}</span>`;
        li.addEventListener('click', () => {
            hazardLocationInput.value = item.subtitle || item.title;
            updateDraftPinOnMap(item.position, true);
            hideLocationSuggestions();
        });
        locationSuggestionsList.appendChild(li);
    });

    locationSuggestionsList.classList.add('active');
}

function hideLocationSuggestions() {
    locationSuggestionsList.classList.remove('active');
    locationSuggestionsList.innerHTML = '';
}

async function openLiveCamera() {
    stopLiveCamera();

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            activeCameraStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
                audio: false
            });
            cameraStreamVideo.srcObject = activeCameraStream;
            openCameraBtn.style.display = 'none';
            capturedPhotoBox.classList.remove('active');
            liveCameraBox.classList.add('active');
            return;
        } catch (err) {
            console.warn('Live WebRTC camera unavailable, falling back to native camera capture:', err);
        }
    }

    cameraOnlyFallbackInput.value = '';
    cameraOnlyFallbackInput.click();
}

function captureLivePhoto() {
    if (!cameraStreamVideo.videoWidth) return;

    const canvas = document.createElement('canvas');
    canvas.width = cameraStreamVideo.videoWidth;
    canvas.height = cameraStreamVideo.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(cameraStreamVideo, 0, 0, canvas.width, canvas.height);

    capturedPhotoDataUrl = canvas.toDataURL('image/jpeg', 0.88);
    stopLiveCamera();
    showCapturedPhoto(capturedPhotoDataUrl);
}

function stopLiveCamera() {
    if (activeCameraStream) {
        activeCameraStream.getTracks().forEach((track) => track.stop());
        activeCameraStream = null;
    }
    cameraStreamVideo.srcObject = null;
    liveCameraBox.classList.remove('active');
    if (!capturedPhotoDataUrl) {
        openCameraBtn.style.display = 'flex';
    }
}

function showCapturedPhoto(dataUrl) {
    hazardPhotoPreview.src = dataUrl;
    openCameraBtn.style.display = 'none';
    liveCameraBox.classList.remove('active');
    capturedPhotoBox.classList.add('active');
}

cameraOnlyFallbackInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        capturedPhotoDataUrl = ev.target.result;
        showCapturedPhoto(capturedPhotoDataUrl);
    };
    reader.readAsDataURL(file);
});

function openProfile() {
    let panel = document.getElementById('profilePanel');

    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'profilePanel';
        panel.className = 'profile-panel';
        panel.innerHTML = `
            <div class="profile-panel-inner">
                <button class="profile-close" onclick="closeProfile()">✕</button>
                <div class="profile-header">
                    <div class="profile-avatar">A</div>
                    <div>
                        <h3>Agent Aria</h3>
                        <p>Emergency Response</p>
                    </div>
                </div>
                <div class="profile-actions">
                    <button>Saved Alerts</button>
                    <button>Response History</button>
                    <button>Settings</button>
                    <button type="button" onclick="openAdminDashboard()">Admin Dashboard</button>
                </div>
            </div>
        `;
        document.body.appendChild(panel);
    }

    panel.classList.add('active');
    panel.addEventListener('click', function (event) {
        if (event.target === panel) {
            closeProfile();
        }
    });
}

function closeProfile() {
    const panel = document.getElementById('profilePanel');
    if (panel) {
        panel.classList.remove('active');
    }
}

function openAdminDashboard() {
    closeProfile();

    let panel = document.getElementById('adminDashboardPanel');

    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'adminDashboardPanel';
        panel.className = 'admin-dashboard-panel';
        panel.innerHTML = `
            <div class="admin-dashboard-inner">
                <div class="admin-dashboard-header">
                    <div>
                        <span class="admin-dashboard-kicker">Admin</span>
                        <h3>Incident Triage Queue</h3>
                    </div>
                    <button class="admin-dashboard-close" onclick="closeAdminDashboard()">✕</button>
                </div>

                <div class="admin-dashboard-filters">
                    <button class="filter-chip active" data-filter="all">All</button>
                    <button class="filter-chip" data-filter="verified">Camera Verified</button>
                    <button class="filter-chip" data-filter="resolved">Resolved</button>
                </div>

                <div class="admin-incident-list">
                    <div class="admin-incident-item" data-priority="verified">
                        <div class="incident-main">
                            <span class="incident-badge blue">Verified</span>
                            <div>
                                <h4>Road Accident</h4>
                                <p>Masterson Avenue · 5 minutes ago</p>
                            </div>
                        </div>
                        <button class="resolve-btn" type="button">Mark as Resolved</button>
                    </div>

                    <div class="admin-incident-item" data-priority="verified">
                        <div class="incident-main">
                            <span class="incident-badge orange">Verified</span>
                            <div>
                                <h4>Fire Emergency</h4>
                                <p>Barangay 8 · 12 minutes ago</p>
                            </div>
                        </div>
                        <button class="resolve-btn" type="button">Mark as Resolved</button>
                    </div>

                    <div class="admin-incident-item" data-priority="verified">
                        <div class="incident-main">
                            <span class="incident-badge blue">Verified</span>
                            <div>
                                <h4>Flash Flood</h4>
                                <p>Barangay 7 · 23 minutes ago</p>
                            </div>
                        </div>
                        <button class="resolve-btn" type="button">Mark as Resolved</button>
                    </div>

                    <div class="admin-incident-item resolved" data-priority="resolved">
                        <div class="incident-main">
                            <span class="incident-badge green">Resolved</span>
                            <div>
                                <h4>Landslide</h4>
                                <p>Camaman-an · 1 hour ago</p>
                            </div>
                        </div>
                        <button class="resolve-btn muted" type="button">Resolved</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        panel.addEventListener('click', (event) => {
            const chip = event.target.closest('.filter-chip');
            if (chip && panel.contains(chip)) {
                panel.querySelectorAll('.filter-chip').forEach((item) => item.classList.toggle('active', item === chip));
                filterAdminIncidents(panel, chip.dataset.filter);
                return;
            }

            const button = event.target.closest('.resolve-btn');
            if (button && panel.contains(button) && !button.disabled) {
                const item = button.closest('.admin-incident-item');
                if (!item) return;

                item.classList.add('resolved');
                item.dataset.priority = 'resolved';
                item.querySelector('.incident-badge').textContent = 'Resolved';
                item.querySelector('.incident-badge').className = 'incident-badge green';
                button.textContent = 'Resolved';
                button.classList.add('muted');
                button.disabled = true;

                const report = hazardReports.find((entry) => String(entry.id) === item.dataset.reportId);
                if (report) {
                    report.status = 'resolved';
                    updateCategoryCards();
                    renderHazardMarkers();
                }

                const activeFilter = panel.querySelector('.filter-chip.active')?.dataset.filter || 'all';
                filterAdminIncidents(panel, activeFilter);
                return;
            }

            if (event.target === panel) closeAdminDashboard();
        });
    }

    hazardReports.forEach(addAdminIncident);
    const activeFilter = panel.querySelector('.filter-chip.active')?.dataset.filter || 'all';
    filterAdminIncidents(panel, activeFilter);
    panel.classList.add('active');
}

function filterAdminIncidents(panel, selectedFilter) {
    panel.querySelectorAll('.admin-incident-item').forEach((item) => {
        const show = selectedFilter === 'all' || item.dataset.priority === selectedFilter;
        item.style.display = show ? 'flex' : 'none';
    });
}

function addAdminIncident(report) {
    const panel = document.getElementById('adminDashboardPanel');
    const list = panel?.querySelector('.admin-incident-list');
    if (!list || list.querySelector(`[data-report-id="${report.id}"]`)) return;

    const incidentTitle = {
        flashfloods: 'Flash Flood',
        accidents: 'Road Accident',
        fires: 'Fire Emergency',
        landslides: 'Landslide'
    }[report.hazardKey];

    const item = document.createElement('div');
    item.className = 'admin-incident-item';
    item.dataset.priority = report.status === 'resolved' ? 'resolved' : 'verified';
    item.dataset.reportId = String(report.id);

    const main = document.createElement('div');
    main.className = 'incident-main';

    if (report.photoUrl) {
        const thumb = document.createElement('img');
        thumb.src = report.photoUrl;
        thumb.alt = 'Live camera photo';
        thumb.className = 'incident-photo-thumb';
        main.appendChild(thumb);
    }

    const badge = document.createElement('span');
    badge.className = `incident-badge ${report.status === 'resolved' ? 'green' : 'blue'}`;
    badge.textContent = report.status === 'resolved' ? 'Resolved' : 'Verified';

    const details = document.createElement('div');
    const title = document.createElement('h4');
    title.textContent = incidentTitle;
    const location = document.createElement('p');
    location.textContent = `${report.location} · Just now`;
    details.append(title, location);
    main.append(badge, details);

    const button = document.createElement('button');
    button.className = 'resolve-btn';
    button.type = 'button';
    button.textContent = report.status === 'resolved' ? 'Resolved' : 'Mark as Resolved';
    if (report.status === 'resolved') {
        item.classList.add('resolved');
        button.classList.add('muted');
        button.disabled = true;
    }

    item.append(main, button);
    list.prepend(item);
}

function closeAdminDashboard() {
    const panel = document.getElementById('adminDashboardPanel');
    if (panel) {
        panel.classList.remove('active');
    }
}

function setCurrentReportTime() {
    const timeInput = document.getElementById('hazardTime');
    if (!timeInput) return;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    timeInput.value = `${hours}:${minutes}`;
}

function formatReportTime(time24) {
    if (!time24) return 'Just now';
    const [hStr, mStr] = time24.split(':');
    let hours = parseInt(hStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${mStr} ${ampm}`;
}

function openReportForm() {
    pullUpSection.classList.remove('expanded');
    pullUpSection.style.display = 'none';
    reportModal.classList.add('active');
    setCurrentReportTime();

    if (selectedHazardFilter && hazardData[selectedHazardFilter]) {
        setSelectedReportType(selectedHazardFilter);
    } else {
        setSelectedReportType('');
    }
}

function closeReportForm() {
    reportModal.classList.remove('active');
    pullUpSection.style.display = '';

    if (hazardReportForm) {
        hazardReportForm.reset();
    }

    capturedPhotoDataUrl = '';
    selectedPinPosition = null;
    stopLiveCamera();
    capturedPhotoBox.classList.remove('active');
    hazardPhotoPreview.src = '';
    openCameraBtn.style.display = 'flex';
    hideLocationSuggestions();
    removeDraftPin();
    setSelectedReportType('');
}

async function getReportedPosition(hazardLocation) {
    if (selectedPinPosition) {
        return selectedPinPosition;
    }

    const rawLocation = (hazardLocation || '').trim();
    const locationText = rawLocation.toLowerCase()
        .replace(/[^a-z0-9,\s.-]/g, ' ')
        .replace(/^(near|at|in|within)\s+/, '')
        .replace(/\b(?:brgy|bgy)\.?(?=\s|$)/g, 'barangay')
        .replace(/\bave\.?(?=\s|$)/g, 'avenue')
        .replace(/\s+(?:in|within|near|at)\s+/g, ', ')
        .replace(/\s*,\s*/g, ', ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!locationText) return null;

    const directCoordinateMatch = locationText.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
    if (directCoordinateMatch) {
        const position = [parseFloat(directCoordinateMatch[1]), parseFloat(directCoordinateMatch[2])];
        return isInsideCagayanDeOroBounds(position) ? position : null;
    }

    const localMatch = cdoLocalPlaces.find((p) => p.name.toLowerCase().startsWith(locationText));
    if (localMatch) {
        return localMatch.position;
    }

    if (geocodedLocationCache.has(locationText)) {
        return geocodedLocationCache.get(locationText);
    }

    try {
        const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(rawLocation)}.json?access_token=${MAPBOX_TOKEN}&country=ph&bbox=124.4,8.2,125.0,8.7&proximity=124.6491,8.4859&limit=5`;
        const response = await fetch(geocodeUrl);
        if (!response.ok) throw new Error('Geocoding request failed');

        const data = await response.json();
        const feature = data.features?.find((item) => isCagayanDeOroFeature(item, rawLocation));
        if (feature && Array.isArray(feature.center) && feature.center.length === 2) {
            const actualPosition = [feature.center[1], feature.center[0]];
            geocodedLocationCache.set(locationText, actualPosition);
            return actualPosition;
        }
    } catch (error) {
        console.warn('Location geocoding failed:', error);
    }

    return null;
}

function isInsideCagayanDeOroBounds(position) {
    const [latitude, longitude] = position;
    return latitude >= cagayanDeOroBounds.south && latitude <= cagayanDeOroBounds.north &&
        longitude >= cagayanDeOroBounds.west && longitude <= cagayanDeOroBounds.east;
}

function isCagayanDeOroFeature(feature, requestedLocation) {
    if (!feature || !Array.isArray(feature.center) || feature.center.length !== 2) return false;

    const position = [feature.center[1], feature.center[0]];
    if (!isInsideCagayanDeOroBounds(position)) return false;

    const normalizePlaceName = (value) => value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const expectedTokens = normalizePlaceName(requestedLocation || '')
        .replace(/\bcagayan de oro(?: city)?\b/g, ' ')
        .replace(/\b(?:cdo|philippines|in|within|near|at|around|the)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .filter((token) => token.length > 1 || /^\d+$/.test(token));
    const featureName = normalizePlaceName(`${feature.text || ''} ${feature.place_name || ''}`);
    const featureTokens = new Set(featureName.split(' '));
    if (expectedTokens.some((token) => !featureTokens.has(token))) return false;

    const locationContext = [feature.text, feature.place_name, ...(feature.context || []).map((item) => item.text)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    return locationContext.includes('cagayan de oro');
}

async function handleHazardSubmit(event) {
    event.preventDefault();

    const hazardKey = hazardTypeInput.value;
    const hazardLocation = hazardLocationInput.value.trim();
    const hazardTimeRaw = document.getElementById('hazardTime')?.value || '';
    const hazardDetails = document.getElementById('hazardDetails').value.trim();

    if (!hazardKey) {
        window.alert('Please select a hazard type first.');
        return;
    }

    if (!hazardLocation) {
        window.alert('Please set a location by tapping the map, using Current Location, or choosing a CDO suggestion.');
        return;
    }

    if (!hazardTimeRaw) {
        window.alert('Please select the time the hazard was spotted.');
        return;
    }

    if (!capturedPhotoDataUrl) {
        window.alert('Please take a live camera photo using "Add Photo/Video" to verify the hazard.');
        return;
    }

    const position = await getReportedPosition(hazardLocation);
    if (!position) {
        window.alert('Please select or pinpoint a valid location within Cagayan de Oro City.');
        return;
    }

    const formattedTime = formatReportTime(hazardTimeRaw);
    const label = `${hazardKey === 'flashfloods' ? 'Flash flood' : hazardKey === 'accidents' ? 'Road accident' : hazardKey === 'fires' ? 'Fire emergency' : 'Landslide'} reported near ${hazardLocation} at ${formattedTime}${hazardDetails ? ' — ' + hazardDetails : ''}`;

    hazardReportCounter += 1;
    const reportId = hazardReportCounter;

    hazardReports.push({
        id: reportId,
        hazardKey,
        label,
        title: 'WARNING!',
        position,
        color: hazardData[hazardKey].color,
        photoUrl: capturedPhotoDataUrl,
        location: hazardLocation,
        time: formattedTime,
        status: 'active'
    });

    updateCategoryCards();
    addAdminIncident(hazardReports[hazardReports.length - 1]);
    const adminPanel = document.getElementById('adminDashboardPanel');
    if (adminPanel) {
        const activeFilter = adminPanel.querySelector('.filter-chip.active')?.dataset.filter || 'all';
        filterAdminIncidents(adminPanel, activeFilter);
    }
    closeReportForm();
    selectHazard(hazardKey, true);
}

function startSheetDrag(clientY) {
    startY = clientY;
    currentY = clientY;
    isDragging = true;
}

function moveSheetDrag(clientY) {
    if (!isDragging) return;
    currentY = clientY;
}

function endSheetDrag() {
    if (!isDragging) return;

    const deltaY = currentY - startY;

    if (deltaY < -35) {
        pullUpSection.classList.add('expanded');
        suppressNextHandleClick = true;
    } else if (deltaY > 35) {
        pullUpSection.classList.remove('expanded');
        suppressNextHandleClick = true;
    }

    isDragging = false;
}

pullUpSection.addEventListener('touchstart', (e) => {
    if (e.target.closest('.pullup-scroll-body') && !pullUpSection.classList.contains('expanded')) {
        return;
    }
    startSheetDrag(e.touches[0].clientY);
}, { passive: true });

pullUpSection.addEventListener('touchmove', (e) => {
    moveSheetDrag(e.touches[0].clientY);
}, { passive: true });

pullUpSection.addEventListener('touchend', endSheetDrag);

pullUpHandle.addEventListener('mousedown', (e) => {
    startSheetDrag(e.clientY);
});

window.addEventListener('mousemove', (e) => {
    moveSheetDrag(e.clientY);
});

window.addEventListener('mouseup', endSheetDrag);

pullUpHandle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleSheet();
    }
});

document.querySelectorAll('.hazard-type-pill').forEach((pill) => {
    pill.addEventListener('click', () => setSelectedReportType(pill.dataset.type));
});

pullUpHandle.addEventListener('click', toggleSheet);
pullUpSectionTitle.addEventListener('click', toggleSheet);
searchInput.addEventListener('input', filterHazards);
hazardLocationInput.addEventListener('input', handleLocationInput);
hazardReportForm.addEventListener('submit', handleHazardSubmit);

setDefaultImages();
updateCategoryCards();
renderHazardMarkers();
filterHazards();
