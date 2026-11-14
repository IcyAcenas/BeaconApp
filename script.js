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

const pullUpSection = document.getElementById('PullUpSection');
const pullUpHandle = document.getElementById('PullUpHandle');
const pullUpSectionTitle = document.getElementById('PullUpSectionTitle');
const warningTitle = document.getElementById('warningtitle');
const warningText = document.getElementById('warningtext');
const searchInput = document.querySelector('.searchbar input');
const reportModal = document.getElementById('reportModal');
const hazardReportForm = document.getElementById('hazardReportForm');

const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyCR8BE6AqdhvwtwiCjymPFpJTIhqjgH_Xo',
    authDomain: 'beaconapp-91c14.firebaseapp.com',
    projectId: 'beaconapp-91c14',
    storageBucket: 'beaconapp-91c14.firebasestorage.app',
    messagingSenderId: '31295353440',
    appId: '1:31295353440:web:112da096e26fd837684905',
    measurementId: 'G-E11EM4J0W7'
};
let authMode = 'login';
let currentUser = null;
let firebase = null;

async function initializeFirebase() {
    const message = document.getElementById('authMessage');
    try {
        const version = '13.3.0';
        const [appSdk, authSdk, dbSdk] = await Promise.all([
            import(`https://www.gstatic.com/firebasejs/${version}/firebase-app.js`),
            import(`https://www.gstatic.com/firebasejs/${version}/firebase-auth.js`),
            import(`https://www.gstatic.com/firebasejs/${version}/firebase-firestore.js`)
        ]);
        const app = appSdk.initializeApp(FIREBASE_CONFIG);
        const auth = authSdk.getAuth(app);
        const db = dbSdk.getFirestore(app);
        firebase = { authSdk, dbSdk, auth, db, provider: new authSdk.GoogleAuthProvider() };
        authSdk.onAuthStateChanged(auth, async (user) => {
            if (!user) return;
            try {
                const profile = await saveFirebaseProfile(user, document.querySelector('input[name="role"]:checked').value);
                enterApp(profile);
            } catch (error) {
                document.getElementById('authGate').hidden = false;
                message.textContent = `Signed in, but couldn't load your Firestore profile: ${error.message}`;
            }
        });
    } catch (error) {
        console.error('Firebase initialization failed:', error);
        message.textContent = 'Firebase could not initialize. Check your internet connection and open Beacon from a local web server.';
    }
}

initializeFirebase();

async function saveFirebaseProfile(user, selectedRole, name = '') {
    const { db, dbSdk } = firebase;
    const profileRef = dbSdk.doc(db, 'users', user.uid);
    const existing = await dbSdk.getDoc(profileRef);
    const oldProfile = existing.exists() ? existing.data() : {};
    const profile = {
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || name || oldProfile.name || '',
        photoURL: user.photoURL || oldProfile.photoURL || '',
        role: oldProfile.role || selectedRole,
        updatedAt: dbSdk.serverTimestamp()
    };
    if (!existing.exists()) profile.createdAt = dbSdk.serverTimestamp();
    await dbSdk.setDoc(profileRef, profile, { merge: true });
    return { ...profile, createdAt: oldProfile.createdAt || profile.createdAt };
}

function setAuthMode(mode) {
    authMode = mode;
    document.querySelectorAll('.auth-tab').forEach((tab) => {
        const active = tab.dataset.mode === mode;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
    });
    document.getElementById('nameField').hidden = mode !== 'signup';
    document.getElementById('authName').required = mode === 'signup';
    document.getElementById('authPassword').autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
    document.getElementById('authSubmit').textContent = mode === 'signup' ? 'Create account' : 'Log in';
    document.getElementById('authTitle').textContent = mode === 'signup' ? 'Create your account' : 'Welcome to Beacon';
    document.getElementById('authMessage').textContent = '';
}

function enterApp(user) {
    currentUser = user;
    document.getElementById('authGate').hidden = true;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

document.querySelectorAll('.auth-tab').forEach((tab) => tab.addEventListener('click', () => setAuthMode(tab.dataset.mode)));
document.getElementById('authForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = document.getElementById('authMessage');
    const email = document.getElementById('authEmail').value.trim().toLowerCase();
    const password = document.getElementById('authPassword').value;
    try {
        if (!firebase) throw new Error('Firebase is still loading. Try again in a moment.');
        const { authSdk, auth } = firebase;
        let credential;
        const role = document.querySelector('input[name="role"]:checked').value;
        if (authMode === 'signup') {
            credential = await authSdk.createUserWithEmailAndPassword(auth, email, password);
            const name = document.getElementById('authName').value.trim();
            await authSdk.updateProfile(credential.user, { displayName: name });
            enterApp(await saveFirebaseProfile(credential.user, role, name));
        } else {
            credential = await authSdk.signInWithEmailAndPassword(auth, email, password);
            enterApp(await saveFirebaseProfile(credential.user, role));
        }
        message.textContent = '';
    } catch (error) { message.textContent = friendlyFirebaseError(error); }
});

