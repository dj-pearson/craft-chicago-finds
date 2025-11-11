# Living Technical Specification
## Craft Chicago Finds Marketplace Platform

**Version:** 1.0
**Last Updated:** 2025-11-11
**Status:** Active Development

---

## Executive Summary

Craft Chicago Finds is a comprehensive multi-city marketplace platform connecting local artisans with buyers. The platform features sophisticated seller tools, admin dashboards, fraud detection, compliance management, and SEO optimization.

**Key Metrics:**
- **Codebase Size:** ~24,900 lines of TypeScript/React
- **Pages:** 39 user-facing routes
- **Database Tables:** 143 tables
- **Custom Hooks:** 31 hooks
- **Component Directories:** 30+ feature-based directories
- **External Integrations:** Stripe, Supabase, Google Search Console

---

## 1. Technology Stack

### Core Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.6.2 | Type safety |
| Vite | 7.2.2 | Build tool & dev server |
| React Router | 6.28.0 | Client-side routing |
| Tailwind CSS | 3.4.17 | Utility-first styling |
| shadcn/ui | Latest | Component library |

### Backend & Services
| Service | Purpose | Integration |
|---------|---------|-------------|
| Supabase | PostgreSQL + Auth + Real-time + Storage | Primary backend |
| Stripe | Payment processing + Connect | Full integration |
| Cloudflare Pages | Hosting & deployment | Wrangler CLI |

### Key Libraries
- **State Management:** TanStack Query (React Query) 5.90.2, React Context
- **Forms:** react-hook-form 7.54.0 + Zod 3.23.8
- **UI Primitives:** Radix UI
- **Charts:** recharts 2.13.3
- **Animation:** framer-motion 11.15.0
- **Icons:** lucide-react 0.468.0
- **Security:** dompurify 3.3.0

---

## 2. Architecture Overview

### 2.1 Application Structure

```
src/
├── api/              # API utilities, sitemap generation
├── components/       # React components (feature-based)
│   ├── accessibility/ # Accessibility features
│   ├── admin/        # Admin dashboard (20+ components)
│   ├── analytics/    # Analytics dashboards
│   ├── browse/       # Product browsing
│   ├── checkout/     # Payment flow
│   ├── messaging/    # Buyer-seller messaging
│   ├── orders/       # Order management
│   ├── product/      # Product display
│   ├── profile/      # User profiles
│   ├── reviews/      # Review system
│   ├── seller/       # Seller tools (40+ components)
│   └── ui/           # shadcn/ui base components
├── hooks/            # Custom React hooks (31 total)
├── integrations/     # Supabase integration
├── lib/              # Utilities, validation, helpers
├── pages/            # Route components (39 pages)
├── styles/           # Global CSS
└── main.tsx          # App entry point
```

### 2.2 Provider Hierarchy

The application uses a strict provider hierarchy for state management:

```
App
└── ErrorBoundary
    └── AccessibilityProvider
        └── AuthProvider (user authentication & session)
            └── PlansProvider (subscription data)
                └── CartProvider (shopping cart state)
                    └── AdminProvider (admin role checking)
                        └── TooltipProvider
                            └── Toaster & Sonner (notifications)
                                └── CityProvider (city context)
                                    └── Routes
```

**Key Providers:**
- **AuthProvider:** User authentication, session management, profile data
- **CartProvider:** Shopping cart with localStorage persistence (useReducer pattern)
- **AdminProvider:** Role-based access control
- **CityProvider:** Multi-city marketplace context

### 2.3 Routing Architecture

**Route Patterns:**
- `/` - Landing page
- `/:city` - City-specific marketplace
- `/:city/browse` - City product browsing
- `/:city/product/:id` - Product detail pages
- `/dashboard/*` - Seller dashboard (protected)
- `/admin/*` - Admin dashboard (protected, admin-only)
- `/checkout` - Checkout flow
- `/orders` - Order history
- `/messages` - Messaging center

