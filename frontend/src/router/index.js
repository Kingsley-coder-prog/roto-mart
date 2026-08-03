import { createRouter, createWebHistory } from 'vue-router';

// Storefront routes are public; /admin routes get a JWT guard in F8.
const routes = [
  { path: '/', name: 'home', component: () => import('../views/storefront/Home.vue') },
  // Admin group — pages added in F8–F10
  { path: '/admin', name: 'admin', component: () => import('../views/admin/Placeholder.vue') },
];

export default createRouter({ history: createWebHistory(), routes });
