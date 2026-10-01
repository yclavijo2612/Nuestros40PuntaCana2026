const STORAGE_KEYS = {
  events: 'nuestros40-events',
  photos: 'nuestros40-photos',
  videos: 'nuestros40-videos',
  flights: 'nuestros40-flights',
  journal: 'nuestros40-journal',
  essentials: 'nuestros40-essentials',
  wifi: 'nuestros40-wifi',
  quotes: 'nuestros40-quotes',
  playlist: 'nuestros40-playlists',
  tiktok: 'nuestros40-tiktok'
};

const defaultEvents = [
  { id: 'sample-1', title: 'Brunch en la playa', date: '2026-11-07', time: '10:00', location: 'Playa Bávaro', detail: 'Primera mañana de sol y buena vibra, con jugos, fotos y risas desde el amanecer.' },
  { id: 'sample-2', title: 'Cena con música en vivo', date: '2026-11-09', time: '20:00', location: 'Punta Cana Village', detail: 'Noche especial para celebrar a las 40 con cocktail, baile y momentos inolvidables.' },
  { id: 'sample-3', title: 'Riu Palace: relax + piscina', date: '2026-11-10', time: '12:00', location: 'Riu Palace Punta Cana', detail: 'Día de piscina, relax, fotos y momentos de descanso total.', alarm: true },
  { id: 'sample-4', title: 'Riu Palace: fiesta de noche', date: '2026-11-11', time: '21:30', location: 'Riu Palace Punta Cana', detail: 'Fiesta, música y celebraciones de las 40 con todas.', alarm: true },
  { id: 'sample-5', title: 'Riu Palace: brunch + mar', date: '2026-11-13', time: '09:30', location: 'Riu Palace Punta Cana', detail: 'Un día perfecto para descansar, tomar sol y compartir risas.', alarm: true }
];

const defaultEssentials = [
  'Pasaporte y documentos de viaje',
  'Protector solar',
  'Gafas de sol',
  'Bloqueador labial',
  'Cargador portátil',
  'Cables de carga',
  'Ropa de baño',
  'Sandalias',
  'Ropa ligera para la noche',
  'Medicinas personales',
  'Toalla pequeña',
  'Dinero y tarjeta',
  'Batería extra para el celular'
];

const defaultQuotes = [
  'A los 40, la sonrisa vale más que la perfección.',
  'Las mejores amigas no se alejan, solo se vuelven historias más hermosas.',
  '40 años, 40 recuerdos y 1 sola historia inolvidable.',
  'Las que ríen juntas, viven más.',
  'En la vida no hay edad para ser felices, solo ganas de vivir.'
];

const defaultWifi = [
  { place: 'Santo Domingo Airport', info: 'Wi‑Fi gratuito en zonas de espera y áreas públicas. Requiere aceptar términos y usar conexión del aeropuerto.', type: 'Aeropuerto' },
  { place: 'Punta Cana Airport', info: 'Conectividad disponible en terminal y salas de espera. Busca la red pública del aeropuerto y acepta la condición.', type: 'Aeropuerto' },
  { place: 'Riu Palace Punta Cana', info: 'Wi‑Fi disponible en lobby, restaurante y zonas comunes. Ideal para compartir fotos y mensajes.', type: 'Hotel' },
  { place: 'Resort / lobby / restaurante', info: 'Conexión gratuita para huéspedes. La velocidad suele ser buena para mensajes y redes sociales.', type: 'Hotel' }
];

