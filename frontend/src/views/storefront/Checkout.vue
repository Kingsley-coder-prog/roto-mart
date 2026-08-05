<script setup>
import { reactive, ref } from 'vue';
import { useCartStore } from '../../stores/cart.js';
import { naira } from '../../utils/format.js';

const cart = useCartStore();
const submitting = ref(false);
const error = ref(null);

const form = reactive({ name: '', email: '', phone: '', address: '' });

function validate() {
  if (form.name.trim().length < 2) return 'Please enter your full name.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return 'Please enter a valid email — your receipt and tracking link go there.';
  if (form.phone.replace(/\D/g, '').length < 10) return 'Please enter a valid phone number.';
  if (form.address.trim().length < 8) return 'Please enter a full delivery address.';
  return null;
}

async function submit() {
  error.value = validate();
  if (error.value) return;
  submitting.value = true;
  // F6 replaces this stub with POST /api/orders → Paystack redirect.
  error.value = 'Payment is not connected yet — coming in the next build step.';
  submitting.value = false;
}
</script>

<template>
  <main class="container">
    <h1>Checkout</h1>
    <p class="crumb"><RouterLink to="/cart" class="link">← Back to cart</RouterLink></p>

    <p v-if="!cart.items.length" class="state-msg">
      Nothing to check out — <RouterLink to="/" class="link">browse the shop</RouterLink>.
    </p>

    <div v-else class="layout">
      <form class="card form" @submit.prevent="submit">
        <label>Full name<input v-model="form.name" autocomplete="name" /></label>
        <label>Email<input v-model="form.email" type="email" autocomplete="email" />
          <small>Your receipt and order tracking link will be sent here.</small>
        </label>
        <label>Phone<input v-model="form.phone" type="tel" autocomplete="tel" /></label>
        <label>Delivery address<textarea v-model="form.address" rows="3" autocomplete="street-address"></textarea></label>
        <p v-if="error" class="error">{{ error }}</p>
        <button class="btn btn-buy" :disabled="submitting">
          {{ submitting ? 'Please wait…' : `Pay ${naira(cart.subtotal)}` }}
        </button>
      </form>

      <aside class="card side">
        <h2>Order summary</h2>
        <p v-for="i in cart.items" :key="i.id" class="row">
          <span>{{ i.name }} × {{ i.qty }}</span><span>{{ naira(i.price * i.qty) }}</span>
        </p>
        <p class="row grand"><span>Total</span><span class="price">{{ naira(cart.subtotal) }}</span></p>
      </aside>
    </div>
  </main>
</template>

<style scoped>
h1 { margin: 2rem 0 0.25rem; letter-spacing: -0.5px; }
.crumb { margin: 0 0 1rem; }
.link { color: var(--green); font-weight: 600; }
.layout { display: grid; grid-template-columns: 1.4fr 1fr; gap: 1.25rem; align-items: start; margin-bottom: 3rem; }
@media (max-width: 700px) { .layout { grid-template-columns: 1fr; } }
.form { padding: 1.25rem; display: grid; gap: 0.9rem; }
label { display: grid; gap: 0.3rem; font-weight: 600; font-size: 0.9rem; }
input, textarea {
  font: inherit; padding: 0.55rem 0.75rem; border: 1px solid var(--line);
  border-radius: 8px; background: var(--surface);
}
input:focus, textarea:focus { outline: 2px solid var(--green); border-color: var(--green); }
small { color: var(--muted); font-weight: 400; }
.error { margin: 0; color: #b91c1c; font-weight: 600; font-size: 0.9rem; }
.side { padding: 1.25rem; }
h2 { margin: 0 0 0.75rem; font-size: 1.05rem; }
.row { display: flex; justify-content: space-between; margin: 0.4rem 0; color: var(--muted); }
.grand { border-top: 1px solid var(--line); padding-top: 0.6rem; margin-top: 0.6rem; color: var(--ink); font-weight: 700; }
</style>
