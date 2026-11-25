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
const warningBanner = document.getElementById('warning');
const warningTitle = document.getElementById('warningtitle');
const warningText = document.getElementById('warningtext');
const searchInput = document.getElementById('mainSearchInput') || document.querySelector('.searchbar input');
const topSearchSuggestions = document.getElementById('topSearchSuggestions');
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

// Category Feed Sheet DOM elements
const categoryFeedSheet = document.getElementById('categoryFeedSheet');
const categoryFeedHandle = document.getElementById('categoryFeedHandle');
const categoryFeedTitle = document.getElementById('categoryFeedTitle');
const categoryFeedList = document.getElementById('categoryFeedList');

// Routing DOM elements
const routePanel = document.getElementById('routePanel');
const routeOriginInput = document.getElementById('routeOriginInput');
const routeDestInput = document.getElementById('routeDestInput');
const routeOriginSuggestions = document.getElementById('routeOriginSuggestions');
const routeDestSuggestions = document.getElementById('routeDestSuggestions');
const routePickHint = document.getElementById('routePickHint');
const routeStatusBox = document.getElementById('routeStatusBox');
const routeStatusBadge = document.getElementById('routeStatusBadge');
const routeMetrics = document.getElementById('routeMetrics');
const routeStatusMessage = document.getElementById('routeStatusMessage');
const routeNextStep = document.getElementById('routeNextStep');

const BACK_ARROW_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M19 12H5"/>
        <path d="M12 19l-7-7 7-7"/>
    </svg>
`;

const DEFAULT_PROFILE_ICON_URI = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" fill="#12261E"/>
        <path d="M4 19c1.5-3 5-4.5 8-4.5s6.5 1.5 8 4.5" fill="none" stroke="#12261E" stroke-width="2.4" stroke-linecap="round"/>
    </svg>
`);

const userProfile = {
   uid: '',
    name: '',
    role: 'regular',
    email: '',
    area: 'Cagayan de Oro City',
    avatarUrl: '',
    signedIn: false
};

const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyCR8BE6AqdhvwtwiCjymPFpJTIhqjgH_Xo',
    authDomain: 'beaconapp-91c14.firebaseapp.com',
    projectId: 'beaconapp-91c14',
    storageBucket: 'beaconapp-91c14.firebasestorage.app',
    messagingSenderId: '31295353440',
    appId: '1:31295353440:web:112da096e26fd837684905',
    measurementId: 'G-E11EM4J0W7'
};

let firebaseClient = null;
let firebaseUser = null;
const AUTH_CACHE_PREFIX = 'beacon.account.';

function accountCacheKey(section) {
    return `${AUTH_CACHE_PREFIX}${firebaseUser?.uid || userProfile.uid || 'guest'}.${section}`;
}

function saveLocalAppData() {
    if (!firebaseUser) return;
    try {
        localStorage.setItem(accountCacheKey('profile'), JSON.stringify({
            name: userProfile.name, role: userProfile.role, email: userProfile.email,
            area: userProfile.area, avatarUrl: userProfile.avatarUrl
        }));
        localStorage.setItem(accountCacheKey('reports'), JSON.stringify(hazardReports));
        localStorage.setItem(accountCacheKey('defaultStatuses'), JSON.stringify(
            Object.fromEntries(defaultHazards.map((hazard) => [hazard.id, { status: hazard.status, resolvedAt: hazard.resolvedAt || '' }]))
        ));
        localStorage.setItem(accountCacheKey('history'), JSON.stringify(resolvedHistory));
    } catch (error) {
        console.warn('Could not save all Beacon data in this browser:', error);
    }
}

function persistProfileToCloud() {
    saveLocalAppData();
    if (!firebaseClient || !firebaseUser) return Promise.resolve();
    return (async () => {
        let avatarUrl = userProfile.avatarUrl;
        if (avatarUrl.startsWith('data:')) {
            const avatarRef = firebaseClient.storageSdk.ref(firebaseClient.storage, `profilePhotos/${firebaseUser.uid}/avatar`);
            const uploaded = await firebaseClient.storageSdk.uploadString(avatarRef, avatarUrl, 'data_url');
            avatarUrl = await firebaseClient.storageSdk.getDownloadURL(uploaded.ref);
            userProfile.avatarUrl = avatarUrl;
        }
        const profile = {
            uid: firebaseUser.uid, name: userProfile.name, role: userProfile.role,
            email: userProfile.email, area: userProfile.area, photoURL: avatarUrl,
            updatedAt: firebaseClient.dbSdk.serverTimestamp()
        };
        await firebaseClient.dbSdk.setDoc(firebaseClient.dbSdk.doc(firebaseClient.db, 'users', firebaseUser.uid), profile, { merge: true });
    })().catch((error) => console.error('Could not sync Beacon profile:', error));
}

async function signInWithGoogle() {
    const button = document.getElementById('googleSignIn');
    const message = document.getElementById('authMessage');
    try {
        if (!firebaseClient) throw new Error('Firebase is still connecting. Please try again.');
        if (button) button.disabled = true;
        if (message) { message.classList.remove('error'); message.textContent = 'Opening Google sign-in…'; }
        await firebaseClient.authSdk.signInWithPopup(firebaseClient.auth, firebaseClient.provider);
    } catch (error) {
        if (button) button.disabled = false;
        if (message) {
            message.classList.add('error');
            message.textContent = error.code === 'auth/unauthorized-domain'
                ? 'Add this app domain to Firebase Authentication authorized domains.'
                : error.code === 'auth/popup-closed-by-user'
                    ? 'Google sign-in was closed before it finished.'
                    : error.message || 'Google sign-in failed.';
        }
    }
}

async function initializeFirebase() {
    const message = document.getElementById('authMessage');
    try {
        const version = '13.3.0';
        const [appSdk, authSdk, dbSdk, storageSdk] = await Promise.all([
            import(`https://www.gstatic.com/firebasejs/${version}/firebase-app.js`),
            import(`https://www.gstatic.com/firebasejs/${version}/firebase-auth.js`),
            import(`https://www.gstatic.com/firebasejs/${version}/firebase-firestore.js`),
            import(`https://www.gstatic.com/firebasejs/${version}/firebase-storage.js`)
        ]);
        const app = appSdk.initializeApp(FIREBASE_CONFIG);
        const auth = authSdk.getAuth(app);
        const db = dbSdk.getFirestore(app);
        const storage = storageSdk.getStorage(app);
        firebaseClient = { authSdk, dbSdk, storageSdk, auth, db, storage, provider: new authSdk.GoogleAuthProvider() };
        authSdk.onAuthStateChanged(auth, async (user) => {
            firebaseUser = user;
            if (!user) {
                userProfile.signedIn = false;
                userProfile.uid = '';
                document.getElementById('authGate').hidden = false;
                if (message) { message.classList.remove('error'); message.textContent = 'Sign in to continue.'; }
                updateTopBarProfileIcon();
                return;
            }
              userProfile.uid = user.uid;
            userProfile.signedIn = true;
            userProfile.name = user.displayName || user.email || 'Beacon member';
            userProfile.email = user.email || '';
            userProfile.avatarUrl = user.photoURL || '';
            document.getElementById('authGate').hidden = true;
            try {
                const cachedProfile = JSON.parse(localStorage.getItem(accountCacheKey('profile')) || 'null');
                if (cachedProfile) Object.assign(userProfile, cachedProfile);
                const profileRef = dbSdk.doc(db, 'users', user.uid);
                const profileSnapshot = await dbSdk.getDoc(profileRef);
                if (profileSnapshot.exists()) {
                    const profile = profileSnapshot.data();
                    userProfile.name = profile.name || userProfile.name;
                    userProfile.role = profile.role || 'regular';
                    userProfile.email = profile.email || userProfile.email;
                    userProfile.area = profile.area || 'Cagayan de Oro City';
                    userProfile.avatarUrl = profile.photoURL || userProfile.avatarUrl;
                } else {
                    await persistProfileToCloud();
                }
                await loadAccountData();
            } catch (error) {
                console.warn('Firestore could not be reached; restoring this account from browser storage:', error);
                loadLocalAccountData();
            }
            saveLocalAppData();
            updateTopBarProfileIcon();
            updateCategoryCards();
            renderHazardMarkers();
            renderExpandedFeed();
            renderProfilePanel();
            if (message) message.textContent = '';
        });
    } catch (error) {
        console.error('Firebase initialization failed:', error);
        if (message) {
            message.classList.add('error');
            message.textContent = 'Firebase could not connect. Check the app setup and internet connection.';
        }
    }
}

function loadLocalAccountData() {
    try {
        const profile = JSON.parse(localStorage.getItem(accountCacheKey('profile')) || 'null');
        if (profile) Object.assign(userProfile, profile);
        const reports = JSON.parse(localStorage.getItem(accountCacheKey('reports')) || '[]');
        hazardReports.splice(0, hazardReports.length, ...(Array.isArray(reports) ? reports : []));
        const statuses = JSON.parse(localStorage.getItem(accountCacheKey('defaultStatuses')) || '{}');
        defaultHazards.forEach((hazard) => {
            if (statuses[hazard.id]) Object.assign(hazard, statuses[hazard.id]);
        });
        const history = JSON.parse(localStorage.getItem(accountCacheKey('history')) || '[]');
        resolvedHistory.splice(0, resolvedHistory.length, ...(Array.isArray(history) ? history : []));
    } catch (error) {
        console.warn('Could not restore local Beacon data:', error);
    }
}

