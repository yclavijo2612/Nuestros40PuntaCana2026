const STORAGE_KEYS = {
  events: 'nuestros40-events',
  photos: 'nuestros40-photos',
  videos: 'nuestros40-videos'
};

const sampleEvents = [
  {
    id: 'sample-1',
    title: 'Brunch en la playa',
    date: '2026-02-18',
    detail: 'Primera mañana de sol y buena vibra, con jugos, fotos y risas desde el amanecer.'
  },
  {
    id: 'sample-2',
    title: 'Cena con música en vivo',
    date: '2026-02-19',
    detail: 'Noche especial para celebrar a las 40 con cocktail, baile y momentos inolvidables.'
  },
  {
    id: 'sample-3',
    title: 'Excursión al mar',
    date: '2026-02-20',
    detail: 'Marea alta, fotos de grupo y el mejor momento para relajarnos entre olas y risas.'
  }
];

const samplePhotos = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1468413253725-0d5181091126?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=900&q=80'
];

const eventForm = document.querySelector('#event-form');
const eventList = document.querySelector('#event-list');
const photoInput = document.querySelector('#photo-input');
const photoGallery = document.querySelector('#photo-gallery');
const videoInput = document.querySelector('#video-input');
const videoGallery = document.querySelector('#video-gallery');

function readFromStorage(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric'
  }).format(date);
}

function renderEvents() {
  const events = readFromStorage(STORAGE_KEYS.events, sampleEvents);
  eventList.innerHTML = events.map((event) => `
    <article class="event-card">
      <span class="date">${formatDate(event.date)}</span>
      <h3>${escapeHtml(event.title)}</h3>
      <p>${escapeHtml(event.detail)}</p>
      <div class="event-actions">
        <button type="button" class="btn-small btn-edit" data-edit-event="${event.id}">✏️ Editar</button>
        <button type="button" class="btn-small btn-delete-event" data-delete-event="${event.id}">🗑️ Borrar</button>
      </div>
    </article>
  `).join('');
}

function handleEventSubmit(event) {
  event.preventDefault();
  const title = document.querySelector('#event-title').value.trim();
  const date = document.querySelector('#event-date').value;
  const detail = document.querySelector('#event-detail').value.trim();
  if (!title || !date || !detail) return;

  const currentEvents = readFromStorage(STORAGE_KEYS.events, sampleEvents);
  saveToStorage(STORAGE_KEYS.events, [{ id: crypto.randomUUID?.() || String(Date.now()), title, date, detail }, ...currentEvents]);
  eventForm.reset();
  renderEvents();
}

function editEvent(id) {
  const events = readFromStorage(STORAGE_KEYS.events, sampleEvents);
  const index = events.findIndex((item) => String(item.id) === String(id));
  if (index < 0) return;
  const item = events[index];
  const title = prompt('Título de la actividad:', item.title);
  if (title === null) return;
  const date = prompt('Fecha (AAAA-MM-DD):', item.date);
  if (date === null) return;
  const detail = prompt('Detalle:', item.detail);
  if (detail === null) return;
  if (!title.trim() || !date || !detail.trim()) return alert('Completa todos los campos.');
  events[index] = { ...item, title: title.trim(), date, detail: detail.trim() };
  saveToStorage(STORAGE_KEYS.events, events);
  renderEvents();
}

function deleteEvent(id) {
  if (!confirm('¿Quieres borrar esta actividad?')) return;
  const events = readFromStorage(STORAGE_KEYS.events, sampleEvents);
  saveToStorage(STORAGE_KEYS.events, events.filter((item) => String(item.id) !== String(id)));
  renderEvents();
}

function renderPhotos() {
  const photos = readFromStorage(STORAGE_KEYS.photos, samplePhotos);
  photoGallery.innerHTML = photos.map((src, index) => `
    <figure class="photo-card photo-item" data-photo-index="${index}">
      <img src="${src}" alt="Foto del viaje" />
      <button type="button" class="btn-delete-photo" data-delete-photo="${index}" title="Borrar foto">✕</button>
    </figure>
  `).join('');
}

function deletePhoto(index) {
  if (!confirm('¿Quieres borrar esta foto?')) return;
  const photos = readFromStorage(STORAGE_KEYS.photos, samplePhotos);
  photos.splice(index, 1);
  saveToStorage(STORAGE_KEYS.photos, photos);
  renderPhotos();
}

function renderVideos() {
  const videos = readFromStorage(STORAGE_KEYS.videos, []);
  videoGallery.innerHTML = videos.map((src, index) => `
    <figure class="video-card video-item" data-video-index="${index}">
      <video controls style="width: 100%; height: 100%; object-fit: cover;"></video>
      <button type="button" class="btn-delete-video" data-delete-video="${index}" title="Borrar video">✕</button>
    </figure>
  `).join('');
  
  videos.forEach((src, index) => {
    const videoElement = videoGallery.querySelector(`[data-video-index="${index}"] video`);
    if (videoElement) videoElement.src = src;
  });
}

function deleteVideo(index) {
  if (!confirm('¿Quieres borrar este video?')) return;
  const videos = readFromStorage(STORAGE_KEYS.videos, []);
  videos.splice(index, 1);
  saveToStorage(STORAGE_KEYS.videos, videos);
  renderVideos();
}

function readFilesAsDataUrls(files) {
  return Promise.all(Array.from(files).map((file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  })));
}

async function handlePhotoUpload(event) {
  const files = event.target.files;
  if (!files?.length) return;
  const dataUrls = await readFilesAsDataUrls(files);
  const currentPhotos = readFromStorage(STORAGE_KEYS.photos, samplePhotos);
  saveToStorage(STORAGE_KEYS.photos, [...dataUrls, ...currentPhotos]);
  photoInput.value = '';
  renderPhotos();
}

async function handleVideoUpload(event) {
  const files = event.target.files;
  if (!files?.length) return;
  const dataUrls = await readFilesAsDataUrls(files);
  const currentVideos = readFromStorage(STORAGE_KEYS.videos, []);
  saveToStorage(STORAGE_KEYS.videos, [...dataUrls, ...currentVideos]);
  videoInput.value = '';
  renderVideos();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

eventList?.addEventListener('click', (event) => {
  const editButton = event.target.closest('[data-edit-event]');
  const deleteButton = event.target.closest('[data-delete-event]');
  if (editButton) editEvent(editButton.dataset.editEvent);
  if (deleteButton) deleteEvent(deleteButton.dataset.deleteEvent);
});

photoGallery?.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('[data-delete-photo]');
  if (deleteButton) deletePhoto(Number(deleteButton.dataset.deletePhoto));
});

videoGallery?.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('[data-delete-video]');
  if (deleteButton) deleteVideo(Number(deleteButton.dataset.deleteVideo));
});

eventForm?.addEventListener('submit', handleEventSubmit);
photoInput?.addEventListener('change', handlePhotoUpload);
videoInput?.addEventListener('change', handleVideoUpload);

window.addEventListener('DOMContentLoaded', () => {
  renderEvents();
  renderPhotos();
  renderVideos();
});
