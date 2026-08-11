<script setup>
import { reactive, ref } from 'vue';
import AdminNav from '../../components/AdminNav.vue';
import { changePassword } from '../../api/auth.js';

const form = reactive({ current: '', next: '', confirm: '' });
const error = ref(null);
const success = ref(false);
const saving = ref(false);

async function submit() {
  error.value = null;
  success.value = false;
  if (form.next.length < 8) { error.value = 'New password must be at least 8 characters.'; return; }
  if (form.next !== form.confirm) { error.value = 'New password and confirmation do not match.'; return; }
  saving.value = true;
  try {
    await changePassword(form.current, form.next);
    success.value = true;
    form.current = form.next = form.confirm = '';
  } catch (e) {
    error.value = e.message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <AdminNav />
  <main class="container">
    <h1>Settings</h1>

    <form class="card panel" @submit.prevent="submit">
      <h2>Change password</h2>
      <p class="hint">Choose a password only you know. You'll stay signed in after changing it.</p>
      <label>Current password<input v-model="form.current" type="password" autocomplete="current-password" /></label>
      <label>New password<input v-model="form.next" type="password" autocomplete="new-password" /></label>
      <label>Confirm new password<input v-model="form.confirm" type="password" autocomplete="new-password" /></label>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="ok">Password updated ✓</p>
      <button class="btn btn-buy" :disabled="saving">{{ saving ? 'Saving…' : 'Update password' }}</button>
    </form>
  </main>
</template>

<style scoped>
h1 { margin: 2rem 0 1rem; letter-spacing: -0.5px; }
.panel { max-width: 420px; padding: 1.5rem; display: grid; gap: 0.85rem; }
h2 { margin: 0; font-size: 1.1rem; }
.hint { margin: 0; color: var(--muted); font-size: 0.85rem; }
label { display: grid; gap: 0.3rem; font-weight: 600; font-size: 0.9rem; }
input { font: inherit; padding: 0.55rem 0.75rem; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); }
input:focus { outline: 2px solid var(--green); border-color: var(--green); }
.error { margin: 0; color: #b91c1c; font-weight: 600; font-size: 0.9rem; }
.ok { margin: 0; color: var(--green); font-weight: 700; font-size: 0.9rem; }
</style>
