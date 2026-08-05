<script setup>
import { ref, onMounted } from 'vue';
import AdminNav from '../../components/AdminNav.vue';
import { fetchCategories } from '../../api/catalog.js';
import { adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from '../../api/adminCatalog.js';

const categories = ref([]);
const loading = ref(true);
const loadError = ref(null);

const newName = ref('');
const adding = ref(false);
const error = ref(null);

const editingId = ref(null);
const editName = ref('');

async function load() {
  loading.value = true;
  try {
    categories.value = await fetchCategories();
  } catch (e) {
    loadError.value = e.message;
  } finally {
    loading.value = false;
  }
}
onMounted(load);

async function add() {
  if (!newName.value.trim()) return;
  adding.value = true;
  error.value = null;
  try {
    categories.value.push(await adminCreateCategory(newName.value.trim()));
    newName.value = '';
  } catch (e) {
    error.value = e.message;
  } finally {
    adding.value = false;
  }
}

function startEdit(c) {
  editingId.value = c.id;
  editName.value = c.name;
  error.value = null;
}

async function saveEdit(c) {
  if (!editName.value.trim()) return;
  try {
    const updated = await adminUpdateCategory(c.id, editName.value.trim());
    Object.assign(c, updated);
    editingId.value = null;
  } catch (e) {
    error.value = e.message;
  }
}

async function remove(c) {
  if (!confirm(`Delete category "${c.name}"?`)) return;
  error.value = null;
  try {
    await adminDeleteCategory(c.id);
    categories.value = categories.value.filter((x) => x.id !== c.id);
  } catch (e) {
    error.value = e.message;
  }
}
</script>

<template>
  <AdminNav />
  <main class="container">
    <h1>Categories</h1>

    <form class="card addbar" @submit.prevent="add">
      <input v-model="newName" placeholder="New category name" />
      <button class="btn btn-buy" :disabled="adding">{{ adding ? 'Adding…' : 'Add' }}</button>
    </form>
    <p v-if="error" class="err">{{ error }}</p>

    <p v-if="loading" class="state-msg">Loading…</p>
    <p v-else-if="loadError" class="state-msg err">{{ loadError }}</p>

    <div v-else class="card list">
      <div v-for="c in categories" :key="c.id" class="row">
        <template v-if="editingId === c.id">
          <input v-model="editName" class="editinput" @keyup.enter="saveEdit(c)" />
          <button class="ghost" @click="saveEdit(c)">Save</button>
          <button class="ghost" @click="editingId = null">Cancel</button>
        </template>
        <template v-else>
          <span class="name">{{ c.name }}</span>
          <button class="ghost" @click="startEdit(c)">Rename</button>
          <button class="ghost danger" @click="remove(c)">Delete</button>
        </template>
      </div>
      <p v-if="!categories.length" class="state-msg">No categories yet.</p>
    </div>
  </main>
</template>

<style scoped>
h1 { margin: 2rem 0 1rem; letter-spacing: -0.5px; }
.addbar { display: flex; gap: 0.6rem; padding: 0.8rem; margin-bottom: 0.5rem; }
.addbar input { flex: 1; font: inherit; padding: 0.5rem 0.7rem; border: 1px solid var(--line); border-radius: 8px; }
.addbar input:focus { outline: 2px solid var(--green); border-color: var(--green); }
.err { color: #b91c1c; font-weight: 600; }
.list { padding: 0.25rem 1rem; }
.row { display: flex; align-items: center; gap: 0.6rem; padding: 0.75rem 0; border-bottom: 1px solid var(--line); }
.row:last-child { border-bottom: 0; }
.name { flex: 1; font-weight: 600; }
.editinput { flex: 1; font: inherit; padding: 0.4rem 0.6rem; border: 1px solid var(--green); border-radius: 8px; outline: none; }
.ghost { background: var(--surface); border: 1px solid var(--line); color: var(--ink); padding: 0.4rem 0.8rem; border-radius: 8px; font-weight: 600; }
.ghost:hover { border-color: var(--green); color: var(--green); }
.ghost.danger:hover { border-color: #b91c1c; color: #b91c1c; }
</style>
