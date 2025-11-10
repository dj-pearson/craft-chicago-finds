import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    {
      name: 'security-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Security headers for development server
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('X-Frame-Options', 'DENY');
          res.setHeader('X-XSS-Protection', '1; mode=block');
          res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
          res.setHeader(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=()'
          );

          // Content Security Policy for dev (more permissive for HMR)
          res.setHeader(
            'Content-Security-Policy',
            [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' ws: wss: https://*.supabase.co https://api.stripe.com",
              "frame-src 'self' https://js.stripe.com",
            ].join('; ')
          );

          next();
        });
      },
    },
  ],
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
          // Core vendor chunks - include Radix UI with React to ensure proper loading order
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/@radix-ui/')) {
            return 'vendor';
          }
          if (id.includes('node_modules/react-router-dom/')) {
            return 'router';
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
          // SEO library
          if (id.includes('node_modules/react-helmet-async/')) {
            return 'seo';
          }
          // Analytics code - keep separate to avoid circular dependencies
          if (id.includes('/lib/analytics')) {
            return 'ga-analytics';
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
