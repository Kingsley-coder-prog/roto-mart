import { defineStore } from 'pinia';
import { fetchProducts, fetchCategories } from '../api/catalog.js';

export const useCatalogStore = defineStore('catalog', {
  state: () => ({
    products: [],
    categories: [],
    loaded: false,
    loading: false,
    error: null,
  }),
  getters: {
    categoryName: (s) => (id) => s.categories.find((c) => c.id === id)?.name || '',
  },
  actions: {
    async load() {
      if (this.loaded || this.loading) return;
      this.loading = true;
      this.error = null;
      try {
        [this.products, this.categories] = await Promise.all([fetchProducts(), fetchCategories()]);
        this.loaded = true;
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },
  },
});
