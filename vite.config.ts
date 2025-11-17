import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './example',
  publicDir: false,
  server: {
    port: 3000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