**Route Protection:**
- `ProtectedRoute` component wraps authenticated routes
- `requireAuth` prop for user authentication
- `requireAdmin` prop for admin-only access
- Seller status checked for `/dashboard` routes

---

## 3. Feature Inventory

### 3.1 Buyer Features (Core Marketplace)

#### Product Discovery
- **Multi-city Browsing:** City-specific marketplaces (`/:city`)
- **National Marketplace:** Cross-city product discovery
- **Search & Filters:** Full-text search, category filtering, price ranges
- **Featured Makers:** Highlighted seller profiles
- **Product Detail Pages:** Image gallery, reviews, seller info, messaging

#### Shopping & Checkout
- **Shopping Cart:** Persistent cart (localStorage), quantity management
- **Multi-seller Orders:** Automatic order grouping by seller
- **Checkout Flow:**
  - Fulfillment method selection (shipping/local pickup)
  - Discount code application
  - Address validation
  - Shipping calculation
  - Stripe payment (card, Apple Pay, Google Pay)
- **Guest Checkout:** Purchase without account creation

#### Post-Purchase
- **Order Management:** Order history, tracking, status updates
- **Pickup Appointments:** Schedule local pickup times
- **Reviews & Ratings:** 1-5 star ratings with written reviews
- **Disputes:** Dispute filing and resolution tracking
- **Buyer Protection Claims:** Protection claim management
- **Messages:** Real-time buyer-seller messaging

#### User Profile
- **Account Settings:** Profile management, saved addresses
- **Notification Preferences:** Email and in-app notifications
- **Email Digest Settings:** Newsletter subscription management
- **Favorites/Wishlists:** Save favorite products
- **Recently Viewed:** Browse history tracking
- **Accessibility Panel:** Built-in accessibility features

#### Content & Resources
- **Blog:** Article browsing with product linking
- **Educational Content:** Food safety, seller standards, guidelines
- **Pricing Calculator Tool:** Handmade product pricing calculator
- **Legal Pages:** Terms, Privacy, DMCA, Cookie Policy

### 3.2 Seller Features (Dashboard & Tools)

#### Dashboard & Onboarding
- **Seller Activation Wizard:** Step-by-step onboarding
- **Performance Dashboard:** Revenue, orders, views, ratings
- **Seller Verification:** Identity and account verification

#### Listing Management
- **Create/Edit Listings:** Full product listing CRUD
- **Bulk Operations:**
  - Product duplication
  - Bulk deletion
  - Bulk status changes
  - Bulk price updates
  - Bulk field updates
- **Inventory Management:**
  - Stock level tracking
  - Inventory alerts
  - Bulk inventory updates
- **A/B Testing Slots:** Test different listing variations

#### Payment & Financial
- **Stripe Connect Onboarding:** Payment account setup
- **Payout Management:** View earnings and payouts
- **Discount Code Manager:**
  - Create percentage/fixed/free shipping discounts
  - Set usage limits and date ranges
  - Category or product-specific discounts
  - Usage analytics
- **Tax Management:**
  - W9 form submission
  - Tax document management
  - Sales tax nexus configuration

#### Shipping & Fulfillment
- **Shipping Settings:**
  - Shipping zone configuration
  - Shipping label creation
- **Ready Today Local Delivery:** Same-day local delivery setup
- **Pickup Appointment Management:** Manage pickup slots
- **Prep Pack Guides:** Packing and shipping guidance

#### Analytics & Insights
- **Performance Metrics:**
  - Revenue trends
  - Order volume
  - Product performance
  - Conversion rates
- **Search Analytics:** Keyword performance, search trends
- **Price Coach:** Dynamic pricing recommendations
- **Shop Health Score:** Overall shop performance indicators

#### Compliance & Quality
- **Compliance Management:**
  - Compliance status overview
  - Alerts and notifications
  - Improvement plans
  - Performance scores
