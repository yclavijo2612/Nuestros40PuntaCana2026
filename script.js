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
  tiktok: 'nuestros40-tiktok',
  locations: 'nuestros40-locations'
};

const defaultEvents = [
  { id: 'sample-1', title: 'Brunch en la playa', date: '2026-11-07', time: '10:00', location: 'Playa Bávaro', detail: 'Primera mañana de sol y buena vibra, con jugos, fotos y risas desde el amanecer.' },
  { id: 'sample-2', title: 'Cena con música en vivo', date: '2026-11-09', time: '20:00', location: 'Punta Cana Village', detail: 'Noche especial para celebrar a las 40 con cocktail, baile y momentos inolvidables.' },
  { id: 'sample-3', title: 'Riu Palace: relax + piscina', date: '2026-11-10', time: '12:00', location: 'Riu Palace Punta Cana', detail: 'Día de piscina, relax, fotos y descanso total.' },
  { id: 'sample-4', title: 'Riu Palace: fiesta de noche', date: '2026-11-11', time: '21:30', location: 'Riu Palace Punta Cana', detail: 'Fiesta, música y celebraciones de las 40 con todas.' },
  { id: 'sample-5', title: 'Riu Palace: brunch + mar', date: '2026-11-13', time: '09:30', location: 'Riu Palace Punta Cana', detail: 'Un día perfecto para descansar, tomar sol y compartir risas.' }
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
  { title: 'Reggaeton + Playa', url: 'https://open.spotify.com/search/reggaeton%20playlist', emoji: '🔥' },
  { title: 'Salsa del Caribe', url: 'https://open.spotify.com/search/salsa%20caribe%20playlist', emoji: '💃' },
  { title: 'Latina Mix', url: 'https://open.spotify.com/search/latina%20playlist', emoji: '🎶' },
  { title: 'Vibra Tropical', url: 'https://open.spotify.com/search/tropical%20party%20playlist', emoji: '🌴' }
];

const defaultTikTok = [
  { title: 'Amigas en la playa', url: 'https://www.tiktok.com/tag/amigasenlaplaya' },
  { title: 'Fiesta con amigas', url: 'https://www.tiktok.com/tag/fiestaconamigas' },
  { title: 'Beach girls', url: 'https://www.tiktok.com/tag/beachgirls' },
  { title: 'Punta Cana vibes', url: 'https://www.tiktok.com/tag/puntacanavibes' }
];

