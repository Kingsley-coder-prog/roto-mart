<script setup>
import { ref, computed, onMounted } from 'vue';
import { useCatalogStore } from '../../stores/catalog.js';
import ProductCard from '../../components/ProductCard.vue';

const catalog = useCatalogStore();
const selected = ref('all');

const visible = computed(() =>
  selected.value === 'all'
    ? catalog.products
    : catalog.products.filter((p) => p.category === selected.value),
);

onMounted(() => catalog.load());
</script>

<template>
  <main class="container">
    <section class="hero">
      <h1>Fresh picks, everyday needs.</h1>
      <p>Farm produce, treats, and hygiene essentials — delivered from one trusted store.</p>
    </section>

    <p v-if="catalog.loading" class="state-msg">Loading products…</p>
    <p v-else-if="catalog.error" class="state-msg">Couldn't load products — {{ catalog.error }}</p>

    <template v-else>
      <div class="chips">
        <button class="chip" :class="{ on: selected === 'all' }" @click="selected = 'all'">All</button>
        <button
          v-for="c in catalog.categories"
          :key="c.id"
          class="chip"
          :class="{ on: selected === c.id }"
          @click="selected = c.id"
        >
          {{ c.name }}
        </button>
      </div>

      <p v-if="!visible.length" class="state-msg">No products in this category yet.</p>
      <div class="grid">
        <ProductCard v-for="p in visible" :key="p.id" :product="p" />
      </div>
    </template>
  </main>
</template>

<style scoped>
.hero { padding: 2.5rem 0 1.5rem; }
.hero h1 { margin: 0 0 0.35rem; font-size: 1.9rem; letter-spacing: -0.5px; }
.hero p { margin: 0; color: var(--muted); }
.chips { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.25rem; }
.chip {
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
  font-weight: 600;
  color: var(--muted);
}
.chip.on { background: var(--green); border-color: var(--green); color: #fff; }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;
  padding-bottom: 3rem;
}
</style>
