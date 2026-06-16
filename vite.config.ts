import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { crx } from '@crxjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest })],
  build: {
    rollupOptions: {
      input: {
        'src/app/app': 'src/app/app.html',
      },
    },
    sourcemap: 'hidden',
    outDir: 'dist',
    emptyOutDir: true,
  },
});
