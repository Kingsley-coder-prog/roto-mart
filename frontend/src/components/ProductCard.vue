<script setup>
import { naira } from '../utils/format.js';

defineProps({ product: { type: Object, required: true } });
</script>

<template>
  <RouterLink :to="`/product/${product.id}`" class="card product-card">
    <div class="thumb">
      <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" loading="lazy" />
      <span v-else class="placeholder">🧺</span>
    </div>
    <div class="body">
      <h3>{{ product.name }}</h3>
      <p class="price">{{ naira(product.price) }}</p>
      <p v-if="product.stock <= 0" class="oos">Out of stock</p>
    </div>
  </RouterLink>
</template>

<style scoped>
.product-card { display: block; transition: transform 0.15s, box-shadow 0.15s; }
.product-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgb(28 25 23 / 0.12); }
.thumb { aspect-ratio: 4 / 3; background: #f0ede8; display: grid; place-items: center; }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.placeholder { font-size: 2.5rem; opacity: 0.5; }
.body { padding: 0.75rem 1rem 1rem; }
h3 { margin: 0 0 0.25rem; font-size: 1rem; }
.price { margin: 0; }
.oos { margin: 0.25rem 0 0; color: #b91c1c; font-size: 0.85rem; font-weight: 600; }
</style>
