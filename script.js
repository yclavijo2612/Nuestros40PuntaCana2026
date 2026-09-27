const STORAGE_KEYS = {
  events: 'nuestros40-events',
  photos: 'nuestros40-photos',
  videos: 'nuestros40-videos',
  flights: 'nuestros40-flights',
  journal: 'nuestros40-journal'
};

const sampleEvents = [
  {id: 'sample-1', title: 'Brunch en la playa', date: '2026-02-18', time: '10:00', location: 'Playa Bávaro', detail: 'Primera mañana de sol y buena vibra, con jugos, fotos y risas desde el amanecer.'},
  {id: 'sample-2', title: 'Cena con música en vivo', date: '2026-02-19', time: '20:00', location: 'Punta Cana Village', detail: 'Noche especial para celebrar a las 40 con cocktail, baile y momentos inolvidables.'}
];
const samplePhotos = [
  {id: 'sample-photo-1', src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80', uploadedBy: 'Punta Cana 2026'},
  {id: 'sample-photo-2', src: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80', uploadedBy: 'Punta Cana 2026'}
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
const alarmTimers = new Map();

function read(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function uid(prefix='item') { return `${prefix}-${crypto.randomUUID?.() || Date.now()}`; }
function esc(value) { return String(value ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function dateText(dateString) { return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${dateString}T12:00:00`)); }
function eventDateValue(event) { return new Date(`${event.date}T${event.time || '00:00'}:00`); }

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
}
function scheduleAlarm(eventItem) {
  if (!eventItem?.date || !eventItem?.time) return;
  const when = eventDateValue(eventItem).getTime() - 30 * 60 * 1000;
  const delay = when - Date.now();
  if (delay <= 0 || delay > 2147483647) return;
  clearTimeout(alarmTimers.get(eventItem.id));
  alarmTimers.set(eventItem.id, setTimeout(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⏰ Actividad en 30 minutos', { body: `${eventItem.title} · ${eventItem.location}` });
    }
    if (navigator.vibrate) navigator.vibrate([250, 100, 250]);
  }, delay));
}
function renderEvents() {
  const events = [...read(STORAGE_KEYS.events, sampleEvents)].sort((a, b) => eventDateValue(a) - eventDateValue(b));
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
  const current = read(STORAGE_KEYS.events, sampleEvents);
  save(STORAGE_KEYS.events, [item, ...current]);
  eventForm.reset();
  renderEvents();
}

eventList?.addEventListener('click', (event) => {
  const edit = event.target.closest('[data-edit-event]');
  const del = event.target.closest('[data-delete-event]');
  const items = read(STORAGE_KEYS.events, sampleEvents);
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
  const photos = normalizePhotos(read(STORAGE_KEYS.photos, samplePhotos));
  photoGallery.innerHTML = photos.map((photo, index) => `
    <figure class="photo-card">
      <img src="${photo.src}" alt="Foto de ${esc(photo.uploadedBy)}">
      <figcaption>📸 ${esc(photo.uploadedBy)}</figcaption>
      <button type="button" class="btn-delete-photo" data-photo-index="${index}" title="Borrar foto">✕</button>
    </figure>
  `).join('');
}
photoInput?.addEventListener('change', async (event) => {
  if (!event.target.files?.length) return;
  const uploadedBy = prompt('¿Quién sube estas fotos?', 'Una amiga') || 'Una amiga';
  const urls = await readFilesAsDataUrls(event.target.files);
  const current = normalizePhotos(read(STORAGE_KEYS.photos, samplePhotos));
  save(STORAGE_KEYS.photos, urls.map((src) => ({ id: uid('photo'), src, uploadedBy: uploadedBy.trim() || 'Una amiga' })).concat(current));
  photoInput.value = '';
  renderPhotos();
});
photoGallery?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-photo-index]');
  if (!button) return;
  const photos = normalizePhotos(read(STORAGE_KEYS.photos, samplePhotos));
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

window.addEventListener('DOMContentLoaded', () => {
  requestNotificationPermission();
  renderEvents();
  renderPhotos();
  renderVideos();
  renderFlights();
  renderJournal();
});
