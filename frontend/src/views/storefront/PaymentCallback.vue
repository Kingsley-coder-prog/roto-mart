<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useCartStore } from '../../stores/cart.js';
import { verifyOrder } from '../../api/orders.js';
import { naira } from '../../utils/format.js';

const route = useRoute();
const cart = useCartStore();
const state = ref('verifying'); // verifying | success | failed
const order = ref(null);
const error = ref(null);

onMounted(async () => {
  // Paystack redirects back with ?reference= (and legacy ?trxref=)
  const reference = route.query.reference || route.query.trxref;
  if (!reference) { state.value = 'failed'; error.value = 'No payment reference found.'; return; }
  try {
    const result = await verifyOrder(reference);
    order.value = result;
    if (result.paid) {
      cart.clear();
      state.value = 'success';
    } else {
      state.value = 'failed';
      error.value = 'Your payment was not completed. You have not been charged for this order.';
    }
  } catch (e) {
    state.value = 'failed';
    error.value = e.message;
  }
});
</script>

<template>
  <main class="container">
    <p v-if="state === 'verifying'" class="state-msg">Confirming your payment…</p>

    <div v-else-if="state === 'success'" class="card panel">
      <h1>Payment confirmed 🎉</h1>
      <p class="order-id">Order <RouterLink :to="`/track/${order.orderId}`"><strong>{{ order.orderId }}</strong></RouterLink></p>
      <p class="note">Keep this order number — you'll use it to track your delivery. A confirmation email with your tracking link is on its way.</p>
      <p v-for="i in order.items" :key="i.id" class="row">
        <span>{{ i.name }} × {{ i.qty }}</span><span>{{ naira(i.price * i.qty) }}</span>
      </p>
      <p class="row grand"><span>Paid</span><span class="price">{{ naira(order.total) }}</span></p>
      <RouterLink to="/"><button class="btn btn-buy">Back to the shop</button></RouterLink>
    </div>

    <div v-else class="card panel">
      <h1>Payment not completed</h1>
      <p class="note">{{ error }}</p>
      <RouterLink to="/checkout"><button class="btn btn-buy">Try again</button></RouterLink>
      <RouterLink to="/cart" class="link">Back to cart</RouterLink>
    </div>
  </main>
</template>

<style scoped>
.panel { max-width: 480px; margin: 3rem auto; padding: 1.5rem 1.75rem; }
h1 { margin: 0 0 0.75rem; font-size: 1.4rem; letter-spacing: -0.5px; }
.order-id { font-size: 1.05rem; margin: 0 0 0.25rem; }
.note { color: var(--muted); margin: 0 0 1rem; }
.row { display: flex; justify-content: space-between; margin: 0.4rem 0; color: var(--muted); }
.grand { border-top: 1px solid var(--line); padding-top: 0.6rem; margin: 0.6rem 0 1.25rem; color: var(--ink); font-weight: 700; }
.link { display: inline-block; margin-left: 1rem; color: var(--green); font-weight: 600; }
</style>
