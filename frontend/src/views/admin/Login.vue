<script setup>
import { reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { login } from '../../api/auth.js';
import { useAdminStore } from '../../stores/admin.js';

const router = useRouter();
const route = useRoute();
const admin = useAdminStore();
const form = reactive({ email: '', password: '' });
const error = ref(null);
const submitting = ref(false);

async function submit() {
  error.value = null;
  submitting.value = true;
  try {
    const { token } = await login(form.email, form.password);
    admin.setToken(token);
    router.replace(route.query.redirect || '/admin');
  } catch (e) {
    error.value = e.message;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <main class="wrap">
    <form class="card panel" @submit.prevent="submit">
      <h1>Roto<span>Mart</span> Admin</h1>
      <p class="sub">Sign in to manage your store.</p>
      <label>Email<input v-model="form.email" type="email" autocomplete="username" /></label>
      <label>Password<input v-model="form.password" type="password" autocomplete="current-password" /></label>
      <p v-if="error" class="error">{{ error }}</p>
      <button class="btn btn-buy" :disabled="submitting">{{ submitting ? 'Signing in…' : 'Sign in' }}</button>
    </form>
  </main>
</template>

<style scoped>
.wrap { min-height: 70vh; display: grid; place-items: center; }
.panel { width: 100%; max-width: 360px; padding: 1.75rem; display: grid; gap: 0.9rem; }
h1 { margin: 0; font-size: 1.4rem; letter-spacing: -0.5px; }
h1 span { color: var(--amber); }
.sub { margin: 0 0 0.5rem; color: var(--muted); }
label { display: grid; gap: 0.3rem; font-weight: 600; font-size: 0.9rem; }
input { font: inherit; padding: 0.55rem 0.75rem; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); }
input:focus { outline: 2px solid var(--green); border-color: var(--green); }
.error { margin: 0; color: #b91c1c; font-weight: 600; font-size: 0.9rem; }
</style>
