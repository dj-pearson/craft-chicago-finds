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

**Scale**: 454 TypeScript files, 44 pages, 49 custom hooks, 58 UI components, 103 database migrations, 41 library utilities

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
├── src/                    # Main application source (454 TypeScript files)
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
│   ├── hooks/              # 49 custom React hooks + context providers
│   ├── integrations/       # Supabase integration + types (252KB)
│   ├── lib/                # 41 utility files (analytics, seo, validation, etc.)
│   ├── pages/              # 44 route components (all lazy-loaded)
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

### Custom Hooks (49 total)

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

### Library Utilities (41 files in `src/lib/`)

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
**Recent Activity**: 99 total commits
**Last Major Updates**:

- Stripe products setup for subscription plans (Free, Pro, Premium)
- Distributed rate limiting and server-side input validation
- Mobile optimization across the platform
- Security enhancements (body size limits, CSS injection prevention)
- Environment variables documentation
- Loading states improvements for performance and SEO
- Secure Stripe checkout with server-side price verification

## Additional Resources

- Extensive documentation in `/docs` directory (100+ markdown files)
- SEO strategy and implementation guides
- Performance optimization reports
- Security audit reports
- Compliance implementation guides
- Feature roadmaps and user journey maps

## Session title

In a cloud session, once you know the task, call `set_session_title` with `CL - <short description>` so the owner can tell CraftLocal sessions from other projects' at a glance; rename it if the task changes. Local CLI sessions get the prefix from `.claude/hooks/session-title.mjs`, generated by the Server repo's `coord title-hook` from `hub/coord/repos.json`.

<!-- SELVEDGE:START -->
## Pearson Media — shared context

*Managed from the vault. Edit `14 - Resources/Shared CLAUDE Block.md` in the vault; direct edits between these markers are overwritten once a sync exists. Everything outside them is yours and is never touched.*

**The memory vault.** Portfolio-wide memory lives in the **Hermes** vault at `<your-home>\Documents\Hermes` (override with `HERMES_VAULT_PATH`; remote: https://github.com/dj-pearson/Hermes). It holds the profile, the map of every project, and cross-project knowledge. Read `VAULT-INDEX.md` there when a task needs context beyond this repo. This repo's own `CLAUDE.md`, `~/.claude` memory, and skills remain authoritative for work inside it — the vault supplements them, never replaces them.

**Name the project.** Pearson Media runs a portfolio of projects on a shared stack. Never say "the app," "the repo," or "production" without naming which one. A right answer about the wrong project is a wrong answer.

**The shared stack.** React + TypeScript + Vite, Tailwind, shadcn/ui, self-hosted Supabase, Cloudflare Pages, Coolify on Contabo, Stripe. A problem solved in one repo is usually already solved for this one — check the vault before solving it twice.

**Secrets are references, never values.** Never write a password, key, or token value into a note, summary, commit, or setup doc; name where it's stored instead. Loose credential files exist under your `Documents` folder — never read one into a document.

**Never delete what Claude Code relies on.** Repo `CLAUDE.md` files, `~/.claude/projects/*/memory/`, `.claude/skills/`, settings. Copy from them freely; removing or stubbing them is Dj's call alone.

**Evidence only.** Verify state from the actual file or command before claiming anything is done or in place. If unsure, say so and go find out.

**Work that waits on Dj is a GitHub issue labelled `on-dj`, and nowhere else.** That one label, across both orgs (`dj-pearson`, `Pearson-Media`), is the operator's to-do list: github.com/issues/assigned, or "Assigned to me" in the GitHub app. No hub, board or doc table has to be running for it.
- **File only what only Dj can do**: a secret or token to create, an account, a payment, a platform form, a decision, an approval. If an agent could do it, do it instead.
- **Search before filing**: `gh search issues --label on-dj --state open --owner dj-pearson --owner Pearson-Media "<keywords>"`. If one already covers it, comment there; never open a second.
- **File in the repo the work belongs to**: `gh issue create --assignee @me --label on-dj --title ... --body-file ...`. Portfolio-wide items go to `dj-pearson/Server`, vault items to `dj-pearson/Hermes`. Always add `--label project:<key>` with the project's registry key, e.g. `project:gradethread` or `project:eatpal` (`project:portfolio` when it spans projects; Server and Hermes carry every key, a project repo carries its own). Add `needs-hub` only if the payoff exists solely while the local ADE Hub is running.
- **The bar for the body**: an assistant who is not a developer can finish it line by line without asking anyone. Use the sections `## Why` (what it unblocks: story ids, features), `## You need` (logins and tools), `## Steps` (numbered; exact URLs, menu paths, Infisical project/environment/secret NAME, file paths, commands and the folder to run them from; for a decision, the options, a recommendation and how to record the choice), `## Done when` (a check the assistant can run) and `## Notes`. Names of secrets, never values.
- **Close the loop**: at the start of work, `gh issue list --label on-dj --state closed --search "closed:>=<last run date>"` in this repo, and pick up whatever those closures unblocked. When you can verify an item is done (the secret now exists, the setting is on), close it with a comment saying how you checked.

**Operating principles.** Distilled from the ADE Hub's design rules (the Server repo's `hub/CLAUDE.md`, with the reasoning in its `docs/engineering-log.md`); they hold in every repo.

