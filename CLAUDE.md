# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules

# Project Instructions

## Security Requirements (MANDATORY)

- **NEVER** include API keys, secrets, passwords, or tokens in any committed file
- **NEVER** hardcode Supabase URLs, anon keys, or service role keys
- **ALWAYS** use environment variables for all sensitive configuration

## Environment Variable Strategy

- **Cloudflare Pages**: Set secrets in dashboard → Settings → Environment Variables
- **Self-hosted Supabase**: Configure via `.env` on server (never committed)
- **Local development**: Use `.env.local` (must be in .gitignore)

## Required Files

- `.env.example` - Template with dummy values only
- `.gitignore` - Must include: .env, .env.local, .env.\*.local

## Code Patterns

Use `import.meta.env.VITE_*` for Vite/Cloudflare frontend
Use `process.env.*` for Node.js backends

## Project Overview

Craft Chicago Finds is a production-ready React-based marketplace application for local artisans and crafters. Built with Vite, TypeScript, React, shadcn/ui, and Tailwind CSS. The application uses Supabase for backend services and is deployed on Cloudflare Pages with edge functions.

**Scale**: 407 TypeScript files, 43 pages, 35 custom hooks, 58 UI components, 95 database migrations

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

- **Frontend**: React 18 + TypeScript 5.6 + Vite 7
- **UI Components**: shadcn/ui with Radix UI primitives (47 packages)
- **Styling**: Tailwind CSS 3.4 with CSS variables, dark mode support
- **State Management**: React Query 5.90 + Context providers
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Payments**: Stripe (@stripe/react-stripe-js, @stripe/stripe-js)
- **Deployment**: Cloudflare Pages with Wrangler 4
- **Testing**: Playwright 1.56 (E2E tests)
- **CI/CD**: GitHub Actions
- **Analytics**: Google Analytics 4
- **Charts**: Recharts 2.13
- **Forms**: React Hook Form 7.54 + Zod 3.23
- **Animations**: Framer Motion 11.15
- **Node**: >=20.19.0, npm >=10.0.0

### Key Directory Structure

```
/
├── src/                    # Main application source (402 TypeScript files)
│   ├── api/                # Sitemap generation utilities
│   ├── components/         # Reusable UI components (35 directories)
│   │   ├── ui/             # 59 shadcn/ui base components
│   │   ├── accessibility/  # Accessibility features & provider
│   │   ├── admin/          # Admin dashboard + support hub
│   │   ├── analytics/      # Analytics dashboards with charts
│   │   ├── auth/           # Authentication components
│   │   ├── blog/           # Blog management and display
│   │   ├── browse/         # Product browsing, search, filters, visual search
│   │   ├── cart/           # Shopping cart components
│   │   ├── checkout/       # Checkout flow + guest checkout
│   │   ├── collections/    # Featured collections
│   │   ├── community/      # Community features
│   │   ├── disputes/       # Dispute resolution system
│   │   ├── education/      # Seller education
│   │   ├── launch/         # Launch controls
│   │   ├── location/       # City/location management
│   │   ├── marketplace/    # Marketplace features
│   │   ├── messaging/      # Real-time buyer-seller messaging
│   │   ├── mobile/         # Mobile-specific (BottomNav, StickySearch)
│   │   ├── notifications/  # Notification system
│   │   ├── onboarding/     # User onboarding flows
│   │   ├── orders/         # Order management
│   │   ├── payments/       # Payment processing (Stripe)
│   │   ├── pickup/         # Local pickup features
│   │   ├── pricing/        # Pricing calculator
│   │   ├── product/        # Product detail components
│   │   ├── profile/        # User profiles
│   │   ├── pwa/            # Progressive Web App features
│   │   ├── reviews/        # Review system
│   │   ├── seller/         # Seller dashboard + AI listing helper
│   │   ├── seo/            # SEO components (CategoryContent, FAQSection)
│   │   ├── subscription/   # Subscription management
│   │   └── wishlist/       # Wishlist/favorites
│   ├── hooks/              # 35 custom React hooks + context providers
│   ├── integrations/       # Supabase integration + types (252KB)
│   ├── lib/                # 29 utility files (analytics, seo, validation, etc.)
│   ├── pages/              # 43 route components (all lazy-loaded)
│   └── styles/             # Global CSS files
├── functions/              # Cloudflare Pages edge functions
│   ├── _middleware.ts      # CORS headers
│   ├── sitemap.xml.ts      # Sitemap index
│   ├── sitemap-*.xml.ts    # Product, blog, maker sitemaps
│   └── api/health.ts       # Health check endpoint
├── supabase/               # Database migrations (95 SQL files) + seed data
├── e2e/                    # Playwright end-to-end tests
├── tests/                  # Additional test files
├── public/                 # Static assets, PWA manifests, service worker
├── mobile/                 # React Native mobile app
├── chatgpt-integration/    # ChatGPT MCP server and widgets
├── blog-content/           # SEO-optimized blog articles (4 posts)
└── .github/workflows/      # CI/CD pipelines
```

