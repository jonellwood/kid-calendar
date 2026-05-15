<template>
  <div>
    <header class="top-bar">
      <h1>Kid Calendar</h1>
      <nav class="actions">
        <RouterLink to="/" class="nav-link" :class="{ active: route.path === '/' }">Calendar</RouterLink>
        <RouterLink to="/admin" class="nav-link" :class="{ active: route.path === '/admin' }">Admin</RouterLink>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { useRoute, RouterLink, RouterView } from 'vue-router';

const route = useRoute();
</script>