- **Public Disclosure:** Seller policy disclosure

#### Marketing & Growth
- **QR Shop Codes:** Generate custom QR codes for shop linking
- **AI Listing Helper:** AI-powered description generation
- **AI Photo Helper:** Image optimization and enhancement
- **Etsy Importer:** Import products from Etsy
- **Vacation Mode:** Pause selling temporarily
- **Seller Education:** Personalized learning recommendations

#### Order Management
- **Order Dashboard:** View and manage orders
- **Order Fulfillment:** Process and ship orders
- **Multi-seller Order Grouping:** Handle grouped orders

### 3.3 Admin Features (Platform Management)

#### Core Admin
- **Admin Dashboard:** Overview metrics and activity feed
- **Proactive Operations Dashboard:** Predictive alerts, platform health, action items
- **User Management:** User accounts, roles, verification status

#### Content Management
- **City Management:** Add/edit cities, manage city slugs
- **City Replication Wizard:** Clone city configuration to new cities
- **Content Manager:** Manage static content and pages
- **Blog Manager:**
  - Create/edit blog articles
  - Blog templates
  - SEO optimization
  - Content calendar
  - Keyword management
  - Analytics tracking
- **Social Media Manager:** Social media posting and scheduling
- **Content Optimizer:** SEO and content quality analysis

#### Moderation & Quality Control
- **Smart Moderation Queue:** AI-assisted content moderation
- **Review Moderation Queue:** Moderate user reviews
- **Dispute Management:** Manage buyer-seller disputes
- **Protection Claims Queue:** Buyer protection claims review
- **General Moderation Queue:** Content flagging review
- **Compliance Verification:** Verify seller compliance

#### Fraud & Security
- **Fraud Detection Dashboard:**
  - Fraud signal detection
  - Risk scoring
  - Transaction review
  - False positive reporting
- **Compliance Controls:** Compliance rule management
- **Compliance Reporting:** Audit reports
- **Audit Log Viewer:** Track all system changes

#### Support & Operations
- **Support Hub:**
  - Ticket management (partial implementation)
  - Support analytics
  - Canned responses
  - User profile viewing
  - SLA tracking
- **Bulk Notifications:** Send notifications to user segments

#### SEO & Marketing
- **SEO Dashboard:**
  - Keyword tracking
  - Backlink analysis
  - Technical SEO audits
  - Content recommendations
  - Core Web Vitals monitoring
  - Competitor analysis
  - SERP position tracking
  - Duplicate content detection
  - Mobile optimization
  - Security analysis
- **Search Insights Dashboard:** Search behavior analysis
- **Keyword Selector:** Keyword research and selection

#### AI & Advanced Features
- **AI Settings Manager:**
  - Configure AI models
  - Set generation parameters
  - Monitor usage and costs

#### Launch & Configuration
- **Launch Controls:** City launch management, feature flags, soft launch configuration

---

## 4. Database Schema

### 4.1 Overview
- **Total Tables:** 143
- **Database Type:** PostgreSQL (via Supabase)
- **Security:** Row-Level Security (RLS) policies
- **Real-time:** Supabase real-time subscriptions enabled

### 4.2 Core Table Categories

#### User & Identity (8 tables)
- `profiles` - User profile data (display_name, email, avatar_url, bio, location, is_seller, seller_verified)
- `user_roles` - Role assignments (admin, city_moderator, seller, buyer)
- `user_trust_scores` - Fraud prevention trust scoring
- `user_device_fingerprints` - Device tracking for fraud detection

#### Marketplace Core (10 tables)
- `listings` - Product listings (title, description, price, inventory, status, category, seller_id)
- `categories` - Product categories
- `cities` - Geographic locations for city-specific marketplaces
- `reviews` - Ratings and reviews (1-5 star, review text)
- `listing_favorites` - User favorite products
- `listing_analytics` - Product view tracking
- `featured_makers` - Featured seller profiles
- `featured_slots` - Featured product slots
- `recently_viewed_products` - User browsing history