1. **Unmeasured is not zero, and a real zero stays zero.** A gap reads `Unavailable - <reason>`. A floor is labelled a floor: it can prove a target was hit, never that it was missed. An empty result that could mean "nothing happened" or "the read failed" says which. A total inherits the honesty of its rows, and a cached figure states its age.
2. **Read-only by default; gate on consequence, not on file location.** Anything that starts autonomous work, sends outward or touches a production box waits for approval; storing local config does not. Stopping something is never gated; starting it is.
3. **Never a second, weaker path into production.** Use the repo's own migrator and deploy path.
4. **Report, don't ration.** No cost cap, failure counter or WIP limit that stops work mid-run; report the number and let a person decide.
5. **Report drift; never resolve it silently.**
6. **A fix instruction names a remedy that can work**, and says when it is one example of several.
7. **Declare once and import it, derive what can be derived, and check a table against reality in both directions.** A duplicated literal is how two truths come to disagree.
8. **Measure; never assert a saving.** An estimate says it is one.
9. **Refuse, never truncate.** If what was approved can't be done whole, refuse; doing part of it and reporting success does something nobody approved.
10. **Assert on behaviour, not on wording, and give every negative check a counter-assertion** that proves it still fires. A green unit test on a pure function is not a working feature; look at the rendered page.
11. **Record refusals with their reasoning** so they are not silently re-proposed. A recorded refusal is not a ban: re-propose it openly, with what has changed.

**Write like a person.** Every model was trained on the same corpus, so the default register is recognisable within a sentence and it lands in commits, PR bodies, docs, UI copy and error strings alike. State the point first, then support it. Have an opinion; asked which of two, name one. Use real names and numbers, not categories. Never label your own significance ("important", "crucial", "worth noting", "notably"); if it matters the reader will see it. Banned outright: *delve, dive into, deep dive, unpack, shed light on, pave the way, usher in, tap into, supercharge, unlock, elevate, empower, streamline, curate, showcase, boast, groundbreaking, cutting-edge, transformative, game-changing, innovative, pivotal, invaluable, meticulous, bespoke, vibrant, multifaceted, holistic, testament, tapestry, synergy, cornerstone, treasure trove, plethora, myriad, moreover, furthermore, additionally.* Banned decoratively but fine literally: *navigate, harness, leverage, robust, comprehensive, landscape, realm, journey*; the test is whether a reader could check the claim. Banned phrases: *"In today's…", "It's important/worth noting", "When it comes to", "At its core", "At the end of the day", "This is where X comes in", "Let's break it down", "plays a crucial role", "cannot be overstated", "underscoring the importance of", "highlighting the need for"*, and the whole chat register (*"Great question!", "Absolutely!", "I'd be happy to", "Let me know if you need anything else", "I hope this helps"*). Banned structures, which imitate insight without carrying any: *"not just X, it's Y"*, *"not only X but Y"*, *"this isn't about X, it's about Y"*, *"No X. No Y. Just Z."*, the rule of three that goes abstract on the third item, the rhetorical question as a transition, and closing with a summary of what was just read. **At most one em dash** per piece of writing, never as the default connector; use commas, parentheses and semicolons. Vary sentence and paragraph length deliberately. Uniform 18-word sentences are the signature that survives every word-level edit. Use contractions. Don't restate the question, don't open with a sweeping scene-setter, don't over-format (no emoji as structure, no header on a three-paragraph answer, no table for two rows). The one allowed exception is a **bold lead-in used as a heading** in a reference document like this one; a *run* of "**Bold term:** one sentence" bullets standing in for prose is the tell.

