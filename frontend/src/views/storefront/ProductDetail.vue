<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { fetchProduct } from '../../api/catalog.js';
import { useCatalogStore } from '../../stores/catalog.js';
import { naira } from '../../utils/format.js';

const route = useRoute();
const catalog = useCatalogStore();
const product = ref(null);
const error = ref(null);

onMounted(async () => {
  catalog.load(); // for the category name; fires in parallel
  try {
    product.value = await fetchProduct(route.params.id);
  } catch (e) {
    error.value = e.message;
  }
});
</script>

<template>
  <main class="container">
    <p v-if="error" class="state-msg">{{ error }} — <RouterLink to="/" class="back">back to shop</RouterLink></p>
    <p v-else-if="!product" class="state-msg">Loading…</p>

    <article v-else class="detail card">
      <div class="thumb">
        <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" />
        <span v-else class="placeholder">🧺</span>
      </div>
      <div class="info">
        <p class="crumb"><RouterLink to="/">Shop</RouterLink> / {{ catalog.categoryName(product.category) }}</p>
        <h1>{{ product.name }}</h1>
        <p class="price big">{{ naira(product.price) }}</p>
        <p class="desc">{{ product.description }}</p>
        <p class="stock" :class="{ out: product.stock <= 0 }">
          {{ product.stock > 0 ? `${product.stock} in stock` : 'Out of stock' }}
        </p>
        <!-- Add-to-cart button lands in F5 -->
        <button class="btn btn-buy" disabled title="Cart coming soon">Add to cart</button>
      </div>
    </article>
  </main>
</template>

<style scoped>
.detail { display: grid; grid-template-columns: 1fr 1fr; margin: 2rem 0 3rem; }
@media (max-width: 700px) { .detail { grid-template-columns: 1fr; } }
.thumb { background: #f0ede8; display: grid; place-items: center; min-height: 320px; }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.placeholder { font-size: 4rem; opacity: 0.5; }
.info { padding: 1.5rem; }
.crumb { color: var(--muted); font-size: 0.85rem; margin: 0 0 0.5rem; }
.crumb a { color: var(--green); font-weight: 600; }
h1 { margin: 0 0 0.5rem; letter-spacing: -0.5px; }
.big { font-size: 1.5rem; margin: 0 0 1rem; }
.desc { color: var(--muted); margin: 0 0 1rem; }
.stock { font-weight: 600; color: var(--green); }
.stock.out { color: #b91c1c; }
.back { color: var(--green); font-weight: 600; }
</style>
