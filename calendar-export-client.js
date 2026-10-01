(() => {
  const EVENTS_KEY = 'nuestros40-events';
  const fallbackEvents = [
    { id: 'sample-1', title: 'Brunch en la playa', date: '2026-11-07', time: '10:00', location: 'Playa Bávaro', detail: 'Primera mañana de sol y buena vibra, con jugos, fotos y risas desde el amanecer.' },
    { id: 'sample-2', title: 'Cena con música en vivo', date: '2026-11-09', time: '20:00', location: 'Punta Cana Village', detail: 'Noche especial para celebrar a las 40 con cocktail, baile y momentos inolvidables.' },
    { id: 'sample-3', title: 'Riu Palace: relax + piscina', date: '2026-11-10', time: '12:00', location: 'Riu Palace Punta Cana', detail: 'Día de piscina, relax, fotos y descanso total.' },
    { id: 'sample-4', title: 'Riu Palace: fiesta de noche', date: '2026-11-11', time: '21:30', location: 'Riu Palace Punta Cana', detail: 'Fiesta, música y celebraciones de las 40 con todas.' },
    { id: 'sample-5', title: 'Riu Palace: brunch + mar', date: '2026-11-13', time: '09:30', location: 'Riu Palace Punta Cana', detail: 'Un día perfecto para descansar, tomar sol y compartir risas.' }
  ];

  function readEvents() {
    try { return JSON.parse(localStorage.getItem(EVENTS_KEY)) || fallbackEvents; } catch { return fallbackEvents; }
  }

  function escapeIcs(value) {
    return String(value ?? '').replace(/[\\;,]/g, (match) => `\\${match}`).replace(/\r?\n/g, '\\n');
  }

  function formatIcsDate(date) {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') + 'Z';
  }

  function downloadCalendarEvent(item) {
    const start = new Date(`${item.date}T${item.time || '00:00'}:00`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nuestros40 Punta Cana//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      `UID:${item.id}@nuestros40puntacana.com`, `DTSTAMP:${formatIcsDate(new Date())}`, `DTSTART:${formatIcsDate(start)}`, `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:${escapeIcs(item.title)}`, `LOCATION:${escapeIcs(item.location)}`, `DESCRIPTION:${escapeIcs(item.detail)}`,
      'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', `DESCRIPTION:Recordatorio: ${escapeIcs(item.title)}`, 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(item.title || 'actividad').replace(/[^a-z0-9áéíóúñ]+/gi, '_')}-${item.date}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    alert('📱 Abre el archivo descargado y elige “Agregar al calendario”. La alarma quedará 30 minutos antes.');
  }

  function addCalendarButtons() {
    const list = document.querySelector('#event-list');
    if (!list) return;
    const events = readEvents().sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`));
    list.querySelectorAll('.event-card').forEach((card, index) => {
      if (card.querySelector('[data-calendar-event]')) return;
      const item = events[index];
      if (!item) return;
      const actions = card.querySelector('.event-actions') || card.appendChild(Object.assign(document.createElement('div'), { className: 'event-actions' }));
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn-small';
      button.dataset.calendarEvent = item.id;
      button.textContent = '📱 Agregar al reloj';
      actions.prepend(button);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    addCalendarButtons();
    const list = document.querySelector('#event-list');
    if (list) new MutationObserver(addCalendarButtons).observe(list, { childList: true, subtree: true });
    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-calendar-event]');
      if (!button) return;
      const item = readEvents().find((entry) => entry.id === button.dataset.calendarEvent);
      if (item) downloadCalendarEvent(item);
    });
  });
})();
