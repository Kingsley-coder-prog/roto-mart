import { defineStore } from 'pinia';

// Cart persists so a refresh (or Paystack redirect round-trip) doesn't lose it.
const KEY = 'rotomart-cart';
const saved = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
};

export const useCartStore = defineStore('cart', {
  state: () => ({ items: saved() }), // [{ id, name, price, imageUrl, stock, qty }]
  getters: {
    count: (s) => s.items.reduce((n, i) => n + i.qty, 0),
    subtotal: (s) => s.items.reduce((n, i) => n + i.price * i.qty, 0),
  },
  actions: {
    persist() { localStorage.setItem(KEY, JSON.stringify(this.items)); },
    add(product, qty = 1) {
      const line = this.items.find((i) => i.id === product.id);
      const max = Number(product.stock);
      if (line) line.qty = Math.min(line.qty + qty, max);
      else this.items.push({ id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl, stock: max, qty: Math.min(qty, max) });
      this.persist();
    },
    setQty(id, qty) {
      const line = this.items.find((i) => i.id === id);
      if (!line) return;
      line.qty = Math.max(1, Math.min(qty, line.stock));
      this.persist();
    },
    remove(id) {
      this.items = this.items.filter((i) => i.id !== id);
      this.persist();
    },
    clear() {
      this.items = [];
      this.persist();
    },
  },
});
