# Chicago Makers Marketplace - Complete PRD

This document contains the complete Product Requirements Document for the Chicago Makers local handmade goods marketplace platform.

## Quick Reference Links
- **Live Project**: [Current Implementation]
- **User Stories**: See Section 5 below
- **Technical Stack**: React, TypeScript, Tailwind CSS, Supabase (when connected)
- **Design System**: Chicago-inspired color palette with artisanal warmth

---

## Executive Summary

**Problem**: Local makers sell through Facebook groups and craft fairs. Buyers want local handmade goods but have no simple local site. Etsy fees (effective 20–25% with ads, listings, and payment costs) and crowded search push many away.

**Solution**: A local, city-first marketplace. Start in Chicago. Sellers list for free. Platform takes 10% commission (+ Stripe card fees). Optional seller plans $10–$50/mo for boosted reach and tools. Buyers browse without logging in; account needed only to buy.

**Why now**: Large share of people prefer to buy local. Makers seek lower fees and stable discovery. Local pickup and low shipping costs boost conversion.

**Targets (12 months Chicago)**:
- GMV $100k/mo
- 500–1,200 orders/mo (AOV $45–$55)
- 200+ active sellers
- repeat buyers ≥ 60%

---

## Scope & Goals

### In-scope (MVP → Scale)
- Multi-vendor marketplace for physical handmade goods (jewelry, home decor, art, seasonal)
- Local pickup and seller-managed shipping
- Stripe Connect split payouts
- Search, filters, reviews, messages, orders, refunds, disputes
- Admin tools for vetting, trust, and catalog quality
- Seller analytics and basic marketing tools

### Out-of-scope (for now)
- Food/perishables, live plants, weapons, adult items
- International markets
- In-app shipping labels (phase 2)
- Mobile apps (use PWA first)

### Success Metrics
- Buyers find and buy local goods fast
- Sellers get steady sales at fair fees
- Clear, simple UX on mobile and desktop

---

## Personas

**Seller (Primary)**: Solo maker, Chicago area, part-time to full-time. Wants lower fees, local buyers, and easy listing flow.

**Buyer (Primary)**: Gift shopper 25–44 in Chicago. Wants unique items, fast delivery/pickup, fair price.

**Admin (Internal)**: Small team. Needs tools to vet sellers, moderate content, manage disputes, and track KPIs.

---

## Roles & Access (RBAC)

- **Guest**: Browse, search, view seller pages, add to cart, save (local storage), view FAQs
- **Buyer**: Everything Guest can do + checkout, order history, reviews, messages, wishlist, address book
- **Seller**: Seller dashboard, listings CRUD, stock, pricing, shipping/pickup settings, order handling, messages, refunds (propose), view payouts, basic analytics
- **Moderator**: Approve/deny sellers & listings, take down content, resolve reports
- **Admin**: Everything + fee settings, feature flags, city config, category tree, payouts override, refunds, coupons, site CMS, data export, KPI dashboards

---

## Core User Stories (Must-have)

### Discovery
- As a buyer, I can search "ceramic mug" and filter by price, category, pickup available, and ZIP radius
- As a buyer, I can sort by newest, price, rating