async function loadAccountData() {
    try {
        const reports = JSON.parse(localStorage.getItem(accountCacheKey('reports')) || '[]');
        hazardReports.splice(0, hazardReports.length, ...(Array.isArray(reports) ? reports : []));
        const statuses = JSON.parse(localStorage.getItem(accountCacheKey('defaultStatuses')) || '{}');
        defaultHazards.forEach((hazard) => {
            if (statuses[hazard.id]) Object.assign(hazard, statuses[hazard.id]);
        });
          const history = JSON.parse(localStorage.getItem(accountCacheKey('history')) || '[]');
        resolvedHistory.splice(0, resolvedHistory.length, ...(Array.isArray(history) ? history : []));
    } catch (error) {
        console.warn('Could not restore local incident data:', error);
    }
    const { dbSdk, db } = firebaseClient;
    const snapshot = await dbSdk.getDocs(dbSdk.collection(db, 'hazardReports'));
    const byId = new Map(hazardReports.map((report) => [String(report.id), report]));
    const remoteReportIds = new Set();
    snapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (data.isDefaultHazard) {
            const sample = defaultHazards.find((hazard) => hazard.id === docSnapshot.id);
            if (sample && data.status) Object.assign(sample, { status: data.status, resolvedAt: data.resolvedAt || '' });
            return;
        }
        const report = { id: data.id || docSnapshot.id, ...data };
        byId.set(String(report.id), report);
        remoteReportIds.add(String(report.id));
    });
     hazardReports.splice(0, hazardReports.length, ...byId.values());
    const knownHistory = new Set(resolvedHistory.map((entry) => entry.id));
    [...defaultHazards, ...hazardReports].forEach((hazard) => {
        const id = hazard.id.startsWith('default-') ? hazard.id : `report-${hazard.id}`;
        if (hazard.status === 'resolved' && !knownHistory.has(id)) {
            const info = hazardData[hazard.hazardKey] || {};
            resolvedHistory.push({ id, title: info.incidentName || info.displayName || hazard.hazardKey,
                location: hazard.location || 'Cagayan de Oro City',
                resolvedAt: hazard.resolvedAt ? new Date(hazard.resolvedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Previously resolved' });
        }
    });
    saveLocalAppData();
    for (const report of hazardReports) {
        if (!remoteReportIds.has(String(report.id))) {
            try { await saveHazardReport(report); }
            catch (error) { console.warn(`Could not sync report ${report.id}; it remains in this device cache:`, error); }
        }
    }
    for (const hazard of defaultHazards) {
        if (hazard.status === 'resolved' && !snapshot.docs.some((item) => item.id === hazard.id)) {
            try { await saveHazardReport(hazard, true); }
            catch (error) { console.warn(`Could not sync sample status ${hazard.id}:`, error); }
        }
    }
}

async function saveHazardReport(report, isDefaultHazard = false) {
    saveLocalAppData();
    if (!firebaseClient || !firebaseUser) return;
    const dbSdk = firebaseClient.dbSdk;
    const recordId = String(report.id);
    const record = isDefaultHazard ? { isDefaultHazard: true, id: recordId, hazardKey: report.hazardKey,
        status: report.status, resolvedAt: report.resolvedAt || '', updatedAt: dbSdk.serverTimestamp() }
        : { ...report, id: recordId, reporterUid: report.reporterUid || firebaseUser.uid,
            updatedAt: dbSdk.serverTimestamp() };
    if (!isDefaultHazard && typeof report.photoUrl === 'string' && report.photoUrl.startsWith('data:')) {
        const photoRef = firebaseClient.storageSdk.ref(firebaseClient.storage, `hazardPhotos/${firebaseUser.uid}/${recordId}`);
        const uploaded = await firebaseClient.storageSdk.uploadString(photoRef, report.photoUrl, 'data_url');
        record.photoUrl = await firebaseClient.storageSdk.getDownloadURL(uploaded.ref);
        report.photoUrl = record.photoUrl;
    }
    await dbSdk.setDoc(dbSdk.doc(firebaseClient.db, 'hazardReports', recordId), record, { merge: true });
    saveLocalAppData();
}    

let isEditingSettings = false;

// ================= TOAST FEEDBACK =================
let toastTimer = null;

function showToast(message, type = 'success', duration = 4500) {
    let el = document.getElementById('appToast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'appToast';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        document.body.appendChild(el);
    }
    el.textContent = message;
    el.className = `app-toast ${type} visible`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('visible'), duration);
}

function setSaveButtonState(saving) {
    const btn = document.querySelector('.save-report-btn');
    if (!btn) return;
    btn.disabled = saving;
    btn.textContent = saving ? 'Saving report…' : 'Save';
}

// ================= DISMISSIBLE WARNING BANNER =================
// The banner can be closed with the X and stays closed until a *different* warning is shown.
let lastWarningKey = 'WARNING!|Flash Flood reported within 300 meters';

function showWarning(title, text) {
    warningTitle.textContent = title;
    warningText.textContent = text;
    const key = `${title}|${text}`;
    if (key !== lastWarningKey) {
        lastWarningKey = key;
        warningBanner.classList.remove('dismissed');
    }
}

function dismissWarning() {
    warningBanner.classList.add('dismissed');
}
window.dismissWarning = dismissWarning;
let activeFeedHazardKey = null;

const hazardData = {
    flashfloods: {
        displayName: 'Flash Floods',
        incidentName: 'Flash Flood',
        label: 'Flash Flood reported within 300 meters',
        title: 'WARNING!',
        position: [8.4867, 124.6491],
        color: '#1E88E5',
        badgeClass: 'blue',
        status: 'active'
    },
    accidents: {
        displayName: 'Accidents',
        incidentName: 'Road Accident',
        label: 'Road accident reported nearby',
        title: 'WARNING!',
        position: [8.4824, 124.6458],
        color: '#E53935',
        badgeClass: 'red',
        status: 'active'
    },
    fires: {
        displayName: 'Fires',
        incidentName: 'Fire Emergency',
        label: 'Fire emergency reported nearby',
        title: 'WARNING!',
        position: [8.4895, 124.6549],
        color: '#FB8C00',
        badgeClass: 'orange',
        status: 'active'
    },
    landslides: {
        displayName: 'Landslides',
        incidentName: 'Landslide',
        label: 'Landslide cleared and monitored',
        title: 'STATUS',
        position: [8.4802, 124.6417],
        color: '#4CAF50',
        badgeClass: 'green',
        status: 'resolved'
    }
};

const defaultHazards = [
    {
        id: 'default-flood-1',
        hazardKey: 'flashfloods',
        reporterName: 'Euan Mercado',
        reporterAvatar: 'images/profilephoto1.jpg',
        label: 'Flash Flood reported near Don Apolinar Velez St.',
        description: 'Ayaw mo agi diri. Taas kaayo ang tubig sa dalan, dili na maagian og gagmay nga sakyanan.',
        title: 'WARNING!',
        location: 'Near Don Apolinar Velez St.',
        timeAgo: '1 hour ago',
        position: [8.4867, 124.6491],
        color: '#1E88E5',
        photoUrl: 'images/flashflood1.jpeg',
        status: 'active'
    },
    {
        id: 'default-flood-2',
        hazardKey: 'flashfloods',
        reporterName: 'Leni Perez',
        reporterAvatar: 'images/profilephoto4.jpg',
        label: 'Flash flood overflow near Claro M. Recto Ave',
        description: 'Hastang taasa sa tubig. Likay mo diri',
        title: 'WARNING!',
        location: 'Near Claro M. Recto Ave',
        timeAgo: '2 hours ago',
        position: [8.4847, 124.6562],
        color: '#1E88E5',
        photoUrl: 'images/flashflood2.jpeg',
        status: 'active'
    },
    {
        id: 'default-accident-1',
        hazardKey: 'accidents',
        reporterName: 'Icy Acenas',
        reporterAvatar: 'images/profilephoto2.jpg',
        label: 'Road accident reported near Masterson Avenue',
        description: 'Two-vehicle collision blocking the outer southbound lane. Traffic moving slowly.',
        title: 'WARNING!',
        location: 'Near Masterson Avenue',
        timeAgo: '12 minutes ago',
        position: [8.4824, 124.6458],
        color: '#E53935',
        photoUrl: 'images/accident1.jpeg',
        status: 'active'
    },
    {
        id: 'default-fire-1',
        hazardKey: 'fires',
        reporterName: 'Mitchie Bagaporo',
        reporterAvatar: 'images/profilephoto3.jpg',
        label: 'Fire emergency reported near Barangay 8',
        description: 'Fire trucks are on scene. Keep roads clear for emergency responders.',
        title: 'WARNING!',
        location: 'Near Barangay 8',
        timeAgo: '30 minutes ago',
        position: [8.4895, 124.6549],
        color: '#FB8C00',
        photoUrl: 'images/fire1.jpeg',
        status: 'active'
    },
    {
        id: 'default-landslide-1',
        hazardKey: 'landslides',
        reporterName: 'Francis King Uyguangco',
        reporterAvatar: 'images/profilephoto4.jpg',
        label: 'Landslide cleared and monitored in Camaman-an',
        description: 'Debris has been cleared by city engineering. Road is now passable.',
        title: 'STATUS',
        location: 'Camaman-an, CDO',
        timeAgo: '2 hours ago',
        position: [8.4802, 124.6417],
        color: '#4CAF50',
        photoUrl: 'images/landslide1.jpeg',
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
        defaultImage: 'images/flood1.jpg',
        defaultReporter: 'Euan Mercado',
        defaultTime: '1 hour ago'
    },
    accidents: {
        imageId: 'accidentlatest',
        statusId: 'accidentstatus',
        descId: 'accidentdescriptioncard',
        reporterId: 'accidentreportername',
        timeId: 'accidentreporttime',
        defaultImage: 'images/accident1.jpg',
        defaultReporter: 'Icy Acenas',
        defaultTime: '12 minutes ago'
    },
    fires: {
        imageId: 'firelatest',
        statusId: 'firestatus',
        descId: 'firedescriptioncard',
        reporterId: 'firereportername',
        timeId: 'firereporttime',
        defaultImage: 'images/fire1.jpg',
        defaultReporter: 'Mitchie Bagaporo',
        defaultTime: '30 minutes ago'
    },
    landslides: {
        imageId: 'landslidelatest',
        statusId: 'landslidestatus',
        descId: 'landslidedescriptioncard',
        reporterId: 'landslidereportername',
        timeId: 'landslidereporttime',
        defaultImage: 'images/landslide1.jpg',
        defaultReporter: 'Francis King Uyguangco',
        defaultTime: '2 hours ago'
    }
};

const cdoLocalPlaces = [
    // Landmarks people know by brand / nickname instead of street address.
    // Coordinates are approximate; map and online results refine them.
    { name: 'Xavier University – Ateneo de Cagayan, Corrales Avenue, Cagayan de Oro City', sub: 'Corrales Avenue, Cagayan de Oro', position: [8.4857, 124.6564],
      aliases: ['ateneo de cagayan', 'ateneo', 'xavier university', 'xavier u', 'ateneo de cagayan xavier university'] },
    { name: 'Don Apolinar Velez St., Cagayan de Oro City', sub: 'City Proper, Cagayan de Oro', position: [8.4867, 124.6491] },
    { name: 'Claro M. Recto Avenue, Cagayan de Oro City', sub: 'Lapasan / Poblacion, CDO', position: [8.4847, 124.6562] },
    { name: 'Corrales Avenue, Cagayan de Oro City', sub: 'City Proper, Cagayan de Oro', position: [8.4812, 124.6488] },
    { name: 'Barangay 8, Cagayan de Oro City', sub: 'Poblacion, Cagayan de Oro', position: [8.4853, 124.6497] },
    { name: 'Masterson Avenue, Cagayan de Oro City', sub: 'Upper Carmen / Uptown CDO', position: [8.4855, 124.6524] },
    { name: 'Carmen, Cagayan de Oro City', sub: 'West Poblacion, Cagayan de Oro', position: [8.4820, 124.6410] },
    { name: 'Consolacion, Cagayan de Oro City', sub: 'North Poblacion, Cagayan de Oro', position: [8.4895, 124.6475] },
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
let feedDragStartY = 0;
let feedDragCurrentY = 0;
let isFeedDragging = false;
let selectedHazardFilter = null;
let capturedPhotoDataUrl = '';
let activeCameraStream = null;
let selectedPinPosition = null;
let draftPinMarker = null;
let suggestionDebounceTimer = null;

// Routing state
const routeLayerGroup = L.layerGroup().addTo(map);
const routeState = {
    profile: 'driving',
    originCoords: null,
    destCoords: null,
    pickMode: null,
    hasActiveRoute: false
};
let routeSuggestTimer = null;
let topSearchTimer = null;

const hazardMarkers = {};
const hazardReports = [];
const resolvedHistory = [];
let hazardReportCounter = 0;
window.hazardReports = hazardReports;
window.hazardData = hazardData;

// Hazards that stop travel. Fires, floods and landslides block EVERY mode
// (walking, biking, driving). Accidents are only passable on foot.
const HAZARD_BLOCK_RADIUS_METERS = { fires: 200, flashfloods: 150, landslides: 150, accidents: 90 };
const ROUTE_MODE_LABELS = { driving: 'driving', walking: 'walking', cycling: 'biking' };

function hazardBlocksProfile(hazard, profile = routeState.profile) {
    if (hazard.hazardKey === 'accidents') return profile !== 'walking';
    return true;
}

function getHazardAvoidRadiusMeters(hazard) {
    return HAZARD_BLOCK_RADIUS_METERS[hazard.hazardKey] || 150;
}

function getRoleLabel(role) {
    return role === 'responder' ? 'Emergency Responder' : 'Regular User';
}

function getUserInitial() {
    return (userProfile.name || 'U').trim().charAt(0).toUpperCase() || 'U';
}

function getUserAvatarDataUri() {
    if (userProfile.avatarUrl) return userProfile.avatarUrl;
    const initial = getUserInitial();
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
            <rect width="96" height="96" rx="48" fill="#12261E"/>
            <text x="48" y="60" text-anchor="middle" font-size="40" font-family="Arial, sans-serif" font-weight="700" fill="#F6F3E9">${initial}</text>
        </svg>
    `);
}

function renderAvatarMarkup(extraClass = '') {
    if (userProfile.avatarUrl) {
        return `<img src="${userProfile.avatarUrl}" alt="${userProfile.name}" class="avatar-photo ${extraClass}"/>`;
    }
    return `<span>${getUserInitial()}</span>`;
}

function updateTopBarProfileIcon() {
    const profileIcon = document.querySelector('.profile-button img');
    if (!profileIcon) return;

    if (userProfile.signedIn && userProfile.avatarUrl) {
        profileIcon.src = userProfile.avatarUrl;
        profileIcon.style.objectFit = 'cover';
    } else {
        profileIcon.src = DEFAULT_PROFILE_ICON_URI;
        profileIcon.style.objectFit = '';
    }
}

function getAllHazards() {
    return [
        ...hazardReports.slice().reverse().map((report) => ({
            id: `report-${report.id}`,
            hazardKey: report.hazardKey,
            reporterName: report.reporterName || userProfile.name || 'You',
            reporterAvatar: report.reporterAvatar || getUserAvatarDataUri(),
            label: report.label,
            description: report.description || '',
            title: report.title,
            location: report.location,
            timeAgo: `Just now · ${report.time}`,
            position: report.position,
            color: report.color,
            photoUrl: report.photoUrl,
            status: report.status
        })),
        ...defaultHazards.map((item) => ({
            id: item.id,
            hazardKey: item.hazardKey,
            reporterName: item.reporterName || 'Community Member',
            reporterAvatar: item.reporterAvatar || getUserAvatarDataUri(),
            label: item.label,
            description: item.description || '',
            title: item.title,
            location: item.location,
            timeAgo: item.timeAgo,
            position: item.position,
            color: item.color,
            photoUrl: item.photoUrl || '',
            status: item.status
        }))
    ];
}

function renderExpandedFeed() {
    if (!expandedFeedList) return;
    expandedFeedList.innerHTML = '';

    const items = getAllHazards();
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
            showWarning(item.title, item.label);
            pullUpSection.classList.remove('expanded');
            openCategoryFeed(item.hazardKey);
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
        const defaultCategoryItem = defaultHazards.find(
            (item) => item.hazardKey === hazardKey && item.photoUrl
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
                reporterEl.textContent = latestReport.reporterName || userProfile.name || 'You';
                timeEl.textContent = 'Just now';
                if (imageEl && latestReport.photoUrl) {
                    imageEl.src = latestReport.photoUrl;
                }
            } else {
                reporterEl.textContent = defaultCategoryItem?.reporterName || config.defaultReporter;
                timeEl.textContent = defaultCategoryItem?.timeAgo || config.defaultTime;
                if (imageEl) {
                    imageEl.src = defaultCategoryItem?.photoUrl || config.defaultImage;
                }
            }
        }
    });

    renderExpandedFeed();

    if (activeFeedHazardKey && categoryFeedSheet?.classList.contains('active')) {
        renderCategoryFeed(activeFeedHazardKey);
    }
}

// ================= SCROLLABLE CATEGORY REPORTS FEED =================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

function openCategoryFeed(hazardKey) {
    if (!categoryFeedSheet || !hazardData[hazardKey]) return;

    activeFeedHazardKey = hazardKey;
    pullUpSection.classList.remove('expanded');
    pullUpSection.style.display = 'none';
    closeRoutePanel();

    renderCategoryFeed(hazardKey);
    categoryFeedSheet.classList.add('active');
}

function closeCategoryFeed(resetSelection = true) {
    if (!categoryFeedSheet) return;
    categoryFeedSheet.classList.remove('active');
    activeFeedHazardKey = null;

    if (!reportModal.classList.contains('active')) {
        pullUpSection.style.display = '';
    }

    if (resetSelection) {
        selectedHazardFilter = null;
        document.querySelectorAll('.hazardcard').forEach((card) => card.classList.remove('selected'));
        renderHazardMarkers();
    }
}

function openReportFromFeed() {
    const targetCategory = activeFeedHazardKey || selectedHazardFilter || '';
    if (categoryFeedSheet) {
        categoryFeedSheet.classList.remove('active');
    }
    openReportForm(targetCategory);
}

function renderCategoryFeed(hazardKey) {
    if (!categoryFeedTitle || !categoryFeedList) return;

    const categoryInfo = hazardData[hazardKey];
    categoryFeedTitle.textContent = categoryInfo ? categoryInfo.displayName : 'Reports';

    const reports = getAllHazards().filter((item) => item.hazardKey === hazardKey);
    categoryFeedList.innerHTML = '';

    if (reports.length === 0) {
        categoryFeedList.innerHTML = `
            <div class="category-feed-empty">
                No reports in ${escapeHtml(categoryInfo?.displayName || 'this category')} yet. Tap <strong>+</strong> to add one.
            </div>
        `;
        return;
    }

    reports.forEach((report) => {
        const isResolved = report.status === 'resolved';
        const statusClass = isResolved ? 'resolved' : 'active';
        const statusLabel = isResolved ? 'Resolved' : 'Active';

        const fullDesc = (report.description || '').trim();
        const maxPreviewLen = 44;
        const needsReadMore = fullDesc.length > maxPreviewLen;
        const shortDesc = needsReadMore ? `${fullDesc.slice(0, maxPreviewLen).trim()}...` : fullDesc;

        const postEl = document.createElement('article');
        postEl.className = 'feed-post-item';

        const quoteHtml = fullDesc
            ? `<p class="feed-post-quote">
                “<span class="feed-quote-text" data-full="${escapeHtml(fullDesc)}" data-short="${escapeHtml(shortDesc)}" data-expanded="false">${escapeHtml(shortDesc)}</span>${needsReadMore ? ` <button type="button" class="feed-read-more-btn">Read More</button>` : ''}”
               </p>`
            : '';

        const photoHtml = report.photoUrl
            ? `<div class="feed-post-photo-wrap">
                <img src="${report.photoUrl}" alt="${escapeHtml(categoryInfo?.displayName || 'Hazard')} report photo" class="feed-post-photo"/>
               </div>`
            : '';

        postEl.innerHTML = `
            <div class="feed-post-top">
                <img src="${report.reporterAvatar}" alt="${escapeHtml(report.reporterName)}" class="feed-post-avatar"/>
                <div class="feed-post-bubble">
                    <h4 class="feed-post-author">${escapeHtml(report.reporterName)}</h4>
                    <span class="feed-post-time">${escapeHtml(report.timeAgo)}</span>
                    <span class="feed-post-location">${escapeHtml(report.location || 'Cagayan de Oro City')}</span>
                    <div class="feed-post-status">
                        <span class="feed-status-dot ${statusClass}"></span>
                        <span>${statusLabel}</span>
                    </div>
                    ${quoteHtml}
                </div>
            </div>
            ${photoHtml}
        `;

        // Toggle "Read More" / "Show Less" without triggering map flyTo
        const readMoreBtn = postEl.querySelector('.feed-read-more-btn');
        if (readMoreBtn) {
            readMoreBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const textSpan = postEl.querySelector('.feed-quote-text');
                const isExpanded = textSpan.dataset.expanded === 'true';
                if (isExpanded) {
                    textSpan.textContent = textSpan.dataset.short;
                    textSpan.dataset.expanded = 'false';
                    readMoreBtn.textContent = 'Read More';
                } else {
                    textSpan.textContent = textSpan.dataset.full;
                    textSpan.dataset.expanded = 'true';
                    readMoreBtn.textContent = 'Show Less';
                }
            });
        }

        // Clicking the card/photo focuses that incident on the map
        postEl.addEventListener('click', () => {
            showWarning(report.title, report.label);
            map.flyTo(report.position, 16, { duration: 0.9 });
        });

        categoryFeedList.appendChild(postEl);
    });
}

function getSheetState() {
    if (pullUpSection.classList.contains('collapsed')) return 'collapsed';
    if (pullUpSection.classList.contains('expanded')) return 'expanded';
    return 'default';
}

function setSheetState(state) {
    pullUpSection.classList.toggle('expanded', state === 'expanded');
    pullUpSection.classList.toggle('collapsed', state === 'collapsed');
}

function toggleSheet() {
    if (suppressNextHandleClick) {
        suppressNextHandleClick = false;
        return;
    }
    const state = getSheetState();
    setSheetState(state === 'collapsed' ? 'default' : state === 'default' ? 'expanded' : 'default');
}

// Lets phone users pull the drawer all the way down to see the whole map.
function toggleSheetCollapsed(event) {
    if (event) event.stopPropagation();
    setSheetState(getSheetState() === 'collapsed' ? 'default' : 'collapsed');
}
window.toggleSheetCollapsed = toggleSheetCollapsed;

function clearSearch() {
    searchInput.value = '';
    searchInput.focus();
    selectedHazardFilter = null;
    hideTopSearchSuggestions();
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

    clearTimeout(topSearchTimer);
    if (!query || query.length < 2) {
        hideTopSearchSuggestions();
        return;
    }

    topSearchTimer = setTimeout(async () => {
        const matches = await queryCdoSuggestions(query);
        renderTopSearchSuggestions(matches);
    }, 240);
}

function renderTopSearchSuggestions(matches) {
    if (!topSearchSuggestions) return;
    topSearchSuggestions.innerHTML = '';

    if (!matches.length) {
        hideTopSearchSuggestions();
        return;
    }

    matches.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'top-search-suggestion-item';
        li.innerHTML = `
            <div>
                <strong>${item.title}</strong>
                <span>${item.subtitle}</span>
            </div>
            <span class="top-search-route-pill">Safe Route →</span>
        `;
        li.addEventListener('click', () => {
            hideTopSearchSuggestions();
            routeToDestination(item.subtitle || item.title, item.position);
        });
        topSearchSuggestions.appendChild(li);
    });

    topSearchSuggestions.classList.add('active');
}

function hideTopSearchSuggestions() {
    if (!topSearchSuggestions) return;
    topSearchSuggestions.classList.remove('active');
    topSearchSuggestions.innerHTML = '';
}

function setDefaultImages() {
    const logo = document.querySelector('.beaconlogo img');

    if (logo) {
        logo.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="120" height="34" viewBox="0 0 120 34">
                <rect width="120" height="34" rx="8" fill="#F6F3E9"/>
                <text x="16" y="22" font-size="18" font-family="Arial, sans-serif" font-weight="700" fill="#12261E">Beacon</text>
            </svg>
        `);
    }

    updateTopBarProfileIcon();

    const getDefaultHazard = (key) => defaultHazards.find((item) => item.hazardKey === key) || {};

    const imageMap = [
        ['#floodlatest', getDefaultHazard('flashfloods').photoUrl || categoryCardElements.flashfloods.defaultImage],
        ['#accidentlatest', getDefaultHazard('accidents').photoUrl || categoryCardElements.accidents.defaultImage],
        ['#firelatest', getDefaultHazard('fires').photoUrl || categoryCardElements.fires.defaultImage],
        ['#landslidelatest', getDefaultHazard('landslides').photoUrl || categoryCardElements.landslides.defaultImage],
        ['#flooduserphoto', getDefaultHazard('flashfloods').reporterAvatar],
        ['#accidentuserphoto', getDefaultHazard('accidents').reporterAvatar],
        ['#fireuserphoto', getDefaultHazard('fires').reporterAvatar],
        ['#landslideuserphoto', getDefaultHazard('landslides').reporterAvatar]
    ];

    imageMap.forEach(([selector, url]) => {
        const image = document.querySelector(selector);
        if (image && url) image.src = url;
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

function createRouteEndpointIcon(badgeText, bgColor) {
    return L.divIcon({
        className: 'route-endpoint-pin',
        html: `<div class="route-endpoint-badge" style="background:${bgColor};">${badgeText}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
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
            if (reportModal.classList.contains('active') || routeState.pickMode) return;
            showWarning(details.title, details.label);
            selectHazard(details.hazardKey, true);
        });
        hazardMarkers[details.id] = marker;
    });
}

function selectHazard(hazardKey, forceSelect = false) {
    const cards = document.querySelectorAll('.hazardcard');

    selectedHazardFilter = hazardKey;

    cards.forEach((card) => {
        card.classList.toggle('selected', card.dataset.hazard === hazardKey);
    });

    const activeMatching = getAllHazards().filter(
        (item) => item.hazardKey === hazardKey && item.status !== 'resolved'
    );
    const latestHazard = activeMatching[0] || hazardData[hazardKey];

    if (latestHazard) {
        showWarning(latestHazard.title, latestHazard.label);
    }

    renderHazardMarkers();
    openCategoryFeed(hazardKey);

    if (activeMatching.length === 1) {
        map.flyTo(activeMatching[0].position, 15, { duration: 1.2 });
    } else if (activeMatching.length > 1) {
        const bounds = L.latLngBounds(activeMatching.map((item) => item.position));
        map.flyToBounds(bounds, { padding: [90, 90], maxZoom: 15, duration: 1.2 });
    } else if (hazardData[hazardKey]) {
        map.flyTo(hazardData[hazardKey].position, 15, { duration: 1.2 });
    }
}

// ================= HAZARD-AWARE REROUTING =================
function openRoutePanel() {
    if (!routePanel) return;
    pullUpSection.classList.remove('expanded');
    if (categoryFeedSheet?.classList.contains('active')) {
        closeCategoryFeed(false);
    }
    routePanel.classList.add('active');
    if (warningBanner) warningBanner.style.display = 'none';

    if (!routeState.originCoords && !routeOriginInput.value.trim()) {
        useRouteGpsOrigin(true);
    }
}

function closeRoutePanel() {
    if (!routePanel) return;
    routePanel.classList.remove('active');
    if (warningBanner) warningBanner.style.display = '';
    setRoutePickMode(null);
    hideRouteSuggestions();
    hideTopSearchSuggestions();
}

function setRouteProfile(profile) {
    routeState.profile = profile;
    document.querySelectorAll('.route-mode-pill').forEach((pill) => {
        pill.classList.toggle('active', pill.dataset.profile === profile);
    });
    if (routeState.hasActiveRoute || (routeOriginInput.value.trim() && routeDestInput.value.trim())) {
        calculateSafeRoute();
    }
}

function setRoutePickMode(mode) {
    routeState.pickMode = mode;
    if (!routePickHint) return;
    if (mode === 'origin') {
        routePickHint.textContent = 'Tap anywhere on the map to set your Start location.';
        routePickHint.classList.add('active');
    } else if (mode === 'destination') {
        routePickHint.textContent = 'Tap anywhere on the map to set your Destination.';
        routePickHint.classList.add('active');
    } else {
        routePickHint.textContent = '';
        routePickHint.classList.remove('active');
    }
}

function enableMapPickMode(mode) {
    const nextMode = routeState.pickMode === mode ? null : mode;
    setRoutePickMode(nextMode);
}

function useRouteGpsOrigin(silentFallback = false) {
    const fallbackCoords = [8.4772, 124.6459];

    if (!navigator.geolocation) {
        routeState.originCoords = fallbackCoords;
        routeOriginInput.value = 'Divisoria, Cagayan de Oro City';
        return;
    }

    routeOriginInput.value = 'Locating GPS...';
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const coords = [pos.coords.latitude, pos.coords.longitude];
            if (!isInsideCagayanDeOroBounds(coords)) {
                routeState.originCoords = fallbackCoords;
                routeOriginInput.value = 'Divisoria, Cagayan de Oro City';
                if (!silentFallback) {
                    window.alert('GPS is outside Cagayan de Oro City. Using Divisoria, CDO as your start point.');
                }
                return;
            }
            routeState.originCoords = coords;
            const address = await reverseGeocodeCdo(coords[0], coords[1]);
            routeOriginInput.value = address || `${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`;
            if (routeDestInput.value.trim()) {
                calculateSafeRoute();
            }
        },
        () => {
            routeState.originCoords = fallbackCoords;
            routeOriginInput.value = 'Divisoria, Cagayan de Oro City';
        },
        { enableHighAccuracy: true, timeout: 6000 }
    );
}

function swapRouteEndpoints() {
    const tempText = routeOriginInput.value;
    const tempCoords = routeState.originCoords;

    routeOriginInput.value = routeDestInput.value;
    routeState.originCoords = routeState.destCoords;

    routeDestInput.value = tempText;
    routeState.destCoords = tempCoords;

    if (routeOriginInput.value.trim() && routeDestInput.value.trim()) {
        calculateSafeRoute();
    }
}

function routeToDestination(label, coords) {
    openRoutePanel();
    routeDestInput.value = label;
    routeState.destCoords = [...coords];

    if (!routeState.originCoords) {
        routeState.originCoords = [8.4772, 124.6459];
        routeOriginInput.value = 'Divisoria, Cagayan de Oro City';
    }

    calculateSafeRoute();
}

function handleRouteAutocomplete(which) {
    const inputEl = which === 'origin' ? routeOriginInput : routeDestInput;
    const listEl = which === 'origin' ? routeOriginSuggestions : routeDestSuggestions;
    const otherListEl = which === 'origin' ? routeDestSuggestions : routeOriginSuggestions;

    if (which === 'origin') routeState.originCoords = null;
    if (which === 'destination') routeState.destCoords = null;

    if (otherListEl) {
        otherListEl.classList.remove('active');
        otherListEl.innerHTML = '';
    }

    const query = inputEl.value.trim();
    clearTimeout(routeSuggestTimer);

    if (!query) {
        listEl.classList.remove('active');
        listEl.innerHTML = '';
        return;
    }

    routeSuggestTimer = setTimeout(async () => {
        const results = await queryCdoSuggestions(query);
        listEl.innerHTML = '';
        if (!results.length) {
            listEl.classList.remove('active');
            return;
        }
        results.forEach((item) => {
            const li = document.createElement('li');
            li.className = 'route-suggestion-item';
            li.innerHTML = `<strong>${item.title}</strong><span>${item.subtitle}</span>`;
            li.addEventListener('click', () => {
                inputEl.value = item.subtitle || item.title;
                if (which === 'origin') {
                    routeState.originCoords = [...item.position];
                } else {
                    routeState.destCoords = [...item.position];
                }
                listEl.classList.remove('active');
                listEl.innerHTML = '';
                if (routeOriginInput.value.trim() && routeDestInput.value.trim()) {
                    calculateSafeRoute();
                }
            });
            listEl.appendChild(li);
        });
        listEl.classList.add('active');
    }, 220);
}

function hideRouteSuggestions() {
    [routeOriginSuggestions, routeDestSuggestions].forEach((el) => {
        if (el) {
            el.classList.remove('active');
            el.innerHTML = '';
        }
    });
}

function haversineDistanceMeters(latLngA, latLngB) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(latLngB[0] - latLngA[0]);
    const dLon = toRad(latLngB[1] - latLngA[1]);
    const lat1 = toRad(latLngA[0]);
    const lat2 = toRad(latLngB[0]);

    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pointToSegmentDistanceMeters(point, segStart, segEnd) {
    const [py, px] = point;
    const [ay, ax] = segStart;
    const [by, bx] = segEnd;

    const dx = bx - ax;
    const dy = by - ay;
    if (dx === 0 && dy === 0) {
        return haversineDistanceMeters(point, segStart);
    }

    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
    const projected = [ay + t * dy, ax + t * dx];
    return haversineDistanceMeters(point, projected);
}

function hazardsWithinRoute(routeLatLngs, hazards) {
    if (!routeLatLngs || routeLatLngs.length < 2) return [];

    return hazards.filter((hazard) => {
        const radius = getHazardAvoidRadiusMeters(hazard);
        for (let i = 0; i < routeLatLngs.length - 1; i += 1) {
            if (pointToSegmentDistanceMeters(hazard.position, routeLatLngs[i], routeLatLngs[i + 1]) <= radius) {
                return true;
            }
        }
        return false;
    });
}

function getHazardsNearRoute(routeLatLngs, activeHazards, profile = routeState.profile) {
    return hazardsWithinRoute(routeLatLngs, activeHazards.filter((hazard) => hazardBlocksProfile(hazard, profile)));
}

async function fetchMapboxRoutes(waypoints, profile, excludedHazards = []) {
    const coordStr = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(';');
    const params = new URLSearchParams({
        alternatives: waypoints.length === 2 ? 'true' : 'false',
        geometries: 'geojson',
        overview: 'full',
        steps: 'true',
        access_token: MAPBOX_TOKEN
    });

    // Mapbox only supports the "exclude" point list for the driving profile.
    // Walking and biking are kept safe by the detour search in calculateSafeRoute.
    if (excludedHazards.length > 0 && profile === 'driving') {
        const excludePoints = excludedHazards
            .slice(0, 50)
            .map((h) => `point(${h.position[1].toFixed(6)} ${h.position[0].toFixed(6)})`)
            .join(',');
        params.set('exclude', excludePoints);
    }

    try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordStr}?${params.toString()}`;
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data.routes) ? data.routes : [];
    } catch (error) {
        console.warn('Route request failed:', error);
        return [];
    }
}

// Drops candidate via-points on rings around each blocking hazard. Mapbox snaps each
// point to the nearest street (major roads, side streets or footpaths depending on the
// mode), so detours can use narrow streets whenever those are the safer option.
function buildDetourWaypoints(originCoords, destCoords, blockingHazards) {
    const waypoints = [];

    blockingHazards.slice(0, 4).forEach((hazard) => {
        const [lat, lng] = hazard.position;
        const base = getHazardAvoidRadiusMeters(hazard);
        const metersPerDegLat = 111320;
        const metersPerDegLng = 111320 * Math.cos((lat * Math.PI) / 180);

        [1.6, 2.6, 4].forEach((factor) => {
            const dist = base * factor + 100;
            for (let deg = 0; deg < 360; deg += 45) {
                const rad = (deg * Math.PI) / 180;
                const wp = [
                    lat + (Math.cos(rad) * dist) / metersPerDegLat,
                    lng + (Math.sin(rad) * dist) / metersPerDegLng
                ];
                if (isInsideCagayanDeOroBounds(wp)) waypoints.push(wp);
            }
        });
    });

    const detourLength = (wp) => haversineDistanceMeters(originCoords, wp) + haversineDistanceMeters(wp, destCoords);
    return waypoints.sort((a, b) => detourLength(a) - detourLength(b)).slice(0, 16);
}

function formatRouteDuration(seconds) {
    const mins = Math.max(1, Math.round(seconds / 60));
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hrs} hr ${remMins} min` : `${hrs} hr`;
}

function formatRouteDistance(meters) {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
}

function stripHtml(htmlText) {
    const div = document.createElement('div');
    div.innerHTML = htmlText || '';
    return div.textContent || div.innerText || '';
}

async function calculateSafeRoute(isLiveUpdate = false) {
    hideRouteSuggestions();
    hideTopSearchSuggestions();
    setRoutePickMode(null);

    const originText = routeOriginInput.value.trim();
    const destText = routeDestInput.value.trim();

    if (!originText || !destText) {
        if (!isLiveUpdate) {
            window.alert('Please enter both a start location and destination.');
        }
        return;
    }

    const originCoords = routeState.originCoords || await getReportedPosition(originText);
    const destCoords = routeState.destCoords || await getReportedPosition(destText);

    if (!originCoords || !destCoords) {
        if (!isLiveUpdate) {
            window.alert('Could not find one of those locations in Cagayan de Oro City. Please pick a suggestion or tap the map.');
        }
        return;
    }

    routeState.originCoords = originCoords;
    routeState.destCoords = destCoords;

    routeStatusBox.classList.add('active');
    routeStatusBadge.className = 'route-status-badge calculating';
    routeStatusBadge.textContent = 'CHECKING HAZARDS...';
    routeMetrics.textContent = '';
    routeStatusMessage.textContent = 'Scanning active hazards along your route...';
    routeNextStep.textContent = '';

    const profile = routeState.profile;
    const modeLabel = ROUTE_MODE_LABELS[profile] || profile;
    const activeHazards = getAllHazards().filter((h) => h.status !== 'resolved');
    // Same rule for every mode: fires, floods and landslides always block.
    // Accidents block bikes and cars, but people on foot may walk through them.
    const blockingHazards = activeHazards.filter((h) => hazardBlocksProfile(h, profile));

    const evaluate = (route) => {
        const latLngs = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        return { route, latLngs, hits: hazardsWithinRoute(latLngs, blockingHazards) };
    };

    const plainRoutes = await fetchMapboxRoutes([originCoords, destCoords], profile, []);
    if (!plainRoutes.length) {
        routeStatusBadge.className = 'route-status-badge warning';
        routeStatusBadge.textContent = 'NO ROUTE FOUND';
        routeStatusMessage.textContent = 'Unable to calculate a path between those two points.';
        return;
    }

    const candidates = [];
    const seen = new Set();
    const addCandidates = (routes) => routes.forEach((route) => {
        const key = `${Math.round(route.duration)}-${Math.round(route.distance)}`;
        if (seen.has(key)) return;
        seen.add(key);
        candidates.push(evaluate(route));
    });

    addCandidates(plainRoutes);
    const directCandidates = candidates.slice();
    const primary = directCandidates[0];

    const fetchDetours = async (hazards) => {
        const jobs = [];
        if (profile === 'driving') {
            jobs.push(fetchMapboxRoutes([originCoords, destCoords], profile, blockingHazards));
        }
        buildDetourWaypoints(originCoords, destCoords, hazards).forEach((wp) => {
            jobs.push(fetchMapboxRoutes([originCoords, wp, destCoords], profile, []));
        });
        return (await Promise.all(jobs)).flat();
    };

    if (primary.hits.length > 0) {
        addCandidates(await fetchDetours(primary.hits));

        if (!candidates.some((c) => c.hits.length === 0)) {
            // Second pass: also swing around any hazard the best detour still runs into.
            const nearMiss = [...candidates].sort((a, b) => a.hits.length - b.hits.length)[0];
            if (nearMiss.hits.some((h) => !primary.hits.includes(h))) {
                const merged = [...new Map([...primary.hits, ...nearMiss.hits].map((h) => [h.id, h])).values()];
                addCandidates(await fetchDetours(merged));
            }
        }
    }

    const byDuration = (a, b) => a.route.duration - b.route.duration;
    const safeRoutes = candidates.filter((c) => c.hits.length === 0).sort(byDuration);
    const chosen = safeRoutes[0] || null;

    const directDangerous = directCandidates.filter((c) => c.hits.length > 0);
    const otherDangerous = candidates.filter((c) => c.hits.length > 0 && !directDangerous.includes(c)).sort(byDuration);
    const dangerousShown = (chosen
        ? directDangerous.slice(0, 2)
        : [...directDangerous, ...otherDangerous].slice(0, 3));

    const hazardNames = (hazards) => [...new Set(hazards.map(
        (h) => `${hazardData[h.hazardKey]?.incidentName || 'Hazard'} (${h.location || 'nearby'})`
    ))].join(', ');

    // ---- draw ----
    routeLayerGroup.clearLayers();
    routeState.hasActiveRoute = true;
    const fitLayers = [];
    const hazardZones = new Map();

    dangerousShown.forEach((candidate) => {
        candidate.hits.forEach((h) => hazardZones.set(h.id, h));
        const line = L.polyline(candidate.latLngs, {
            color: '#E53935',
            weight: 5,
            opacity: 0.92,
            dashArray: '1, 10',
            lineCap: 'round'
        })
            .bindPopup(`<strong>Dangerous route</strong><br>Passes through ${hazardNames(candidate.hits)}. Do not take this route.`)
            .addTo(routeLayerGroup);
        fitLayers.push(line);
    });

    hazardZones.forEach((hazard) => {
        L.circle(hazard.position, {
            radius: getHazardAvoidRadiusMeters(hazard),
            color: '#E53935',
            weight: 2,
            fillColor: '#E53935',
            fillOpacity: 0.16
        })
            .bindPopup(`<strong>Hazard Zone</strong><br>${hazard.label}`)
            .addTo(routeLayerGroup);
    });

    if (chosen) {
        L.polyline(chosen.latLngs, { color: '#12261E', weight: 9, opacity: 0.55 }).addTo(routeLayerGroup);
        fitLayers.push(
            L.polyline(chosen.latLngs, { color: '#4CAF50', weight: 6, opacity: 0.96 }).addTo(routeLayerGroup)
        );
    }

    const endpointColor = chosen ? '#2E7D32' : '#E53935';
    L.marker(originCoords, { icon: createRouteEndpointIcon('A', '#12261E') })
        .bindPopup(`<strong>Start:</strong> ${originText}`)
        .addTo(routeLayerGroup);
    L.marker(destCoords, { icon: createRouteEndpointIcon('B', endpointColor) })
        .bindPopup(`<strong>Destination:</strong> ${destText}`)
        .addTo(routeLayerGroup);

    if (fitLayers.length) {
        const routeBounds = L.featureGroup(fitLayers).getBounds();
        if (routeBounds.isValid()) {
            map.fitBounds(routeBounds, { padding: [110, 140], maxZoom: 16 });
        }
    }

    // ---- status panel ----
    if (chosen) {
        const durationText = formatRouteDuration(chosen.route.duration);
        const distanceText = formatRouteDistance(chosen.route.distance);
        routeMetrics.textContent = `${durationText} · ${distanceText}`;

        const firstStep = chosen.route.legs?.[0]?.steps?.[0];
        routeNextStep.textContent = firstStep?.maneuver?.instruction
            ? `Next: ${stripHtml(firstStep.maneuver.instruction)}`
            : '';

        // Walkers may pass accidents; just tell them to stay alert.
        const accidentsOnPath = profile === 'walking'
            ? hazardsWithinRoute(chosen.latLngs, activeHazards.filter((h) => h.hazardKey === 'accidents'))
            : [];
        const accidentNote = accidentsOnPath.length
            ? ` Your walking route passes an accident scene (${hazardNames(accidentsOnPath)}) — stay alert and keep clear of responders.`
            : '';

        if (primary.hits.length > 0) {
            const names = hazardNames(primary.hits);
            routeStatusBadge.className = 'route-status-badge rerouted';
            routeStatusBadge.textContent = '⚠️ REROUTED AROUND HAZARD';
            routeStatusMessage.textContent = `Safe ${modeLabel} route found, avoiding ${names}. The red dotted line is the dangerous route — do not take it.${accidentNote}`;
            showWarning('REROUTED', `Safe ${modeLabel} detour active (${durationText}) avoiding ${names}.`);
        } else {
            routeStatusBadge.className = 'route-status-badge clear';
            routeStatusBadge.textContent = '✓ SAFE ROUTE';
            const base = isLiveUpdate
                ? 'Hazard cleared — fastest direct route is now open.'
                : 'No active hazards detected along this route.';
            const altNote = dangerousShown.length
                ? ' The red dotted line shows another route that is NOT safe.'
                : '';
            routeStatusMessage.textContent = `${base}${altNote}${accidentNote}`;
        }
    } else {
        const names = hazardNames([...hazardZones.values()]);
        routeStatusBadge.className = 'route-status-badge nosafe';
        routeStatusBadge.textContent = '⛔ NO SAFE ROUTE';
        routeMetrics.textContent = 'No safe way';
        routeStatusMessage.textContent = `There is no safe way to get to this destination by ${modeLabel}. Every available route passes through ${names}. Avoid the trip or wait until the hazard is cleared. The dangerous routes are marked with red dotted lines.`;
        routeNextStep.textContent = 'If you must go, proceed with extreme caution and never drive, bike or walk into fire, flood or landslide areas.';
        showWarning('NO SAFE ROUTE', `No safe ${modeLabel} route to your destination. Proceed with caution — avoid the red dotted routes.`);
    }
}

function clearRoute() {
    routeLayerGroup.clearLayers();
    routeState.hasActiveRoute = false;
    routeState.destCoords = null;
    routeDestInput.value = '';
    setRoutePickMode(null);
    hideRouteSuggestions();
    if (routeStatusBox) {
        routeStatusBox.classList.remove('active');
    }
}

function refreshActiveRouteIfNeeded() {
    if (routeState.hasActiveRoute && routeState.originCoords && routeState.destCoords) {
        calculateSafeRoute(true);
    }
}

// ================= REPORT FORM PIN & LOCATION =================
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
    const coords = [e.latlng.lat, e.latlng.lng];

    if (reportModal.classList.contains('active')) {
        if (!updateDraftPinOnMap(coords, false)) return;
        hideLocationSuggestions();
        hazardLocationInput.value = 'Pinpointing address...';
        const address = await reverseGeocodeCdo(coords[0], coords[1]);
        hazardLocationInput.value = address || `${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`;
        return;
    }

    if (routeState.pickMode) {
        if (!isInsideCagayanDeOroBounds(coords)) {
            window.alert('Please tap a point within Cagayan de Oro City.');
            return;
        }
        const mode = routeState.pickMode;
        setRoutePickMode(null);

        const targetInput = mode === 'origin' ? routeOriginInput : routeDestInput;
        targetInput.value = 'Pinpointing address...';
        const address = await reverseGeocodeCdo(coords[0], coords[1]);
        targetInput.value = address || `${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`;

        if (mode === 'origin') {
            routeState.originCoords = coords;
        } else {
            routeState.destCoords = coords;
        }

        if (routeOriginInput.value.trim() && routeDestInput.value.trim()) {
            calculateSafeRoute();
        }
    }
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

const suggestionCache = new Map();

async function fetchMapboxSuggestions(query) {
    try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=ph&bbox=124.4,8.2,125.0,8.7&proximity=124.6491,8.4859&autocomplete=true&types=poi,address,place,locality,neighborhood&limit=8`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.features || [])
            .filter((f) => isCagayanDeOroFeature(f))
            .map((f) => ({
                title: f.text,
                subtitle: f.place_name.replace(/,\s*Philippines$/i, ''),
                position: [f.center[1], f.center[0]]
            }));
    } catch (err) {
        console.warn('Mapbox autocomplete failed:', err);
        return [];
    }
}

// OpenStreetMap search knows brands and landmarks (Jollibee, schools, malls) well.
async function fetchOsmSuggestions(query) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&viewbox=124.4,8.7,125.0,8.2&bounded=1&countrycodes=ph&limit=8&accept-language=en`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const rows = await res.json();
        return (Array.isArray(rows) ? rows : [])
            .map((r) => ({
                title: r.name || String(r.display_name || '').split(',')[0],
                subtitle: String(r.display_name || '').replace(/,\s*Philippines$/i, ''),
                position: [parseFloat(r.lat), parseFloat(r.lon)]
            }))
            .filter((item) => item.title && Number.isFinite(item.position[0]) && isInsideCagayanDeOroBounds(item.position));
    } catch (err) {
        console.warn('OSM autocomplete failed:', err);
        return [];
    }
}

async function queryCdoSuggestions(query) {
    const trimmed = query.trim();
    const qLower = trimmed.toLowerCase();
    if (!qLower) return [];
    if (suggestionCache.has(qLower)) return suggestionCache.get(qLower);

    const localMatches = cdoLocalPlaces
        .filter((place) => [place.name, place.sub, ...(place.aliases || [])]
            .some((text) => text.toLowerCase().includes(qLower)))
        .map((place) => ({ title: place.name, subtitle: place.sub, position: place.position }));

    const mentionsCity = /cagayan|\bcdo\b/i.test(trimmed);
    const [mapboxPlain, mapboxCity, osm] = await Promise.all([
        fetchMapboxSuggestions(trimmed),
        // Adding the city name surfaces brand/chain branches (e.g. "Jollibee") that a plain query can miss.
        mentionsCity ? Promise.resolve([]) : fetchMapboxSuggestions(`${trimmed} Cagayan de Oro`),
        fetchOsmSuggestions(trimmed)
    ]);

    // De-duplicate by name + location, NOT by name, so several branches of one brand all show up.
    const seen = new Set();
    const merged = [...localMatches, ...mapboxPlain, ...mapboxCity, ...osm].filter((item) => {
        const key = `${item.title.toLowerCase()}|${item.position[0].toFixed(3)},${item.position[1].toFixed(3)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    }).slice(0, 8);

    if (merged.length) suggestionCache.set(qLower, merged);
    return merged;
}

async function fetchLocationSuggestions(query) {
    const combined = await queryCdoSuggestions(query);
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

const cameraFallbackBox = document.getElementById('cameraFallbackBox');
const cameraFallbackMsg = document.getElementById('cameraFallbackMsg');

function triggerFallbackPhotoPicker() {
    if (!cameraOnlyFallbackInput) return;
    cameraOnlyFallbackInput.value = '';
    cameraOnlyFallbackInput.click();
}

function retakeHazardPhoto() {
    capturedPhotoDataUrl = '';
    capturedPhotoBox.classList.remove('active');
    hazardPhotoPreview.src = '';
    openLiveCamera();
}

async function openLiveCamera() {
    stopLiveCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        openCameraBtn.style.display = 'none';
        if (cameraFallbackBox) {
            if (cameraFallbackMsg) {
                cameraFallbackMsg.textContent = 'Live camera requires HTTPS or localhost. Tap below to use your camera or upload a photo:';
            }
            cameraFallbackBox.classList.add('active');
        }
        triggerFallbackPhotoPicker();
        return;
    }

    try {
        try {
            activeCameraStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
                audio: false
            });
        } catch {
            activeCameraStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });
        }

        cameraStreamVideo.srcObject = activeCameraStream;
        await cameraStreamVideo.play();

        openCameraBtn.style.display = 'none';
        capturedPhotoBox.classList.remove('active');
        liveCameraBox.classList.add('active');
    } catch (err) {
        console.warn('Live WebRTC camera unavailable:', err);
        openCameraBtn.style.display = 'none';
        if (cameraFallbackBox) {
            if (cameraFallbackMsg) {
                cameraFallbackMsg.textContent = 'Camera access was blocked or no webcam was detected.';
            }
            cameraFallbackBox.classList.add('active');
        }
    }
}

