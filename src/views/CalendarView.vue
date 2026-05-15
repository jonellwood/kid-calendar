<template>
  <section class="card">
    <div class="toolbar">
      <button :class="{ active: mode === 'month' }" @click="mode = 'month'">Month</button>
      <button :class="{ active: mode === 'week' }" @click="mode = 'week'">Week</button>
      <button :class="{ active: mode === 'agenda' }" @click="mode = 'agenda'">Agenda</button>
    </div>

    <p v-if="loading" class="muted">Loading events...</p>
    <p v-else-if="error" class="error">{{ error }}</p>

    <div v-else-if="mode === 'month'">
      <div class="month-header">
        <button type="button" @click="shiftMonth(-1)">Previous</button>
        <h2>{{ monthTitle }}</h2>
        <button type="button" @click="shiftMonth(1)">Next</button>
      </div>

      <div class="weekday-row" aria-hidden="true">
        <div v-for="label in weekdayLabels" :key="label" class="weekday-label">{{ label }}</div>
      </div>

      <div class="calendar-grid">
        <article v-for="day in monthDays" :key="day.iso" class="day" :class="{ past: day.isPast, 'outside-month': !day.isCurrentMonth }">
          <div class="day-number">{{ day.date.getDate() }}</div>
          <article
            v-for="event in day.events.slice(0, 3)"
            :key="event.id"
            class="month-event"
            tabindex="0"
            :title="eventTooltipText(event)"
            @mouseenter="openTooltip(tooltipKey(event, day.iso))"
            @focusin="openTooltip(tooltipKey(event, day.iso))"
            @mouseleave="deferHideTooltip(tooltipKey(event, day.iso))"
            @focusout="deferHideTooltip(tooltipKey(event, day.iso))"
          >
            <div class="small-event">{{ event.title }} - {{ event.child }}</div>
            <div class="event-tooltip" :class="{ visible: isTooltipVisible(tooltipKey(event, day.iso)) }" role="tooltip">
              <strong>{{ event.title }}</strong>
              <div>{{ event.child }}</div>
              <div>{{ formatDateTime(event.start) }} - {{ formatDateTime(event.end) }}</div>
              <div v-if="event.location">
                Location:
                <a class="map-link" :href="locationHref(event.location)" target="_blank" rel="noopener noreferrer">{{ event.location }}</a>
              </div>
              <div v-if="event.notes">Notes: {{ event.notes }}</div>
            </div>
          </article>
        </article>
      </div>
    </div>

    <div v-else-if="mode === 'week'">
      <div class="month-header">
        <button type="button" @click="shiftWeek(-1)">Previous</button>
        <h2>{{ weekTitle }}</h2>
        <button type="button" @click="shiftWeek(1)">Next</button>
      </div>
      <div class="week-grid">
        <article v-for="day in weekDays" :key="day.iso" class="week-day" :class="{ past: day.isPast }">
          <h3>{{ day.label }}</h3>
          <article
            v-for="event in day.events"
            :key="event.id"
            class="week-event"
            tabindex="0"
            :title="eventTooltipText(event)"
            @mouseenter="openTooltip(tooltipKey(event, day.iso))"
            @focusin="openTooltip(tooltipKey(event, day.iso))"
            @mouseleave="deferHideTooltip(tooltipKey(event, day.iso))"
            @focusout="deferHideTooltip(tooltipKey(event, day.iso))"
          >
            <div class="small-event">{{ formatTime(event.start) }} {{ event.title }} - {{ event.child }}</div>
            <div class="event-tooltip" :class="{ visible: isTooltipVisible(tooltipKey(event, day.iso)) }" role="tooltip">
              <strong>{{ event.title }}</strong>
              <div>{{ event.child }}</div>
              <div>{{ formatDateTime(event.start) }} - {{ formatDateTime(event.end) }}</div>
              <div v-if="event.location">
                Location:
                <a class="map-link" :href="locationHref(event.location)" target="_blank" rel="noopener noreferrer">{{ event.location }}</a>
              </div>
              <div v-if="event.notes">Notes: {{ event.notes }}</div>
            </div>
          </article>
        </article>
      </div>
    </div>

    <div v-else>
      <h2>Agenda</h2>
      <article v-for="event in sortedEvents" :key="event.id" class="event-item" :class="{ past: isPast(event.start) }">
        <strong>{{ event.title }}</strong>
        <div>{{ formatDateTime(event.start) }} - {{ formatDateTime(event.end) }}</div>
        <div>
          {{ event.child }}
          <span v-if="event.location">
            •
            <a class="map-link" :href="locationHref(event.location)" target="_blank" rel="noopener noreferrer">{{ event.location }}</a>
          </span>
        </div>
        <div v-if="event.notes" class="muted">{{ event.notes }}</div>
      </article>
      <p v-if="sortedEvents.length === 0" class="muted">No events yet.</p>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useEvents } from '../composables/useEvents';

