import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'CraftLocalWidgets',
      fileName: 'craftlocal-widgets',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name][extname]',
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: '[name].js'
      }
    },
    minify: 'terser',
    sourcemap: true,
    target: 'es2020'
  },
  server: {
    port: 3002,
    cors: true
  }
});