### Provider Architecture

The app uses multiple context providers in a specific hierarchy:

```
1. QueryClientProvider (React Query) - 5min stale, 10min cache
2. HelmetProvider (SEO meta tags)
3. BrowserRouter (Routing)
4. AnalyticsProvider (Google Analytics 4)
5. ErrorBoundary (Error handling)
6. AccessibilityProvider (Accessibility features)
7. AuthProvider (Supabase Auth)
8. PlansProvider (Subscription plans)
9. CartProvider (Shopping cart with localStorage)
10. AdminProvider (Admin features)
11. TooltipProvider (UI tooltips)
12. CityProvider (Multi-city marketplace context)
13. StripeProvider (Payments - route-specific)
```

### Key Features

#### E-commerce Core

- Multi-city marketplace with dynamic routing (`/:city`)
- Product browsing with filters, search, visual search
- Shopping cart with personalization options & localStorage persistence
- Stripe payment integration (Apple Pay, Google Pay)
- Guest and authenticated checkout
- Discount/promo code system with bundle pricing
- Local pickup and shipping options
- Order tracking and purchase protection claims

#### Seller Features

- Comprehensive seller dashboard with priority view
- Listing creation with AI assistance & templates library
- Bulk operations and listing duplication
- Order management and analytics
- Pricing calculator tool
- W9 tax form submission
- Saved AI generations

#### Admin Features

- Admin dashboard with analytics and insights
- User management and content management
- Blog manager with templates & blog-product linking
- Review moderation queue
- Protection claims queue
- Fraud detection dashboard
- Compliance verification
- Support hub with ticketing system & canned responses
- Search insights dashboard
- Launch controls and SEO dashboard
- Proactive operations dashboard
- Bulk notifications

#### Content & SEO

- Blog system with 4 SEO-optimized articles
- Dynamic sitemap generation (static, products, blogs, makers)
- Edge functions for sitemap delivery
- SEO components (CategoryContent, FAQSection)
- Meta tag management with react-helmet-async
- Schema.org structured data
- Open Graph and Twitter Cards
- Chicago Craft Index

#### Communication & Social

- Real-time messaging between buyers and sellers
- Notification system with email digests
- Support ticketing system
- Dispute resolution
- Review system
- Wishlist/favorites
- Recently viewed products

#### Mobile Experience

- Mobile-first responsive design
- Bottom navigation bar (mobile component)
- Sticky search (mobile component)
- PWA installation capabilities
- React Native mobile app (separate `/mobile` directory)

#### Advanced Features

- Lazy loading: All 43 pages are lazy-loaded for performance
- Accessibility panel and provider
- Dark mode support (next-themes)
- Performance monitoring (Core Web Vitals)
- Google Analytics 4 tracking with e-commerce events
- Demand forecasting and category trend alerts
- Fraud detection system
- Content moderation
- Featured collections and makers showcase
- Craft fair integration

## Configuration Files

### Build & Development

- **vite.config.ts** - Vite configuration with:

  - React SWC plugin for fast refresh
  - Security headers middleware
  - Manual code splitting (vendor, router, framer, supabase, stripe, react-query)
  - Terser minification with console.log removal in production
  - Asset optimization with consistent naming for caching
  - Path alias (`@/` → `src/`)

