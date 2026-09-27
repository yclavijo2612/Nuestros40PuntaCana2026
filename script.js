const STORAGE_KEYS = {
  photos: 'nuestros40-photos'
};

const samplePhotos = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1468413253725-0d5181091126?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=900&q=80'
];

const photoInput = document.querySelector('#photo-input');
const photoGallery = document.querySelector('#photo-gallery');

function readFromStorage(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function renderPhotos() {
  const photos = readFromStorage(STORAGE_KEYS.photos, samplePhotos);
  photoGallery.innerHTML = photos.map((src) => `
    <figure class="photo-card">
      <img src="${src}" alt="Foto del viaje" />
    </figure>
  `).join('');
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
  if (!files || files.length === 0) return;
  const dataUrls = await readFilesAsDataUrls(files);
  const currentPhotos = readFromStorage(STORAGE_KEYS.photos, samplePhotos);
  saveToStorage(STORAGE_KEYS.photos, [...dataUrls, ...currentPhotos]);
  photoInput.value = '';
  renderPhotos();
}

// Añade botones Editar a las actividades y recordatorios creados por index.html.
function addEditButtons() {
  document.querySelectorAll('#event-list .event-card').forEach((card) => {
    if (card.querySelector('.btn-edit')) return;
    const deleteButton = card.querySelector('[onclick^="deleteEvent("]');
    if (!deleteButton) return;
    const match = deleteButton.getAttribute('onclick').match(/deleteEvent\((\d+)\)/);
    if (!match) return;
    const button = document.createElement('button');
    button.className = 'btn-small btn-edit';
    button.textContent = '✏️ Editar';
    button.type = 'button';
    button.addEventListener('click', () => editEvent(Number(match[1])));
    card.querySelector('.event-actions')?.prepend(button);
  });

  document.querySelectorAll('#reminder-list .reminder-item').forEach((item) => {
    if (item.querySelector('.btn-edit')) return;
    const deleteButton = item.querySelector('[onclick^="deleteReminder("]');
    if (!deleteButton) return;
    const match = deleteButton.getAttribute('onclick').match(/deleteReminder\((\d+)\)/);
    if (!match) return;
    const button = document.createElement('button');
    button.className = 'btn-delete btn-edit';
    button.textContent = '✏️';
    button.type = 'button';
    button.title = 'Editar';
    button.addEventListener('click', () => editReminder(Number(match[1])));
    item.querySelector('.reminder-content')?.append(button);
  });
}

function editEvent(eventId) {
  const events = JSON.parse(localStorage.getItem('events')) || [];
  const event = events.find((item) => item.id === eventId);
  if (!event) return;

  const title = prompt('Título de la actividad:', event.title);
  if (title === null) return;
  const date = prompt('Fecha (AAAA-MM-DD):', event.date);
  if (date === null) return;
  const time = prompt('Hora (HH:MM):', event.time || '12:00');
  if (time === null) return;
  const detail = prompt('Detalle:', event.detail);
  if (detail === null) return;
  const alarm = prompt('Alarma en minutos (0, 5, 15, 30 o 60):', event.alarm ?? 0);
  if (alarm === null) return;

  Object.assign(event, {
    title: title.trim() || event.title,
    date,
    time,
    detail: detail.trim() || event.detail,
    alarm: Number(alarm) || 0
  });
  localStorage.setItem('events', JSON.stringify(events));
  window.renderEvents?.();
  alert('Actividad actualizada ✅');
}

function editReminder(reminderId) {
  const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
  const reminder = reminders.find((item) => item.id === reminderId);
  if (!reminder) return;
  const text = prompt('Editar lo que no deben olvidar:', reminder.text);
  if (text === null || !text.trim()) return;
  reminder.text = text.trim();
  localStorage.setItem('reminders', JSON.stringify(reminders));
  window.renderReminders?.();
}

window.addEventListener('DOMContentLoaded', () => {
  renderPhotos();
  addEditButtons();
  const observer = new MutationObserver(addEditButtons);
  observer.observe(document.querySelector('#event-list'), { childList: true, subtree: true });
  observer.observe(document.querySelector('#reminder-list'), { childList: true, subtree: true });
});

photoInput?.addEventListener('change', handlePhotoUpload);
