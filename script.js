const map = L.map('map').setView([8.485983, 124.649128], 13);

const MAPBOX_TOKEN = 'pk.eyJ1IjoiaWNlejc3NzciLCJhIjoiY213MjdjdmF2MDBhcjMwb241Y2Vsbng0byJ9.6bH3-ZjfMblsBG0dnsCv-w'

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

function toggleSheet() {
pullUpSection.classList.toggle('expanded');
}

pullUpHandle.addEventListener('click', toggleSheet);
pullUpSectionTitle.addEventListener('click', toggleSheet);

function handleTouchStart(e) {
    if (e.target.closest('#PullUpSectionContent') && !pullUpSection.classList.contains('expanded')) {
        return;
    }

    let startY = e.touches[0].clientY;
    isDragging = true;
}

function handleTouchMove(e) {
    if (!isDragging) return;

    let currentY = e.touches[0].clientY;
}

function handleTouchEnd(e) {
    let deltaY = currentY - startY;

    if (deltaY < -50) {
        pullUpSection.classList.add('expanded');
    } else if (deltaY > 50) {
        pullUpSection.classList.remove('expanded');
    }

    isDragging = false;
}