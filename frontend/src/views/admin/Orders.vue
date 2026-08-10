<script setup>
import { ref, computed, onMounted } from 'vue';
import AdminNav from '../../components/AdminNav.vue';
import { adminListOrders, updateOrderStatus, archiveOrder } from '../../api/adminOrders.js';
import { naira } from '../../utils/format.js';

const orders = ref([]);
const loading = ref(true);
const loadError = ref(null);
const filter = ref('all');
const busyId = ref(null);
const actionError = ref(null);
const expanded = ref({}); // id -> bool

const NEXT = ['ready', 'shipped', 'delivered', 'cancelled']; // admin-settable statuses
const LABELS = {
  pending_payment: 'Awaiting payment', paid: 'Paid', ready: 'Ready',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
};
const FILTERS = ['all', 'paid', 'ready', 'shipped', 'delivered', 'cancelled', 'pending_payment', 'archived'];

const itemCount = (o) => o.items.reduce((n, i) => n + i.qty, 0);

const shown = computed(() => {
  if (filter.value === 'archived') return orders.value.filter((o) => o.archived);
  const live = orders.value.filter((o) => !o.archived);
  return filter.value === 'all' ? live : live.filter((o) => o.status === filter.value);
});

const fmtDate = (s) => new Date(s).toLocaleString('en-NG', {
  day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
});

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

function toggle(id) {
  expanded.value[id] = !expanded.value[id];
}

async function changeStatus(order, status) {
  if (!status || status === order.status) return;
  if (status === 'cancelled' && !confirm(`Cancel order ${order.id}?`)) return;
  busyId.value = order.id;
  actionError.value = null;
  try {
    Object.assign(order, await updateOrderStatus(order.id, status));
  } catch (e) {
    actionError.value = `${order.id}: ${e.message}`;
  } finally {
    busyId.value = null;
  }
}

async function setArchived(order, archived) {
  if (archived && !confirm(`Archive order ${order.id}? It stays in your sheet but leaves this list.`)) return;
  busyId.value = order.id;
  actionError.value = null;
  try {
    Object.assign(order, await archiveOrder(order.id, archived));
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
        {{ f === 'all' ? 'All' : f === 'archived' ? 'Archived' : LABELS[f] }}
      </button>
    </div>
    <p v-if="actionError" class="err">{{ actionError }}</p>

    <p v-if="loading" class="state-msg">Loading orders…</p>
    <p v-else-if="loadError" class="state-msg err">{{ loadError }}</p>
    <p v-else-if="!shown.length" class="state-msg">No orders here.</p>

    <div v-else class="card tablewrap">
      <table>
        <thead>
          <tr>
            <th class="ex"></th><th>Order</th><th>Date</th><th>Buyer</th>
            <th class="r">Total</th><th>Status</th><th class="act">Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="o in shown" :key="o.id">
            <tr class="main" @click="toggle(o.id)">
              <td class="ex"><span class="caret" :class="{ open: expanded[o.id] }">▸</span></td>
              <td class="mono">{{ o.id }}</td>
              <td class="nowrap">{{ fmtDate(o.createdAt) }}</td>
              <td>{{ o.buyerName }} <span class="muted small">· {{ itemCount(o) }} item{{ itemCount(o) > 1 ? 's' : '' }}</span></td>
              <td class="r">{{ naira(o.total) }}</td>
              <td><span class="badge" :class="o.status">{{ LABELS[o.status] }}</span></td>
              <td class="act" @click.stop>
                <select v-if="o.status !== 'pending_payment' && !o.archived" :disabled="busyId === o.id"
                        @change="changeStatus(o, $event.target.value); $event.target.value = ''">
                  <option value="">Change to…</option>
                  <option v-for="s in NEXT" :key="s" :value="s" :disabled="s === o.status">{{ LABELS[s] }}</option>
                </select>
                <button v-if="!o.archived" class="ghost small" :disabled="busyId === o.id" @click="setArchived(o, true)">Archive</button>
                <button v-else class="ghost small" :disabled="busyId === o.id" @click="setArchived(o, false)">Restore</button>
              </td>
            </tr>
            <tr v-if="expanded[o.id]" class="detail">
              <td></td>
              <td colspan="6">
                <div class="dwrap">
                  <div class="contact">
                    <span class="muted">{{ o.buyerEmail }}</span> · <span class="muted">{{ o.buyerPhone }}</span><br />
                    <span class="muted">{{ o.buyerAddress }}</span>
                  </div>
                  <ul class="items">
                    <li v-for="i in o.items" :key="i.id"><span>{{ i.name }} × {{ i.qty }}</span><span>{{ naira(i.price * i.qty) }}</span></li>
                  </ul>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </main>
</template>

<style scoped>
h1 { margin: 2rem 0 1rem; letter-spacing: -0.5px; }
.filters { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
.chip { border: 1px solid var(--line); background: var(--surface); padding: 0.35rem 0.8rem; border-radius: 999px; font-weight: 600; font-size: 0.85rem; }
.chip.on { background: var(--green); color: #fff; border-color: var(--green); }
.err { color: #b91c1c; font-weight: 600; }
.tablewrap { padding: 0.25rem 0.75rem; overflow-x: auto; margin-bottom: 3rem; }
table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
th, td { text-align: left; padding: 0.6rem 0.5rem; }
th { color: var(--muted); font-size: 0.78rem; border-bottom: 1px solid var(--line); }
th.r, td.r { text-align: right; }
.main { border-bottom: 1px solid var(--line); cursor: pointer; }
.main:hover { background: #faf7f2; }
.detail td { background: #faf7f2; border-bottom: 1px solid var(--line); }
.ex { width: 24px; text-align: center; }
.caret { display: inline-block; transition: transform 0.15s; color: var(--muted); }
.caret.open { transform: rotate(90deg); }
.mono { font-weight: 700; white-space: nowrap; }
.nowrap { white-space: nowrap; }
.muted { color: var(--muted); }
.small { font-size: 0.8rem; }
.badge { font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: #e7e5e4; color: var(--ink); white-space: nowrap; }
.badge.paid { background: #dbeafe; color: #1e40af; }
.badge.ready { background: #fef3c7; color: #92400e; }
.badge.shipped { background: #e0e7ff; color: #3730a3; }
.badge.delivered { background: #dcfce7; color: #166534; }
.badge.cancelled { background: #fee2e2; color: #991b1b; }
.act { white-space: nowrap; }
.act select { font: inherit; padding: 0.3rem 0.4rem; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); margin-right: 0.4rem; }
.act select:focus { outline: 2px solid var(--green); border-color: var(--green); }
.ghost { background: var(--surface); border: 1px solid var(--line); color: var(--ink); padding: 0.3rem 0.7rem; border-radius: 8px; font-weight: 600; }
.ghost:hover { border-color: var(--green); color: var(--green); }
.dwrap { display: flex; flex-wrap: wrap; gap: 1.5rem; padding: 0.4rem 0 0.6rem; }
.contact { font-size: 0.85rem; line-height: 1.5; }
.items { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.2rem; min-width: 220px; }
.items li { display: flex; justify-content: space-between; gap: 1.5rem; font-size: 0.85rem; color: var(--muted); }
</style>
