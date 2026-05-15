<template>
  <section class="admin-layout">
    <form class="card" @submit.prevent="onSubmit">
      <h2>Add / Edit Event</h2>

      <label>
        Title
        <input v-model="form.title" required />
      </label>

      <label>
        Child
        <input v-model="form.child" required />
      </label>

      <label>
        Start
        <input v-model="form.start" type="datetime-local" required />
      </label>

      <label>
        End
        <input v-model="form.end" type="datetime-local" required />
      </label>

      <label>
        Location
        <input v-model="form.location" />
      </label>

      <label>
        Notes
        <textarea v-model="form.notes" rows="3"></textarea>
      </label>

      <section class="recurrence-box">
        <label class="inline-toggle">
          <input v-model="form.repeatEnabled" type="checkbox" :disabled="Boolean(form.id)" />
          Repeat this event
        </label>

        <div v-if="form.repeatEnabled" class="recurrence-grid">
          <label>
            Every
            <input v-model.number="form.repeatInterval" type="number" min="1" required />
          </label>

          <label>
            Unit
            <select v-model="form.repeatFrequency">
              <option value="day">Day(s)</option>
              <option value="week">Week(s)</option>
              <option value="month">Month(s)</option>
              <option value="year">Year(s)</option>
            </select>
          </label>

          <label>
            Total occurrences
            <input v-model.number="form.repeatCount" type="number" min="2" max="120" required />
          </label>
        </div>

        <p v-if="form.repeatEnabled" class="muted input-hint">{{ repeatSummary }}</p>
        <p v-if="form.id" class="muted input-hint">Recurrence is only applied when creating a new event.</p>
      </section>

      <div class="row">
        <button type="submit">Save Event</button>
        <button type="button" class="secondary" @click="resetForm">Clear</button>
        <button type="button" class="secondary" @click="downloadJson">Download JSON</button>
      </div>

      <p class="muted">Changes are saved in your browser. Download JSON to update repository data.</p>
      <p v-if="status" :class="statusType">{{ status }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </form>

    <section class="card">
      <h2>Events</h2>
      <p v-if="loading" class="muted">Loading events...</p>

      <ul v-else class="event-list">
        <li v-for="event in sortedEvents" :key="event.id">
          <strong>{{ event.title }}</strong><br />
          {{ new Date(event.start).toLocaleString() }} - {{ new Date(event.end).toLocaleString() }}<br />
            <span class="muted">
              {{ event.child }}
              <span v-if="event.location">
                •
                <a class="map-link" :href="locationHref(event.location)" target="_blank" rel="noopener noreferrer">{{ event.location }}</a>
              </span>
            </span>
          <div class="row">
            <button type="button" @click="editEvent(event)">Edit</button>
            <button type="button" class="secondary" @click="deleteEvent(event.id)">Delete</button>
          </div>
        </li>
      </ul>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useEvents } from '../composables/useEvents';

const { events, sortedEvents, loading, error, loadEvents, upsertEvent, removeEvent, replaceEvents } = useEvents();

const status = ref('');
const statusType = ref('muted');

const form = reactive({
  id: '',
  title: '',
  child: '',
  start: '',
  end: '',
  location: '',
  notes: '',
  repeatEnabled: false,
  repeatInterval: 1,
  repeatFrequency: 'week',
  repeatCount: 2,
});

function toIsoDate(value) {
  return new Date(value).toISOString();
}

