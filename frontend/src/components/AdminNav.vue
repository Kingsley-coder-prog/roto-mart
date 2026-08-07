<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchMe } from '../api/auth.js';
import { useAdminStore } from '../stores/admin.js';

const router = useRouter();
const admin = useAdminStore();
const email = ref('');

onMounted(async () => {
  try {
    email.value = (await fetchMe(admin.token)).email; // re-validate token server-side
  } catch {
    admin.logout();
    router.replace('/admin/login');
  }
});

function logout() {
  admin.logout();
  router.replace('/admin/login');
}
</script>

<template>
  <header class="anav">
    <div class="container bar">
      <span class="brand">Roto<span>Mart</span> Admin</span>
      <nav class="links">
        <RouterLink to="/admin/products" class="link">Products</RouterLink>
        <RouterLink to="/admin/categories" class="link">Categories</RouterLink>
        <RouterLink to="/admin/orders" class="link">Orders</RouterLink>
        <RouterLink to="/admin/payouts" class="link">Payouts</RouterLink>
      </nav>
      <div class="right">
        <span v-if="email" class="who">{{ email }}</span>
        <button class="logout" @click="logout">Log out</button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.anav { background: var(--green); color: #fff; }
.bar { display: flex; align-items: center; gap: 1.5rem; height: 56px; }
.brand { font-weight: 800; letter-spacing: -0.3px; }
.brand span { color: var(--amber); }
.links { display: flex; gap: 1rem; }
.link { color: #ffffffcc; font-weight: 600; }
.link:hover, .link.router-link-active { color: #fff; }
.right { margin-left: auto; display: flex; align-items: center; gap: 1rem; }
.who { font-size: 0.85rem; color: #ffffffcc; }
.logout { background: #ffffff22; border: 1px solid #ffffff55; color: #fff; padding: 0.35rem 0.8rem; border-radius: 8px; font-weight: 600; }
.logout:hover { background: #ffffff33; }
</style>
