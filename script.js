import {
  initializeApp, initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc, runTransaction,
  serverTimestamp, query, orderBy,
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, deleteUser, getDoc
} from './vendor/firebase.js';
import { firebaseConfig } from './firebase-config.js';

/* ---------- Firebase ---------- */

const app = initializeApp(firebaseConfig);
let db;
try {
  // Caché local: el sitio sigue funcionando con mala señal y sincroniza al volver.
  db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
} catch {
  db = initializeFirestore(app, {});
}
const auth = getAuth(app);

/* ---------- Datos fijos ---------- */

// Hora de Punta Cana (UTC-4, sin horario de verano). Así la hora de cada
// actividad es la misma para todas, sin importar desde qué país abran el sitio.
const TRIP_OFFSET = '-04:00';

const defaultEvents = [
  { id: 'sample-1', title: 'Brunch en la playa', date: '2026-11-07', time: '10:00', location: 'Playa Bávaro', detail: 'Primera mañana de sol y buena vibra, con jugos, fotos y risas desde el amanecer.' },
  { id: 'sample-2', title: 'Cena con música en vivo', date: '2026-11-09', time: '20:00', location: 'Punta Cana Village', detail: 'Noche especial para celebrar a las 40 con cocktail, baile y momentos inolvidables.' },
  { id: 'sample-3', title: 'Riu Palace: relax + piscina', date: '2026-11-10', time: '12:00', location: 'Riu Palace Punta Cana', detail: 'Día de piscina, relax, fotos y descanso total.' },
  { id: 'sample-4', title: 'Riu Palace: fiesta de noche', date: '2026-11-11', time: '21:30', location: 'Riu Palace Punta Cana', detail: 'Fiesta, música y celebraciones de las 40 con todas.' },
  { id: 'sample-5', title: 'Riu Palace: brunch + mar', date: '2026-11-13', time: '09:30', location: 'Riu Palace Punta Cana', detail: 'Un día perfecto para descansar, tomar sol y compartir risas.' }
];

const defaultEssentials = [
  'Pasaporte y documentos de viaje', 'Protector solar', 'Gafas de sol', 'Bloqueador labial',
  'Cargador portátil', 'Cables de carga', 'Ropa de baño', 'Sandalias', 'Ropa ligera para la noche',
  'Medicinas personales', 'Toalla pequeña', 'Dinero y tarjeta', 'Batería extra para el celular'
];

const quotes = [
  'A los 40, la sonrisa vale más que la perfección.',
  'Las mejores amigas no se alejan, solo se vuelven historias más hermosas.',
  '40 años, 40 recuerdos y 1 sola historia inolvidable.',
  'Las que ríen juntas, viven más.',
  'En la vida no hay edad para ser felices, solo ganas de vivir.'
];

const wifiSpots = [
  { place: 'Santo Domingo Airport', info: 'Wi‑Fi gratuito en zonas de espera y áreas públicas. Requiere aceptar términos y usar conexión del aeropuerto.', type: 'Aeropuerto' },
  { place: 'Punta Cana Airport', info: 'Conectividad disponible en terminal y salas de espera. Busca la red pública del aeropuerto y acepta la condición.', type: 'Aeropuerto' },
  { place: 'Riu Palace Punta Cana', info: 'Wi‑Fi disponible en lobby, restaurante y zonas comunes. Ideal para compartir fotos y mensajes.', type: 'Hotel' },
  { place: 'Resort / lobby / restaurante', info: 'Conexión gratuita para huéspedes. La velocidad suele ser buena para mensajes y redes sociales.', type: 'Hotel' }
];

const playlists = [
  { title: 'Reggaeton + Playa', url: 'https://open.spotify.com/search/reggaeton%20playlist', emoji: '🔥' },
  { title: 'Salsa del Caribe', url: 'https://open.spotify.com/search/salsa%20caribe%20playlist', emoji: '💃' },
  { title: 'Latina Mix', url: 'https://open.spotify.com/search/latina%20playlist', emoji: '🎶' },
  { title: 'Vibra Tropical', url: 'https://open.spotify.com/search/tropical%20party%20playlist', emoji: '🌴' }
];

const tiktoks = [
  { title: 'Amigas en la playa', url: 'https://www.tiktok.com/tag/amigasenlaplaya' },
  { title: 'Fiesta con amigas', url: 'https://www.tiktok.com/tag/fiestaconamigas' },
  { title: 'Beach girls', url: 'https://www.tiktok.com/tag/beachgirls' },
  { title: 'Punta Cana vibes', url: 'https://www.tiktok.com/tag/puntacanavibes' }
];