### Buy
- As a buyer, I can add multiple items from one seller to a cart and check out with Stripe in one flow
- As a buyer, I can pick local pickup or seller ships (with seller's flat rate)
- As a buyer, I can check out as guest and create a password later

### Sell
- As a seller, I can onboard with Stripe Connect Express in < 5 min
- As a seller, I can create listings with 10 photos, variants (size/color), stock, shipping fee, pickup toggle
- As a seller, I can process orders, add tracking, message the buyer, and mark complete

### Trust & Support
- As a buyer, I can rate/review a purchase and upload a photo
- As a buyer, I can open a dispute if item not as described or not delivered
- As an admin, I can see dispute queue and issue refunds

### Growth
- As a seller, I can pay $25/mo to boost listings (featured placement) and get advanced analytics
- As an admin, I can pin Featured on the homepage and category pages

---

## Feature List (Detailed)

### 6.1 Catalog & Listings
**Fields**: title, description (plain + line breaks), price, compare-at price (optional), category, tags, variants (name + options), SKU, stock by variant, condition (handmade default), materials, care notes, location (city/ZIP), shipping fee (flat), pickup toggle, lead time (days)

**Media**: up to 10 images per listing; auto compress; 1:1 and 4:5 crops; WebP + JPEG fallback

**Status**: draft → submitted → live

**Bulk edit (Pro plan)**: price/stock updates via CSV

**Rules**:
- Handmade only (no mass-produced, no dropship)
- Prohibited list enforced
- One-of-a-kind items: auto "sold out" after purchase

### 6.2 Search & Discovery
**Index**: Elasticsearch (products, shops)

**Filters**: category, price range, pickup, shipping, ZIP + radius

**Sort**: relevance (BM25), newest, price asc/desc, rating

**Typeahead**: top tags, categories, recent searches

**SEO**: clean URLs /listing/{slug}, schema.org Product + BreadcrumbList

**Seasonal hubs**: "Holiday", "Mother's Day", etc. (admin-config)

**Personalized rows (phase 2)**: "Because you liked…"

### 6.3 Cart & Checkout
**Cart per seller (MVP)**. If cart holds items from 2 sellers, show separate subtotals and Check out seller A / B buttons

**Taxes (MVP)**: display "Seller may collect sales tax per local rules." Phase 2: TaxJar

**Payments**: Stripe Payment Element (cards, Apple Pay/Google Pay)

**Fees**: show item total, shipping, tax (phase 2), platform fee (if any buyer fee is added later; default $0), order total

**Guest checkout** with email; prompt to create password post-purchase

**Receipts** via email (platform + Stripe)

**Payout split** via Stripe Connect: platform fee (commission) + Stripe fees → net to seller

### 6.4 Orders & Fulfillment
**Status**: New → Accepted → Shipped/Ready for Pickup → Completed (auto after 7 days from delivery unless dispute) → Archived

**Shipping**: seller enters carrier + tracking; buyer gets email + link

**Pickup**: buyer selects time window proposal; seller confirms; in-thread message for details

**SLA prompts**: ship within seller's stated lead time; reminders if late

**Cancellations**: buyer can request; seller can accept/decline. If declined and buyer disputes, admin reviews

**Refunds**: partial/full; Stripe refunds via admin; seller acknowledges

### 6.5 Reviews
- Buyer can review after Completed
- 1–5 stars + text + up to 3 photos
- Shop rating = weighted average
- Report review → moderator queue
- Seller reply (one public response)

### 6.6 Messaging
- Thread per order; pre-sale Q&A on listing page (private)
- Email notifications; reply goes back to thread (masked)
- Filter links (no off-platform payments pre-checkout; allow phone/email after purchase for pickup if both agree)

### 6.7 Seller Dashboard
**Home**: sales today/7d/30d, views, conversion, top listings

**Listings**: table + filters + bulk edit (Pro)

**Orders**: status board, labels print (phase 2), tracking helper

**Payouts**: expected vs paid, fees breakdown

**Settings**: shop info, location, pickup rules, Stripe Connect status, vacation mode

**Promotions (Growth/Pro)**: featured slots, coupon codes, shop banner, scheduled drops

### 6.8 Admin Console
**Users**: search, roles, ban/unban, KYC flags

**Sellers**: onboarding status, Stripe status, risk score, warnings

**Listings**: approve/deny, take down, reasons log

**Reports queue**: listings, reviews, users

**Disputes**: list, evidence, timers, outcomes, refunds

**CMS**: homepage slots, category banners, seasonal hubs, FAQs, policy pages

**Fees**: set commission by city/category/plan; promo windows

**KPIs**: GMV, AOV, orders, take rate, active sellers, repeat rate, CAC by channel (manual input), refunds %, dispute time

### 6.9 Plans & Pricing
- **Free**: 10% commission, basic stats, unlimited listings, standard support
- **Growth $25/mo**: 8% commission, featured rotation, advanced stats, bulk edit, priority support
- **Pro $50/mo**: 6% commission, shop banner + custom sections, early features, dedicated help

(Plans adjustable in Admin. Commission bands also support volume discounts, e.g., 8% if seller hits $5k monthly.)

---

## User Flows (Step-by-Step)

### 7.1 Seller Onboarding
1. Sign up → choose Sell
2. Shop info (name, city/ZIP, bio, logo)
3. Stripe Connect Express flow (ID + bank)
4. Listing quick-start wizard (photo tips, pricing tips)
5. Submit first item → mod review (MVP) → live

### 7.2 Buyer Checkout (Shipping)
1. Add to cart → Checkout
2. Email/login → address → shipping fee shown
3. Stripe pay → order placed → emails sent
4. Seller ships → tracking sent → Completed after delivery window if no dispute

### 7.3 Buyer Checkout (Pickup)
1. Pick Pickup → suggest window (seller's rules)
2. Seller confirms time → meet → seller marks Completed
3. Auto complete after 3 days if not marked and no dispute

### 7.4 Dispute
1. Buyer opens dispute (late/no delivery, not as described, damaged)
2. Both upload notes/photos
3. Moderator reviews in 48 hours → resolve → refund partial/full or deny
4. Log outcome; mark seller scorecard

---

## Technical Implementation

### Current Tech Stack
- **Frontend**: React + TypeScript, Vite, React Router, Tailwind CSS
- **Design System**: Chicago-inspired colors, semantic tokens, responsive components
- **State Management**: React Query for server state, local state with React hooks
- **UI Components**: Shadcn/ui with custom marketplace variants

### Planned Integrations (Next Phase)
- **Backend**: Supabase for database, auth, storage, edge functions
- **Payments**: Stripe + Stripe Connect Express
- **Search**: Elasticsearch/OpenSearch
- **CDN**: Image optimization and delivery

### Data Model (High-level)
- User(id, email, role, password_hash, 2fa, created_at)
- SellerProfile(user_id FK, shop_name, bio, city, zip, stripe_account_id, rating_avg, rating_cnt)
- Listing(id, seller_id FK, title, slug, desc, category_id, price_cents, shipping_cents, pickup_bool, lead_days, status, created_at)
- Variant(listing_id FK, name, options JSON, stock_by_option JSON, sku)
- Media(listing_id FK, url, sort)
- Order(id, buyer_id FK, seller_id FK, status, subtotal_cents, shipping_cents, tax_cents, total_cents, payout_status, payment_intent_id, created_at)
- OrderItem(order_id FK, listing_id FK, variant, qty, price_cents)
- Review(id, order_id FK, rating, text, photos JSON, created_at)
- MessageThread(id, buyer_id, seller_id, order_id nullable)

---

## Development Roadmap

### Phase 0 (Weeks 0–2): ✅ COMPLETE
- IA, design system, data model, policy pages
- Basic marketplace UI components and layouts

### Phase 1 (Weeks 3–10): CURRENT PHASE
- Supabase integration for backend
- User authentication and seller onboarding
- Listings CRUD and search functionality
- Cart and basic checkout flow
- Order management system
- Email notifications

### Phase 2 (Weeks 11–16): 
- Reviews and messaging system
- Pickup scheduler
- Seller analytics v1
- Featured slots and plans billing
- Admin moderation tools

### Phase 3 (Weeks 17–24):
- Tax integration (TaxJar for IL)
- Multi-seller cart
- Advanced SEO
- Bulk edit and CSV import
- Performance optimization

### Phase 4 (Post-launch):
- Mobile PWA enhancements
- Multi-city expansion
- Advanced recommendations
- Shipping integrations

---

## Next Steps for Development

### Immediate (Week 1-2)
1. **Connect Supabase**: Set up database, authentication, and storage
2. **User Authentication**: Implement signup/login flows for buyers and sellers
3. **Basic Data Models**: Create core tables (users, listings, orders)
4. **Seller Onboarding**: Build the seller registration and shop setup flow

### Short Term (Week 3-4)
1. **Listings Management**: CRUD operations for product listings
2. **Search & Filters**: Implement product search with basic filters
3. **Shopping Cart**: Build cart functionality and basic checkout
4. **Order Management**: Create order tracking and status updates

### Medium Term (Week 5-8)
1. **Stripe Integration**: Implement payments and seller payouts
2. **Reviews System**: Build rating and review functionality
3. **Messaging**: Add buyer-seller communication
4. **Admin Tools**: Create moderation and content management tools

---

## Success Metrics & KPIs

### Primary Metrics
- **GMV**: Gross Merchandise Value per month
- **Orders**: Number of completed transactions
- **AOV**: Average Order Value
- **Take Rate**: Platform commission percentage

### Secondary Metrics
- **Active Sellers**: Monthly active seller accounts
- **Repeat Buyers**: Percentage of buyers making 2+ purchases
- **Conversion Rate**: Visitor to buyer conversion
- **Search Success**: Search to purchase conversion

### Operational Metrics
- **Shipping Time**: Average fulfillment time
- **Dispute Rate**: Percentage of orders disputed
- **Refund Rate**: Percentage of orders refunded
- **Support Resolution**: Average support ticket resolution time

---

This PRD serves as the complete reference for building the Chicago Makers marketplace. The current implementation provides the foundational UI and design system, ready for backend integration and feature development.