function captureLivePhoto() {
    const width = cameraStreamVideo.videoWidth || cameraStreamVideo.clientWidth;
    const height = cameraStreamVideo.videoHeight || cameraStreamVideo.clientHeight;
    if (!width || !height) {
        window.alert('Camera is still starting up—please tap Capture Photo again.');
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
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
    if (cameraStreamVideo) {
        cameraStreamVideo.srcObject = null;
    }
    if (liveCameraBox) {
        liveCameraBox.classList.remove('active');
    }
    if (cameraFallbackBox) {
        cameraFallbackBox.classList.remove('active');
    }
    if (!capturedPhotoDataUrl && openCameraBtn) {
        openCameraBtn.style.display = 'flex';
    }
}

function showCapturedPhoto(dataUrl) {
    hazardPhotoPreview.src = dataUrl;
    openCameraBtn.style.display = 'none';
    liveCameraBox.classList.remove('active');
    if (cameraFallbackBox) cameraFallbackBox.classList.remove('active');
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

// ================= PROFILE PANEL =================
function openProfile() {
    let panel = document.getElementById('profilePanel');

    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'profilePanel';
        panel.className = 'profile-panel';
        panel.addEventListener('click', (event) => {
            if (event.target === panel) {
                closeProfile();
            }
        });
        document.body.appendChild(panel);
    }

    renderProfilePanel();
    panel.classList.add('active');
}

function renderProfilePanel() {
    const panel = document.getElementById('profilePanel');
    if (!panel) return;

    if (!userProfile.signedIn) {
        panel.innerHTML = `
            <div class="profile-panel-inner">
                <button class="profile-close" type="button" onclick="closeProfile()">✕</button>
                <div class="profile-header">
                    <div class="profile-avatar">?</div>
                    <div>
                        <h3>Signed Out</h3>
                        <p>Sign in to manage alerts and responder tools</p>
                    </div>
                </div>
                <div class="profile-actions">
                    <button type="button" onclick="signInBack()">Sign In as ${userProfile.name}</button>
                </div>
            </div>
        `;
        return;
    }

    panel.innerHTML = `
        <div class="profile-panel-inner">
            <button class="profile-close" type="button" onclick="closeProfile()">✕</button>
            <div class="profile-header">
                <div class="profile-avatar">${renderAvatarMarkup()}</div>
                <div>
                    <h3>${userProfile.name}</h3>
                    <p>${getRoleLabel(userProfile.role)}</p>
                </div>
            </div>
            <div class="profile-actions">
                <button type="button" onclick="openResponseHistory()">Response History</button>
                <button type="button" onclick="openSettings()">Settings</button>
                <button type="button" onclick="openAdminDashboard()">Admin Dashboard</button>
            </div>
        </div>
    `;
}

function closeProfile() {
    const panel = document.getElementById('profilePanel');
    if (panel) {
        panel.classList.remove('active');
    }
}

function signInBack() {
      signInWithGoogle();
}

// ================= SETTINGS PANEL =================
function openSettings() {
    closeProfile();
    isEditingSettings = false;

    let panel = document.getElementById('settingsPanel');

    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'settingsPanel';
        panel.className = 'settings-panel';
        panel.addEventListener('click', (event) => {
            if (event.target === panel) {
                closeSettings(false);
            }
        });
        document.body.appendChild(panel);
    }

    renderSettingsPanel();
    panel.classList.add('active');
}