/* ---------- Utilidades ---------- */

const $ = (selector) => document.querySelector(selector);
const state = { events: [], flights: [], journal: [], essentials: [], photos: [], videos: [] };
const alarmTimers = new Map();
const unsubscribers = [];
let editingEventId = null;
let currentName = '';

// Quién crea cada cosa (se guarda junto con el dato).
function stamp() {
  return { createdAt: serverTimestamp(), createdBy: auth.currentUser?.uid || '', createdByName: currentName };
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function safeUrl(url) {
  return /^https:\/\//i.test(url || '') ? esc(url) : '#';
}

function localGet(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}

function localSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sin espacio o modo privado */ }
}

function eventDate(item) {
  return new Date(`${item.date}T${item.time || '00:00'}:00${TRIP_OFFSET}`);
}

function dateText(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function byCreatedDesc(a, b) {
  return (b.createdAt?.toMillis?.() ?? Date.now()) - (a.createdAt?.toMillis?.() ?? Date.now());
}

function showStatus(message, isError = false) {
  const banner = $('#sync-status');
  if (!banner) return;
  banner.textContent = message;
  banner.hidden = !message;
  banner.classList.toggle('error', isError);
}

function reportError(error, action = 'guardar') {
  console.error(error);
  if (error?.code === 'permission-denied') {
    showStatus('⚠️ La base de datos todavía no tiene permisos configurados. Avísale a quien administra el sitio.', true);
  } else {
    alert(`No se pudo ${action}. Revisa tu conexión e inténtalo de nuevo.`);
  }
}

function listen(name, render) {
  const q = query(collection(db, name), orderBy('createdAt', 'desc'));
  unsubscribers.push(onSnapshot(q, (snapshot) => {
    state[name] = snapshot.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }));
    render();
  }, (error) => reportError(error, 'cargar los datos')));
}

/* ---------- Agenda ---------- */

function renderEvents() {
  const list = $('#event-list');
  if (!list) return;
  const events = [...state.events].sort((a, b) => eventDate(a) - eventDate(b));
  list.innerHTML = events.map((item) => `
    <article class="event-card">
      <span class="date">${esc(dateText(item.date))} · ${esc(item.time)}</span>
      <h3>${esc(item.title)}</h3>
      <p class="event-location">📍 ${esc(item.location || 'Lugar pendiente')}</p>
      <p>${esc(item.detail)}</p>
      <small>⏰ Usa “Agregar al calendario” para que el celular te avise 30 minutos antes</small>
      <div class="event-actions">
        <button type="button" class="btn-small" data-calendar-event="${esc(item.id)}">📱 Agregar al calendario</button>
        <button type="button" class="btn-small" data-edit-event="${esc(item.id)}">✏️ Editar</button>
        <button type="button" class="btn-small" data-delete-event="${esc(item.id)}">🗑️ Borrar</button>
      </div>
    </article>
  `).join('') || '<p>No hay actividades todavía.</p>';
  events.forEach(scheduleAlarm);
}

function setEventFormMode(item) {
  editingEventId = item?.id || null;
  $('#event-title').value = item?.title || '';
  $('#event-date').value = item?.date || '';
  $('#event-time').value = item?.time || '';
  $('#event-location').value = item?.location || '';
  $('#event-detail').value = item?.detail || '';
  $('#event-submit').textContent = item ? 'Guardar cambios' : 'Agregar actividad';
  $('#event-cancel').hidden = !item;
  if (item) $('#event-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function handleEventSubmit(event) {
  event.preventDefault();
  const item = {
    title: $('#event-title').value.trim(),
    date: $('#event-date').value,
    time: $('#event-time').value,
    location: $('#event-location').value.trim(),
    detail: $('#event-detail').value.trim()
  };
  if (!item.title || !item.date || !item.time || !item.location || !item.detail) {
    alert('Completa todos los campos de la actividad');
    return;
  }
  const button = $('#event-submit');
  button.disabled = true;
  try {
    if (editingEventId) {
      await updateDoc(doc(db, 'events', editingEventId), item);
    } else {
      await addDoc(collection(db, 'events'), { ...item, ...stamp() });
    }
    setEventFormMode(null);
  } catch (error) {
    reportError(error);
  } finally {
    button.disabled = false;
  }
}

async function handleEventListClick(event) {
  const calendar = event.target.closest('[data-calendar-event]');
  const edit = event.target.closest('[data-edit-event]');
  const del = event.target.closest('[data-delete-event]');
  const button = calendar || edit || del;
  if (!button) return;
  const id = button.dataset.calendarEvent ?? button.dataset.editEvent ?? button.dataset.deleteEvent;
  const item = state.events.find((entry) => entry.id === id);
  if (!item) return;

  if (calendar) downloadCalendarEvent(item);
  if (edit) setEventFormMode(item);
  if (del && confirm(`¿Borrar “${item.title}” para todas?`)) {
    try { await deleteDoc(doc(db, 'events', item.id)); } catch (error) { reportError(error, 'borrar'); }
  }
}

/* Alarma mientras la página está abierta (el aviso fiable es el del calendario). */
function scheduleAlarm(item) {
  if (!item?.date || !item?.time) return;
  clearTimeout(alarmTimers.get(item.id));
  const delay = eventDate(item).getTime() - 30 * 60 * 1000 - Date.now();
  if (delay <= 0 || delay > 2147483647) return;
  alarmTimers.set(item.id, setTimeout(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⏰ Actividad en 30 minutos', { body: `${item.title} · ${item.location}` });
    }
    navigator.vibrate?.([250, 100, 250]);
  }, delay));
}