const defaultPlaylists = [
  { title: 'Punta Cana Summer Vibes', url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=7a1d7890f7b844a9', emoji: '☀️' },
  { title: 'Beach Party 2026', url: 'https://open.spotify.com/playlist/37i9dQZF1DXaXB8fQg7xif?si=40d0ad2f89d6451d', emoji: '🏖️' },
  { title: 'Party Mix Latina', url: 'https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd?si=709db1489e691488', emoji: '🎉' },
  { title: 'Caribbean Chill', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO?si=23d1fce730d64e76', emoji: '🌴' }
];

const defaultTikTok = [
  { title: 'Amigas en la playa', url: 'https://www.tiktok.com/tag/amigasenlaplaya' },
  { title: 'Fiesta con amigas', url: 'https://www.tiktok.com/tag/fiestaconamigas' },
  { title: 'Beach girls', url: 'https://www.tiktok.com/tag/beachgirls' },
  { title: 'Punta Cana vibes', url: 'https://www.tiktok.com/tag/puntacanavibes' }
];

const eventForm = document.querySelector('#event-form');
const eventList = document.querySelector('#event-list');
const photoInput = document.querySelector('#photo-input');
const photoGallery = document.querySelector('#photo-gallery');
const videoInput = document.querySelector('#video-input');
const videoGallery = document.querySelector('#video-gallery');
const flightForm = document.querySelector('#flight-form');
const flightList = document.querySelector('#flight-list');
const journalForm = document.querySelector('#journal-form');
const journalList = document.querySelector('#journal-list');
const essentialsList = document.querySelector('#essentials-list');
const essentialsForm = document.querySelector('#essentials-form');
const wifiList = document.querySelector('#wifi-list');
const quoteList = document.querySelector('#quote-list');
const playlistList = document.querySelector('#playlist-list');
const tiktokList = document.querySelector('#tiktok-list');
const alarmTimers = new Map();

function read(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(prefix = 'item') {
  return `${prefix}-${crypto.randomUUID?.() || Date.now()}`;
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function dateText(dateString) {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${dateString}T12:00:00`));
}

function eventDateValue(event) {
  return new Date(`${event.date}T${event.time || '00:00'}:00`);
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function scheduleAlarm(item) {
  if (!item?.date || !item?.time) return;
  const when = eventDateValue(item).getTime() - 30 * 60 * 1000;
  const delay = when - Date.now();
  if (delay <= 0 || delay > 2147483647) return;
  clearTimeout(alarmTimers.get(item.id));
  alarmTimers.set(item.id, setTimeout(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⏰ Actividad en 30 minutos', { body: `${item.title} · ${item.location}` });
    }
    if (navigator.vibrate) navigator.vibrate([250, 100, 250]);
  }, delay));
}

function renderEvents() {
  const events = [...read(STORAGE_KEYS.events, defaultEvents)].sort((a, b) => eventDateValue(a) - eventDateValue(b));
  eventList.innerHTML = events.map((event) => `
    <article class="event-card">
      <span class="date">${dateText(event.date)} · ${esc(event.time)}</span>
      <h3>${esc(event.title)}</h3>
      <p class="event-location">📍 ${esc(event.location || 'Lugar pendiente')}</p>
      <p>${esc(event.detail)}</p>
      <small>⏰ Alarma automática 30 minutos antes</small>
      <div class="event-actions">
        <button type="button" class="btn-small" data-edit-event="${event.id}">✏️ Editar</button>
        <button type="button" class="btn-small" data-delete-event="${event.id}">🗑️ Borrar</button>
      </div>
    </article>
  `).join('');
  events.forEach(scheduleAlarm);
}

function handleEventSubmit(event) {
  event.preventDefault();
  const item = {
    id: uid('event'),
    title: document.querySelector('#event-title').value.trim(),
    date: document.querySelector('#event-date').value,
    time: document.querySelector('#event-time').value,
    location: document.querySelector('#event-location').value.trim(),
    detail: document.querySelector('#event-detail').value.trim()
  };
  if (!item.title || !item.date || !item.time || !item.location || !item.detail) return;
  const current = read(STORAGE_KEYS.events, defaultEvents);
  save(STORAGE_KEYS.events, [item, ...current]);
  eventForm.reset();
  renderEvents();
}

eventList?.addEventListener('click', (event) => {
  const edit = event.target.closest('[data-edit-event]');
  const del = event.target.closest('[data-delete-event]');
  const items = read(STORAGE_KEYS.events, defaultEvents);
  if (edit) {
    const item = items.find((entry) => entry.id === edit.dataset.editEvent);
    if (!item) return;
    const nextTitle = prompt('Título de la actividad:', item.title); if (nextTitle === null) return;
    const nextDate = prompt('Fecha (AAAA-MM-DD):', item.date); if (nextDate === null) return;
    const nextTime = prompt('Hora (HH:MM):', item.time); if (nextTime === null) return;
    const nextLocation = prompt('Lugar:', item.location); if (nextLocation === null) return;
    const nextDetail = prompt('Detalle:', item.detail); if (nextDetail === null) return;
    if (!nextTitle.trim() || !nextDate || !nextTime || !nextLocation.trim() || !nextDetail.trim()) return alert('Completa todos los campos.');
    Object.assign(item, { title: nextTitle.trim(), date: nextDate, time: nextTime, location: nextLocation.trim(), detail: nextDetail.trim() });
    save(STORAGE_KEYS.events, items);
    renderEvents();
  }
  if (del) {
    const targetId = del.dataset.deleteEvent;
    clearTimeout(alarmTimers.get(targetId));
    save(STORAGE_KEYS.events, items.filter((entry) => entry.id !== targetId));
    renderEvents();
  }
});

function readFilesAsDataUrls(files) {
  return Promise.all(Array.from(files).map((file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  })));
}

function normalizePhotos(photos) {
  return photos.map((photo) => typeof photo === 'string' ? { id: uid('photo'), src: photo, uploadedBy: 'Punta Cana 2026' } : photo);
}

function renderPhotos() {
  const photos = normalizePhotos(read(STORAGE_KEYS.photos, [
    { id: 'sample-photo-1', src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80', uploadedBy: 'Punta Cana 2026' },
    { id: 'sample-photo-2', src: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80', uploadedBy: 'Punta Cana 2026' }
  ]));

  photoGallery.innerHTML = photos.map((photo, index) => `
    <figure class="photo-card">
      <img src="${photo.src}" alt="Foto de ${esc(photo.uploadedBy)}">
      <figcaption>📸 ${esc(photo.uploadedBy)}</figcaption>
      <button type="button" class="btn-delete-photo" data-photo-index="${index}" title="Borrar foto">✕</button>
      <a class="download-btn" href="${photo.src}" download="foto-${index + 1}.jpg" title="Descargar foto">⬇️</a>
    </figure>
  `).join('');
}

photoInput?.addEventListener('change', async (event) => {
  if (!event.target.files?.length) return;
  const uploadedBy = prompt('¿Quién sube estas fotos?', 'Una amiga') || 'Una amiga';
  const urls = await readFilesAsDataUrls(event.target.files);
  const current = normalizePhotos(read(STORAGE_KEYS.photos, [
    { id: 'sample-photo-1', src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80', uploadedBy: 'Punta Cana 2026' },
    { id: 'sample-photo-2', src: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80', uploadedBy: 'Punta Cana 2026' }
  ]));
  save(STORAGE_KEYS.photos, urls.map((src) => ({ id: uid('photo'), src, uploadedBy: uploadedBy.trim() || 'Una amiga' })).concat(current));
  photoInput.value = '';
  renderPhotos();
});

photoGallery?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-photo-index]');
  if (!button) return;
  const photos = normalizePhotos(read(STORAGE_KEYS.photos, [
    { id: 'sample-photo-1', src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80', uploadedBy: 'Punta Cana 2026' },
    { id: 'sample-photo-2', src: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80', uploadedBy: 'Punta Cana 2026' }
  ]));
  photos.splice(Number(button.dataset.photoIndex), 1);
  save(STORAGE_KEYS.photos, photos);
  renderPhotos();
});

function renderVideos() {
  const videos = read(STORAGE_KEYS.videos, []);
  videoGallery.innerHTML = videos.map((src, index) => `
    <figure class="video-card">
      <video src="${src}" controls></video>
      <button type="button" class="btn-delete-video" data-video-index="${index}" title="Borrar video">✕</button>
      <a class="download-btn" href="${src}" download="video-${index + 1}.mp4" title="Descargar video">⬇️</a>
    </figure>
  `).join('');
}

videoInput?.addEventListener('change', async (event) => {
  if (!event.target.files?.length) return;
  const urls = await readFilesAsDataUrls(event.target.files);
  const current = read(STORAGE_KEYS.videos, []);
  save(STORAGE_KEYS.videos, urls.concat(current));
  videoInput.value = '';
  renderVideos();
});

videoGallery?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-video-index]');
  if (!button) return;
  const videos = read(STORAGE_KEYS.videos, []);
  videos.splice(Number(button.dataset.videoIndex), 1);
  save(STORAGE_KEYS.videos, videos);
  renderVideos();
});

function renderFlights() {
  const flights = read(STORAGE_KEYS.flights, []);
  flightList.innerHTML = flights.map((flight, index) => `
    <article class="flight-card">
      <strong>✈️ ${esc(flight.airline)} ${esc(flight.number)}</strong>
      <span>${esc(flight.date)} · ${esc(flight.time)}</span>
      <span>Origen: ${esc(flight.origin)} → Punta Cana</span>
      <span class="flight-status">Estado: ${esc(flight.status)}</span>
      <button type="button" class="btn-small" data-flight-index="${index}">🗑️ Borrar</button>
    </article>
  `).join('') || '<p>No hay vuelos agregados aún.</p>';
}

flightForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const flight = {
    airline: document.querySelector('#flight-airline').value.trim(),
    number: document.querySelector('#flight-number').value.trim(),
    date: document.querySelector('#flight-date').value,
    time: document.querySelector('#flight-time').value,
    origin: document.querySelector('#flight-origin').value.trim(),
    status: document.querySelector('#flight-status').value
  };
  if (!flight.airline || !flight.number || !flight.date || !flight.time || !flight.origin) return;
  const current = read(STORAGE_KEYS.flights, []);
  save(STORAGE_KEYS.flights, [flight, ...current]);
  flightForm.reset();
  renderFlights();
});

flightList?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-flight-index]');
  if (!button) return;
  const flights = read(STORAGE_KEYS.flights, []);
  flights.splice(Number(button.dataset.flightIndex), 1);
  save(STORAGE_KEYS.flights, flights);
  renderFlights();
});

function renderJournal() {
  const entries = read(STORAGE_KEYS.journal, []);
  journalList.innerHTML = entries.map((entry, index) => `
    <article class="journal-card">
      <h3>${esc(entry.title)}</h3>
      <p>${esc(entry.text)}</p>
      <small>✍️ ${esc(entry.author)}</small>
      <button type="button" class="btn-small" data-journal-index="${index}">🗑️ Borrar</button>
    </article>
  `).join('') || '<p>Aún no hay recuerdos escritos. ¡Sea la primera!</p>';
}

journalForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const entry = {
    title: document.querySelector('#journal-title').value.trim(),
    author: document.querySelector('#journal-author').value.trim(),
    text: document.querySelector('#journal-text').value.trim()
  };
  if (!entry.title || !entry.author || !entry.text) return;
  const current = read(STORAGE_KEYS.journal, []);
  save(STORAGE_KEYS.journal, [entry, ...current]);
  journalForm.reset();
  renderJournal();
});

journalList?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-journal-index]');
  if (!button) return;
  const entries = read(STORAGE_KEYS.journal, []);
  entries.splice(Number(button.dataset.journalIndex), 1);
  save(STORAGE_KEYS.journal, entries);
  renderJournal();
});

function renderEssentials() {
  const items = read(STORAGE_KEYS.essentials, defaultEssentials);
  essentialsList.innerHTML = items.map((item, index) => `
    <li>
      <input type="checkbox" />
      <span>${esc(item)}</span>
      <button type="button" class="mini-delete" data-essential-index="${index}">✕</button>
    </li>
  `).join('');
}

essentialsForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = document.querySelector('#essential-input').value.trim();
  if (!value) return;
  const current = read(STORAGE_KEYS.essentials, defaultEssentials);
  save(STORAGE_KEYS.essentials, [value, ...current]);
  essentialsForm.reset();
  renderEssentials();
});

essentialsList?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-essential-index]');
  if (!button) return;
  const items = read(STORAGE_KEYS.essentials, defaultEssentials);
  items.splice(Number(button.dataset.essentialIndex), 1);
  save(STORAGE_KEYS.essentials, items);
  renderEssentials();
});

function renderWifi() {
  const items = read(STORAGE_KEYS.wifi, defaultWifi);
  wifiList.innerHTML = items.map((entry) => `
    <li><strong>${esc(entry.place)}</strong><span>${esc(entry.type)}</span><p>${esc(entry.info)}</p></li>
  `).join('');
}

function renderQuotes() {
  const items = read(STORAGE_KEYS.quotes, defaultQuotes);
  quoteList.innerHTML = items.map((quote) => `<li>“${esc(quote)}”</li>`).join('');
}

function renderPlaylists() {
  const items = read(STORAGE_KEYS.playlist, defaultPlaylists);
  playlistList.innerHTML = items.map((item) => `
    <a href="${item.url}" target="_blank" rel="noopener" class="playlist-item">${item.emoji} ${esc(item.title)}</a>
  `).join('');
}

function renderTikTok() {
  const items = read(STORAGE_KEYS.tiktok, defaultTikTok);
  tiktokList.innerHTML = items.map((item) => `
    <a href="${item.url}" target="_blank" rel="noopener" class="tiktok-item">🎵 ${esc(item.title)}</a>
  `).join('');
}

window.addEventListener('DOMContentLoaded', () => {
  requestNotificationPermission();
  renderEvents();
  renderPhotos();
  renderVideos();
  renderFlights();
  renderJournal();
  renderEssentials();
  renderWifi();
  renderQuotes();
  renderPlaylists();
  renderTikTok();
});