document.getElementById('googleSignIn').addEventListener('click', async () => {
    const message = document.getElementById('authMessage');
    try {
        if (!firebase) throw new Error('Firebase is still loading. Try again in a moment.');
        message.textContent = 'Signing in with Google…';
        const result = await firebase.authSdk.signInWithPopup(firebase.auth, firebase.provider);
        enterApp(await saveFirebaseProfile(result.user, document.querySelector('input[name="role"]:checked').value));
        message.textContent = '';
    } catch (error) { message.textContent = friendlyFirebaseError(error); }
});

function friendlyFirebaseError(error) {
    const messages = {
        'auth/invalid-credential': 'Email or password is incorrect.',
        'auth/email-already-in-use': 'This email already has an account. Log in instead.',
        'auth/weak-password': 'Choose a password with at least 6 characters.',
        'auth/operation-not-allowed': 'Enable this sign-in method in Firebase Authentication settings.',
        'auth/unauthorized-domain': 'Add this app domain to Firebase Authentication authorized domains.',
        'auth/popup-closed-by-user': 'Google sign-in was closed before it finished.'
    };
    return messages[error.code] || error.message || 'Firebase sign-in failed.';
}

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

const locationOffsets = {
    'barangay 8': [8.4853, 124.6497],
    'masterson avenue': [8.4855, 124.6524],
    'mile 3': [8.4820, 124.6475],
    'cagayan de oro': [8.4859, 124.6491],
    'cdo': [8.4859, 124.6491],
    'default': [8.485983, 124.649128]
};

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
const hazardMarkers = {};
const hazardReports = [];
let hazardReportCounter = 0;
window.hazardReports = hazardReports;
window.hazardData = hazardData;

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
    const profileIcon = document.querySelector('.profile-button img');

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
    Object.values(hazardMarkers).forEach((marker) => marker.remove());
    Object.keys(hazardMarkers).forEach((key) => delete hazardMarkers[key]);

    const hazardIcons = {
        flashfloods: '🔵',
        accidents: '🔴',
        fires: '🟠',
        landslides: '🟢'
    };

    const allHazards = [
        ...Object.entries(hazardData).map(([key, details]) => ({ key, ...details })),
        ...hazardReports.map((report) => ({
            key: report.hazardKey,
            label: report.label,
            title: report.title,
            position: report.position,
            color: report.color,
            reportId: report.id
        }))
    ];

    allHazards.forEach((details) => {
        const key = details.reportId ? `${details.key}-${details.reportId}` : details.key;
        const marker = L.marker(details.position, {
            icon: L.divIcon({
                className: 'hazard-map-pin',
                html: `<div style="background:${details.color};color:#fff;display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,0.9);box-shadow:0 4px 10px rgba(0,0,0,0.3);font-size:12px;">${hazardIcons[details.key]}</div>`,
                iconSize: [26, 26],
                iconAnchor: [13, 13]
            })
        }).addTo(map);

        marker.bindPopup(`<strong>${details.key.toUpperCase()}</strong><br>${details.label}`);
        marker.on('click', () => selectHazard(details.key, details.reportId));
        hazardMarkers[key] = marker;
    });
}