function enableAlerts() {
  if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  alert('📱 Para recibir el aviso aunque el celular esté bloqueado, toca “Agregar al calendario” en cada actividad. La alarma queda 30 minutos antes.');
}

function escapeIcs(value) {
  return String(value ?? '').replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\r?\n/g, '\\n');
}

function icsDate(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function downloadCalendarEvent(item) {
  const start = eventDate(item);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nuestros40 Punta Cana//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    `UID:${item.id}@nuestros40puntacana`, `DTSTAMP:${icsDate(new Date())}`, `DTSTART:${icsDate(start)}`, `DTEND:${icsDate(end)}`,
    `SUMMARY:${escapeIcs(item.title)}`, `LOCATION:${escapeIcs(item.location)}`, `DESCRIPTION:${escapeIcs(item.detail)}`,
    'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', `DESCRIPTION:Recordatorio: ${escapeIcs(item.title)}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'
  ];
  const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(item.title || 'actividad').replace(/[^a-z0-9áéíóúñ]+/gi, '_')}-${item.date}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/* ---------- Fotos y videos ---------- */

// Las fotos se guardan dentro de Firestore (plan gratis, sin Storage):
// una miniatura en "photos" para la galería y la foto grande en "photoFull" (mismo ID),
// que solo se descarga cuando alguien la abre.
function isDataImage(src) {
  return /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(src || '');
}

function renderPhotos() {
  const gallery = $('#photo-gallery');
  if (!gallery) return;
  gallery.innerHTML = state.photos.filter((photo) => isDataImage(photo.thumb)).map((photo) => `
    <figure class="photo-card">
      <img src="${photo.thumb}" alt="Foto de ${esc(photo.uploadedBy)}" loading="lazy" data-open-photo="${esc(photo.id)}">
      <figcaption>📸 ${esc(photo.uploadedBy)}</figcaption>
      <button type="button" class="btn-delete-photo" data-delete-photo="${esc(photo.id)}" title="Borrar foto">✕</button>
      <button type="button" class="download-btn" data-open-photo="${esc(photo.id)}" title="Ver en grande y guardar">⬇️</button>
    </figure>
  `).join('') || '<p>No hay fotos aún. ¡Sube la primera!</p>';
}

function videoEmbed(url) {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/i);
  if (yt) return `<iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}" title="Video" allow="encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
  if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) return `<video src="${esc(url)}" controls playsinline preload="metadata"></video>`;
  return '';
}

function renderVideos() {
  const gallery = $('#video-gallery');
  if (!gallery) return;
  gallery.innerHTML = state.videos.filter((video) => /^https:\/\//i.test(video.url || '')).map((video) => {
    const embed = videoEmbed(video.url);
    return `
    <figure class="video-card ${embed ? '' : 'video-link-card'}">
      ${embed || '<div class="video-placeholder">🎬</div>'}
      <figcaption>
        <strong>${esc(video.title || 'Video del viaje')}</strong>
        <span>🎥 ${esc(video.uploadedBy)}</span>
        <a class="btn-small" href="${esc(video.url)}" target="_blank" rel="noopener">▶️ Abrir video</a>
      </figcaption>
      <button type="button" class="btn-delete-video" data-delete-video="${esc(video.id)}" title="Quitar video">✕</button>
    </figure>`;
  }).join('') || '<p>No hay videos aún. Pega el link de un video para compartirlo.</p>';
}