#### Orders & Fulfillment (7 tables)
- `orders` - Order records (total_amount, status, buyer_id, seller_id, fulfillment_method)
- `order_items` - Items within orders with pricing and personalization
- `order_reminders` - Order status reminders
- `pickup_appointments` - Local pickup scheduling
- `pickup_meetups` - Scheduled pickup locations
- `pickup_slots` - Available pickup time slots
- `reorder_history` - Track repeat customer purchases

#### Payments & Financial (6 tables)
- `commission_payouts` - Seller payment tracking
- `platform_revenue` - Platform earnings tracking
- `platform_fee_config` - Commission rate configuration
- `discount_codes` - Seller discount code management
- `subscriptions` - Seller subscription plans
- `plans` - Subscription tier definitions (Basic, Standard, Premium)
- `sales_tax_nexus` - Tax jurisdiction configuration

#### Communication (3 tables)
- `messages` - Buyer-seller messaging
- `notifications` - User notifications
- `newsletter_subscriptions` - Newsletter signup tracking

#### Content Management (15 tables)
- `blog_articles` - Published articles
- `blog_article_templates` - Article templates
- `blog_content_calendar` - Editorial calendar
- `blog_keywords` - Keyword tracking
- `blog_keyword_clusters` - Keyword groupings
- `blog_seo_keywords` - SEO keyword tracking
- `blog_analytics` - Article performance metrics
- `blog_post_templates` - Reusable post templates
- Plus 7 more blog-related tables

#### Admin & Compliance (5 tables)
- `compliance_audit_log` - Compliance action tracking
- `moderation_logs` - Content moderation history
- `moderation_queue` - Pending moderation items
- `dmca_notices` - DMCA takedown requests
- `error_logs` - System error tracking
- `webhook_logs` - Webhook call tracking
- `rate_limit_logs` - Rate limiting records

#### Analytics (6 tables)
- `analytics_trends` - Trend data over time
- `search_analytics` - Search behavior tracking
- `listing_analytics` - Product performance
- `blog_analytics` - Blog post performance
- `api_endpoint_metrics` - API performance tracking
- `performance_metrics` - System performance data

#### AI & Generation (3 tables)
- `ai_generation_logs` - AI content generation history
- `ai_models` - Available AI models configuration
- `ai_settings` - AI system settings

#### Fraud Detection (4 tables)
- `fraud_detection_rules` - Rules for fraud detection
- `fraud_detection_sessions` - Session tracking for fraud analysis
- `fraud_reviews` - Manual fraud review records
- `fraud_signals` - Detected fraud indicators

#### SEO Management (30+ tables)
Comprehensive SEO tracking including:
- Keyword tracking & history
- Backlink monitoring
- Technical audits (crawl results, duplicate content, mobile analysis, security)
- Competitor analysis
- SERP position tracking
- Core Web Vitals
- Performance budgets
- Structured data tracking

#### Dispute & Protection (4 tables)
- `disputes` - Dispute records
- `dispute_messages` - Dispute communication
- `protection_claims` - Buyer protection claims
- `protection_claim_messages` - Claim discussions

#### Seller Tools (15+ tables)
- `seller_tax_info` - Tax configuration per seller
- `seller_public_disclosures` - Seller policies
- `seller_performance_metrics` - Seller KPI tracking
- `seller_price_analytics` - Pricing analysis
- `social_media_profiles` - Seller social links
- `social_media_campaigns` - Marketing campaigns
- `shipping_zones` - Shipping configuration
- `inventory_alerts` - Low stock alerts
- Plus more seller-related tables

#### System & Operations (10+ tables)
- `system_health_checks` - Uptime monitoring
- `uptime_incidents` - Downtime events
- `webhook_settings` - Webhook configuration
- `oauth_clients` - OAuth app configuration
- `oauth_events` - OAuth activity logging
- `gsc_properties` - Google Search Console properties
- `gsc_oauth_credentials` - GSC authentication
- Plus more operational tables

