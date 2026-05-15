const STORAGE_KEY = 'kid-calendar-events';

function parseStoredEvents(rawValue) {
  if (!rawValue) return null;
  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateTime(value) {
  const d = new Date(value);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function loadEvents() {
  const fromStorage = parseStoredEvents(localStorage.getItem(STORAGE_KEY));
  if (fromStorage) {
    return fromStorage;
  }

  try {
    const res = await fetch('data/events.json');
    const json = await res.json();
    const events = Array.isArray(json.events) ? json.events : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    return events;
  } catch {
    return [];
  }
}

function hasEventsInMonth(events, date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  return events.some((e) => {
    const eventDate = new Date(e.start);
    return eventDate.getFullYear() === year && eventDate.getMonth() === month;
  });
}

function getDefaultMonthDate(events) {
  const now = new Date();
  if (hasEventsInMonth(events, now)) {
    return now;
  }

  const upcoming = [...events]
    .filter((e) => new Date(e.start) >= startOfDay(now))
    .sort((a, b) => new Date(a.start) - new Date(b.start))[0];
  if (upcoming) {
    return new Date(upcoming.start);
  }

  const first = [...events].sort((a, b) => new Date(a.start) - new Date(b.start))[0];
  return first ? new Date(first.start) : now;
}

function getDefaultWeekDate(events) {
  const now = new Date();
  const startOfCurrentWeek = new Date(now);
  startOfCurrentWeek.setDate(now.getDate() - now.getDay());
  startOfCurrentWeek.setHours(0, 0, 0, 0);

  const endOfCurrentWeek = new Date(startOfCurrentWeek);
  endOfCurrentWeek.setDate(startOfCurrentWeek.getDate() + 7);

  const hasCurrentWeekEvents = events.some((e) => {
    const date = new Date(e.start);
    return date >= startOfCurrentWeek && date < endOfCurrentWeek;
  });

  if (hasCurrentWeekEvents) {
    return now;
  }

  const upcoming = [...events]
    .filter((e) => new Date(e.start) >= startOfDay(now))
    .sort((a, b) => new Date(a.start) - new Date(b.start))[0];
  if (upcoming) {
    return new Date(upcoming.start);
  }

  const first = [...events].sort((a, b) => new Date(a.start) - new Date(b.start))[0];
  return first ? new Date(first.start) : now;
}

function bindViewButtons() {
  const pairs = [
    ['monthBtn', 'monthView'],
    ['weekBtn', 'weekView'],
    ['agendaBtn', 'agendaView'],
  ];

  pairs.forEach(([buttonId, viewId]) => {
    document.getElementById(buttonId).addEventListener('click', () => {
      document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
      document.querySelectorAll('.actions button').forEach((b) => b.classList.remove('active'));
      document.getElementById(viewId).classList.add('active');
      document.getElementById(buttonId).classList.add('active');
    });
  });
}

function renderMonthView(events, baseDate = new Date()) {
  const container = document.getElementById('monthView');
  const today = startOfDay(new Date());
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  let html = '<div class="card"><h2>This Month</h2><div class="calendar-grid">';
  for (let i = 0; i < 42; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const iso = day.toISOString().slice(0, 10);
    const dayEvents = events.filter((e) => e.start.slice(0, 10) === iso);
    const isPast = startOfDay(day) < today;
    html += `<div class="day ${isPast ? 'past' : ''}"><div class="day-number">${day.getDate()}</div>`;
    dayEvents.slice(0, 3).forEach((e) => {
      html += `<div class="small-event">${escapeHtml(e.title)}</div>`;
    });
    html += '</div>';
  }
  html += '</div></div>';
  container.innerHTML = html;
}

function renderWeekView(events, baseDate = new Date()) {
  const container = document.getElementById('weekView');
  const today = startOfDay(new Date());
  const start = new Date(baseDate);
  start.setDate(baseDate.getDate() - baseDate.getDay());

  let html = '<div class="card"><h2>This Week</h2><div class="week-grid">';
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const iso = day.toISOString().slice(0, 10);
    const dayEvents = events.filter((e) => e.start.slice(0, 10) === iso);
    const isPast = startOfDay(day) < today;
    html += `<div class="week-day ${isPast ? 'past' : ''}"><h3>${day.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</h3>`;
    dayEvents.forEach((e) => {
      html += `<div class="small-event">${new Date(e.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} ${escapeHtml(e.title)}</div>`;
    });
    html += '</div>';
  }
  html += '</div></div>';
  container.innerHTML = html;
}

function renderAgendaView(events) {
  const container = document.getElementById('agendaView');
  const today = startOfDay(new Date());
  const sorted = [...events].sort((a, b) => new Date(a.start) - new Date(b.start));

  const items = sorted
    .map((e) => {
      const isPast = startOfDay(new Date(e.start)) < today;
      return `<article class="event-item ${isPast ? 'past' : ''}">
        <strong>${escapeHtml(e.title)}</strong>
        <div>${formatDateTime(e.start)} - ${formatDateTime(e.end)}</div>
        <div>${escapeHtml(e.child)}${e.location ? ` • ${escapeHtml(e.location)}` : ''}</div>
        ${e.notes ? `<div class="muted">${escapeHtml(e.notes)}</div>` : ''}
      </article>`;
    })
    .join('');

  container.innerHTML = `<div class="card"><h2>Agenda</h2>${items || '<p class="muted">No events yet.</p>'}</div>`;
}

(async function init() {
  bindViewButtons();
  const events = await loadEvents();
  const monthDate = getDefaultMonthDate(events);
  const weekDate = getDefaultWeekDate(events);
  renderMonthView(events, monthDate);
  renderWeekView(events, weekDate);
  renderAgendaView(events);
})();