async function loadBitmap(source) {
  if (typeof source === 'string') {
    const img = new Image();
    img.src = source;
    await img.decode();
    return img;
  }
  try {
    return await createImageBitmap(source, { imageOrientation: 'from-image' });
  } catch {
    const url = URL.createObjectURL(source);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

// Convierte la foto a JPEG achicando tamaño y calidad hasta que entre en el límite.
function toJpeg(bitmap, maxSide, maxChars) {
  const width = bitmap.width || bitmap.naturalWidth;
  const height = bitmap.height || bitmap.naturalHeight;
  let side = maxSide;
  let quality = 0.82;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const scale = Math.min(1, side / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (dataUrl.length <= maxChars) return dataUrl;
    if (quality > 0.55) quality -= 0.1; else side = Math.round(side * 0.8);
  }
  throw new Error('No se pudo achicar la foto');
}

async function photoVersions(source) {
  const bitmap = await loadBitmap(source);
  return {
    thumb: toJpeg(bitmap, 480, 90000),
    full: toJpeg(bitmap, 1600, 900000)
  };
}

async function savePhoto(id, versions, uploadedBy) {
  await setDoc(doc(db, 'photoFull', id), { src: versions.full, ...stamp() });
  await setDoc(doc(db, 'photos', id), { thumb: versions.thumb, uploadedBy, ...stamp() });
}

function newId(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`;
}

function askUploader() {
  return (currentName || 'Una amiga').slice(0, 80);
}

async function handlePhotoInput(event) {
  const files = Array.from(event.target.files || []);
  event.target.value = '';
  if (!files.length) return;
  const uploadedBy = askUploader();
  let failed = 0;
  for (const [index, file] of files.entries()) {
    showStatus(`⏳ Subiendo foto ${index + 1} de ${files.length}…`);
    try {
      await savePhoto(newId('photo'), await photoVersions(file), uploadedBy);
    } catch (error) {
      console.error(error);
      if (error?.code === 'permission-denied') { showStatus(''); reportError(error); return; }
      failed += 1;
    }
  }
  showStatus('');
  if (failed) alert(`${failed} foto(s) no se pudieron subir. Prueba con otra o revisa tu conexión.`);
}

async function openPhoto(id) {
  const photo = state.photos.find((entry) => entry.id === id);
  if (!photo) return;
  const viewer = $('#photo-viewer');
  const img = $('#photo-viewer-img');
  const save = $('#photo-viewer-save');
  img.src = photo.thumb;
  save.removeAttribute('href');
  $('#photo-viewer-by').textContent = `📸 ${photo.uploadedBy || ''}`;
  viewer.hidden = false;
  document.body.classList.add('viewer-open');
  try {
    const snap = await getDoc(doc(db, 'photoFull', id));
    const src = snap.exists() ? snap.data().src : '';
    if (isDataImage(src) && !viewer.hidden) {
      img.src = src;
      save.href = src;
      save.download = `foto-punta-cana-${id.slice(-6)}.jpg`;
    }
  } catch (error) {
    console.error(error);
  }
}

function closePhoto() {
  $('#photo-viewer').hidden = true;
  $('#photo-viewer-img').removeAttribute('src');
  document.body.classList.remove('viewer-open');
}

async function handleVideoSubmit(event) {
  event.preventDefault();
  const url = $('#video-url').value.trim();
  const title = $('#video-title').value.trim();
  if (!/^https:\/\/\S+$/i.test(url)) {
    alert('Pega un link que empiece con https:// (de Google Fotos, Drive, YouTube, iCloud, etc.).');
    return;
  }
  try {
    await addDoc(collection(db, 'videos'), { url: url.slice(0, 2000), title: title.slice(0, 120), uploadedBy: askUploader(), ...stamp() });
    event.target.reset();
  } catch (error) {
    reportError(error);
  }
}

async function deleteMedia(kind, id) {
  const item = state[kind].find((entry) => entry.id === id);
  if (!item || !confirm(kind === 'photos' ? '¿Borrar esta foto para todas?' : '¿Quitar este video para todas?')) return;
  try {
    await deleteDoc(doc(db, kind, id));
    if (kind === 'photos') await deleteDoc(doc(db, 'photoFull', id)).catch(() => {});
  } catch (error) {
    reportError(error, 'borrar');
  }
}

/* ---------- Vuelos, diario y lista ---------- */

function renderFlights() {
  const list = $('#flight-list');
  if (!list) return;
  const flights = [...state.flights].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  list.innerHTML = flights.map((flight) => `
    <article class="flight-card">
      <strong>✈️ ${esc(flight.airline)} ${esc(flight.number)}</strong>
      <span>${esc(dateText(flight.date))} · ${esc(flight.time)}</span>
      <span>Origen: ${esc(flight.origin)} → Punta Cana</span>
      <span class="flight-status">Estado: ${esc(flight.status)}</span>
      <button type="button" class="btn-small" data-delete-flight="${esc(flight.id)}">🗑️ Borrar</button>
    </article>
  `).join('') || '<p>No hay vuelos agregados aún.</p>';
}

function renderJournal() {
  const list = $('#journal-list');
  if (!list) return;
  list.innerHTML = state.journal.map((entry) => `
    <article class="journal-card">
      <h3>${esc(entry.title)}</h3>
      <p>${esc(entry.text)}</p>
      <small>✍️ ${esc(entry.author)}</small>
      <button type="button" class="btn-small" data-delete-journal="${esc(entry.id)}">🗑️ Borrar</button>
    </article>
  `).join('') || '<p>Aún no hay recuerdos escritos. ¡Sea la primera!</p>';
}

// Los ✓ de la maleta son personales: cada una marca lo que ya empacó en su celular.
function renderEssentials() {
  const list = $('#essentials-list');
  if (!list) return;
  const checked = localGet('nuestros40-checked', {});
  const items = [...state.essentials].sort((a, b) => -byCreatedDesc(a, b));
  list.innerHTML = items.map((item) => `
    <li>
      <input type="checkbox" data-check-essential="${esc(item.id)}" ${checked[item.id] ? 'checked' : ''} />
      <span>${esc(item.text)}</span>
      <button type="button" class="mini-delete" data-delete-essential="${esc(item.id)}" aria-label="Eliminar item">✕</button>
    </li>
  `).join('');
}

function bindSimpleDelete(listSelector, attr, collectionName, labelFn) {
  $(listSelector)?.addEventListener('click', async (event) => {
    const button = event.target.closest(`[${attr}]`);
    if (!button) return;
    const id = button.getAttribute(attr);
    const item = state[collectionName].find((entry) => entry.id === id);
    if (!item || !confirm(`¿Borrar ${labelFn(item)} para todas?`)) return;
    try { await deleteDoc(doc(db, collectionName, id)); } catch (error) { reportError(error, 'borrar'); }
  });
}

function bindForms() {
  $('#event-form')?.addEventListener('submit', handleEventSubmit);
  $('#event-cancel')?.addEventListener('click', () => setEventFormMode(null));
  $('#event-list')?.addEventListener('click', handleEventListClick);

  $('#photo-input')?.addEventListener('change', handlePhotoInput);
  $('#video-form')?.addEventListener('submit', handleVideoSubmit);
  $('#photo-gallery')?.addEventListener('click', (event) => {
    const del = event.target.closest('[data-delete-photo]');
    const open = event.target.closest('[data-open-photo]');
    if (del) deleteMedia('photos', del.dataset.deletePhoto);
    else if (open) openPhoto(open.dataset.openPhoto);
  });
  $('#photo-viewer-close')?.addEventListener('click', closePhoto);
  $('#photo-viewer')?.addEventListener('click', (event) => { if (event.target.id === 'photo-viewer') closePhoto(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !$('#photo-viewer').hidden) closePhoto(); });
  $('#video-gallery')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-delete-video]');
    if (button) deleteMedia('videos', button.dataset.deleteVideo);
  });

  $('#flight-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const flight = {
      airline: $('#flight-airline').value.trim(),
      number: $('#flight-number').value.trim(),
      date: $('#flight-date').value,
      time: $('#flight-time').value,
      origin: $('#flight-origin').value.trim(),
      status: $('#flight-status').value || 'Confirmado'
    };
    if (!flight.airline || !flight.number || !flight.date || !flight.time || !flight.origin) {
      alert('Completa todos los campos del vuelo.');
      return;
    }
    try {
      await addDoc(collection(db, 'flights'), { ...flight, ...stamp() });
      event.target.reset();
    } catch (error) { reportError(error); }
  });
  bindSimpleDelete('#flight-list', 'data-delete-flight', 'flights', (f) => `el vuelo ${f.airline} ${f.number}`);

  $('#journal-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const entry = {
      title: $('#journal-title').value.trim(),
      author: $('#journal-author').value.trim(),
      text: $('#journal-text').value.trim()
    };
    if (!entry.title || !entry.author || !entry.text) {
      alert('Completa todos los campos del recuerdo.');
      return;
    }
    try {
      await addDoc(collection(db, 'journal'), { ...entry, ...stamp() });
      event.target.reset();
      $('#journal-author').value = currentName;
    } catch (error) { reportError(error); }
  });
  bindSimpleDelete('#journal-list', 'data-delete-journal', 'journal', (j) => `“${j.title}”`);

  $('#essentials-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const text = $('#essential-input').value.trim();
    if (!text) {
      alert('Escribe un item para agregarlo a la lista.');
      return;
    }
    try {
      await addDoc(collection(db, 'essentials'), { text, ...stamp() });
      event.target.reset();
    } catch (error) { reportError(error); }
  });
  bindSimpleDelete('#essentials-list', 'data-delete-essential', 'essentials', (e) => `“${e.text}”`);
  $('#essentials-list')?.addEventListener('change', (event) => {
    const box = event.target.closest('[data-check-essential]');
    if (!box) return;
    const checked = localGet('nuestros40-checked', {});
    if (box.checked) checked[box.dataset.checkEssential] = true; else delete checked[box.dataset.checkEssential];
    localSet('nuestros40-checked', checked);
  });

  $('#enable-alerts-btn')?.addEventListener('click', enableAlerts);
}

/* ---------- Contenido fijo ---------- */

function renderStatic() {
  $('#wifi-list').innerHTML = wifiSpots.map((entry) => `
    <li><strong>${esc(entry.place)}</strong><span>${esc(entry.type)}</span><p>${esc(entry.info)}</p></li>
  `).join('');
  $('#quote-list').innerHTML = quotes.map((quote) => `<li>“${esc(quote)}”</li>`).join('');
  $('#playlist-list').innerHTML = playlists.map((item) => `
    <a href="${safeUrl(item.url)}" target="_blank" rel="noopener" class="playlist-item">${item.emoji} ${esc(item.title)}</a>
  `).join('');
  $('#tiktok-list').innerHTML = tiktoks.map((item) => `
    <a href="${safeUrl(item.url)}" target="_blank" rel="noopener" class="tiktok-item">🎵 ${esc(item.title)}</a>
  `).join('');
}

/* ---------- Datos iniciales y migración ---------- */

// Carga la agenda y la lista de ejemplo una sola vez para todo el grupo.
async function seedDefaultsOnce() {
  try {
    await runTransaction(db, async (tx) => {
      const seedRef = doc(db, 'meta', 'seed');
      if ((await tx.get(seedRef)).exists()) return;
      tx.set(seedRef, { at: serverTimestamp() });
      defaultEvents.forEach(({ id, ...item }) => tx.set(doc(db, 'events', id), { ...item, ...stamp() }));
      defaultEssentials.forEach((text, index) => tx.set(doc(db, 'essentials', `default-${index + 1}`), { text, ...stamp() }));
    });
  } catch (error) {
    reportError(error, 'preparar la agenda');
  }
}

function hashId(prefix, value) {
  let h = 0;
  for (const ch of JSON.stringify(value)) h = (Math.imul(31, h) + ch.charCodeAt(0)) | 0;
  return `${prefix}-${(h >>> 0).toString(36)}`;
}

// Sube lo que cada celular tenía guardado solo para sí en la versión anterior.
// Usa IDs fijos, así que si se repite no duplica nada.
async function migrateLocalData() {
  if (localGet('nuestros40-migrated', false)) return;
  const raw = (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
  const writes = [];

  const events = raw('nuestros40-events');
  if (Array.isArray(events)) {
    events.forEach((e) => {
      if (!e?.title || !/^\d{4}-\d{2}-\d{2}$/.test(e.date || '') || !/^\d{2}:\d{2}$/.test(e.time || '')) return;
      const item = { title: e.title, date: e.date, time: e.time, location: e.location || '', detail: e.detail || '' };
      const original = defaultEvents.find((d) => d.id === e.id);
      if (original && ['title', 'date', 'time', 'location', 'detail'].every((k) => original[k] === item[k])) return;
      writes.push(setDoc(doc(db, 'events', String(e.id || hashId('event', item)).replace(/\//g, '-')), { ...item, ...stamp() }));
    });
  }

  const flights = raw('nuestros40-flights');
  if (Array.isArray(flights)) {
    flights.forEach((f) => {
      if (!f?.airline) return;
      const item = { airline: f.airline, number: f.number || '', date: f.date || '', time: f.time || '', origin: f.origin || '', status: f.status || 'Confirmado' };
      writes.push(setDoc(doc(db, 'flights', hashId('flight', item)), { ...item, ...stamp() }));
    });
  }

  const journal = raw('nuestros40-journal');
  if (Array.isArray(journal)) {
    journal.forEach((j) => {
      if (!j?.title || !j?.text) return;
      const item = { title: j.title, author: j.author || '', text: j.text };
      writes.push(setDoc(doc(db, 'journal', hashId('journal', item)), { ...item, ...stamp() }));
    });
  }

  const essentials = raw('nuestros40-essentials');
  if (Array.isArray(essentials)) {
    essentials.forEach((text) => {
      if (typeof text !== 'string' || !text.trim() || defaultEssentials.includes(text)) return;
      writes.push(setDoc(doc(db, 'essentials', hashId('essential', text)), { text: text.trim(), ...stamp() }));
    });
  }

  const photos = raw('nuestros40-photos');
  if (Array.isArray(photos)) {
    for (const photo of photos) {
      const src = typeof photo === 'string' ? photo : photo?.src;
      if (!src?.startsWith('data:image/')) continue;
      writes.push((async () => {
        const id = hashId('photo', src.slice(0, 4000));
        await savePhoto(id, await photoVersions(src), (photo?.uploadedBy || 'Una amiga').slice(0, 80));
      })());
    }
  }

  if (!writes.length) {
    localSet('nuestros40-migrated', true);
    return;
  }
  const results = await Promise.allSettled(writes);
  showStatus('');
  if (results.every((r) => r.status === 'fulfilled')) {
    localSet('nuestros40-migrated', true);
  } else {
    console.error(results.filter((r) => r.status === 'rejected'));
  }
}

/* ---------- Perfiles (usuario + PIN de 4 dígitos) ---------- */

// Por dentro se usa el login de Firebase con un correo inventado a partir del usuario.
function usernameToEmail(username) {
  return `${username.toLowerCase()}@nuestros40.app`;
}

function pinToPassword(pin) {
  return `n40-${pin}`; // Firebase pide mínimo 6 caracteres
}

function authErrorMessage(error) {
  switch (error?.code) {
    case 'auth/email-already-in-use': return 'Ese nombre de usuario ya existe. Elige otro o entra con él.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email': return 'Usuario o PIN incorrecto.';
    case 'auth/too-many-requests': return 'Demasiados intentos. Espera unos minutos y vuelve a probar.';
    case 'auth/network-request-failed': return 'Sin conexión. Revisa tu internet.';
    case 'auth/operation-not-allowed': return 'El inicio de sesión todavía no está activado. Avísale a quien administra el sitio.';
    default: return 'No se pudo entrar. Inténtalo de nuevo.';
  }
}

const MODES = {
  signup: { title: 'Crea tu perfil', submit: 'Crear perfil', switchText: '¿Ya tienes perfil? Entra aquí', fields: ['username', 'pin', 'pin2', 'code'] },
  login: { title: 'Entra a tu perfil', submit: 'Entrar', switchText: '¿Primera vez? Crea tu perfil', fields: ['username', 'pin'] },
  join: { title: 'Falta el código del grupo', submit: 'Unirme al grupo', switchText: 'Salir', fields: ['code'] }
};

function setAuthMode(mode) {
  const config = MODES[mode];
  $('#auth-form').dataset.mode = mode;
  $('#auth-title').textContent = config.title;
  $('#auth-submit').textContent = config.submit;
  $('#auth-switch').textContent = config.switchText;
  ['username', 'pin', 'pin2', 'code'].forEach((field) => {
    const group = $(`#auth-${field}-group`);
    group.hidden = !config.fields.includes(field);
    group.querySelector('input').required = config.fields.includes(field);
  });
  $('#auth-error').textContent = '';
}