### 4.3 Key RPC Functions (30+)

**Admin & Permissions:**
- `is_admin(user_id)` - Check if user has admin role
- `is_city_moderator(user_id, city_id)` - Check city moderator status
- `has_role(user_id, role)` - Generic role check

**Discount System:**
- `validate_discount_code()` - Validate discount eligibility
- `calculate_discount_amount()` - Compute discount
- `get_vendor_discount_stats()` - Discount code analytics

**Inventory Management:**
- `update_inventory_count()` - Update stock
- `decrement_inventory()` - Decrease inventory
- `increment_listing_views()` - Track views
- `get_inventory_stats()` - Inventory overview

**Notifications:**
- `create_notification()` - Create alert
- `mark_notification_read()` - Mark as read
- `mark_all_notifications_read()` - Read all

**Seller Features:**
- `set_vacation_mode()` - Pause selling
- `bulk_toggle_listing_status()` - Batch status change
- `bulk_update_listing_fields()` - Batch field updates
- `bulk_update_listing_prices()` - Batch pricing

**Analytics:**
- `get_trending_categories()` - Popular categories
- `get_top_cities_stats()` - City performance
- `get_featured_collections()` - Featured items

**Fraud & Safety:**
- `should_flag_transaction()` - Fraud check
- `update_user_trust_score()` - Recalculate trust
- `verify_review_purchase()` - Verify review eligibility

---

## 5. User Roles & Permissions

### 5.1 Role Types

| Role | Access Level | Key Permissions |
|------|--------------|-----------------|
| **Admin** | Full platform | All management features, all city moderation |
| **City Moderator** | City-specific | Content moderation for assigned cities |
| **Seller** | Seller dashboard | Manage listings, orders, analytics, payments |
| **Buyer** | Default user | Browse, purchase, review, message |

### 5.2 Access Control Implementation

**Components:**
- `ProtectedRoute.tsx` - Route-level authentication
- `AdminProvider` - Admin role checking
- `useAuth()` hook - User authentication state

**Database:**
- `user_roles` table stores role assignments
- RLS policies enforce row-level security
- RPC functions (`is_admin()`, `is_city_moderator()`) for role checks

**Profile Fields:**
```typescript
is_seller: boolean
seller_verified: boolean
seller_setup_completed: boolean
stripe_account_id?: string
```

---

## 6. External Integrations

### 6.1 Stripe Payment Processing

**Files:** `/hooks/useStripe.tsx`, `/pages/Checkout.tsx`, `/components/checkout/*`

**Features:**
- Card payment processing
- Apple Pay integration
- Google Pay integration
- Stripe Connect for seller onboarding
- Payout management
- Subscription handling

**Flow:**
```
Buyer: Checkout → Stripe Elements → Payment → Order Creation
Seller: Stripe Connect Onboarding → Payout Setup → Receive Payments
```

### 6.2 Supabase Backend

**Files:** `/integrations/supabase/client.ts`, `/integrations/supabase/types.ts`

**Services Used:**
- **Authentication:** Email/password, password reset, session management (PKCE flow)
- **Database:** PostgreSQL with RLS policies
- **Real-time:** Subscriptions for messaging
- **Storage:** File uploads (product images, documents)

**Security Features:**
- PKCE flow for enhanced security
- SecureStorage with 24-hour expiration
- Auto-refresh tokens
- Session persistence

### 6.3 Google Search Console (Optional)

**Tables:** `gsc_properties`, `gsc_oauth_credentials`, `gsc_page_performance`, `gsc_keyword_performance`

**Features:**
- Keyword ranking tracking
- Search performance monitoring
- Backlink opportunities
- Technical SEO data

### 6.4 Etsy Integration

**Component:** `/components/seller/EtsyImporter.tsx`