- **tailwind.config.ts** - Tailwind CSS with:

  - Dark mode support
  - Custom color system with CSS variables
  - Extended theme (gradients, shadows, animations)
  - Custom animations (shimmer, shake, accordion)
  - shadcn/ui integration

- **tsconfig.json** - TypeScript 5.6.2 strict mode
- **postcss.config.js** - PostCSS with Tailwind and Autoprefixer

### Testing

- **playwright.config.ts** - E2E testing setup:

  - Tests in `/e2e` directory
  - Cross-browser (Chromium, Firefox, WebKit)
  - Mobile viewport testing (Pixel 5, iPhone 12)
  - Screenshot & video on failure
  - Auto-starts dev server

- **Test Files**:
  - `/e2e/auth.spec.ts` - Authentication flow tests
  - `/e2e/checkout.spec.ts` - Checkout flow tests
  - `/e2e/messaging.spec.ts` - Messaging tests

### Code Quality

- **eslint.config.js** - ESLint 9 with TypeScript ESLint, React Hooks rules

### Deployment

- **wrangler.toml** - Cloudflare Pages configuration:

  - Compatibility date: 2024-12-19
  - Build output: `dist/`
  - HTTPS redirect enforcement

- **components.json** - shadcn/ui configuration:
  - Path aliases for components, utils, ui, lib, hooks
  - Slate base color with CSS variables

### PWA

- **public/manifest.json** - Progressive Web App manifest:

  - Name: "CraftLocal - Handmade Marketplace"
  - Standalone display mode, 8 icon sizes
  - Shopping & lifestyle categories
  - Shortcuts: Browse, Cart

- **public/service-worker.js** - Service worker for offline functionality
- **public/\_headers** - Cloudflare headers (security, caching, CSP)
- **public/\_redirects** - URL redirects configuration

## Development Notes

### Path Aliases

- `@/` maps to `src/`
- `@/components` for UI components
- `@/lib` for utilities
- `@/hooks` for custom hooks
- `@/integrations` for external services

### Build Optimization

- Manual code splitting for vendor libraries, UI components, and utilities
- Terser minification with console.log removal in production
- Asset optimization with consistent naming for long-term caching
- All pages lazy-loaded with React.lazy() and Suspense
- React Query caching: 5 min stale time, 10 min cache time

### Database Integration

- Supabase client configured in `src/integrations/supabase/client.ts`
- Type definitions auto-generated in `types.ts` (252KB, comprehensive)
- 95 SQL migrations in `/supabase/migrations/`
- Row Level Security enabled
- Real-time subscriptions for messaging and notifications
- Storage for image uploads

### Key Database Tables

- **Core**: profiles, listings, orders, cart_items
- **Commerce**: subscriptions, discount_codes, bundles, shipping_rates
- **Communication**: messages, notifications, support_tickets
- **Admin**: admin_audit_log, fraud_reports, content_moderation_queue
- **Analytics**: search_analytics, demand_forecast, category_trends
- **AI**: ai_models, ai_settings, ai_generation_logs
- **Content**: blog_posts, blog_keywords, seo_metadata
- **Compliance**: compliance_violations, w9_submissions
- **Social**: reviews, favorites, recently_viewed

### State Management Patterns

- **Server State**: React Query for all Supabase queries
- **Global State**: Context API for auth, cart, city, admin, accessibility
- **Local State**: useState/useReducer for component state
- **Persistence**: localStorage for cart, recently viewed
- **Optimistic Updates**: Cart operations with immediate UI feedback

### Custom Hooks (35 total)

Key hooks to be aware of:

