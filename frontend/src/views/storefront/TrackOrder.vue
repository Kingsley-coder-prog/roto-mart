<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { trackOrder } from '../../api/orders.js';
import { naira } from '../../utils/format.js';

const route = useRoute();
const order = ref(null);
const error = ref(null);

const STEPS = ['paid', 'ready', 'shipped', 'delivered'];
const LABELS = { paid: 'Paid', ready: 'Ready', shipped: 'Shipped', delivered: 'Delivered' };

const stepIndex = computed(() => STEPS.indexOf(order.value?.status));

onMounted(async () => {
  try {
    order.value = await trackOrder(route.params.orderId);
  } catch (e) {
    error.value = e.message;
  }
});
</script>

<template>
  <main class="container">
    <p v-if="error" class="state-msg">{{ error }} — check that your order number is correct.</p>
    <p v-else-if="!order" class="state-msg">Looking up your order…</p>

    <div v-else class="card panel">
      <h1>Order {{ order.orderId }}</h1>
      <p class="placed">Placed {{ new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) }}</p>

      <p v-if="order.status === 'pending_payment'" class="pending">Awaiting payment — this order hasn't been paid for yet.</p>
      <p v-else-if="order.status === 'cancelled'" class="pending">This order was cancelled.</p>

      <ol v-else class="steps">
        <li v-for="(s, i) in STEPS" :key="s" :class="{ done: i <= stepIndex, current: i === stepIndex }">
          <span class="dot"></span>{{ LABELS[s] }}
        </li>
      </ol>

      <p v-for="i in order.items" :key="i.id" class="row">
        <span>{{ i.name }} × {{ i.qty }}</span><span>{{ naira(i.price * i.qty) }}</span>
      </p>
      <p class="row grand"><span>Total</span><span class="price">{{ naira(order.total) }}</span></p>
    </div>
  </main>
</template>

<style scoped>
.panel { max-width: 520px; margin: 3rem auto; padding: 1.5rem 1.75rem; }
h1 { margin: 0 0 0.25rem; font-size: 1.3rem; letter-spacing: -0.5px; }
.placed { color: var(--muted); margin: 0 0 1.25rem; }
.pending { color: #b45309; font-weight: 600; }
.steps { list-style: none; padding: 0; margin: 0 0 1.5rem; display: flex; gap: 0; }
.steps li { flex: 1; text-align: center; font-size: 0.85rem; color: var(--muted); position: relative; padding-top: 22px; }
.dot { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 16px; height: 16px; border-radius: 50%; background: var(--line); }
.steps li::before { content: ''; position: absolute; top: 7px; left: -50%; width: 100%; height: 2px; background: var(--line); }
.steps li:first-child::before { display: none; }
.steps li.done { color: var(--ink); font-weight: 600; }
.steps li.done .dot, .steps li.done::before { background: var(--green); }
.steps li.current .dot { outline: 3px solid #16653433; }
.row { display: flex; justify-content: space-between; margin: 0.4rem 0; color: var(--muted); }
.grand { border-top: 1px solid var(--line); padding-top: 0.6rem; margin-top: 0.6rem; color: var(--ink); font-weight: 700; }
</style>