**Plain characters only.** Generated text carries Unicode that renders as ordinary punctuation, as ordinary whitespace, or as nothing at all, and it survives review precisely because it looks correct. **Anything a machine parses is ASCII unless the content requires otherwise**: code, config, JSON, YAML, CSV, SQL, regex, env values, filenames, URLs, commit subjects. Straight quotes `'` `"`, hyphen-minus `-`, three dots for an ellipsis, one ordinary space between words. Never emit curly quotes (U+2018/2019/201C/201D), en/em dashes (U+2013/2014), U+2026 ellipsis, U+2212 minus or U+2032 primes into code; a look-alike character in a PowerShell string or a SQL literal is a runtime failure, which is how `backup-databases.ps1` and `ssl-check.ps1` sat unparseable for months. Never emit a no-break space (U+00A0, and U+202F/2007/2009/2002/2003/3000), which breaks shell word-splitting, `grep` and column parsing while looking exactly like a space, or U+2028/U+2029, which are valid JSON and a syntax error inside a JS string literal. **Never emit an invisible or bidi character anywhere:** U+200B-U+200F, U+2060-U+2064, U+FEFF, U+00AD, U+034F, U+180E, the bidi controls U+202A-U+202E and U+2066-U+2069, and above all the Unicode tag block **U+E0000-U+E007F**, which encodes arbitrary ASCII invisibly and is the usual carrier for text a reviewer cannot see. Avoid homoglyphs (Cyrillic a/e/o/p/c/x, Greek omicron, fullwidth Latin, mathematical alphanumerics for bold): an identifier holding one compares unequal to the identifier it appears to be. Prose may use real typography and real accented names; prose may not carry characters that don't render. The one exception is a deliberate, load-bearing use, which carries a comment saying why. Scan with `rg -n '[\x{0000}-\x{0008}\x{000B}\x{000C}\x{000E}-\x{001F}\x{00A0}\x{00AD}\x{034F}\x{061C}\x{180E}\x{200B}-\x{200F}\x{202A}-\x{202E}\x{2060}-\x{2064}\x{2066}-\x{2069}\x{FEFF}\x{E0000}-\x{E007F}]'`. The C0 control range and the no-break space are in it because the older scan missed a live instance: a stray U+0008 backspace inside a regex in the Server repo's `hub/test/ui-smoke.mjs` disabled a test guard for as long as the guard existed.

**Terminal output is scrollback, not a report.** Answer first — no "I'll start by", no restating the request, no narrating tool calls the transcript already shows. Don't summarise a diff the reader can see or paste back code you just wrote; one line naming what changed and where, with `file:line` because it's clickable. Length matches the question: a yes/no gets a yes/no plus the clause that makes it trustworthy, and under about six lines there are no headers, bullets or tables. Report actual output, not a paraphrase: quote the failing assertion, say what was skipped, say plainly what's verified and what isn't. No emoji and no status theatre; "246 tests, 246 passing" beats "✅ All tests passing!" and is falsifiable. Don't close with an offer of more help or unrequested next steps: ask a real question, or name the real remaining work. Commits are imperative, what and why, no launch copy. PR bodies say what changed, why, how it was verified, and what's still open.

**UI has a craft floor.** Every model trained on the same SaaS templates, so the *default* frontend output is a recognizable handful of tells — and Tailwind + shadcn/ui puts each of them one autocomplete away. Treat the following as the category's defaults rather than as bans: the brief's own words can earn any of them, but reaching for one on a free axis means you were not deciding. Refuse **purple/blue gradients and gradient text** (emphasis comes from weight and size); **Inter or a system default as the type *choice***; a colored **`border-left`/`border-right` above 1px** on cards, list items, callouts or alerts — the single most recognizable tell; grids of **same-size icon-tile + heading + text cards** as the page structure, and **cards nested in cards**; a **1px border under a wide soft shadow** (declare elevation once — border *or* shadow); **gray text on colored surfaces** (tint secondary text from the surface hue or the foreground); **bounce/elastic easing**; **monospace as a costume** for "technical" rather than for code, data or measurement; and a **tracked uppercase eyebrow over every section**. Keep body measure at 65–75ch, tracking no tighter than -0.04em, and card radii at 12–16px.

**Check UI, don't just intend it.** `npx impeccable detect <path>` runs 60 deterministic anti-pattern rules with no install, no API key and no LLM — it works from any repo, so there is no excuse for asserting a UI is clean. Use the `/impeccable` skill (`audit`, `critique`, `polish`, `colorize`, `typeset`) for the judgement calls it cannot make. Source: [Impeccable](https://github.com/pbakaus/impeccable), Apache 2.0.
<!-- SELVEDGE:END -->