- `useAuth` - Authentication & user sessions
- `useCart` - Shopping cart with localStorage persistence
- `useAdmin` - Admin functionality
- `usePlans` - Subscription plans
- `useStripe` - Stripe payment integration
- `useCityContext` - Multi-city marketplace context
- `useAccessibility` - Accessibility features
- `useSEO` - SEO metadata management
- `usePerformanceMonitor` - Performance monitoring
- `usePWA` - PWA installation
- `useNotifications` - Real-time notifications
- `useFraudDetection` - Fraud prevention
- `useContentModeration` - Content moderation
- `useCompliance` - Compliance validation
- `useDisputes` - Dispute management
- `useDiscountCodes` - Discount/promo codes
- `useFavorites` - Wishlist functionality
- `useRecentlyViewed` - Recently viewed products
- `useSearchAnalytics` - Search analytics tracking
- `useSmartSave` - Smart form saving
- `useOptimisticCart` - Optimistic UI updates
- `useDebounce` - Debounce utility
- `useIntersectionObserver` - Lazy loading
- `useMobile` - Mobile device detection
- `useToast` - Toast notifications
- `useAnalytics` - Analytics tracking
- `useDemandForecast` - Demand forecasting
- `useCategoryTrendAlerts` - Category trend alerts
- `useChicagoCraftIndexData` - Chicago Craft Index data

### Library Utilities (29 files in `src/lib/`)

Key utilities:

- `queryClient.ts` - React Query configuration
- `analytics.ts` - Google Analytics 4 integration
- `seo.ts` & `seo-utils.ts` - SEO utilities
- `sitemap.ts` - Sitemap generation
- `performance.ts` - Core Web Vitals monitoring
- `errorHandler.ts` - Global error handling
- `validation.ts` - Form validation
- `sanitize.ts` & `sanitization.ts` - Input sanitization (DOMPurify)
- `fileValidation.ts` - File upload validation
- `imageOptimization.ts` - Image optimization
- `fraud-detection.ts` - Fraud detection logic
- `content-moderation.ts` - Content moderation
- `compliance-*.ts` - Compliance validation & emails
- `pricing-calculator.ts` - Fee calculation
- `pdf-generator.ts` - PDF generation (jsPDF)
- `accessibility.ts` - Accessibility utilities
- `animations.ts` - Framer Motion animations
- `serviceWorker.ts` - Service worker registration
- `utils.ts` - General utilities (cn, formatters, etc.)

### Security Features

- **Input Sanitization**: DOMPurify for all user-generated content
- **File Validation**: Type, size, dimension checks for uploads
- **Fraud Detection**: Custom fraud detection system with dashboard
- **Content Moderation**: Automated content review queue
- **CSP Headers**: Strict Content Security Policy in `public/_headers`
- **CORS**: Configured in edge function middleware
- **HSTS**: HTTP Strict Transport Security enabled
- **Admin Audit Log**: All admin actions logged
- **Row Level Security**: Supabase RLS policies enforced

### Deployment

- Builds to `dist/` directory for Cloudflare Pages
- Uses Wrangler for deployment and local development
- Compatibility date set to 2024-12-19
- Edge functions in `/functions` directory
- CI/CD via GitHub Actions (`.github/workflows/`)

### CI/CD Pipelines

- **test-and-build.yml**: Runs on push/PR to main/develop
  - Checkout, install, lint, type check, build
  - Uploads build artifacts (7-day retention)
- **deploy-production.yml**: Runs on push to main
  - Build and deploy to Cloudflare Pages
  - Environment: production
  - Requires: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID

### Edge Functions (Cloudflare Pages)

Located in `/functions/`:

- `_middleware.ts` - CORS headers for all functions
- `sitemap.xml.ts` - Main sitemap index
- `sitemap-static.xml.ts` - Static pages sitemap
- `sitemap-products.xml.ts` - Product listings sitemap
- `sitemap-blogs.xml.ts` - Blog articles sitemap
- `sitemap-makers.xml.ts` - Maker profiles sitemap
- `api/health.ts` - Health check endpoint

### Performance Monitoring

- Core Web Vitals tracking in `src/lib/performance.ts`
- Google Analytics 4 with e-commerce events
- Custom performance monitoring hook
- Error boundary for graceful error handling

### Accessibility

- Dedicated AccessibilityProvider context
- Accessibility panel component
- ARIA labels and semantic HTML
- Keyboard navigation support
- Screen reader optimization

### SEO Strategy

- Server-side sitemap generation via edge functions
- Dynamic meta tags with react-helmet-async
- Structured data (Schema.org)
- Open Graph and Twitter Cards
- Blog content for organic traffic (4 articles in `/blog-content/`)
- SEO dashboard for admins
- URL slug optimization

