import { defineStore } from 'pinia';

// JWT persists so an admin refresh doesn't force re-login (token self-expires in 12h).
const KEY = 'rotomart-admin-token';

export const useAdminStore = defineStore('admin', {
  state: () => ({ token: localStorage.getItem(KEY) || null }),
  getters: {
    isAuthenticated: (s) => !!s.token,
  },
  actions: {
    setToken(token) {
      this.token = token;
      localStorage.setItem(KEY, token);
    },
    logout() {
      this.token = null;
      localStorage.removeItem(KEY);
    },
  },
});
