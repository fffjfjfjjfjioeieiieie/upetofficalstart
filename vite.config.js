import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/@firebase/') || id.includes('/firebase/')) return 'firebase';
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router') || id.includes('/@radix-ui/') || id.includes('/@floating-ui/')) return 'react';
          if (id.includes('/framer-motion/') || id.includes('/motion-dom/') || id.includes('/motion-utils/')) return 'motion';
          if (id.includes('/lucide-react/')) return 'icons';
          if (id.includes('/zod/') || id.includes('/re2js/')) return 'validation';
          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/redesign', import.meta.url)),
    },
  },
  server: {
    watch: {
      ignored: ['**/public/profile-background.mp4'],
    },
  },
});