**Features:**
- Bulk import of product listings from Etsy
- Data mapping and transformation

---

## 7. Key Technical Patterns

### 7.1 State Management

**React Context + Hooks Pattern:**
- Context providers for global state (Auth, Cart, Admin, City)
- Custom hooks for feature-specific logic (31 total)
- useReducer for complex state (Cart management)

**React Query (TanStack Query):**
- Server state management
- Automatic caching and refetching
- Query invalidation

**localStorage Integration:**
- Cart persistence: `cart_${userId}`
- Session metadata with expiration
- Security validation on reads

### 7.2 Data Fetching Patterns

**Direct Supabase Queries:**
```typescript
const { data, error } = await supabase
  .from('listings')
  .select('*')
  .eq('seller_id', userId)
  .order('created_at', { ascending: false })
```

**RPC Functions (Complex Logic):**
```typescript
const { data, error } = await supabase.rpc(
  'validate_discount_code',
  { p_code: code, p_user_id: userId, p_cart_total: total }
)
```

### 7.3 Form Handling & Validation

**react-hook-form + Zod Schema Validation:**

**Files:** `/lib/validation.ts`

**Pattern:**
```typescript
// Centralized validators
validators.email, validators.password, validators.price

// Composed schemas
profileSchema, listingSchema, checkoutSchema

// Usage
validateWithSchema(listingSchema, formData)
// Returns: { success: true, data } | { success: false, errors[] }
```

**Common Validations:**
- Email: RFC 5322 compliant
- Password: 8+ chars, uppercase, lowercase, number
- Price: Positive, max 1,000,000
- Slug: Lowercase alphanumeric + hyphens

### 7.4 Security Patterns

**SecureStorage Implementation:**
```typescript
// Wraps localStorage with:
- Key prefix validation (sb- prefix)
- 24-hour expiration metadata
- Automatic cleanup of expired items
- Background cleanup every 5 minutes
```

**Input Sanitization:** `/lib/sanitization.ts`
- DOMPurify integration
- XSS prevention
- HTML sanitization

**Compliance Validation:** `/lib/compliance-validation.ts`
- Tax ID validation
- Address verification
- Business rule checking

### 7.5 Performance Optimizations

**Code Splitting:**
- All pages lazy-loaded with React.lazy()
- Component-level code splitting in vite.config.ts
- Manual vendor chunk separation
- UI component bundling

**Build Optimization:**
```javascript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor': [...],
        'ui-components': [...],
        'utils': [...]
      }
    }
  },
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true // Remove console.logs in production
    }
  }
}
```

**Image Optimization:** `/lib/imageOptimization.ts`
- Responsive image sizing
- Format optimization
- Lazy loading support

### 7.6 Error Handling

**ErrorBoundary:** `/components/ErrorBoundary.tsx`
- Catches React rendering errors
- Shows fallback UI
- Logs to monitoring service

**Global Error Handler:** `/lib/errorHandler.ts`
- Centralized error processing
- Sentry integration setup
- Console warning cleanup in production

**Network Error Handling:** `/lib/networkError.ts`
- Retry logic
- Timeout handling
- User-friendly error messages

---

## 8. Known Limitations & Technical Debt

### 8.1 Incomplete Features

#### Missing Database Tables/Functions
1. **Service Worker** (`/src/main.tsx`)
   - Status: Not properly compiled for Vite
   - Impact: PWA functionality limited

2. **Smart Recommendations** (`/hooks/useSmartSave.tsx`)
   - Missing: `user_favorites` table, `track_listing_view` function
   - Impact: Smart recommendations incomplete

3. **Email Digest** (`/hooks/useEmailDigest.tsx`)
   - Missing: `email_digest_preferences` table
   - Impact: Email preferences not persisted

4. **Product Bundles** (`/components/product/BundleBuilder.tsx`)
   - Missing: `product_bundles`, `cart_bundles` tables
   - Impact: Product bundling not functional