function selectHazard(hazardKey, reportId) {
    const cards = document.querySelectorAll('.hazardcard');

    cards.forEach((card) => {
        const match = card.dataset.hazard === hazardKey && (
            !reportId || card.dataset.reportId === String(reportId)
        );
        card.classList.toggle('selected', match);
    });

    const hazard = hazardReports.find((entry) => entry.id === reportId) || hazardData[hazardKey];

    if (hazard) {
        warningText.textContent = hazard.label;
        warningTitle.textContent = hazard.title;

        const { position } = hazard;
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
                    <div class="profile-avatar">${escapeHtml((currentUser?.name || currentUser?.email || 'B').slice(0, 1).toUpperCase())}</div>
                    <div>
                        <h3>${escapeHtml(currentUser?.name || currentUser?.email || 'Beacon member')}</h3>
                        <p>${currentUser?.role === 'responder' ? 'Responder' : 'Driver'}</p>
                    </div>
                </div>
                <div class="profile-actions">
                    <button>Saved Alerts</button>
                    <button>Response History</button>
                    <button>Settings</button>
                    <button type="button" onclick="openAdminDashboard()">Admin Dashboard</button>
                    <button type="button" onclick="signOutBeacon()">Log out</button>
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

async function signOutBeacon() {
    try {
        if (firebase) await firebase.authSdk.signOut(firebase.auth);
        currentUser = null;
        closeProfile();
        document.getElementById('authGate').hidden = false;
        document.getElementById('authForm').reset();
        setAuthMode('login');
    } catch (error) {
        document.getElementById('authMessage').textContent = friendlyFirebaseError(error);
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
                    <button class="filter-chip" data-filter="high">High Priority</button>
                    <button class="filter-chip" data-filter="moderate">Moderate</button>
                    <button class="filter-chip" data-filter="low">Low</button>
                    <button class="filter-chip" data-filter="resolved">Resolved</button>
                </div>

                <div class="admin-incident-list">
                    <div class="admin-incident-item" data-priority="high">
                        <div class="incident-main">
                            <span class="incident-badge red">High</span>
                            <div>
                                <h4>Road Accident</h4>
                                <p>Masterson Avenue · 5 minutes ago</p>
                            </div>
                        </div>
                        <button class="resolve-btn" type="button">Mark as Resolved</button>
                    </div>

                    <div class="admin-incident-item" data-priority="moderate">
                        <div class="incident-main">
                            <span class="incident-badge orange">Moderate</span>
                            <div>
                                <h4>Fire Emergency</h4>
                                <p>Barangay 8 · 12 minutes ago</p>
                            </div>
                        </div>
                        <button class="resolve-btn" type="button">Mark as Resolved</button>
                    </div>

                    <div class="admin-incident-item" data-priority="low">
                        <div class="incident-main">
                            <span class="incident-badge blue">Low</span>
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
                if (report) report.status = 'resolved';

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

    const intensity = report.intensity || 'moderate';
    const intensityLabel = intensity.charAt(0).toUpperCase() + intensity.slice(1);
    const badgeClass = intensity === 'high' ? 'red' : intensity === 'moderate' ? 'orange' : 'blue';
    const incidentTitle = {
        flashfloods: 'Flash Flood',
        accidents: 'Road Accident',
        fires: 'Fire Emergency',
        landslides: 'Landslide'
    }[report.hazardKey];
    const item = document.createElement('div');
    item.className = 'admin-incident-item';
    item.dataset.priority = report.status === 'resolved' ? 'resolved' : intensity;
    item.dataset.reportId = String(report.id);

    const main = document.createElement('div');
    main.className = 'incident-main';
    const badge = document.createElement('span');
    badge.className = `incident-badge ${report.status === 'resolved' ? 'green' : badgeClass}`;
    badge.textContent = report.status === 'resolved' ? 'Resolved' : intensityLabel;
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

function openReportForm() {
    if (reportModal) {
        reportModal.classList.add('active');
    }
}

function closeReportForm() {
    if (reportModal) {
        reportModal.classList.remove('active');
    }

    if (hazardReportForm) {
        hazardReportForm.reset();
    }
}

async function getReportedPosition(hazardKey, hazardLocation) {
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

    if (!locationText) {
        return null;
    }

    const directCoordinateMatch = locationText.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
    if (directCoordinateMatch) {
        const position = [parseFloat(directCoordinateMatch[1]), parseFloat(directCoordinateMatch[2])];
        if (!isInsideCagayanDeOroBounds(position)) return null;

        try {
            const [latitude, longitude] = position;
            const reverseUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&country=ph&types=place&limit=1`;
            const response = await fetch(reverseUrl);
            const data = await response.json();
            return data.features?.some(isCagayanDeOroFeature) ? position : null;
        } catch (error) {
            console.warn('Coordinate validation failed:', error);
            return null;
        }
    }

    const manualLocationChecks = [
        ['barangay 8', [8.4853, 124.6497]],
        ['masterson avenue', [8.4855, 124.6524]],
        ['mile 3', [8.4820, 124.6475]],
        ['cagayan de oro', [8.4859, 124.6491]],
        ['cdo', [8.4859, 124.6491]]
    ];

    const manualMatch = manualLocationChecks.find(([key]) => locationText === key || locationText.startsWith(`${key},`));
    if (manualMatch) {
        const extraLocationParts = locationText.slice(manualMatch[0].length).replace(/^,\s*/, '').split(',').map((part) => part.trim()).filter(Boolean);
        const allowedSuffixes = ['cagayan de oro', 'cagayan de oro city', 'cdo', 'philippines'];
        if (extraLocationParts.every((part) => allowedSuffixes.includes(part))) {
            geocodedLocationCache.set(locationText, manualMatch[1]);
            return manualMatch[1];
        }
        return null;
    }

    if (geocodedLocationCache.has(locationText)) {
        return geocodedLocationCache.get(locationText);
    }

    try {
        const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(rawLocation)}.json?access_token=${MAPBOX_TOKEN}&country=ph&bbox=124.4,8.2,125.0,8.7&proximity=124.6491,8.4859&limit=5`;
        const response = await fetch(geocodeUrl);
        if (!response.ok) {
            throw new Error('Geocoding request failed');
        }

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

function addReportedHazardCard(hazardKey, label, position, reportId) {
    const container = document.getElementById('PullUpSectionContent');
    if (!container) return;

    const card = document.createElement('div');
    card.className = 'hazardcard';
    card.dataset.hazard = hazardKey;
    card.dataset.reportId = String(reportId);
    card.onclick = () => selectHazard(hazardKey, reportId);

    const hazardTitle = hazardKey === 'flashfloods' ? 'FLASH FLOODS' :
        hazardKey === 'accidents' ? 'ACCIDENTS' :
        hazardKey === 'fires' ? 'FIRES' : 'LANDSLIDES';

    const hazardImage = hazardKey === 'flashfloods' ? 'https://images.unsplash.com/photo-1520916218334-4f0c6829d7d7?auto=format&fit=crop&w=900&q=80' :
        hazardKey === 'accidents' ? 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80' :
        hazardKey === 'fires' ? 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=900&q=80' :
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80';

    const reporterPhoto = hazardKey === 'flashfloods' ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' :
        hazardKey === 'accidents' ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80' :
        hazardKey === 'fires' ? 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80' :
        'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=200&q=80';

    card.innerHTML = `
        <div class="hazardimagewhole">
            <img src="${hazardImage}" alt="${hazardTitle}" class="hazardimage"/>
            <div class="reporterinfo">
                <img src="${reporterPhoto}" alt="Reporter" class="userimagecard"/>
                <div class="reporternameandtime">
                    <span class="reportername">You</span>
                    <span class="reporttime">Just now</span>
                </div>
            </div>
        </div>

        <div class="hazardclassdetails">
            <svg class="hazard-pin pin-${hazardKey === 'flashfloods' ? 'blue' : hazardKey === 'accidents' ? 'red' : hazardKey === 'fires' ? 'orange' : 'brown'}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <div class="hazardtextdetails">
                <span class="hazardtitlecard">${hazardTitle}</span>
                <div class="hazardstatus">
                    <span class="status-dot dot-red"></span>
                    <span class="hazarddescriptioncard">${label}</span>
                </div>
            </div>
        </div>
    `;

    container.prepend(card);
}

async function handleHazardSubmit(event) {
    event.preventDefault();

    const hazardType = document.getElementById('hazardType').value;
    const hazardIntensity = document.getElementById('hazardIntensity').value;
    const hazardLocation = document.getElementById('hazardLocation').value.trim();
    const hazardDetails = document.getElementById('hazardDetails').value.trim();

    if (!hazardType || !hazardIntensity || !hazardLocation) {
        window.alert('Please choose a hazard type, intensity, and location.');
        return;
    }

    const hazardKey = hazardType;
    const position = await getReportedPosition(hazardKey, hazardLocation);
    if (!position) {
        window.alert('Please enter a location within Cagayan de Oro City.');
        return;
    }

    const label = `${hazardType === 'flashfloods' ? 'Flash flood' : hazardType === 'accidents' ? 'Road accident' : hazardType === 'fires' ? 'Fire emergency' : 'Landslide'} reported near ${hazardLocation}${hazardDetails ? ' — ' + hazardDetails : ''}`;

    hazardReportCounter += 1;
    const reportId = hazardReportCounter;

    hazardReports.push({
        id: reportId,
        hazardKey,
        label,
        title: 'WARNING!',
        position,
        color: hazardData[hazardKey].color,
        intensity: hazardIntensity,
        location: hazardLocation,
        status: 'active'
    });

    addReportedHazardCard(hazardKey, label, position, reportId);
    addAdminIncident(hazardReports[hazardReports.length - 1]);
    const adminPanel = document.getElementById('adminDashboardPanel');
    if (adminPanel) {
        const activeFilter = adminPanel.querySelector('.filter-chip.active')?.dataset.filter || 'all';
        filterAdminIncidents(adminPanel, activeFilter);
    }
    renderHazardMarkers();
    selectHazard(hazardKey, reportId);
    closeReportForm();
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
hazardReportForm.addEventListener('submit', handleHazardSubmit);

setDefaultImages();
renderHazardMarkers();
selectHazard('flashfloods');
filterHazards();
