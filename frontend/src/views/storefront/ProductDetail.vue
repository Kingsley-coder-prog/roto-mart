<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { fetchProduct } from '../../api/catalog.js';
import { useCatalogStore } from '../../stores/catalog.js';
import { useCartStore } from '../../stores/cart.js';
import { naira } from '../../utils/format.js';

const route = useRoute();
const catalog = useCatalogStore();
const cart = useCartStore();
const product = ref(null);
const error = ref(null);
const qty = ref(1);
const added = ref(false);

function addToCart() {
  cart.add(product.value, qty.value);
  added.value = true;
  setTimeout(() => (added.value = false), 1800);
}

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
        <div v-if="product.stock > 0" class="buy-row">
          <div class="qty">
            <button @click="qty = Math.max(1, qty - 1)" :disabled="qty <= 1">−</button>
            <span>{{ qty }}</span>
            <button @click="qty = Math.min(product.stock, qty + 1)" :disabled="qty >= product.stock">+</button>
          </div>
          <button class="btn btn-buy" @click="addToCart">{{ added ? 'Added ✓' : 'Add to cart' }}</button>
          <RouterLink v-if="cart.count" to="/cart" class="view-cart">View cart →</RouterLink>
        </div>
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
.buy-row { display: flex; align-items: center; gap: 0.9rem; flex-wrap: wrap; }
.qty { display: flex; align-items: center; gap: 0.6rem; }
.qty button { width: 32px; height: 32px; border: 1px solid var(--line); background: var(--surface); border-radius: 8px; font-weight: 700; }
.qty button:disabled { opacity: 0.4; }
.qty span { min-width: 20px; text-align: center; font-weight: 700; }
.view-cart { color: var(--green); font-weight: 600; }
</style>
