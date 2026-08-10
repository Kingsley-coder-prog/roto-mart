<script setup>
import { ref, computed, onMounted } from 'vue';
import AdminNav from '../../components/AdminNav.vue';
import { adminAnalytics } from '../../api/adminOrders.js';
import { naira } from '../../utils/format.js';

const data = ref(null);
const loading = ref(true);
const loadError = ref(null);

const STATUS_LABELS = {
  pending_payment: 'Awaiting payment', paid: 'Paid', ready: 'Ready',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
};

const maxMonthly = computed(() => Math.max(1, ...(data.value?.monthly.map((m) => m.earnings) || [1])));
const maxProduct = computed(() => Math.max(1, ...(data.value?.topProducts.map((p) => p.revenue) || [1])));
const statusList = computed(() => Object.entries(data.value?.ordersByStatus || {}));
const hasSales = computed(() => (data.value?.paidOrders || 0) > 0);

async function load() {
  loading.value = true;
  try {
    data.value = await adminAnalytics();
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
    <h1>Analytics</h1>

    <p v-if="loading" class="state-msg">Crunching your numbers…</p>
    <p v-else-if="loadError" class="state-msg err">{{ loadError }}</p>

    <template v-else>
      <!-- KPI stat tiles (headline magnitudes — not charts) -->
      <div class="tiles">
        <div class="card tile"><span class="lbl">Your earnings (93%)</span><span class="val green">{{ naira(data.yourEarnings) }}</span></div>
        <div class="card tile"><span class="lbl">Gross sales</span><span class="val">{{ naira(data.grossRevenue) }}</span></div>
        <div class="card tile"><span class="lbl">Paid orders</span><span class="val">{{ data.paidOrders }}</span></div>
        <div class="card tile"><span class="lbl">Avg order value</span><span class="val">{{ naira(data.avgOrderValue) }}</span></div>
      </div>

      <p v-if="!hasSales" class="state-msg">No sales yet — charts appear once orders are paid.</p>

      <template v-else>
        <div class="charts">
          <!-- Monthly earnings: single-series bars over time -->
          <section class="card panel">
            <h2>Monthly earnings <span class="sub">your 93% share</span></h2>
            <div class="bars">
              <div v-for="m in data.monthly" :key="m.month" class="barcol" :title="`${m.month}: ${naira(m.earnings)} · ${m.orders} order(s)`">
                <span class="bval">{{ naira(m.earnings) }}</span>
                <div class="bar" :style="{ height: `${Math.max(4, (m.earnings / maxMonthly) * 140)}px` }"></div>
                <span class="blabel">{{ m.month }}</span>
              </div>
            </div>
          </section>

          <!-- Top products: ranked magnitude, horizontal bars -->
          <section class="card panel">
            <h2>Best sellers <span class="sub">by revenue</span></h2>
            <ul class="ranked">
              <li v-for="p in data.topProducts" :key="p.id" :title="`${p.qty} sold`">
                <div class="rtop"><span class="rname">{{ p.name }}</span><span class="rval">{{ naira(p.revenue) }}</span></div>
                <div class="track"><div class="fill" :style="{ width: `${(p.revenue / maxProduct) * 100}%` }"></div></div>
                <span class="rqty">{{ p.qty }} sold</span>
              </li>
            </ul>
          </section>
        </div>

        <!-- Orders by status: reserved status palette, always with labels -->
        <section class="card panel">
          <h2>Orders by status</h2>
          <div class="statusrow">
            <div v-for="[s, n] in statusList" :key="s" class="stat">
              <span class="dot" :class="s"></span>
              <span class="scount">{{ n }}</span>
              <span class="sname">{{ STATUS_LABELS[s] || s }}</span>
            </div>
          </div>
        </section>
      </template>
    </template>
  </main>
</template>

<style scoped>
h1 { margin: 2rem 0 1rem; letter-spacing: -0.5px; }
.err { color: #b91c1c; font-weight: 600; }
.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
.tile { padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.3rem; }
.lbl { color: var(--muted); font-size: 0.85rem; font-weight: 600; }
.val { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px; }
.val.green, .green { color: var(--green); }
.charts { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; }
@media (max-width: 760px) { .charts { grid-template-columns: 1fr; } }
.panel { padding: 1.25rem 1.4rem; margin-bottom: 0; }
h2 { margin: 0 0 1.1rem; font-size: 1.05rem; }
h2 .sub { color: var(--muted); font-weight: 500; font-size: 0.8rem; }
/* Monthly bars */
.bars { display: flex; align-items: flex-end; gap: 1rem; min-height: 180px; padding-top: 0.5rem; overflow-x: auto; }
.barcol { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; justify-content: flex-end; }
.bval { font-size: 0.75rem; font-weight: 700; color: var(--ink); }
.bar { width: 46px; background: var(--green); border-radius: 4px 4px 0 0; }
.blabel { font-size: 0.75rem; color: var(--muted); white-space: nowrap; }
/* Ranked product bars */
.ranked { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.85rem; }
.rtop { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.88rem; }
.rname { font-weight: 600; }
.rval { font-weight: 700; white-space: nowrap; }
.track { height: 8px; background: #ece8e1; border-radius: 999px; margin: 0.25rem 0 0.15rem; overflow: hidden; }
.fill { height: 100%; background: var(--green); border-radius: 999px; }
.rqty { font-size: 0.75rem; color: var(--muted); }
/* Status */
.statusrow { display: flex; flex-wrap: wrap; gap: 1.5rem; }
.stat { display: flex; align-items: center; gap: 0.4rem; }
.dot { width: 12px; height: 12px; border-radius: 50%; background: #e7e5e4; flex-shrink: 0; }
.dot.paid { background: #1e40af; }
.dot.ready { background: #92400e; }
.dot.shipped { background: #3730a3; }
.dot.delivered { background: #166534; }
.dot.cancelled { background: #991b1b; }
.dot.pending_payment { background: #a8a29e; }
.scount { font-weight: 800; }
.sname { color: var(--muted); font-size: 0.85rem; }
</style>