function renderSettingsPanel() {
    const panel = document.getElementById('settingsPanel');
    if (!panel) return;

    const roleBadgeClass = userProfile.role === 'responder' ? 'blue' : 'green';

    panel.innerHTML = `
        <div class="settings-panel-inner">
            <div class="settings-header">
                <div>
                    <span class="admin-dashboard-kicker">Account</span>
                    <h3>Settings</h3>
                </div>
                <button class="panel-back-btn" type="button" onclick="closeSettings(true)" aria-label="Back to Profile">
                    ${BACK_ARROW_SVG}
                </button>
            </div>

            <div class="settings-avatar-section">
                <div class="settings-avatar-preview" onclick="triggerProfilePhotoUpload()" title="Click to upload profile picture">
                    ${renderAvatarMarkup()}
                </div>
                <div class="settings-avatar-meta">
                    <h4>${userProfile.name}</h4>
                    <span class="incident-badge ${roleBadgeClass}">${getRoleLabel(userProfile.role)}</span>
                    <div class="settings-avatar-buttons">
                        <button type="button" class="settings-upload-btn" onclick="triggerProfilePhotoUpload()">Upload Photo</button>
                        ${userProfile.avatarUrl ? `<button type="button" class="settings-remove-photo-btn" onclick="removeProfilePhoto()">Remove</button>` : ''}
                    </div>
                    <input type="file" id="profilePhotoInput" accept="image/*" style="display:none" onchange="handleProfilePhotoUpload(event)"/>
                </div>
            </div>

            ${isEditingSettings ? `
                <form class="settings-edit-form" onsubmit="saveSettingsProfile(event)">
                    <div class="settings-field">
                        <label for="settingsNameInput">Full Name</label>
                        <input id="settingsNameInput" type="text" value="${userProfile.name.replace(/"/g, '&quot;')}" required/>
                    </div>

                    <div class="settings-field">
                        <label for="settingsRoleSelect">Account Role</label>
                        <select id="settingsRoleSelect">
                            <option value="responder" ${userProfile.role === 'responder' ? 'selected' : ''}>Emergency Responder</option>
                            <option value="regular" ${userProfile.role === 'regular' ? 'selected' : ''}>Regular User</option>
                        </select>
                    </div>

                    <div class="settings-field">
                        <label for="settingsEmailInput">Email Address</label>
                        <input id="settingsEmailInput" type="email" value="${userProfile.email.replace(/"/g, '&quot;')}" required/>
                    </div>

                    <div class="settings-field">
                        <label for="settingsAreaInput">City / Barangay</label>
                        <input id="settingsAreaInput" type="text" value="${userProfile.area.replace(/"/g, '&quot;')}" required/>
                    </div>

                    <div class="settings-edit-actions">
                        <button type="button" class="settings-cancel-btn" onclick="toggleEditSettings(false)">Cancel</button>
                        <button type="submit" class="settings-save-btn">Save Profile</button>
                    </div>
                </form>
            ` : `
                <div class="settings-info-card">
                    <div class="settings-info-row">
                        <span class="settings-info-label">Full Name</span>
                        <span class="settings-info-value">${userProfile.name}</span>
                    </div>
                    <div class="settings-info-row">
                        <span class="settings-info-label">Role</span>
                        <span class="settings-info-value">${getRoleLabel(userProfile.role)}</span>
                    </div>
                    <div class="settings-info-row">
                        <span class="settings-info-label">Email</span>
                        <span class="settings-info-value">${userProfile.email}</span>
                    </div>
                    <div class="settings-info-row">
                        <span class="settings-info-label">Location</span>
                        <span class="settings-info-value">${userProfile.area}</span>
                    </div>
                </div>

                <div class="settings-footer-actions">
                    <button type="button" class="settings-edit-btn" onclick="toggleEditSettings(true)">Edit Profile</button>
                    <button type="button" class="settings-signout-btn" onclick="signOutUser()">Sign Out</button>
                </div>
            `}
        </div>
    `;
}

