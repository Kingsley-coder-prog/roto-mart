<script setup>
import { useCartStore } from '../../stores/cart.js';
import { naira } from '../../utils/format.js';

const cart = useCartStore();
</script>

<template>
  <main class="container">
    <h1>Your Cart</h1>

    <p v-if="!cart.items.length" class="state-msg">
      Your cart is empty — <RouterLink to="/" class="link">browse the shop</RouterLink>.
    </p>

    <template v-else>
      <div class="card lines">
        <div v-for="i in cart.items" :key="i.id" class="line">
          <div class="thumb">
            <img v-if="i.imageUrl" :src="i.imageUrl" :alt="i.name" />
            <span v-else>🧺</span>
          </div>
          <div class="grow">
            <RouterLink :to="`/product/${i.id}`" class="name">{{ i.name }}</RouterLink>
            <p class="each">{{ naira(i.price) }} each</p>
          </div>
          <div class="qty">
            <button @click="cart.setQty(i.id, i.qty - 1)" :disabled="i.qty <= 1">−</button>
            <span>{{ i.qty }}</span>
            <button @click="cart.setQty(i.id, i.qty + 1)" :disabled="i.qty >= i.stock">+</button>
          </div>
          <p class="price total">{{ naira(i.price * i.qty) }}</p>
          <button class="remove" @click="cart.remove(i.id)" title="Remove">✕</button>
        </div>
      </div>

      <div class="summary card">
        <RouterLink to="/" class="link">← Continue shopping</RouterLink>
        <p>Subtotal <span class="price">{{ naira(cart.subtotal) }}</span></p>
        <RouterLink to="/checkout"><button class="btn btn-buy">Proceed to checkout</button></RouterLink>
      </div>
    </template>
  </main>
</template>

<style scoped>
h1 { margin: 2rem 0 1rem; letter-spacing: -0.5px; }
.link { color: var(--green); font-weight: 600; }
.lines { padding: 0.25rem 1rem; }
.line { display: flex; align-items: center; gap: 1rem; padding: 0.9rem 0; border-bottom: 1px solid var(--line); }
.line:last-child { border-bottom: 0; }
.thumb { width: 56px; height: 56px; border-radius: 8px; background: #f0ede8; display: grid; place-items: center; overflow: hidden; flex-shrink: 0; }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.grow { flex: 1; min-width: 0; }
.name { font-weight: 600; }
.each { margin: 0; color: var(--muted); font-size: 0.85rem; }
.qty { display: flex; align-items: center; gap: 0.5rem; }
.qty button { width: 28px; height: 28px; border: 1px solid var(--line); background: var(--surface); border-radius: 6px; font-weight: 700; }
.qty button:disabled { opacity: 0.4; }
.total { width: 90px; text-align: right; margin: 0; }
.remove { border: 0; background: none; color: var(--muted); font-size: 1rem; }
.remove:hover { color: #b91c1c; }
.summary { margin: 1rem 0 3rem; padding: 1rem 1.25rem; display: flex; align-items: center; justify-content: space-between; }
.summary p { margin: 0; font-weight: 600; }
.summary .price { margin-left: 0.5rem; font-size: 1.2rem; }
</style>