5. **SEO Slug Generation** (`/lib/seo-utils.ts`)
   - Missing: `generate_unique_slug` RPC function
   - Impact: May generate duplicate slugs

6. **Support Hub** (`/components/admin/support/*`)
   - Missing: `support_tickets`, `support_messages`, `support_canned_responses` tables
   - Status: Partial implementation with stubs

7. **Shop Following** (`/components/seller/FollowShopButton.tsx`)
   - Missing: `shop_follows`, `collection_follows` tables
   - Status: UI skeleton only

8. **Personalization Options** (`/components/product/ProductInfo.tsx`)
   - Missing: `personalization_options` table
   - Impact: Product customization not available

9. **Wishlist Sharing** (`/components/wishlist/ShareWishlistDialog.tsx`)
   - Missing: `shared_wishlists` table
   - Status: Placeholder implementation

### 8.2 Partial Implementations

**Admin Features:**
- Smart Moderation Queue: Missing moderation rules
- Proactive Operations Dashboard: Placeholder metrics
- Search Analytics: Type definitions not updated, commented code

**Profile & Settings:**
- SellerSettings: Profile update not implemented
- NotificationSettings: Preferences not persisted

**Blog System:**
- Product linking UI exists but backend integration incomplete
- Readability score uses placeholder value (85)

### 8.3 Architectural Considerations

**State Management:**
- Context API used extensively (could benefit from Redux for scale)
- Multiple providers create deep nesting
- Potential for prop drilling in some components

**Database:**
- 143 tables is comprehensive but may indicate schema optimization opportunities
- RLS policies not visible in codebase (assumed configured)

**API Layer:**
- No abstraction layer between components and Supabase client
- Direct supabase calls throughout codebase
- Would benefit from custom API hooks/services

**Testing:**
- No test files found (Playwright config exists but no tests written)
- Should implement comprehensive testing strategy

**Performance Monitoring:**
- Hooks exist for performance tracking
- Could be more granular
- Real-time monitoring infrastructure not visible

---

## 9. Development & Deployment

### 9.1 Development Environment

**Requirements:**
- Node.js >= 20.19.0
- npm >= 10.0.0

**Commands:**
```bash
npm i              # Install dependencies
npm run dev        # Start dev server (port 8080)
npm run build      # Production build
npm run build:dev  # Dev build with sourcemaps
npm run lint       # Run ESLint
npm run preview    # Preview production build (port 3000)
npm run pages:dev  # Local Cloudflare Pages testing
```

### 9.2 Path Aliases

Configured in `tsconfig.json` and `vite.config.ts`:
- `@/` → `src/`
- `@/components` → `src/components/`
- `@/lib` → `src/lib/`
- `@/hooks` → `src/hooks/`

### 9.3 Build Configuration

**Target:** Cloudflare Pages
**Build Tool:** Vite 7.2.2
**Compatibility Date:** 2024-12-19

**Key Configuration Files:**
- `vite.config.ts` - Build optimization, code splitting
- `wrangler.toml` - Cloudflare Pages deployment settings
- `tailwind.config.ts` - Tailwind CSS configuration
- `components.json` - shadcn/ui configuration
- `eslint.config.js` - ESLint with React hooks rules

**Build Optimizations:**
- Manual code splitting (vendor, UI components, utils)
- Terser minification
- Console.log removal in production
- Asset optimization with consistent naming for caching

### 9.4 Deployment

**Platform:** Cloudflare Pages
**Deployment Tool:** Wrangler CLI 4.46.0
**Build Output:** `dist/` directory

---

## 10. Opportunities for Growth

### 10.1 Feature Completion
1. **Complete Support Hub System**
   - Implement ticket management database tables
   - Build out canned responses system
   - Complete SLA tracking

2. **Finish Product Bundling**
   - Create bundle tables
   - Implement bundle pricing logic
   - Add bundle checkout flow