const mode = ref('month');
const { sortedEvents, loading, error, loadEvents } = useEvents();
const monthCursor = ref(null);
const openTooltipId = ref('');
const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
let hideTooltipTimer = null;

const today = new Date();
today.setHours(0, 0, 0, 0);

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateTime(value) {
  const date = new Date(value);
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatTime(value) {
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function locationHref(location) {
  const trimmed = String(location || '').trim();
  if (!trimmed) return '#';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
}

function eventTooltipText(event) {
  const details = [
    event.title,
    event.child,
    `${formatDateTime(event.start)} - ${formatDateTime(event.end)}`,
  ];

  if (event.location) {
    details.push(`Location: ${event.location}`);
  }
  if (event.notes) {
    details.push(`Notes: ${event.notes}`);
  }

  return details.join('\n');
}

function tooltipKey(event, dayIso) {
  return `${event.id}-${dayIso}`;
}

function clearHideTooltipTimer() {
  if (hideTooltipTimer) {
    clearTimeout(hideTooltipTimer);
    hideTooltipTimer = null;
  }
}

function openTooltip(id) {
  clearHideTooltipTimer();
  openTooltipId.value = id;
}

function deferHideTooltip(id) {
  clearHideTooltipTimer();
  hideTooltipTimer = setTimeout(() => {
    if (openTooltipId.value === id) {
      openTooltipId.value = '';
    }
  }, 5000);
}

function isTooltipVisible(id) {
  return openTooltipId.value === id;
}

function isPast(value) {
  return startOfDay(value) < today;
}

function chooseBaseDate() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const hasCurrentMonthEvents = sortedEvents.value.some((event) => {
    const date = new Date(event.start);
    return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
  });

  if (hasCurrentMonthEvents || sortedEvents.value.length === 0) {
    return now;
  }

  const upcoming = sortedEvents.value.find((event) => new Date(event.start) >= now);
  if (upcoming) return new Date(upcoming.start);

  return new Date(sortedEvents.value[0].start);
}

const baseDate = computed(() => chooseBaseDate());

const activeBaseDate = computed(() => {
  return monthCursor.value || baseDate.value;
});

function shiftMonth(delta) {
  const next = new Date(activeBaseDate.value);
  next.setDate(1);
  next.setMonth(next.getMonth() + delta);
  monthCursor.value = next;
}

function shiftWeek(deltaWeeks) {
  const next = new Date(activeBaseDate.value);
  next.setDate(next.getDate() + (deltaWeeks * 7));
  monthCursor.value = next;
}

const monthTitle = computed(() => {
  return activeBaseDate.value.toLocaleDateString([], { month: 'long', year: 'numeric' });
});

const monthDays = computed(() => {
  const year = activeBaseDate.value.getFullYear();
  const month = activeBaseDate.value.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  const result = [];
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const iso = date.toISOString().slice(0, 10);
    result.push({
      iso,
      date,
      isPast: startOfDay(date) < today,
      isCurrentMonth: date.getMonth() === month,
      events: sortedEvents.value.filter((event) => event.start.slice(0, 10) === iso),
    });
  }
  return result;
});

const weekTitle = computed(() => {
  const start = new Date(activeBaseDate.value);
  start.setDate(activeBaseDate.value.getDate() - activeBaseDate.value.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
});

const weekDays = computed(() => {
  const start = new Date(activeBaseDate.value);
  start.setDate(activeBaseDate.value.getDate() - activeBaseDate.value.getDay());

  const result = [];
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const iso = date.toISOString().slice(0, 10);
    result.push({
      iso,
      date,
      label: date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
      isPast: startOfDay(date) < today,
      events: sortedEvents.value.filter((event) => event.start.slice(0, 10) === iso),
    });
  }
  return result;
});

onMounted(async () => {
  await loadEvents();
  if (!monthCursor.value) {
    monthCursor.value = new Date(baseDate.value);
  }
});

onBeforeUnmount(() => {
  clearHideTooltipTimer();
});
</script>