function triggerProfilePhotoUpload() {
    const input = document.getElementById('profilePhotoInput');
    if (input) {
        input.value = '';
        input.click();
    }
}

function handleProfilePhotoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        userProfile.avatarUrl = ev.target.result;
        updateTopBarProfileIcon();
        renderSettingsPanel();
        renderProfilePanel();
        persistProfileToCloud();
    };
    reader.readAsDataURL(file);
}

function removeProfilePhoto() {
    userProfile.avatarUrl = '';
    updateTopBarProfileIcon();
    renderSettingsPanel();
    renderProfilePanel();
    persistProfileToCloud();
}

function toggleEditSettings(editing) {
    isEditingSettings = editing;
    renderSettingsPanel();
}

async function saveSettingsProfile(event) {
    event.preventDefault();

    const nameVal = document.getElementById('settingsNameInput')?.value.trim();
    const roleVal = document.getElementById('settingsRoleSelect')?.value || 'regular';
    const emailVal = document.getElementById('settingsEmailInput')?.value.trim();
    const areaVal = document.getElementById('settingsAreaInput')?.value.trim();

    if (!nameVal) {
        window.alert('Please enter your name.');
        return;
    }

    userProfile.name = nameVal;
    userProfile.role = roleVal;
    userProfile.email = emailVal || userProfile.email;
    userProfile.area = areaVal || userProfile.area;

    if (firebaseClient && firebaseUser && firebaseUser.displayName !== nameVal) {
        try { await firebaseClient.authSdk.updateProfile(firebaseUser, { displayName: nameVal }); }
        catch (error) { console.warn('Could not update the Google display name:', error); }
    }
    await persistProfileToCloud();
    
    isEditingSettings = false;
    renderSettingsPanel();
    renderProfilePanel();
}