## Important Patterns & Conventions

### Code Splitting

```typescript
// All pages are lazy-loaded
const PageName = lazy(() => import("./pages/PageName"));

// Wrapped in Suspense with LoadingSpinner
<Suspense fallback={<LoadingSpinner />}>
  <PageName />
</Suspense>;
```

### Form Validation

```typescript
// Use React Hook Form + Zod
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const schema = z.object({
  field: z.string().min(1, "Required"),
});
```

### Sanitization

```typescript
// Always sanitize user-generated content
import { sanitizeUserInput } from "@/lib/sanitization";

const clean = sanitizeUserInput(userInput);
```

### Supabase Queries

```typescript
// Use React Query with Supabase
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const { data } = useQuery({
  queryKey: ["resource", id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("table")
      .select("*")
      .eq("id", id);
    if (error) throw error;
    return data;
  },
});
```

### Error Handling

```typescript
// Use error boundary and custom error handler
import { handleError } from "@/lib/errorHandler";

try {
  // operation
} catch (error) {
  handleError(error, "Operation failed");
}
```

### Styling

```typescript
// Use Tailwind with cn utility
import { cn } from "@/lib/utils";

<div className={cn("base-class", conditional && "conditional-class")} />;
```

## Related Projects

### Mobile App

- React Native mobile app in `/mobile` directory
- Separate from web app but shares design system
- See `/mobile/README.md` for details

### ChatGPT Integration

- MCP server and widgets in `/chatgpt-integration`
- OAuth implementation
- Deployment and testing guides included

## Notes for AI Assistants

### When Making Changes

1. **Always use path aliases**: `@/` instead of relative paths
2. **Sanitize user input**: Use `sanitizeUserInput` from `@/lib/sanitization`
3. **Validate files**: Use `validateFile` from `@/lib/fileValidation`
4. **Handle errors**: Use `handleError` from `@/lib/errorHandler`
5. **Follow provider hierarchy**: Don't reorder context providers
6. **Lazy load pages**: All new pages should use `lazy()` and `Suspense`
7. **Use React Query**: For all server state management
8. **Type safety**: Leverage auto-generated Supabase types from `@/integrations/supabase/types`
9. **Security first**: Never trust user input, always sanitize and validate
10. **Test changes**: Run `npm run lint` and `npm run build` before committing

### Common Tasks

**Adding a new page:**

1. Create component in `src/pages/PageName.tsx`
2. Lazy load in `src/App.tsx`
3. Add route to router configuration
4. Update sitemap if necessary

**Adding a UI component:**

1. Use shadcn/ui CLI: `npx shadcn-ui@latest add [component]`
2. Or create in `src/components/` with proper structure
3. Follow existing patterns for accessibility

**Adding a database query:**

1. Create hook in `src/hooks/`
2. Use React Query with proper error handling
3. Leverage types from `@/integrations/supabase/types`

**Adding an edge function:**

1. Create in `functions/` directory
2. Follow middleware pattern for CORS
3. Test locally with `npm run pages:dev`

### Testing

- **E2E tests**: Add to `/e2e/` directory
- **Run tests**: `npx playwright test`
- **Debug**: `npx playwright test --debug`
- **UI mode**: `npx playwright test --ui`

### Deployment

- **Production**: Push to `main` branch (auto-deploys via GitHub Actions)
- **Manual**: `npm run build && wrangler pages deploy dist`
- **Local preview**: `npm run pages:dev` (after building)

## Project Status

**Status**: Production-ready, actively maintained
**Recent Activity**: 193 commits since November 1, 2024
**Last Major Updates**:

- Error handling and keyboard accessibility improvements
- AI search optimization and sitemap enhancements
- PageSpeed performance optimizations
- Edge function improvements
- Seller feature enhancements (AI generations, bulk operations, templates)
- SEO strategy implementation with blog content
- Mobile optimizations (bottom nav, sticky search)

## Additional Resources

- Extensive documentation in `/docs` directory (100+ markdown files)
- SEO strategy and implementation guides
- Performance optimization reports
- Security audit reports
- Compliance implementation guides
- Feature roadmaps and user journey maps
