import { computed, ref } from 'vue';
import bundledData from '../../data/events.json';

const STORAGE_KEY = 'kid-calendar-events';
const events = ref([]);
const loading = ref(false);
const error = ref('');
const initialized = ref(false);

function parseStoredEvents(rawValue) {
  if (!rawValue) return null;
  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function persistEvents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events.value));
}

async function loadEvents() {
  if (initialized.value) return;

  loading.value = true;
  error.value = '';

  const fromStorage = parseStoredEvents(localStorage.getItem(STORAGE_KEY));
  if (fromStorage) {
    events.value = fromStorage;
    initialized.value = true;
    loading.value = false;
    return;
  }

  events.value = Array.isArray(bundledData.events) ? bundledData.events : [];
  persistEvents();
  initialized.value = true;
  loading.value = false;
}

function upsertEvent(nextEvent) {
  const index = events.value.findIndex((item) => item.id === nextEvent.id);
  if (index >= 0) {
    events.value[index] = nextEvent;
  } else {
    events.value.push(nextEvent);
  }
  persistEvents();
}

function removeEvent(id) {
  const index = events.value.findIndex((item) => item.id === id);
  if (index < 0) return;
  events.value.splice(index, 1);
  persistEvents();
}

function replaceEvents(nextEvents) {
  events.value = [...nextEvents];
  persistEvents();
}

const sortedEvents = computed(() => {
  return [...events.value].sort((a, b) => new Date(a.start) - new Date(b.start));
});

export function useEvents() {
  return {
    events,
    sortedEvents,
    loading,
    error,
    loadEvents,
    upsertEvent,
    removeEvent,
    replaceEvents,
  };
}
