# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Craft Chicago Finds is a React-based marketplace application for local artisans and crafters. Built with Vite, TypeScript, React, shadcn/ui, and Tailwind CSS. The application uses Supabase for backend services and is deployed on Cloudflare Pages.

## Development Commands

```bash
# Install dependencies
npm i

# Start development server (port 8080)
npm run dev

# Build for production
npm run build

# Build for development (with sourcemaps)
npm run build:dev

# Lint code
npm run lint

# Preview production build (port 3000)
npm run preview

# Run Cloudflare Pages locally
npm run pages:dev
```

## Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables
- **State Management**: React Query + Context providers
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Payments**: Stripe
- **Deployment**: Cloudflare Pages with Wrangler

### Key Directory Structure
```
src/
├── api/              # API utilities and sitemap generation
├── components/       # Reusable UI components
│   ├── accessibility/ # Accessibility features
│   ├── admin/        # Admin dashboard components
│   ├── analytics/    # Analytics dashboards
│   ├── browse/       # Product browsing components
│   ├── ui/           # shadcn/ui base components
├── hooks/            # Custom React hooks and context providers
├── integrations/     # External service integrations (Supabase)
├── lib/              # Utility functions and configurations
├── pages/            # Route components (lazy-loaded)
├── styles/           # Global CSS files
```

### Provider Architecture
The app uses multiple context providers in a specific hierarchy:
1. QueryClientProvider (React Query)
2. AccessibilityProvider
3. StripeProvider
4. AuthProvider
5. PlansProvider
6. CartProvider
7. AdminProvider
8. CityProvider

### Key Features
- **Multi-city marketplace**: Dynamic routing for city-specific pages (`/:city`)
- **Lazy loading**: All pages are lazy-loaded for performance
- **Accessibility**: Built-in accessibility panel and features
- **Admin system**: Comprehensive admin dashboard with analytics
- **Seller dashboard**: Tools for managing listings and orders
- **Shopping cart**: Persistent cart with Stripe checkout
- **Real-time messaging**: Between buyers and sellers

## Configuration Files

- `components.json` - shadcn/ui configuration with path aliases
- `vite.config.ts` - Vite build configuration optimized for Cloudflare
- `wrangler.toml` - Cloudflare Pages deployment settings
- `eslint.config.js` - ESLint configuration with React hooks rules
- `tailwind.config.ts` - Tailwind CSS configuration

## Development Notes

### Path Aliases
- `@/` maps to `src/`
- `@/components` for UI components
- `@/lib` for utilities
- `@/hooks` for custom hooks

### Build Optimization
- Manual code splitting for vendor libraries, UI components, and utilities
- Terser minification with console.log removal in production
- Asset optimization with consistent naming for caching

### Database Integration
- Supabase client configured in `src/integrations/supabase/`
- Type definitions auto-generated in `types.ts`
- Real-time subscriptions for messaging and notifications

### Deployment
- Builds to `dist/` directory for Cloudflare Pages
- Uses Wrangler for deployment and local development
- Compatibility date set to 2024-12-19