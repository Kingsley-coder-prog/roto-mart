import { createRouter, createWebHistory } from 'vue-router';
import { useAdminStore } from '../stores/admin.js';

// Storefront routes are public; /admin routes require a valid admin JWT (F8).
const routes = [
  { path: '/', name: 'home', component: () => import('../views/storefront/Home.vue') },
  { path: '/product/:id', name: 'product', component: () => import('../views/storefront/ProductDetail.vue') },
  { path: '/cart', name: 'cart', component: () => import('../views/storefront/Cart.vue') },
  { path: '/checkout', name: 'checkout', component: () => import('../views/storefront/Checkout.vue') },
  { path: '/payment/callback', name: 'payment-callback', component: () => import('../views/storefront/PaymentCallback.vue') },
  { path: '/track/:orderId', name: 'track', component: () => import('../views/storefront/TrackOrder.vue') },
  // Admin group
  { path: '/admin/login', name: 'admin-login', component: () => import('../views/admin/Login.vue') },
  { path: '/admin', name: 'admin', component: () => import('../views/admin/Placeholder.vue'), meta: { requiresAdmin: true } },
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to) => {
  const admin = useAdminStore();
  if (to.meta.requiresAdmin && !admin.isAuthenticated) {
    return { name: 'admin-login', query: { redirect: to.fullPath } };
  }
  if (to.name === 'admin-login' && admin.isAuthenticated) {
    return { name: 'admin' };
  }
});

export default router;