3. **Complete Personalization Options**
   - Add personalization_options table
   - Build customization UI
   - Integrate with cart/checkout

4. **Enhance Email System**
   - Complete email digest preferences
   - Build email template system
   - Implement automated campaigns

### 10.2 Testing & Quality
1. **Comprehensive Testing**
   - Write unit tests for critical paths
   - Implement E2E tests with Playwright
   - Add integration tests for checkout/payments

2. **Performance Testing**
   - Load testing for high traffic
   - Database query optimization
   - Frontend performance auditing

### 10.3 Architecture Improvements
1. **API Abstraction Layer**
   - Create service layer between components and Supabase
   - Centralize API calls
   - Improve error handling

2. **State Management**
   - Consider Redux or Zustand for complex state
   - Reduce provider nesting
   - Optimize re-renders

3. **Database Optimization**
   - Review schema for normalization
   - Optimize high-traffic queries
   - Implement caching strategy

### 10.4 Platform Expansion
1. **Mobile App**
   - React Native implementation
   - Shared business logic
   - Push notifications

2. **Marketplace Features**
   - Live streaming for makers
   - Virtual events/marketplaces
   - Subscription boxes

3. **Advanced Analytics**
   - Predictive analytics for sellers
   - Customer lifetime value tracking
   - Churn prediction

4. **AI Features**
   - AI-powered product recommendations
   - Smart pricing optimization
   - Automated inventory forecasting

### 10.5 International Expansion
1. **Multi-currency Support**
2. **Internationalization (i18n)**
3. **Multiple Language Support**
4. **International Shipping Integration**

---

## 11. Summary & Metrics

### 11.1 Current State

| Metric | Value |
|--------|-------|
| **Total Lines of Code** | ~24,900 |
| **Pages** | 39 |
| **Component Directories** | 30+ |
| **Custom Hooks** | 31 |
| **Database Tables** | 143 |
| **RPC Functions** | 30+ |
| **Admin Components** | 20+ |
| **Seller Components** | 40+ |
| **User Roles** | 4 |
| **External Integrations** | 3 major |
| **Estimated Completion** | ~85% |

### 11.2 Feature Matrix

| Category | Features Implemented | Completion |
|----------|---------------------|------------|
| **Buyer Experience** | Full marketplace, checkout, reviews, messaging | 95% |
| **Seller Tools** | Listings, inventory, analytics, payments | 90% |
| **Admin Dashboard** | User mgmt, moderation, compliance, SEO | 85% |
| **Payment Processing** | Stripe integration, payouts, subscriptions | 95% |
| **Content Management** | Blog, SEO, social media | 80% |
| **Fraud Detection** | Trust scoring, transaction flagging | 85% |
| **Analytics** | Seller & admin analytics dashboards | 90% |
| **Support System** | Messaging (complete), ticketing (partial) | 60% |

### 11.3 Technical Health

✅ **Strengths:**
- Modern, type-safe tech stack
- Comprehensive feature set
- Strong security patterns
- Well-organized codebase
- Sophisticated admin tools

⚠️ **Areas for Improvement:**
- Testing coverage (0%)
- Some incomplete features
- No API abstraction layer
- Deep provider nesting
- Missing documentation for some features

---

## 12. Maintenance & Updates

### 12.1 This Document

This Living Technical Specification should be updated:
- **Weekly:** During active feature development
- **Monthly:** During maintenance phases
- **Always:** When adding new major features or integrations
- **Before:** Major version releases

### 12.2 Update Checklist

When updating this document:
- [ ] Update feature inventory
- [ ] Document new database tables/functions
- [ ] Add new integration points
- [ ] Update metrics and statistics
- [ ] Review and update limitations
- [ ] Update opportunities section
- [ ] Update version number and date

---

**Document Version:** 1.0
**Last Updated:** 2025-11-11
**Next Review:** 2025-12-11
**Maintained By:** Development Team
