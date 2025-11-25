import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const LOCAL_PROXY_TARGET = process.env.PROXY_TARGET ?? 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: LOCAL_PROXY_TARGET,
        changeOrigin: true,
      },
    },
  },
});
