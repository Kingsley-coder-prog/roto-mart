<script setup>
import { useCartStore } from '../stores/cart.js';

const cart = useCartStore();
</script>

<template>
  <header class="header">
    <div class="container bar">
      <RouterLink to="/" class="logo">Roto<span>Mart</span></RouterLink>
      <nav class="nav">
        <RouterLink to="/" class="nav-link">Shop</RouterLink>
        <RouterLink to="/cart" class="nav-link cart">
          🛒 Cart
          <span v-if="cart.count" class="badge">{{ cart.count }}</span>
        </RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.header { background: var(--green); color: #fff; }
.bar { display: flex; align-items: center; justify-content: space-between; height: 60px; }
.logo { font-size: 1.35rem; font-weight: 800; letter-spacing: -0.5px; }
.logo span { color: var(--amber); }
.nav { display: flex; gap: 1.25rem; align-items: center; }
.nav-link { font-weight: 600; opacity: 0.9; }
.nav-link:hover { opacity: 1; }
.cart { position: relative; }
.badge {
  position: absolute; top: -8px; right: -14px;
  background: var(--amber); color: var(--ink);
  border-radius: 999px; font-size: 0.7rem; font-weight: 800;
  min-width: 18px; height: 18px; display: grid; place-items: center; padding: 0 4px;
}
</style>