async function signOutUser() {
    if (firebaseClient) await firebaseClient.authSdk.signOut(firebaseClient.auth);
    userProfile.signedIn = false;
    isEditingSettings = false;
    updateTopBarProfileIcon();
    closeSettings(true);
}

function closeSettings(returnToProfile = false) {
    const panel = document.getElementById('settingsPanel');
    if (panel) {
        panel.classList.remove('active');
    }
    if (returnToProfile) {
        openProfile();
    }
}

// ================= RESPONSE HISTORY PANEL =================
function openResponseHistory() {
    closeProfile();

    let panel = document.getElementById('responseHistoryPanel');

    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'responseHistoryPanel';
        panel.className = 'response-history-panel';
        panel.innerHTML = `
            <div class="response-history-inner">
                <div class="response-history-header">
                    <div>
                        <span class="admin-dashboard-kicker">Responder Log</span>
                        <h3>Response History</h3>
                    </div>
                    <button class="panel-back-btn" type="button" onclick="closeResponseHistory(true)" aria-label="Back to Profile">
                        ${BACK_ARROW_SVG}
                    </button>
                </div>
                <div id="responseHistoryList" class="response-history-list"></div>
            </div>
        `;
        panel.addEventListener('click', (event) => {
            if (event.target === panel) {
                closeResponseHistory(false);
            }
        });
        document.body.appendChild(panel);
    }

    renderResponseHistoryList();
    panel.classList.add('active');
}

