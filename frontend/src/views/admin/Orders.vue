<script setup>
import { ref, computed, onMounted } from 'vue';
import AdminNav from '../../components/AdminNav.vue';
import { adminListOrders, updateOrderStatus } from '../../api/adminOrders.js';
import { naira } from '../../utils/format.js';

const orders = ref([]);
const loading = ref(true);
const loadError = ref(null);
const filter = ref('all');
const busyId = ref(null);
const actionError = ref(null);

const NEXT = ['ready', 'shipped', 'delivered', 'cancelled']; // admin-settable statuses
const LABELS = {
  pending_payment: 'Awaiting payment', paid: 'Paid', ready: 'Ready',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
};
const FILTERS = ['all', 'paid', 'ready', 'shipped', 'delivered', 'cancelled', 'pending_payment'];

const shown = computed(() => (filter.value === 'all' ? orders.value : orders.value.filter((o) => o.status === filter.value)));
const fmtDate = (s) => new Date(s).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

async function load() {
  loading.value = true;
  try {
    orders.value = await adminListOrders();
  } catch (e) {
    loadError.value = e.message;
  } finally {
    loading.value = false;
  }
}
onMounted(load);

async function changeStatus(order, status) {
  if (!status || status === order.status) return;
  if (status === 'cancelled' && !confirm(`Cancel order ${order.id}?`)) return;
  busyId.value = order.id;
  actionError.value = null;
  try {
    const updated = await updateOrderStatus(order.id, status);
    Object.assign(order, updated);
  } catch (e) {
    actionError.value = `${order.id}: ${e.message}`;
  } finally {
    busyId.value = null;
  }
}
</script>

<template>
  <AdminNav />
  <main class="container">
    <h1>Orders</h1>

    <div class="filters">
      <button v-for="f in FILTERS" :key="f" class="chip" :class="{ on: filter === f }" @click="filter = f">
        {{ f === 'all' ? 'All' : LABELS[f] }}
      </button>
    </div>
    <p v-if="actionError" class="err">{{ actionError }}</p>

    <p v-if="loading" class="state-msg">Loading orders…</p>
    <p v-else-if="loadError" class="state-msg err">{{ loadError }}</p>
    <p v-else-if="!shown.length" class="state-msg">No orders here.</p>

    <div v-else class="grid">
      <div v-for="o in shown" :key="o.id" class="card order">
        <div class="top">
          <span class="oid">{{ o.id }}</span>
          <span class="badge" :class="o.status">{{ LABELS[o.status] }}</span>
        </div>
        <p class="date">{{ fmtDate(o.createdAt) }}</p>

        <div class="buyer">
          <strong>{{ o.buyerName }}</strong> · {{ o.buyerPhone }}<br />
          <span class="muted">{{ o.buyerEmail }}</span><br />
          <span class="muted">{{ o.buyerAddress }}</span>
        </div>

        <ul class="items">
          <li v-for="i in o.items" :key="i.id"><span>{{ i.name }} × {{ i.qty }}</span><span>{{ naira(i.price * i.qty) }}</span></li>
        </ul>
        <p class="total"><span>Total</span><span>{{ naira(o.total) }}</span></p>

        <div class="statusrow">
          <template v-if="o.status === 'pending_payment'">
            <span class="muted small">Awaiting payment — no action</span>
          </template>
          <template v-else>
            <label class="small">Update status</label>
            <select :disabled="busyId === o.id" @change="changeStatus(o, $event.target.value); $event.target.value = ''">
              <option value="">Change to…</option>
              <option v-for="s in NEXT" :key="s" :value="s" :disabled="s === o.status">{{ LABELS[s] }}</option>
            </select>
          </template>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
h1 { margin: 2rem 0 1rem; letter-spacing: -0.5px; }
.filters { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
.chip { border: 1px solid var(--line); background: var(--surface); padding: 0.35rem 0.8rem; border-radius: 999px; font-weight: 600; font-size: 0.85rem; }
.chip.on { background: var(--green); color: #fff; border-color: var(--green); }
.err { color: #b91c1c; font-weight: 600; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; margin-bottom: 3rem; }
.order { padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: 0.5rem; }
.top { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.oid { font-weight: 700; font-size: 0.9rem; }
.date { margin: 0; color: var(--muted); font-size: 0.8rem; }
.badge { font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: #e7e5e4; color: var(--ink); white-space: nowrap; }
.badge.paid { background: #dbeafe; color: #1e40af; }
.badge.ready { background: #fef3c7; color: #92400e; }
.badge.shipped { background: #e0e7ff; color: #3730a3; }
.badge.delivered { background: #dcfce7; color: #166534; }
.badge.cancelled { background: #fee2e2; color: #991b1b; }
.buyer { font-size: 0.85rem; line-height: 1.5; }
.muted { color: var(--muted); }
.small { font-size: 0.8rem; }
.items { list-style: none; padding: 0; margin: 0.3rem 0; display: grid; gap: 0.2rem; }
.items li { display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--muted); }
.total { display: flex; justify-content: space-between; font-weight: 700; border-top: 1px solid var(--line); padding-top: 0.5rem; margin: 0.2rem 0 0; }
.statusrow { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.3rem; }
.statusrow label { font-weight: 600; color: var(--muted); }
select { font: inherit; padding: 0.35rem 0.5rem; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); }
select:focus { outline: 2px solid var(--green); border-color: var(--green); }
</style>
