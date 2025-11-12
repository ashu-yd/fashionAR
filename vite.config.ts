import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // ✅ Correct absolute path resolution for Windows + Vite
      'three': path.resolve(__dirname, 'node_modules/three')
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  }
});
