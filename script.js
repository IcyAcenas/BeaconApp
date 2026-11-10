const map = L.map('map').setView([8.485983, 124.649128], 13);

const MAPBOX_TOKEN = 'pk.eyJ1IjoiaWNlejc3NzciLCJhIjoiY213MjdjdmF2MDBhcjMwb241Y2Vsbng0byJ9.6bH3-ZjfMblsBG0dnsCv-w';

const styleId = 'mapbox/dark-v11';

L.tileLayer(`https://api.mapbox.com/styles/v1/${styleId}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`, {
    tileSize: 512,
    zoomOffset: -1,
    maxZoom: 19,
    attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const pullUpSection = document.getElementById('PullUpSection');
const pullUpHandle = document.getElementById('PullUpHandle');
const pullUpSectionTitle = document.getElementById('PullUpSectionTitle');
const warningTitle = document.getElementById('warningtitle');
const warningText = document.getElementById('warningtext');
const searchInput = document.querySelector('.searchbar input');

const hazardData = {
    flashfloods: {
        label: 'Flash Flood reported within 300 meters',
        title: 'WARNING!',
        position: [8.4867, 124.6491],
        color: '#1E88E5'
    },
    accidents: {
        label: 'Road accident reported nearby',
        title: 'WARNING!',
        position: [8.4824, 124.6458],
        color: '#E53935'
    },
    fires: {
        label: 'Fire emergency reported nearby',
        title: 'WARNING!',
        position: [8.4895, 124.6549],
        color: '#FB8C00'
    },
    landslides: {
        label: 'Landslide cleared and monitored',
        title: 'STATUS',
        position: [8.4802, 124.6417],
        color: '#4CAF50'
    }
};

let startY = 0;
let currentY = 0;
let isDragging = false;

function toggleSheet() {
    pullUpSection.classList.toggle('expanded');
}

function clearSearch() {
    searchInput.value = '';
    searchInput.focus();
    filterHazards();
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
        ['#floodlatest', 'https://images.unsplash.com/photo-1520916218334-4f0c6829d7d7?auto=format&fit=crop&w=900&q=80'],
        ['#accidentlatest', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80'],
        ['#firelatest', 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=900&q=80'],
        ['#landslidelatest', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80'],
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

function renderHazardMarkers() {
    const hazardIcons = {
        flashfloods: '🔵',
        accidents: '🔴',
        fires: '🟠',
        landslides: '🟢'
    };

    Object.entries(hazardData).forEach(([key, details]) => {
        const marker = L.marker(details.position, {
            icon: L.divIcon({
                className: 'hazard-map-pin',
                html: `<div style="background:${details.color};color:#fff;display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,0.9);box-shadow:0 4px 10px rgba(0,0,0,0.3);font-size:12px;">${hazardIcons[key]}</div>`,
                iconSize: [26, 26],
                iconAnchor: [13, 13]
            })
        }).addTo(map);

        marker.bindPopup(`<strong>${key.toUpperCase()}</strong><br>${details.label}`);
        marker.on('click', () => selectHazard(key));
    });
}

function selectHazard(hazardKey) {
    const cards = document.querySelectorAll('.hazardcard');

    cards.forEach((card) => {
        card.classList.toggle('selected', card.dataset.hazard === hazardKey);
    });

    if (hazardData[hazardKey]) {
        warningText.textContent = hazardData[hazardKey].label;
        warningTitle.textContent = hazardData[hazardKey].title;

        const { position } = hazardData[hazardKey];
        map.flyTo(position, 15, { duration: 1.2 });
    }
}

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
                </div>
            </div>
        `;
        document.body.appendChild(panel);
    }

    panel.classList.add('active');
}

function closeProfile() {
    const panel = document.getElementById('profilePanel');
    if (panel) panel.classList.remove('active');
}

function handleTouchStart(e) {
    if (e.target.closest('#PullUpSectionContent') && !pullUpSection.classList.contains('expanded')) {
        return;
    }

    startY = e.touches[0].clientY;
    currentY = startY;
    isDragging = true;
}

function handleTouchMove(e) {
    if (!isDragging) return;
    currentY = e.touches[0].clientY;
}

function handleTouchEnd() {
    if (!isDragging) return;

    const deltaY = currentY - startY;

    if (deltaY < -50) {
        pullUpSection.classList.add('expanded');
    } else if (deltaY > 50) {
        pullUpSection.classList.remove('expanded');
    }

    isDragging = false;
}

pullUpHandle.addEventListener('click', toggleSheet);
pullUpSectionTitle.addEventListener('click', toggleSheet);
searchInput.addEventListener('input', filterHazards);
pullUpSection.addEventListener('touchstart', handleTouchStart, { passive: true });
pullUpSection.addEventListener('touchmove', handleTouchMove, { passive: true });
pullUpSection.addEventListener('touchend', handleTouchEnd);

setDefaultImages();
renderHazardMarkers();
selectHazard('flashfloods');
filterHazards();