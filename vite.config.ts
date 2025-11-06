import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize for Cloudflare Pages
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: mode === 'development', // Only generate sourcemaps in development
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production', // Remove console.logs in production only
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        // Improved manual chunking for better caching and reduced bundle sizes
        manualChunks: (id) => {
          // Core vendor chunks
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor';
          }
          if (id.includes('node_modules/react-router-dom/')) {
            return 'router';
          }
          // Group all Radix UI components together but separate from other vendor code
          if (id.includes('node_modules/@radix-ui/')) {
            return 'radix-ui';
          }
          // Separate large libraries
          if (id.includes('node_modules/framer-motion/')) {
            return 'framer';
          }
          if (id.includes('node_modules/recharts/')) {
            return 'recharts';
          }
          // Utility libraries
          if (id.includes('node_modules/clsx/') || id.includes('node_modules/tailwind-merge/') ||
              id.includes('node_modules/date-fns/')) {
            return 'utils';
          }
          // Backend services
          if (id.includes('node_modules/@supabase/')) {
            return 'supabase';
          }
          if (id.includes('node_modules/@stripe/')) {
            return 'stripe';
          }
          if (id.includes('node_modules/@tanstack/react-query/')) {
            return 'react-query';
          }
          // SEO and analytics
          if (id.includes('node_modules/react-helmet-async/')) {
            return 'analytics';
          }
        },
        // Consistent naming for better caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name]-[hash][extname]';
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[ext]/[name]-[hash][extname]`;
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  // Preview server configuration for local development
  preview: {
    port: 3000,
    host: true,
  },
}));
