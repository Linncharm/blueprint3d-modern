import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/blueprint3d/' : '/',
  root: './',
  publicDir: false,  // Disable default public dir handling
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'example/js/*',
          dest: 'js'
        },
        {
          src: 'example/models/*',
          dest: 'models'
        },
        {
          src: 'example/rooms/*',
          dest: 'rooms'
        },
        {
          src: 'example/css/*',
          dest: 'css'
        },
        {
          src: 'example/fonts/*',
          dest: 'fonts'
        }
      ]
    })
  ],
  server: {
    port: 3000,
    open: '/example/index.html',
    fs: {
      strict: false
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    },
    extensions: ['.ts', '.js', '.json']
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'example/index.html')
      }
    }
  }
});
