import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // dev-only: forward API calls to the backend
      '/api': 'http://localhost:4000',
    },
  },
});
