import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import CalendarView from './views/CalendarView.vue';
import AdminView from './views/AdminView.vue';
import './styles.css';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'calendar', component: CalendarView },
    { path: '/admin', name: 'admin', component: AdminView },
  ],
});

createApp(App).use(router).mount('#app');