const alarmTimers = new Map();
const locationMap = null;

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
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function eventDateValue(event) {
  return new Date(`${event.date}T${event.time || '00:00'}:00`);
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function enableAlerts() {
  requestNotificationPermission();
  if ('Notification' in window && Notification.permission === 'granted') {
    alert('✅ Alertas activadas. Te avisaremos 30 minutos antes de cada actividad.');
  } else {
    alert('📣 Si aceptas la notificación, podrás recibir alertas de tus actividades del viaje.');
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
  const eventList = document.querySelector('#event-list');
  if (!eventList) return;

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

  const titleEl = document.querySelector('#event-title');
  const dateEl = document.querySelector('#event-date');
  const timeEl = document.querySelector('#event-time');
  const locationEl = document.querySelector('#event-location');
  const detailEl = document.querySelector('#event-detail');

  if (!titleEl || !dateEl || !timeEl || !locationEl || !detailEl) return;

  const item = {
    id: uid('event'),
    title: titleEl.value.trim(),
    date: dateEl.value,
    time: timeEl.value,
    location: locationEl.value.trim(),
    detail: detailEl.value.trim()
  };

  if (!item.title || !item.date || !item.time || !item.location || !item.detail) {
    alert('Completa todos los campos de la actividad');
    return;
  }

  const current = read(STORAGE_KEYS.events, defaultEvents);
  save(STORAGE_KEYS.events, [item, ...current]);

  titleEl.value = '';
  dateEl.value = '';
  timeEl.value = '';
  locationEl.value = '';
  detailEl.value = '';

  renderEvents();
}

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
  const photoGallery = document.querySelector('#photo-gallery');
  if (!photoGallery) return;

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

function normalizeVideos(videos) {
  return (Array.isArray(videos) ? videos : []).map((video, index) => {
    if (typeof video === 'string') {
      return { id: uid('video'), name: `video-${index + 1}.mp4`, url: video };
    }
    if (video && typeof video === 'object' && video.url) {
      return {
        id: video.id || uid('video'),
        name: video.name || `video-${index + 1}.mp4`,
        url: video.url
      };
    }
    return null;
  }).filter(Boolean);
}

function isValidVideo(file) {
  if (!file) return false;

  const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
  const maxSize = 20 * 1024 * 1024;
  const extension = (file.name || '').toLowerCase();

  if (!validTypes.includes(file.type) && !/\.(mp4|webm|mov|mkv)$/i.test(extension)) {
    alert('Archivo no válido. Usa un video MP4, WEBM, MOV o MKV.');
    return false;
  }

  if (file.size > maxSize) {
    alert('El video es demasiado grande. Sube uno de hasta 20 MB.');
    return false;
  }

  return true;
}

function renderVideos() {
  const videoGallery = document.querySelector('#video-gallery');
  if (!videoGallery) return;

  const videos = normalizeVideos(read(STORAGE_KEYS.videos, []));
  videoGallery.innerHTML = videos.map((video, index) => `
    <figure class="video-card">
      <video src="${video.url}" controls></video>
      <button type="button" class="btn-delete-video" data-video-index="${index}" title="Borrar video">✕</button>
      <a class="download-btn" href="${video.url}" download="${video.name || `video-${index + 1}.mp4`}" title="Descargar video">⬇️</a>
    </figure>
  `).join('') || '<p>No hay videos aún. Súbelo desde la biblioteca del celular.</p>';
}

function renderFlights() {
  const flightList = document.querySelector('#flight-list');
  if (!flightList) return;

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

function renderJournal() {
  const journalList = document.querySelector('#journal-list');
  if (!journalList) return;

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

function renderEssentials() {
  const essentialsList = document.querySelector('#essentials-list');
  if (!essentialsList) return;

  const items = read(STORAGE_KEYS.essentials, defaultEssentials);
  essentialsList.innerHTML = items.map((item, index) => `
    <li>
      <input type="checkbox" />
      <span>${esc(item)}</span>
      <button type="button" class="mini-delete" data-essential-index="${index}" aria-label="Eliminar item">✕</button>
    </li>
  `).join('');
}

function renderWifi() {
  const wifiList = document.querySelector('#wifi-list');
  if (!wifiList) return;

  const items = read(STORAGE_KEYS.wifi, defaultWifi);
  wifiList.innerHTML = items.map((entry) => `
    <li>
      <strong>${esc(entry.place)}</strong>
      <span>${esc(entry.type)}</span>
      <p>${esc(entry.info)}</p>
    </li>
  `).join('');
}

function renderQuotes() {
  const quoteList = document.querySelector('#quote-list');
  if (!quoteList) return;

  const items = read(STORAGE_KEYS.quotes, defaultQuotes);
  quoteList.innerHTML = items.map((quote) => `<li>“${esc(quote)}”</li>`).join('');
}

function renderPlaylists() {
  const playlistList = document.querySelector('#playlist-list');
  if (!playlistList) return;

  const items = read(STORAGE_KEYS.playlist, defaultPlaylists);
  playlistList.innerHTML = items.map((item) => `
    <a href="${item.url}" target="_blank" rel="noopener" class="playlist-item">${item.emoji} ${esc(item.title)}</a>
  `).join('');
}

function renderTikTok() {
  const tiktokList = document.querySelector('#tiktok-list');
  if (!tiktokList) return;

  const items = read(STORAGE_KEYS.tiktok, defaultTikTok);
  tiktokList.innerHTML = items.map((item) => `
    <a href="${item.url}" target="_blank" rel="noopener" class="tiktok-item">🎵 ${esc(item.title)}</a>
  `).join('');
}

function getSupabaseClient() {
  const config = window.NUESTROS40_CONFIG || {};
  const url = config.supabaseUrl || '';
  const key = config.supabaseKey || '';

  if (!url || !key || url.includes('tu-proyecto') || key.includes('tu-anon-key')) {
    return null;
  }

  if (!window.supabase || !window.supabase.createClient) {
    return null;
  }

  return window.supabase.createClient(url, key);
}

function getLocationsFromStorage() {
  return read(STORAGE_KEYS.locations, []);
}

function setLocationsInStorage(locations) {
  save(STORAGE_KEYS.locations, locations);
}

function renderMapMarkers(locations) {
  const mapEl = document.querySelector('#location-map');
  if (!mapEl) return;

  if (!window.L) {
    mapEl.innerHTML = '<p class="map-empty">Mapa no disponible.</p>';
    return;
  }

  if (!window.__LOCATION_MAP__) {
    window.__LOCATION_MAP__ = L.map('location-map').setView([18.5601, -68.3725], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(window.__LOCATION_MAP__);
  }

  const map = window.__LOCATION_MAP__;
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  if (!locations.length) {
    map.setView([18.5601, -68.3725], 11);
    mapEl.dataset.empty = 'true';
    return;
  }

  mapEl.dataset.empty = 'false';
  const bounds = [];

  locations.forEach((person) => {
    const marker = L.marker([person.latitude, person.longitude]).addTo(map);
    marker.bindPopup(`<strong>${esc(person.name)}</strong><br>${new Date(person.updated_at || Date.now()).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`);
    bounds.push([person.latitude, person.longitude]);
  });

  map.fitBounds(bounds, { padding: [20, 20] });
}

function syncLocationsFromRemote() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    renderMapMarkers(getLocationsFromStorage());
    return;
  }

  supabase
    .from('group_locations')
    .select('*')
    .order('updated_at', { ascending: false })
    .then(({ data, error }) => {
      if (error) {
        console.error(error);
        renderMapMarkers(getLocationsFromStorage());
        return;
      }

      const locations = (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        latitude: row.latitude,
        longitude: row.longitude,
        updated_at: row.updated_at
      }));

      setLocationsInStorage(locations);
      renderMapMarkers(locations);
    });
}

function saveLocationForCurrentUser(name, latitude, longitude) {
  const payload = {
    name,
    latitude,
    longitude,
    updated_at: new Date().toISOString()
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    supabase.from('group_locations').upsert(payload, { onConflict: 'name' }).then(({ error }) => {
      if (error) {
        console.error(error);
        const stored = getLocationsFromStorage();
        const filtered = stored.filter((person) => person.name.toLowerCase() !== name.toLowerCase());
        filtered.push(payload);
        setLocationsInStorage(filtered);
        renderMapMarkers(filtered);
        return;
      }
      syncLocationsFromRemote();
    });
    return;
  }

  const stored = getLocationsFromStorage();
  const filtered = stored.filter((person) => person.name.toLowerCase() !== name.toLowerCase());
  filtered.push(payload);
  setLocationsInStorage(filtered);
  renderMapMarkers(filtered);
}

function handleLocationSubmit(event) {
  event.preventDefault();

  const nameInput = document.querySelector('#location-name');
  const statusBox = document.querySelector('#location-status');
  if (!nameInput || !statusBox) return;

  const name = nameInput.value.trim();
  if (!name) {
    alert('Escribe tu nombre para compartir tu ubicación');
    return;
  }

  statusBox.textContent = 'Compartiendo tu ubicación...';

  if (!navigator.geolocation) {
    statusBox.textContent = 'Tu navegador no permite geolocalización.';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      saveLocationForCurrentUser(name, latitude, longitude);
      statusBox.textContent = `✅ Ubicación compartida de ${name}`;
      nameInput.value = '';
    },
    () => {
      statusBox.textContent = 'No se pudo acceder a tu ubicación. Asegúrate de permitir permisos.';
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

function initEvents() {
  const eventForm = document.querySelector('#event-form');
  if (eventForm) {
    eventForm.addEventListener('submit', handleEventSubmit);
  }

  const eventList = document.querySelector('#event-list');
  if (eventList) {
    eventList.addEventListener('click', (event) => {
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

        if (!nextTitle.trim() || !nextDate || !nextTime || !nextLocation.trim() || !nextDetail.trim()) {
          alert('Completa todos los campos.');
          return;
        }

        Object.assign(item, {
          title: nextTitle.trim(),
          date: nextDate,
          time: nextTime,
          location: nextLocation.trim(),
          detail: nextDetail.trim()
        });

        save(STORAGE_KEYS.events, items);
        renderEvents();
      }

      if (del) {
        const targetId = del.dataset.deleteEvent;
        save(STORAGE_KEYS.events, items.filter((entry) => entry.id !== targetId));
        renderEvents();
      }
    });
  }

  const photoInput = document.querySelector('#photo-input');
  if (photoInput) {
    photoInput.addEventListener('change', async (event) => {
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
  }

  const photoGallery = document.querySelector('#photo-gallery');
  if (photoGallery) {
    photoGallery.addEventListener('click', (event) => {
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
  }

  const videoInput = document.querySelector('#video-input');
  if (videoInput) {
    videoInput.addEventListener('change', (event) => {
      const files = Array.from(event.target.files || []).filter(isValidVideo);
      if (!files.length) {
        videoInput.value = '';
        return;
      }

      const current = normalizeVideos(read(STORAGE_KEYS.videos, []));
      const newVideos = files.map((file) => ({
        id: uid('video'),
        name: file.name,
        url: URL.createObjectURL(file)
      }));

      save(STORAGE_KEYS.videos, [...newVideos, ...current]);
      videoInput.value = '';
      renderVideos();
    });
  }

  const theVideoGallery = document.querySelector('#video-gallery');
  if (theVideoGallery) {
    theVideoGallery.addEventListener('click', (event) => {
      const button = event.target.closest('[data-video-index]');
      if (!button) return;

      const videos = normalizeVideos(read(STORAGE_KEYS.videos, []));
      const index = Number(button.dataset.videoIndex);
      const targetVideo = videos[index];

      if (targetVideo?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(targetVideo.url);
      }

      videos.splice(index, 1);
      save(STORAGE_KEYS.videos, videos);
      renderVideos();
    });
  }

  const flightForm = document.querySelector('#flight-form');
  if (flightForm) {
    flightForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const flight = {
        airline: document.querySelector('#flight-airline')?.value.trim() || '',
        number: document.querySelector('#flight-number')?.value.trim() || '',
        date: document.querySelector('#flight-date')?.value || '',
        time: document.querySelector('#flight-time')?.value || '',
        origin: document.querySelector('#flight-origin')?.value.trim() || '',
        status: document.querySelector('#flight-status')?.value || 'Confirmado'
      };

      if (!flight.airline || !flight.number || !flight.date || !flight.time || !flight.origin) {
        alert('Completa todos los campos del vuelo.');
        return;
      }

      const current = read(STORAGE_KEYS.flights, []);
      save(STORAGE_KEYS.flights, [flight, ...current]);
      flightForm.reset();
      renderFlights();
    });
  }

  const flightList = document.querySelector('#flight-list');
  if (flightList) {
    flightList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-flight-index]');
      if (!button) return;
      const flights = read(STORAGE_KEYS.flights, []);
      flights.splice(Number(button.dataset.flightIndex), 1);
      save(STORAGE_KEYS.flights, flights);
      renderFlights();
    });
  }

  const journalForm = document.querySelector('#journal-form');
  if (journalForm) {
    journalForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const entry = {
        title: document.querySelector('#journal-title')?.value.trim() || '',
        author: document.querySelector('#journal-author')?.value.trim() || '',
        text: document.querySelector('#journal-text')?.value.trim() || ''
      };

      if (!entry.title || !entry.author || !entry.text) {
        alert('Completa todos los campos del recuerdo.');
        return;
      }

      const current = read(STORAGE_KEYS.journal, []);
      save(STORAGE_KEYS.journal, [entry, ...current]);
      journalForm.reset();
      renderJournal();
    });
  }

  const journalList = document.querySelector('#journal-list');
  if (journalList) {
    journalList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-journal-index]');
      if (!button) return;
      const entries = read(STORAGE_KEYS.journal, []);
      entries.splice(Number(button.dataset.journalIndex), 1);
      save(STORAGE_KEYS.journal, entries);
      renderJournal();
    });
  }

  const essentialsForm = document.querySelector('#essentials-form');
  if (essentialsForm) {
    essentialsForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = document.querySelector('#essential-input')?.value.trim() || '';
      if (!value) {
        alert('Escribe un item para agregarlo a la lista.');
        return;
      }
      const current = read(STORAGE_KEYS.essentials, defaultEssentials);
      save(STORAGE_KEYS.essentials, [value, ...current]);
      essentialsForm.reset();
      renderEssentials();
    });
  }

  const essentialsList = document.querySelector('#essentials-list');
  if (essentialsList) {
    essentialsList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-essential-index]');
      if (!button) return;
      const items = read(STORAGE_KEYS.essentials, defaultEssentials);
      items.splice(Number(button.dataset.essentialIndex), 1);
      save(STORAGE_KEYS.essentials, items);
      renderEssentials();
    });
  }

  const enableAlertsBtn = document.querySelector('#enable-alerts-btn');
  if (enableAlertsBtn) {
    enableAlertsBtn.addEventListener('click', enableAlerts);
  }

  const locationForm = document.querySelector('#location-form');
  if (locationForm) {
    locationForm.addEventListener('submit', handleLocationSubmit);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  requestNotificationPermission();
  initEvents();

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
  syncLocationsFromRemote();
});
