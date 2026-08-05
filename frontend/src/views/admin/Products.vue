<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import AdminNav from '../../components/AdminNav.vue';
import { fetchCategories } from '../../api/catalog.js';
import {
  adminListProducts, adminCreateProduct, adminUpdateProduct,
  adminSetProductActive, adminUploadImage,
} from '../../api/adminCatalog.js';
import { naira } from '../../utils/format.js';

const products = ref([]);
const categories = ref([]);
const loading = ref(true);
const loadError = ref(null);

const catName = (id) => categories.value.find((c) => c.id === id)?.name || '—';

// One reusable form for both create and edit; editingId null = creating.
const blank = { name: '', category: '', price: '', stock: '', description: '', imageUrl: '' };
const form = reactive({ ...blank });
const editingId = ref(null);
const showForm = ref(false);
const formError = ref(null);
const saving = ref(false);
const uploading = ref(false);

const heading = computed(() => (editingId.value ? 'Edit product' : 'Add product'));

async function load() {
  loading.value = true;
  loadError.value = null;
  try {
    [products.value, categories.value] = await Promise.all([adminListProducts(), fetchCategories()]);
  } catch (e) {
    loadError.value = e.message;
  } finally {
    loading.value = false;
  }
}
onMounted(load);

function openCreate() {
  Object.assign(form, blank);
  form.category = categories.value[0]?.id || '';
  editingId.value = null;
  formError.value = null;
  showForm.value = true;
}

function openEdit(p) {
  Object.assign(form, { name: p.name, category: p.category, price: p.price, stock: p.stock, description: p.description, imageUrl: p.imageUrl });
  editingId.value = p.id;
  formError.value = null;
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
}

async function onFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  uploading.value = true;
  formError.value = null;
  try {
    form.imageUrl = await adminUploadImage(file);
  } catch (err) {
    formError.value = err.message;
  } finally {
    uploading.value = false;
  }
}

async function save() {
  formError.value = null;
  saving.value = true;
  try {
    const payload = {
      name: form.name,
      category: form.category,
      price: Number(form.price),
      stock: Number(form.stock),
      description: form.description,
      imageUrl: form.imageUrl,
    };
    if (editingId.value) {
      const updated = await adminUpdateProduct(editingId.value, payload);
      const i = products.value.findIndex((p) => p.id === editingId.value);
      if (i !== -1) products.value[i] = updated;
    } else {
      products.value.unshift(await adminCreateProduct(payload));
    }
    showForm.value = false;
  } catch (e) {
    formError.value = e.message;
  } finally {
    saving.value = false;
  }
}

async function toggleActive(p) {
  try {
    await adminSetProductActive(p.id, !p.active);
    p.active = !p.active;
  } catch (e) {
    alert(e.message);
  }
}
</script>

<template>
  <AdminNav />
  <main class="container">
    <div class="head">
      <h1>Products</h1>
      <button class="btn btn-buy" @click="openCreate">+ Add product</button>
    </div>

    <p v-if="loading" class="state-msg">Loading products…</p>
    <p v-else-if="loadError" class="state-msg err">{{ loadError }}</p>

    <div v-else class="card list">
      <div v-for="p in products" :key="p.id" class="row" :class="{ inactive: !p.active }">
        <div class="thumb">
          <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" />
          <span v-else>🧺</span>
        </div>
        <div class="grow">
          <p class="name">{{ p.name }} <span v-if="!p.active" class="badge">Hidden</span></p>
          <p class="meta">{{ catName(p.category) }} · {{ naira(p.price) }} · {{ p.stock }} in stock</p>
        </div>
        <button class="ghost" @click="openEdit(p)">Edit</button>
        <button class="ghost" @click="toggleActive(p)">{{ p.active ? 'Hide' : 'Show' }}</button>
      </div>
      <p v-if="!products.length" class="state-msg">No products yet — add your first one.</p>
    </div>

    <!-- Create / edit form -->
    <div v-if="showForm" class="overlay" @click.self="closeForm">
      <form class="card panel" @submit.prevent="save">
        <h2>{{ heading }}</h2>
        <label>Name<input v-model="form.name" /></label>
        <label>Category
          <select v-model="form.category">
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </label>
        <div class="two">
          <label>Price (₦)<input v-model="form.price" type="number" min="0" /></label>
          <label>Stock<input v-model="form.stock" type="number" min="0" /></label>
        </div>
        <label>Description<textarea v-model="form.description" rows="2"></textarea></label>
        <label>Image
          <input type="file" accept="image/*" @change="onFile" />
        </label>
        <div v-if="uploading" class="hint">Uploading image…</div>
        <div v-else-if="form.imageUrl" class="preview"><img :src="form.imageUrl" alt="preview" /></div>
        <p v-if="formError" class="err">{{ formError }}</p>
        <div class="actions">
          <button type="button" class="ghost" @click="closeForm">Cancel</button>
          <button class="btn btn-buy" :disabled="saving || uploading">{{ saving ? 'Saving…' : 'Save' }}</button>
        </div>
      </form>
    </div>
  </main>
</template>

<style scoped>
.head { display: flex; align-items: center; justify-content: space-between; margin: 2rem 0 1rem; }
h1 { margin: 0; letter-spacing: -0.5px; }
.list { padding: 0.25rem 1rem; }
.row { display: flex; align-items: center; gap: 1rem; padding: 0.8rem 0; border-bottom: 1px solid var(--line); }
.row:last-child { border-bottom: 0; }
.row.inactive { opacity: 0.55; }
.thumb { width: 48px; height: 48px; border-radius: 8px; background: #f0ede8; display: grid; place-items: center; overflow: hidden; flex-shrink: 0; }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.grow { flex: 1; min-width: 0; }
.name { font-weight: 600; margin: 0; }
.meta { margin: 0.15rem 0 0; color: var(--muted); font-size: 0.85rem; }
.badge { background: #e7e5e4; color: var(--ink); font-size: 0.65rem; padding: 1px 6px; border-radius: 999px; font-weight: 700; vertical-align: middle; }
.ghost { background: var(--surface); border: 1px solid var(--line); color: var(--ink); padding: 0.4rem 0.8rem; border-radius: 8px; font-weight: 600; }
.ghost:hover { border-color: var(--green); color: var(--green); }
.err { color: #b91c1c; font-weight: 600; }
.overlay { position: fixed; inset: 0; background: #0006; display: grid; place-items: center; padding: 1rem; z-index: 20; }
.panel { width: 100%; max-width: 440px; padding: 1.5rem; display: grid; gap: 0.8rem; max-height: 90vh; overflow: auto; }
h2 { margin: 0; }
label { display: grid; gap: 0.3rem; font-weight: 600; font-size: 0.9rem; }
input, select, textarea { font: inherit; padding: 0.5rem 0.7rem; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); }
input:focus, select:focus, textarea:focus { outline: 2px solid var(--green); border-color: var(--green); }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
.hint { color: var(--muted); font-size: 0.85rem; }
.preview img { max-height: 90px; border-radius: 8px; }
.actions { display: flex; justify-content: flex-end; gap: 0.6rem; margin-top: 0.3rem; }
</style>
