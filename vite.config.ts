import path from 'node:path';
import { defineConfig } from 'vite';
import type { ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Optional dev fallback: `fetch('/bc-swarm/...')` → eu-swarm `/api/...` when superbet-api is not used.
 * Default Swarm path is `VITE_SWARM_API_URL` → **superbet-api** (see `.env.example`).
 */
const swarmProxy: Record<string, string | ProxyOptions> = {
  '/bc-swarm': {
    target: 'https://eu-swarm.betconstruct.com',
    changeOrigin: true,
    secure: true,
    rewrite: (p: string) => p.replace(/^\/bc-swarm/, '/api'),
    configure(proxy) {
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.setHeader(
          'User-Agent',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );
      });
    },
  },
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    /** Same Wi‑Fi: open `http://<your-PC-LAN-IP>:5174` on your phone (no deploy). */
    host: true,
    port: 5174,
    proxy: { ...swarmProxy },
  },
  preview: {
    host: true,
    proxy: { ...swarmProxy },
  },
});
