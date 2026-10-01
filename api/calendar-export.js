export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { title, date, time, location, detail } = req.body ?? {};

  if (!title || !date || !time) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    const start = new Date(`${date}T${time}:00`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const formatDateTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}T${hours}${minutes}${seconds}`;
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Nuestros40 Punta Cana//Calendar//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${Date.now()}@nuestros40.local
DTSTART:${formatDateTime(start)}
DTEND:${formatDateTime(end)}
SUMMARY:${title}
LOCATION:${location || ''}
DESCRIPTION:${detail || ''}
BEGIN:VALARM
TRIGGER:-PT30M
ACTION:DISPLAY
DESCRIPTION:Recordatorio: ${title}
END:VALARM
END:VEVENT
END:VCALENDAR`;

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s+/g, '_')}.ics"`);
    res.status(200).send(icsContent);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || 'No se pudo generar el archivo'
    });
  }
}