function formatRangeDate(value) {
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function addInterval(date, frequency, steps) {
  const next = new Date(date);
  if (frequency === 'day') {
    next.setDate(next.getDate() + steps);
    return next;
  }
  if (frequency === 'week') {
    next.setDate(next.getDate() + (steps * 7));
    return next;
  }
  if (frequency === 'month') {
    next.setMonth(next.getMonth() + steps);
    return next;
  }
  next.setFullYear(next.getFullYear() + steps);
  return next;
}

function createEventId(index = 0) {
  return `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
}

const repeatSummary = computed(() => {
  if (!form.repeatEnabled || !form.start) {
    return 'Create a repeating series with one save.';
  }

  const repeatCount = Number(form.repeatCount);
  const repeatInterval = Number(form.repeatInterval);
  if (!Number.isFinite(repeatCount) || repeatCount < 2 || !Number.isFinite(repeatInterval) || repeatInterval < 1) {
    return 'Use at least 2 occurrences and an interval of 1 or more.';
  }

  const first = new Date(form.start);
  const last = addInterval(first, form.repeatFrequency, repeatInterval * (repeatCount - 1));
  return `Will create ${repeatCount} events from ${formatRangeDate(first)} to ${formatRangeDate(last)}.`;
});

function toInputDateTime(value) {
  const date = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function locationHref(location) {
  const trimmed = String(location || '').trim();
  if (!trimmed) return '#';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
}

function resetForm() {
  form.id = '';
  form.title = '';
  form.child = '';
  form.start = '';
  form.end = '';
  form.location = '';
  form.notes = '';
  form.repeatEnabled = false;
  form.repeatInterval = 1;
  form.repeatFrequency = 'week';
  form.repeatCount = 2;
}

function onSubmit() {
  const startDate = new Date(form.start);
  const endDate = new Date(form.end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    status.value = 'Start and end are required.';
    statusType.value = 'error';
    return;
  }

  if (endDate <= startDate) {
    status.value = 'End time must be after start time.';
    statusType.value = 'error';
    return;
  }

  if (form.id) {
    upsertEvent({
      id: form.id,
      title: form.title.trim(),
      child: form.child.trim(),
      start: toIsoDate(startDate),
      end: toIsoDate(endDate),
      location: form.location.trim(),
      notes: form.notes.trim(),
    });

    status.value = 'Event updated.';
    statusType.value = 'success';
    resetForm();
    return;
  }

  if (form.repeatEnabled) {
    const repeatCount = Number(form.repeatCount);
    const repeatInterval = Number(form.repeatInterval);
    if (!Number.isFinite(repeatCount) || repeatCount < 2 || !Number.isFinite(repeatInterval) || repeatInterval < 1) {
      status.value = 'Recurrence must be at least 2 occurrences with interval 1 or more.';
      statusType.value = 'error';
      return;
    }

    const durationMs = endDate.getTime() - startDate.getTime();
    const series = [];
    for (let index = 0; index < repeatCount; index += 1) {
      const nextStart = addInterval(startDate, form.repeatFrequency, repeatInterval * index);
      const nextEnd = new Date(nextStart.getTime() + durationMs);
      series.push({
        id: createEventId(index),
        title: form.title.trim(),
        child: form.child.trim(),
        start: toIsoDate(nextStart),
        end: toIsoDate(nextEnd),
        location: form.location.trim(),
        notes: form.notes.trim(),
      });
    }

    replaceEvents([...events.value, ...series]);
    status.value = `Created ${series.length} recurring events.`;
    statusType.value = 'success';
    resetForm();
    return;
  }

  const id = createEventId();
  upsertEvent({
    id,
    title: form.title.trim(),
    child: form.child.trim(),
    start: toIsoDate(startDate),
    end: toIsoDate(endDate),
    location: form.location.trim(),
    notes: form.notes.trim(),
  });

  status.value = 'Saved to browser storage.';
  statusType.value = 'success';
  resetForm();
}

function editEvent(event) {
  form.id = event.id;
  form.title = event.title;
  form.child = event.child;
  form.start = toInputDateTime(event.start);
  form.end = toInputDateTime(event.end);
  form.location = event.location || '';
  form.notes = event.notes || '';
  form.repeatEnabled = false;
  form.repeatInterval = 1;
  form.repeatFrequency = 'week';
  form.repeatCount = 2;
}

function deleteEvent(id) {
  removeEvent(id);
  status.value = 'Event removed from browser storage.';
  statusType.value = 'success';
}

function downloadJson() {
  const payload = JSON.stringify({ events: sortedEvents.value }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'events.json';
  anchor.click();
  URL.revokeObjectURL(url);
  status.value = 'events.json downloaded. Replace data/events.json and commit.';
  statusType.value = 'success';
}

onMounted(loadEvents);
</script>