function memberRef(uid) {
  return doc(db, 'members', uid);
}

// El código se valida en las reglas de Firestore contra config/access,
// que nadie puede leer desde el sitio. Si es incorrecto, Firestore lo rechaza.
async function joinGroup(user, username, code) {
  await setDoc(memberRef(user.uid), { username, code, createdAt: serverTimestamp() });
}

async function isMember(uid) {
  try {
    return (await getDoc(memberRef(uid))).exists();
  } catch {
    return true; // sin conexión: se deja entrar y las reglas deciden
  }
}

let signingUp = false;

async function handleAuthSubmit(event) {
  event.preventDefault();
  const mode = $('#auth-form').dataset.mode;
  const username = $('#auth-username').value.trim();
  const pin = $('#auth-pin').value.trim();
  const code = $('#auth-code').value.trim();
  const errorBox = $('#auth-error');
  errorBox.textContent = '';

  if (mode !== 'join') {
    if (!/^[a-zA-Z0-9._-]{3,20}$/.test(username)) {
      errorBox.textContent = 'El usuario debe tener de 3 a 20 letras o números, sin espacios ni tildes.';
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      errorBox.textContent = 'El PIN debe tener exactamente 4 números.';
      return;
    }
  }
  if (mode === 'signup' && $('#auth-pin2').value.trim() !== pin) {
    errorBox.textContent = 'Los PIN no coinciden.';
    return;
  }
  if (mode !== 'login' && !code) {
    errorBox.textContent = 'Escribe el código del grupo.';
    return;
  }

  const button = $('#auth-submit');
  button.disabled = true;
  try {
    if (mode === 'signup') {
      signingUp = true;
      const cred = await createUserWithEmailAndPassword(auth, usernameToEmail(username), pinToPassword(pin));
      try {
        await joinGroup(cred.user, username, code);
      } catch (error) {
        // Código incorrecto: se borra el perfil recién creado para que pueda intentarlo de nuevo.
        await deleteUser(cred.user).catch(() => signOut(auth));
        throw { code: 'group/wrong-code' };
      }
      await updateProfile(cred.user, { displayName: username });
      signingUp = false;
      startSession(cred.user);
    } else if (mode === 'join') {
      const user = auth.currentUser;
      if (!user) return setAuthMode('login');
      await joinGroup(user, user.displayName || user.email.split('@')[0], code)
        .catch(() => { throw { code: 'group/wrong-code' }; });
      startSession(user);
    } else {
      await signInWithEmailAndPassword(auth, usernameToEmail(username), pinToPassword(pin));
    }
    event.target.reset();
  } catch (error) {
    signingUp = false;
    console.error(error);
    errorBox.textContent = error?.code === 'group/wrong-code' ? 'El código del grupo no es correcto.' : authErrorMessage(error);
  } finally {
    button.disabled = false;
  }
}