function renderResponseHistoryList() {
    const list = document.getElementById('responseHistoryList');
    if (!list) return;

    list.innerHTML = '';

    if (resolvedHistory.length === 0) {
        list.innerHTML = `
            <div class="response-history-empty">
                No incidents marked as resolved yet.
            </div>
        `;
        return;
    }

    resolvedHistory.forEach((entry) => {
        const item = document.createElement('div');
        item.className = 'response-history-item';
        item.innerHTML = `
            <div class="incident-main">
                <span class="incident-badge green">Resolved</span>
                <div>
                    <h4>${entry.title}</h4>
                    <p>${entry.location} · Resolved at ${entry.resolvedAt}</p>
                </div>
            </div>
            <button type="button" class="resolve-btn undo-btn" onclick="undoResolveIncidentById('${entry.id}')">Undo</button>
        `;
        list.appendChild(item);
    });
}

function closeResponseHistory(returnToProfile = false) {
    const panel = document.getElementById('responseHistoryPanel');
    if (panel) {
        panel.classList.remove('active');
    }
    if (returnToProfile) {
        openProfile();
    }
}

// ================= ADMIN DASHBOARD PANEL =================
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
                    <button class="panel-back-btn" type="button" onclick="closeAdminDashboard(true)" aria-label="Back to Profile">
                        ${BACK_ARROW_SVG}
                    </button>
                </div>

                <div class="admin-dashboard-filters">
                    <button class="filter-chip active" type="button" data-filter="all">All</button>
                    <button class="filter-chip" type="button" data-filter="verified">Camera Verified</button>
                    <button class="filter-chip" type="button" data-filter="resolved">Resolved</button>
                </div>

                <div class="admin-incident-list"></div>
            </div>
        `;
        document.body.appendChild(panel);

        panel.addEventListener('click', (event) => {
            const chip = event.target.closest('.filter-chip');
            if (chip && panel.contains(chip)) {
                panel.querySelectorAll('.filter-chip').forEach((item) => item.classList.toggle('active', item === chip));
                const activeFilter = chip.dataset.filter || 'all';
                filterAdminIncidents(panel, activeFilter);
                return;
            }

            const button = event.target.closest('.resolve-btn');
            if (button && panel.contains(button)) {
                const item = button.closest('.admin-incident-item');
                if (!item || !item.dataset.hazardId) return;

                if (button.dataset.action === 'undo') {
                    undoResolveIncidentById(item.dataset.hazardId);
                } else {
                    resolveIncidentById(item.dataset.hazardId);
                }
                return;
            }

            if (event.target === panel) {
                closeAdminDashboard(false);
            }
        });
    }

    renderAdminIncidentList();
    panel.classList.add('active');
}

function renderAdminIncidentList() {
    const panel = document.getElementById('adminDashboardPanel');
    const list = panel?.querySelector('.admin-incident-list');
    if (!list) return;

    list.innerHTML = '';

    getAllHazards().forEach((hazard) => {
        const info = hazardData[hazard.hazardKey] || {};
        const isResolved = hazard.status === 'resolved';

        const item = document.createElement('div');
        item.className = `admin-incident-item${isResolved ? ' resolved' : ''}`;
        item.dataset.priority = isResolved ? 'resolved' : 'verified';
        item.dataset.hazardId = hazard.id;

        const main = document.createElement('div');
        main.className = 'incident-main';

        if (hazard.photoUrl) {
            const thumb = document.createElement('img');
            thumb.src = hazard.photoUrl;
            thumb.alt = 'Live camera photo';
            thumb.className = 'incident-photo-thumb';
            main.appendChild(thumb);
        }

        const badge = document.createElement('span');
        badge.className = `incident-badge ${isResolved ? 'green' : (info.badgeClass || 'blue')}`;
        badge.textContent = isResolved ? 'Resolved' : 'Verified';

        const details = document.createElement('div');
        const title = document.createElement('h4');
        title.textContent = info.incidentName || info.displayName || hazard.hazardKey;
        const location = document.createElement('p');
        location.textContent = `${hazard.location || 'Cagayan de Oro City'} · ${hazard.timeAgo || 'Just now'}`;
        details.append(title, location);
        main.append(badge, details);

        const button = document.createElement('button');
        button.className = `resolve-btn${isResolved ? ' undo-btn' : ''}`;
        button.type = 'button';
        button.dataset.action = isResolved ? 'undo' : 'resolve';
        button.textContent = isResolved ? 'Undo' : 'Mark as Resolved';

        item.append(main, button);
        list.appendChild(item);
    });

    const activeFilter = panel.querySelector('.filter-chip.active')?.dataset.filter || 'all';
    filterAdminIncidents(panel, activeFilter);
}

function findHazardRecord(hazardId) {
    if (hazardId.startsWith('report-')) {
         const reportId = hazardId.slice('report-'.length);
        return hazardReports.find((entry) => String(entry.id) === reportId) || null;
    }
    return defaultHazards.find((entry) => entry.id === hazardId) || null;
}

function resolveIncidentById(hazardId) {
    const target = findHazardRecord(hazardId);
    if (!target || target.status === 'resolved') return;

    target.status = 'resolved';
    target.resolvedAt = new Date().toISOString();

    const info = hazardData[target.hazardKey] || {};
    const now = new Date();
    const resolvedAt = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    resolvedHistory.unshift({
        id: hazardId,
        title: info.incidentName || info.displayName || target.hazardKey,
        location: target.location || 'Cagayan de Oro City',
        resolvedAt
    });

    saveHazardReport(target, hazardId.startsWith('default-')).catch((error) => {
        console.error('Could not sync resolved status:', error);
        window.alert('The status was saved on this device, but could not sync to Firebase.');
    }); 
    
    updateCategoryCards();
    renderHazardMarkers();
    renderAdminIncidentList();
    renderResponseHistoryList();
    refreshActiveRouteIfNeeded();
}

function undoResolveIncidentById(hazardId) {
    const target = findHazardRecord(hazardId);
    if (!target || target.status !== 'resolved') return;

    target.status = 'active';
    target.resolvedAt = '';
    
    const historyIndex = resolvedHistory.findIndex((entry) => entry.id === hazardId);
    if (historyIndex !== -1) {
        resolvedHistory.splice(historyIndex, 1);
    }

 saveHazardReport(target, hazardId.startsWith('default-')).catch((error) => {
        console.error('Could not sync restored status:', error);
        window.alert('The status change was saved on this device, but could not sync to Firebase.');
    });
    
    updateCategoryCards();
    renderHazardMarkers();
    renderAdminIncidentList();
    renderResponseHistoryList();
    refreshActiveRouteIfNeeded();
}

function filterAdminIncidents(panel, selectedFilter) {
    panel.querySelectorAll('.admin-incident-item').forEach((item) => {
        const show = selectedFilter === 'all' || item.dataset.priority === selectedFilter;
        item.style.display = show ? 'flex' : 'none';
    });
}

function closeAdminDashboard(returnToProfile = false) {
    const panel = document.getElementById('adminDashboardPanel');
    if (panel) {
        panel.classList.remove('active');
    }
    if (returnToProfile) {
        openProfile();
    }
}

// ================= REPORT FORM & SUBMISSION =================
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

function openReportForm(preselectedKey = '') {
    pullUpSection.classList.remove('expanded');
    pullUpSection.style.display = 'none';
    if (categoryFeedSheet) {
        categoryFeedSheet.classList.remove('active');
    }
    reportModal.classList.add('active');
    setCurrentReportTime();

    const targetType = preselectedKey || selectedHazardFilter || '';
    if (targetType && hazardData[targetType]) {
        setSelectedReportType(targetType);
    } else {
        setSelectedReportType('');
    }
}

function closeReportForm() {
    reportModal.classList.remove('active');

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

    if (activeFeedHazardKey) {
        openCategoryFeed(activeFeedHazardKey);
    } else {
        pullUpSection.style.display = '';
    }
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

function isCagayanDeOroFeature(feature) {
    if (!feature || !Array.isArray(feature.center) || feature.center.length !== 2) return false;

    const position = [feature.center[1], feature.center[0]];
    if (!isInsideCagayanDeOroBounds(position)) return false;

    const locationContext = [feature.text, feature.place_name, ...(feature.context || []).map((item) => item.text)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    if (locationContext.includes('cagayan de oro')) return true;

    // Some points of interest omit the city in their context; accept them inside the city's core area.
    return position[0] >= 8.38 && position[0] <= 8.58 && position[1] >= 124.55 && position[1] <= 124.78;
}

let isSubmittingReport = false;

// Wrapper: blocks double submits and shows a "Saving report…" state while uploading.
async function handleHazardSubmit(event) {
    event.preventDefault();
    if (isSubmittingReport) return;
    isSubmittingReport = true;
    setSaveButtonState(true);
    try {
        await submitHazardReport(event);
    } finally {
        isSubmittingReport = false;
        setSaveButtonState(false);
    }
}

async function submitHazardReport(event) {
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

    const reportId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const report = {
        id: reportId,
        hazardKey,
        reporterName: userProfile.name || 'You',
        reporterAvatar: getUserAvatarDataUri(),
        label,
        description: hazardDetails,
        title: 'WARNING!',
        position,
        color: hazardData[hazardKey].color,
        photoUrl: capturedPhotoDataUrl,
        location: hazardLocation.startsWith('Near ') ? hazardLocation : `Near ${hazardLocation}`,
        time: formattedTime,
        status: 'active',
        createdAt: new Date().toISOString(),
        reporterUid: userProfile.uid || '',
        resolvedAt: ''
    };
    hazardReports.push(report);
    // The report is already stored on this device at this point. The cloud upload can stall
    // (slow network, Firebase rules, Storage not set up), so never let the form wait on it forever.
    const canUpload = Boolean(firebaseClient && firebaseUser);
    const uploadPromise = saveHazardReport(report).then(() => 'done', (error) => {
        console.error('Could not sync hazard report:', error);
        return 'failed';
    });
    const outcome = await Promise.race([
        uploadPromise,
        new Promise((resolve) => setTimeout(() => resolve('slow'), 10000))
    ]);

    if (!canUpload || outcome === 'failed') {
        showToast('Report saved on this device, but it could not be uploaded yet. Check your connection.', 'warning', 6500);
    } else if (outcome === 'slow') {
        showToast('Report saved on this device. Still uploading in the background…', 'warning', 5000);
        uploadPromise.then((result) => {
            if (result === 'done') {
                showToast('✓ Report finished uploading. Thank you for keeping others safe!', 'success');
            } else {
                showToast('Upload failed. The report is saved on this device and will retry next time you sign in.', 'warning', 7000);
            }
        });
    } else {
        showToast('✓ Report saved and uploaded. Thank you for keeping others safe!', 'success');
    }

    activeFeedHazardKey = hazardKey;
    updateCategoryCards();
    renderAdminIncidentList();
    closeReportForm();
    selectHazard(hazardKey, true);
    refreshActiveRouteIfNeeded();
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
    const state = getSheetState();

    if (deltaY < -35) {
        setSheetState(state === 'collapsed' ? 'default' : 'expanded');
        suppressNextHandleClick = true;
    } else if (deltaY > 35) {
        setSheetState(state === 'expanded' ? 'default' : 'collapsed');
        suppressNextHandleClick = true;
    }

    isDragging = false;
}

pullUpSection.addEventListener('touchstart', (e) => {
    if (e.target.closest('.pullup-scroll-body') && !pullUpSection.classList.contains('expanded')) {
        return;
    }
    // While the expanded list is scrolled, swiping down should scroll it, not collapse the drawer.
    const scrollBody = pullUpSection.querySelector('.pullup-scroll-body');
    if (pullUpSection.classList.contains('expanded') && scrollBody && scrollBody.scrollTop > 0 && e.target.closest('.pullup-scroll-body')) {
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
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSheetState(getSheetState() === 'expanded' ? 'default' : 'collapsed');
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSheetState(getSheetState() === 'collapsed' ? 'default' : 'expanded');
    }
});

// Category Feed Sheet handle click & swipe-down to close
if (categoryFeedHandle) {
    categoryFeedHandle.addEventListener('click', () => closeCategoryFeed(true));
    categoryFeedHandle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            closeCategoryFeed(true);
        }
    });
    categoryFeedHandle.addEventListener('touchstart', (e) => {
        feedDragStartY = e.touches[0].clientY;
        feedDragCurrentY = feedDragStartY;
        isFeedDragging = true;
    }, { passive: true });
    categoryFeedHandle.addEventListener('touchmove', (e) => {
        if (!isFeedDragging) return;
        feedDragCurrentY = e.touches[0].clientY;
    }, { passive: true });
    categoryFeedHandle.addEventListener('touchend', () => {
        if (!isFeedDragging) return;
        if (feedDragCurrentY - feedDragStartY > 35) {
            closeCategoryFeed(true);
        }
        isFeedDragging = false;
    });
}

document.querySelectorAll('.hazard-type-pill').forEach((pill) => {
    pill.addEventListener('click', () => setSelectedReportType(pill.dataset.type));
});

if (routeOriginInput) {
    routeOriginInput.addEventListener('input', () => handleRouteAutocomplete('origin'));
}
if (routeDestInput) {
    routeDestInput.addEventListener('input', () => handleRouteAutocomplete('destination'));
    routeDestInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            calculateSafeRoute();
        }
    });
}

searchInput.addEventListener('focus', () => openRoutePanel());
searchInput.addEventListener('click', () => openRoutePanel());
searchInput.addEventListener('input', filterHazards);
searchInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (!query) return;
        const matches = await queryCdoSuggestions(query);
        if (matches.length > 0) {
            hideTopSearchSuggestions();
            routeToDestination(matches[0].subtitle || matches[0].title, matches[0].position);
        } else {
            openRoutePanel();
            routeDestInput.value = query;
            routeState.destCoords = null;
            calculateSafeRoute();
        }
    }
});

pullUpHandle.addEventListener('click', toggleSheet);
pullUpSectionTitle.addEventListener('click', toggleSheet);
hazardLocationInput.addEventListener('input', handleLocationInput);
hazardReportForm.addEventListener('submit', handleHazardSubmit);

setDefaultImages();
updateCategoryCards();
renderHazardMarkers();
filterHazards();
initializeFirebase();
