import { fileURLToPath } from 'node:url';
import { mergeConfig } from 'vite';
import appConfig from '../vite.config.js';

// Isolated production-bundle verification, never part of the public build.
export default mergeConfig(appConfig, {
  build: {
    emptyOutDir: false,
    rollupOptions: { input: fileURLToPath(new URL('./graphics-v2-harness.html', import.meta.url)) },
  },
});
