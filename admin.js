const STORAGE_KEY = 'kid-calendar-events';

async function loadEvents() {
  const fromStorage = localStorage.getItem(STORAGE_KEY);
  if (fromStorage) {
    return JSON.parse(fromStorage);
  }
  const res = await fetch('data/events.json');
  const json = await res.json();
  return json.events;
}

function saveEvents(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function toInputDateTime(value) {
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function clearForm() {
  document.getElementById('eventId').value = '';
  document.getElementById('title').value = '';
  document.getElementById('child').value = '';
  document.getElementById('start').value = '';
  document.getElementById('end').value = '';
  document.getElementById('location').value = '';
  document.getElementById('notes').value = '';
}

function bindForm(events, onChange) {
  document.getElementById('eventForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const id = document.getElementById('eventId').value || String(Date.now());
    const event = {
      id,
      title: document.getElementById('title').value.trim(),
      child: document.getElementById('child').value.trim(),
      start: new Date(document.getElementById('start').value).toISOString(),
      end: new Date(document.getElementById('end').value).toISOString(),
      location: document.getElementById('location').value.trim(),
      notes: document.getElementById('notes').value.trim(),
    };

    const idx = events.findIndex((x) => x.id === id);
    if (idx >= 0) {
      events[idx] = event;
    } else {
      events.push(event);
    }

    saveEvents(events);
    onChange();
    clearForm();
  });

  document.getElementById('clearBtn').addEventListener('click', clearForm);

  document.getElementById('downloadBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ events }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'events.json';
    a.click();
    URL.revokeObjectURL(url);
  });
}

function renderList(events, onChange) {
  const list = document.getElementById('eventList');
  const sorted = [...events].sort((a, b) => new Date(a.start) - new Date(b.start));
  list.innerHTML = sorted
    .map(
      (e) => `<li>
      <strong>${escapeHtml(e.title)}</strong><br />
      ${new Date(e.start).toLocaleString()} - ${new Date(e.end).toLocaleString()}<br />
      <span class="muted">${escapeHtml(e.child)}${e.location ? ` • ${escapeHtml(e.location)}` : ''}</span>
      <div class="row">
        <button data-edit="${escapeHtml(e.id)}" type="button">Edit</button>
        <button data-delete="${escapeHtml(e.id)}" type="button" class="secondary">Delete</button>
      </div>
    </li>`
    )
    .join('');

  list.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const event = events.find((x) => x.id === btn.dataset.edit);
      if (!event) return;
      document.getElementById('eventId').value = event.id;
      document.getElementById('title').value = event.title;
      document.getElementById('child').value = event.child;
      document.getElementById('start').value = toInputDateTime(event.start);
      document.getElementById('end').value = toInputDateTime(event.end);
      document.getElementById('location').value = event.location || '';
      document.getElementById('notes').value = event.notes || '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  list.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = events.findIndex((x) => x.id === btn.dataset.delete);
      if (idx < 0) return;
      events.splice(idx, 1);
      saveEvents(events);
      onChange();
    });
  });
}

(async function init() {
  const events = await loadEvents();
  const rerender = () => renderList(events, rerender);
  bindForm(events, rerender);
  rerender();
})();