let sessionUid = null;

function startSession(user) {
  currentName = user.displayName || user.email.split('@')[0];
  $('#user-name').textContent = currentName;
  $('#journal-author').value = currentName;
  $('#auth-screen').hidden = true;
  document.body.classList.remove('locked');
  localSet('nuestros40-has-profile', true);
  if (sessionUid === user.uid) return;
  sessionUid = user.uid;
  listen('events', renderEvents);
  listen('photos', renderPhotos);
  listen('videos', renderVideos);
  listen('flights', renderFlights);
  listen('journal', renderJournal);
  listen('essentials', renderEssentials);
  seedDefaultsOnce().then(migrateLocalData);
}

function showAuthScreen(mode) {
  $('#auth-screen').hidden = false;
  document.body.classList.add('locked');
  setAuthMode(mode);
}

function endSession() {
  sessionUid = null;
  currentName = '';
  unsubscribers.splice(0).forEach((stop) => stop());
  Object.keys(state).forEach((key) => { state[key] = []; });
  ['#event-list', '#photo-gallery', '#video-gallery', '#flight-list', '#journal-list', '#essentials-list']
    .forEach((selector) => { const el = $(selector); if (el) el.innerHTML = ''; });
  showAuthScreen(localGet('nuestros40-has-profile', false) ? 'login' : 'signup');
}

/* ---------- Inicio ---------- */

bindForms();
renderStatic();
$('#auth-form').addEventListener('submit', handleAuthSubmit);
$('#auth-switch').addEventListener('click', () => {
  const mode = $('#auth-form').dataset.mode;
  if (mode === 'join') signOut(auth);
  else setAuthMode(mode === 'signup' ? 'login' : 'signup');
});
$('#logout-btn').addEventListener('click', () => { if (confirm('¿Salir de tu perfil en este celular?')) signOut(auth); });
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    endSession();
    return;
  }
  if (signingUp || sessionUid === user.uid) return;
  if (await isMember(user.uid)) startSession(user);
  else showAuthScreen('join');
});
