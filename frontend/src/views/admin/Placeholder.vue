<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchMe } from '../../api/auth.js';
import { useAdminStore } from '../../stores/admin.js';

const router = useRouter();
const admin = useAdminStore();
const email = ref('');

onMounted(async () => {
  try {
    // Confirms the stored token is still valid server-side; bounce to login if not.
    const me = await fetchMe(admin.token);
    email.value = me.email;
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
  <main class="container">
    <div class="bar">
      <h1>Admin dashboard</h1>
      <button class="btn logout" @click="logout">Log out</button>
    </div>
    <p class="who" v-if="email">Signed in as <strong>{{ email }}</strong></p>
    <p class="note">Products, categories, orders and payouts management land in F9–F10.</p>
  </main>
</template>

<style scoped>
.bar { display: flex; align-items: center; justify-content: space-between; margin: 2rem 0 0.5rem; }
h1 { margin: 0; letter-spacing: -0.5px; }
.logout { background: var(--surface); border: 1px solid var(--line); color: var(--ink); }
.who { color: var(--muted); }
.note { color: var(--muted); margin-top: 2rem; }
</style>
