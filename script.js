const STORAGE_KEYS = {
  events: 'nuestros40-events',
  photos: 'nuestros40-photos'
};

const sampleEvents = [
  {
    title: 'Brunch en la playa',
    date: '2026-02-18',
    detail: 'Primera mañana de sol y buena vibra, con jugos, fotos y risas desde el amanecer.'
  },
  {
    title: 'Cena con música en vivo',
    date: '2026-02-19',
    detail: 'Noche especial para celebrar a las 40 con cocktail, baile y momentos inolvidables.'
  },
  {
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

function readFromStorage(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatDate(dateString) {
  const date = new Date(dateString + 'T12:00:00');
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function renderEvents() {
  const events = readFromStorage(STORAGE_KEYS.events, sampleEvents);

  eventList.innerHTML = events
    .map(
      (event) => `
        <article class="event-card">
          <span class="date">${formatDate(event.date)}</span>
          <h3>${event.title}</h3>
          <p>${event.detail}</p>
        </article>
      `
    )
    .join('');
}

function renderPhotos() {
  const photos = readFromStorage(STORAGE_KEYS.photos, samplePhotos);

  photoGallery.innerHTML = photos
    .map(
      (src) => `
        <figure class="photo-card">
          <img src="${src}" alt="Foto del viaje" />
        </figure>
      `
    )
    .join('');
}

function handleEventSubmit(event) {
  event.preventDefault();

  const title = document.querySelector('#event-title').value.trim();
  const date = document.querySelector('#event-date').value;
  const detail = document.querySelector('#event-detail').value.trim();

  if (!title || !date || !detail) return;

  const currentEvents = readFromStorage(STORAGE_KEYS.events, sampleEvents);
  const updatedEvents = [{ title, date, detail }, ...currentEvents];

  saveToStorage(STORAGE_KEYS.events, updatedEvents);
  eventForm.reset();
  renderEvents();
}

function readFilesAsDataUrls(files) {
  return Promise.all(
    Array.from(files).map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    )
  );
}

async function handlePhotoUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  const dataUrls = await readFilesAsDataUrls(files);
  const currentPhotos = readFromStorage(STORAGE_KEYS.photos, samplePhotos);
  const updatedPhotos = [...dataUrls, ...currentPhotos];

  saveToStorage(STORAGE_KEYS.photos, updatedPhotos);
  photoInput.value = '';
  renderPhotos();
}

window.addEventListener('DOMContentLoaded', () => {
  renderEvents();
  renderPhotos();
});

eventForm.addEventListener('submit', handleEventSubmit);
photoInput.addEventListener('change', handlePhotoUpload);
