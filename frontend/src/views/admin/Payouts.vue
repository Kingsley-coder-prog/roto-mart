<script setup>
import { ref, computed, onMounted } from 'vue';
import AdminNav from '../../components/AdminNav.vue';
import { adminListPayouts } from '../../api/adminOrders.js';
import { naira } from '../../utils/format.js';

const payouts = ref([]);
const loading = ref(true);
const loadError = ref(null);

const totals = computed(() => payouts.value.reduce(
  (t, p) => ({ admin: t.admin + p.adminShare, dev: t.dev + p.developerShare, gross: t.gross + p.totalAmount }),
  { admin: 0, dev: 0, gross: 0 },
));
const fmtDate = (s) => new Date(s).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

async function load() {
  loading.value = true;
  try {
    payouts.value = await adminListPayouts();
  } catch (e) {
    loadError.value = e.message;
  } finally {
    loading.value = false;
  }
}
onMounted(load);
</script>

<template>
  <AdminNav />
  <main class="container">
    <h1>Payouts</h1>
    <p class="sub">Every paid order is split automatically: <strong>93% to you</strong>, 7% to the developer.</p>

    <p v-if="loading" class="state-msg">Loading…</p>
    <p v-else-if="loadError" class="state-msg err">{{ loadError }}</p>
    <p v-else-if="!payouts.length" class="state-msg">No payouts yet — they appear here once orders are paid.</p>

    <template v-else>
      <div class="cards">
        <div class="card stat"><span class="lbl">Your earnings (93%)</span><span class="val green">{{ naira(totals.admin) }}</span></div>
        <div class="card stat"><span class="lbl">Developer (7%)</span><span class="val">{{ naira(totals.dev) }}</span></div>
        <div class="card stat"><span class="lbl">Gross paid</span><span class="val">{{ naira(totals.gross) }}</span></div>
      </div>

      <div class="card tablewrap">
        <table>
          <thead>
            <tr><th>Order</th><th>Date</th><th class="r">Total</th><th class="r">You (93%)</th><th class="r">Dev (7%)</th></tr>
          </thead>
          <tbody>
            <tr v-for="p in payouts" :key="p.id">
              <td class="mono">{{ p.orderId }}</td>
              <td>{{ fmtDate(p.date) }}</td>
              <td class="r">{{ naira(p.totalAmount) }}</td>
              <td class="r green">{{ naira(p.adminShare) }}</td>
              <td class="r">{{ naira(p.developerShare) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </main>
</template>

<style scoped>
h1 { margin: 2rem 0 0.25rem; letter-spacing: -0.5px; }
.sub { color: var(--muted); margin: 0 0 1.25rem; }
.err { color: #b91c1c; font-weight: 600; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
.stat { padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.3rem; }
.lbl { color: var(--muted); font-size: 0.85rem; font-weight: 600; }
.val { font-size: 1.4rem; font-weight: 800; letter-spacing: -0.5px; }
.val.green, .green { color: var(--green); }
.tablewrap { padding: 0.5rem 1rem; overflow-x: auto; margin-bottom: 3rem; }
table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
th, td { text-align: left; padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--line); white-space: nowrap; }
th { color: var(--muted); font-size: 0.8rem; }
tbody tr:last-child td { border-bottom: 0; }
.r { text-align: right; }
.mono { font-weight: 700; }
</style>
