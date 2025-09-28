# Local Hobby & Craft Marketplace (Chicago) — Full PRD (A→Z)

> Plain language. No fluff. Built for an agent to execute end-to-end.

---

## 1) Executive Summary

- **Problem:** Local makers sell through Facebook groups and craft fairs. Buyers want local handmade goods but have no simple local site. Etsy fees (effective 20–25% with ads, listings, and payment costs) and crowded search push many away.
- **Solution:** A local, city-first marketplace. Start in **Chicago**. Sellers list for free. Platform takes **10%** commission (+ Stripe card fees). Optional seller plans $10–$50/mo for boosted reach and tools. Buyers browse without logging in; account needed only to buy.
- **Why now:** Large share of people prefer to buy local. Makers seek lower fees and stable discovery. Local pickup and low shipping costs boost conversion.
- **Targets (12 months Chicago):**
  GMV $100k/mo; 500–1,200 orders/mo (AOV $45–$55); 200+ active sellers; repeat buyers ≥ 60%.

---

## 2) Scope & Goals

### In-scope (MVP → Scale)

- Multi-vendor marketplace for **physical handmade goods** (jewelry, home decor, art, seasonal).
- Local pickup and seller-managed shipping.
- Stripe Connect split payouts.
- Search, filters, reviews, messages, orders, refunds, disputes.
- Admin tools for vetting, trust, and catalog quality.
- Seller analytics and basic marketing tools.

### Out-of-scope (for now)

- Food/perishables, live plants, weapons, adult items.
- International markets.
- In-app shipping labels (phase 2).
- Mobile apps (use PWA first).

### Success

- Buyers find and buy local goods fast.
- Sellers get steady sales at fair fees.
- Clear, simple UX on mobile and desktop.

---

## 3) Personas

**Seller (Primary):** Solo maker, Chicago area, part-time to full-time. Wants lower fees, local buyers, and easy listing flow.
**Buyer (Primary):** Gift shopper 25–44 in Chicago. Wants unique items, fast delivery/pickup, fair price.
**Admin (Internal):** Small team. Needs tools to vet sellers, moderate content, manage disputes, and track KPIs.

---

## 4) Roles & Access (RBAC)

- **Guest:** Browse, search, view seller pages, add to cart, save (local storage), view FAQs.
- **Buyer:** Everything Guest can do + checkout, order history, reviews, messages, wishlist, address book.
- **Seller:** Seller dashboard, listings CRUD, stock, pricing, shipping/pickup settings, order handling, messages, refunds (propose), view payouts, basic analytics.
- **Moderator:** Approve/deny sellers & listings, take down content, resolve reports.
- **Admin:** Everything + fee settings, feature flags, city config, category tree, payouts override, refunds, coupons, site CMS, data export, KPI dashboards.

---

## 5) Core User Stories (Must-have)

**Discovery**

- As a buyer, I can search “ceramic mug” and filter by price, category, pickup available, and ZIP radius.
- As a buyer, I can sort by newest, price, rating.

**Buy**

- As a buyer, I can add multiple items from one seller to a cart and check out with **Stripe** in one flow.
- As a buyer, I can pick **local pickup** or **seller ships** (with seller’s flat rate).
- As a buyer, I can check out as guest and create a password later.

**Sell**

- As a seller, I can onboard with **Stripe Connect Express** in < 5 min.
- As a seller, I can create listings with 10 photos, variants (size/color), stock, shipping fee, pickup toggle.
- As a seller, I can process orders, add tracking, message the buyer, and mark complete.

**Trust & Support**

- As a buyer, I can rate/review a purchase and upload a photo.
- As a buyer, I can open a dispute if item not as described or not delivered.
- As an admin, I can see dispute queue and issue refunds.

**Growth**

- As a seller, I can pay $25/mo to boost listings (featured placement) and get advanced analytics.
- As an admin, I can pin **Featured** on the homepage and category pages.

---

## 6) Feature List (Detailed)

### 6.1 Catalog & Listings

- Fields: title, description (plain + line breaks), price, compare-at price (optional), category, tags, variants (name + options), SKU, stock by variant, condition (handmade default), materials, care notes, location (city/ZIP), shipping fee (flat), pickup toggle, lead time (days).
- Media: up to 10 images per listing; auto compress; 1:1 and 4:5 crops; WebP + JPEG fallback.
- Status: draft → submitted → live.
- Bulk edit (Pro plan): price/stock updates via CSV.

**Rules**

- Handmade only (no mass-produced, no dropship).
- Prohibited list enforced.
- One-of-a-kind items: auto “sold out” after purchase.

### 6.2 Search & Discovery

- Index: Elasticsearch (products, shops).
- Filters: category, price range, pickup, shipping, ZIP + radius.
- Sort: relevance (BM25), newest, price asc/desc, rating.
- Typeahead: top tags, categories, recent searches.
- SEO: clean URLs `/listing/{slug}`, schema.org Product + BreadcrumbList.
- Seasonal hubs: “Holiday”, “Mother’s Day”, etc. (admin-config).
- Personalized rows (phase 2): “Because you liked…”.

### 6.3 Cart & Checkout

- Cart per seller (MVP). If cart holds items from 2 sellers, show separate subtotals and **Check out seller A / B** buttons.
- Taxes (MVP): display “Seller may collect sales tax per local rules.” Phase 2: TaxJar.
- Payments: Stripe Payment Element (cards, Apple Pay/Google Pay).
- Fees: show item total, shipping, tax (phase 2), platform fee (if any buyer fee is added later; default $0), order total.
- Guest checkout with email; prompt to create password post-purchase.
- Receipts via email (platform + Stripe).
- Payout split via Stripe Connect: platform fee (commission) + Stripe fees → net to seller.

### 6.4 Orders & Fulfillment

- Status: **New → Accepted → Shipped/Ready for Pickup → Completed** (auto after 7 days from delivery unless dispute) → Archived.
- Shipping: seller enters carrier + tracking; buyer gets email + link.
- Pickup: buyer selects time window proposal; seller confirms; in-thread message for details.
- SLA prompts: ship within seller’s stated lead time; reminders if late.
- Cancellations: buyer can request; seller can accept/decline. If declined and buyer disputes, admin reviews.
- Refunds: partial/full; Stripe refunds via admin; seller acknowledges.

### 6.5 Reviews

- Buyer can review after **Completed**.
- 1–5 stars + text + up to 3 photos.
- Shop rating = weighted average.
- Report review → moderator queue.
- Seller reply (one public response).

### 6.6 Messaging

- Thread per order; pre-sale Q&A on listing page (private).
- Email notifications; reply goes back to thread (masked).
- Filter links (no off-platform payments pre-checkout; allow phone/email after purchase for pickup if both agree).

### 6.7 Seller Dashboard

- Home: sales today/7d/30d, views, conversion, top listings.
- Listings: table + filters + bulk edit (Pro).
- Orders: status board, labels print (phase 2), tracking helper.
- Payouts: expected vs paid, fees breakdown.
- Settings: shop info, location, pickup rules, Stripe Connect status, vacation mode.
- Promotions (Growth/Pro): featured slots, coupon codes, shop banner, scheduled drops.

### 6.8 Admin Console

- Users: search, roles, ban/unban, KYC flags.
- Sellers: onboarding status, Stripe status, risk score, warnings.
- Listings: approve/deny, take down, reasons log.
- Reports queue: listings, reviews, users.
- Disputes: list, evidence, timers, outcomes, refunds.
- CMS: homepage slots, category banners, seasonal hubs, FAQs, policy pages.
- Fees: set commission by city/category/plan; promo windows.
- KPIs: GMV, AOV, orders, take rate, active sellers, repeat rate, CAC by channel (manual input), refunds %, dispute time.

### 6.9 Plans & Pricing

- **Free:** 10% commission, basic stats, unlimited listings, standard support.
- **Growth $25/mo:** 8% commission, featured rotation, advanced stats, bulk edit, priority support.
- **Pro $50/mo:** 6% commission, shop banner + custom sections, early features, dedicated help.

_(Plans adjustable in Admin. Commission bands also support volume discounts, e.g., 8% if seller hits $5k monthly.)_

---

## 7) Flows (Step-by-Step)

### 7.1 Seller Onboarding

1. Sign up → choose **Sell**
2. Shop info (name, city/ZIP, bio, logo)
3. Stripe Connect Express flow (ID + bank)
4. Listing quick-start wizard (photo tips, pricing tips)
5. Submit first item → mod review (MVP) → live

### 7.2 Buyer Checkout (Shipping)

1. Add to cart → Checkout
2. Email/login → address → shipping fee shown
3. Stripe pay → order placed → emails sent
4. Seller ships → tracking sent → **Completed** after delivery window if no dispute

### 7.3 Buyer Checkout (Pickup)

1. Pick Pickup → suggest window (seller’s rules)
2. Seller confirms time → meet → seller marks **Completed**
3. Auto complete after 3 days if not marked and no dispute

### 7.4 Dispute

1. Buyer opens dispute (late/no delivery, not as described, damaged)
2. Both upload notes/photos
3. Moderator reviews in 48 hours → resolve → refund partial/full or deny
4. Log outcome; mark seller scorecard

---

## 8) Non-Functional

- **Performance:** < 2.5s LCP on 4G; image lazy load; CDN.
- **Uptime:** 99.9% monthly target.
- **Security:** HTTPS, HSTS, OWASP top 10, JWT with rotation, 2FA for sellers.
- **Privacy:** PII minimal. Stripe holds card data.
- **Backups:** Daily DB backups, 30-day retention.
- **Accessibility:** WCAG 2.1 AA patterns (labels, contrast, keyboard use, alt text).
- **Analytics:** GA4 (events), server KPIs, Sentry for errors.

---

## 9) Tech Stack

- **Frontend:** React + TypeScript, Vite, React Router, React Query, Zustand/Redux (light), Tailwind CSS, Headless UI, PWA (manifest + service worker).
- **Backend:** Python **FastAPI**, SQLAlchemy, PostgreSQL, Redis (cache, sessions, rate limits), Celery/RQ for async jobs (emails, search indexing), Elasticsearch/OpenSearch for search.
- **Payments:** Stripe + Stripe Connect (Express).
- **Storage/CDN:** AWS S3 + CloudFront; image resizing lambda or Thumbor.
- **Infra:** Docker, Terraform, AWS (ECS/EKS or Fargate), ALB, CloudWatch, SSM.
- **CI/CD:** GitHub Actions (lint, test, build, deploy).
- **Testing:** Unit (Pytest, RTL), e2e (Playwright).
- **Logging/Monitoring:** OpenTelemetry, Sentry, Datadog/New Relic.

---

## 10) Data Model (High-level)

- **User**(id, email, role, password_hash, 2fa, created_at)
- **SellerProfile**(user_id FK, shop_name, bio, city, zip, stripe_account_id, rating_avg, rating_cnt)
- **Listing**(id, seller_id FK, title, slug, desc, category_id, price_cents, shipping_cents, pickup_bool, lead_days, status, created_at)
- **Variant**(listing_id FK, name, options JSON, stock_by_option JSON, sku)
- **Media**(listing_id FK, url, sort)
- **Order**(id, buyer_id FK, seller_id FK, status, subtotal_cents, shipping_cents, tax_cents, total_cents, payout_status, payment_intent_id, created_at)
- **OrderItem**(order_id FK, listing_id FK, variant, qty, price_cents)
- **Shipment**(order_id FK, carrier, tracking, shipped_at, delivered_at)
- **Pickup**(order_id FK, proposed_time, confirmed_time, location_notes)
- **Review**(id, order_id FK, rating, text, photos JSON, created_at)
- **MessageThread**(id, buyer_id, seller_id, order_id nullable)
- **Message**(thread_id FK, sender_id, body, attachments JSON, created_at)
- **PlanSubscription**(seller_id, plan, start_at, end_at, status, stripe_sub_id)
- **Dispute**(order_id, reason, status, admin_notes, created_at)

Indexes on search fields, seller_id, status, created_at.

---

## 11) API (Sample Endpoints)

**Auth**

- `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`

**Catalog**

- `GET /listings?query=&cat=&price_min=&price_max=&pickup=&zip=&radius=`
- `GET /listings/{slug}`
- `POST /seller/listings` (auth: seller)
- `PUT /seller/listings/{id}`
- `POST /seller/listings/{id}/media`

**Cart/Checkout**

- `POST /cart/add`, `GET /cart`
- `POST /checkout/intent` (Stripe PI create)
- `POST /checkout/confirm` (webhook handles success)

**Orders**

- `GET /buyer/orders`, `GET /seller/orders`
- `POST /seller/orders/{id}/ship`
- `POST /seller/orders/{id}/pickup/confirm`
- `POST /orders/{id}/cancel`
- `POST /orders/{id}/dispute`

**Reviews**

- `POST /orders/{id}/review`
- `GET /shops/{id}/reviews`

**Messages**

- `POST /messages/thread`, `GET /messages/threads`, `POST /messages/{thread_id}`

**Admin**

- `GET /admin/reports`, `POST /admin/listings/{id}/approve`, `POST /admin/listings/{id}/remove`
- `GET /admin/disputes`, `POST /admin/disputes/{id}/resolve`
- `POST /admin/feature/home`, `POST /admin/fees/config`

Webhooks: `/webhooks/stripe` (payments, payouts, disputes), retries with idempotency.

---

## 12) UI / UX Spec (Key Screens)

### Buyer

- **Home:** Search bar; hero with “Shop Chicago Makers”; featured rows (New, Trending, Pickup Near You); seasonal tiles.
- **Category:** Filters left (mobile overlay); grid cards with price, seller, rating, pickup badge.
- **Listing page:** Image gallery, price, options, stock, shipping fee, pickup toggle, seller card (city, rating), Q&A button, add to cart.
- **Cart/Checkout:** Simple steps; address form (if shipping); pickup scheduler (if pickup). Payment element inline.
- **Orders:** List with status, tracking links, review buttons.
- **Messages:** Inbox list + thread view; send images.

### Seller

- **Dashboard:** Tiles (sales, views, conv), chart (last 30 days), alert cards (late ship).
- **Listings:** Table with photo, title, price, stock, status; add/edit wizard (5 steps).
- **Orders:** Kanban by status; detail view with buyer info (masked), actions.
- **Payouts:** Table of settlements; fee breakdown.
- **Settings:** Shop profile, location, pickup rules, Stripe status, plan switch.

### Admin

- **Moderation queue:** Cards with listing photos, flags, approve/deny.
- **Disputes:** Table with SLA timer, evidence viewer, refund buttons.
- **CMS:** Drag-and-drop featured slots; seasonal hubs editor.
- **KPIs:** GMV, AOV, orders, repeat %, refund %, active sellers; export CSV.

**Design rules**

- Mobile-first.
- 12-column grid; 8pt spacing.
- Buttons: primary (solid), secondary (outline), link.
- Forms: labels always visible; inline errors.
- Copy: short, direct, helpful tips.
- Empty states with “Next action” buttons.

---

## 13) Payments & Fees

- **Commission:** default 10% (configurable by plan and volume).
- **Processor:** Stripe fee (2.9% + $0.30) taken during charge.
- **Payouts:** Stripe Connect to seller; daily/weekly per Stripe settings.
- **Refunds:** via Stripe; commission refunded on full refunds; partial refunds pro-rated.
- **Chargebacks:** Stripe workflow; admin receives webhook; freeze payouts on risky sellers.

---

## 14) Policy & Trust

- **Allowed:** Handmade goods only.
- **Banned:** Mass-produced, dropship, copied IP, weapons, adult, recalled items.
- **Quality:** Clear photos, honest descriptions, ship on time.
- **Returns:** Sellers set policy; platform covers “not as described/damaged” with dispute flow.
- **Pickup safety:** Meet in public places; share contact only after purchase; common-sense safety tips page.
- **Enforcement:** Warnings → limits → removal; appeal path.

---

## 15) Analytics & KPIs

- GMV, Orders, AOV, Take rate.
- Sellers: active, new, churn, sales distribution.
- Buyers: MAU, new vs repeat, cohort repeat %, time to 2nd order.
- Funnel: search → PDP → add to cart → checkout start → paid.
- Ops: ship times, dispute rate, refund %, SLA times.
- Marketing: CAC by channel (manual input + UTM), conversion by landing.

---

## 16) Roadmap

**Phase 0 (Weeks 0–2):** IA, design system, data model, Stripe Connect setup, policy pages.
**Phase 1 (Weeks 3–10):** Listings, search, PDP, seller onboarding, cart/checkout (Stripe), orders, emails, basic admin, PWA.
**Phase 2 (Weeks 11–16):** Reviews, messages, pickup scheduler, seller analytics v1, featured slots, plans billing.
**Phase 3 (Weeks 17–24):** TaxJar (IL), multi-seller cart, label buy (Shippo/phase 2 alt), recs, advanced SEO, bulk edit, CSV import (from Etsy).
**Phase 4 (Post-launch):** Mobile apps (optional), shipping rate APIs, multi-city.

---

## 17) Testing & Acceptance

- **Unit:** ≥ 80% on core services.
- **e2e:** Guest browse → buy (ship/pickup); seller ship; review; dispute; refund.
- **Stripe test:** all webhooks, retries, idempotency.
- **Perf:** 95th pct < 500ms API; LCP < 2.5s on 4G.
- **A11y:** Keyboard, screen reader pass on top flows.
- **Security:** Authz tests by role; SSRF/XSS/SQLi checks.

**Go-live gate:** 50 test sellers, 300 live listings, 30 successful test orders (mix ship/pickup), zero blocker bugs.

---

## 18) Risk Matrix (Short)

- **Low liquidity early:** Seed sellers first; feature top items; promos.
- **Inconsistent shipping:** Clear SLAs, reminders, late flags, education.
- **Bad actors:** Seller vetting, report flow, payout holds, scorecards.
- **Seasonality:** Seasonal hubs, gift guides, off-season pushes.
- **Fees pressure:** Keep plan value clear; volume discounts.

---

## 19) Content & Emails

- **System emails:** Welcome, verify email, order confirm, shipped, pickup confirm, review invite, refund issued, dispute updates, payout notice, plan invoice.
- **Copy tone:** Friendly, short, local pride. No jargon.
- **Help center:** Getting started, photo tips, pricing tips, shipping tips, pickup safety, refunds, disputes.

---

## 20) Config & City Model

- City entity: name, slug, center lat/lon, default radius filters, featured rows.
- Listings tied to city by seller ZIP.
- Admin can add new cities later; switcher in header (Chicago default).

---

## 21) Legal & Compliance

- Terms of Use (buyer, seller), Privacy, Cookie notice, Community Rules.
- Marketplace facilitator note (tax phase 2 with TaxJar for IL).
- DMCA process.
- Age 18+ to sell.
- Stripe terms passed through.

---

## 22) Deployment & Ops

- Blue/green deploys.
- Feature flags for risky features (multi-seller cart, TaxJar).
- On-call rotation (business hours first 60 days).
- Runbooks: Stripe incident, search outage, email outage, image pipeline fail.

---

## 23) Chicago Launch Plan

- **Supply first (Weeks 6–10):** 100 sellers from Chicago fairs, maker spaces, Instagram DMs; free 60-day Growth plan; onsite help booths at 2 major markets.
- **Soft launch (Week 12):** 500 local buyers via email lists and partner posts; track funnel; fix rough spots.
- **Public launch (Week 14):** PR to local news/blogs; paid social to Chicago ZIPs; “Pickup near you” ads; “Meet the Maker” weekly spotlights.
- **Target by Month 6:** GMV $50k/mo, 800 orders, repeat ≥ 50%, 200 active sellers.

---

## 24) Acceptance Criteria (MVP)

- Guest can browse, search, filter, open PDP in < 2.5s.
- Buyer can complete shipping and pickup orders via Stripe; receipts sent.
- Seller can onboard with Stripe, list items, fulfill orders, get payouts.
- Reviews and messages work end-to-end.
- Admin can approve listings, feature items, resolve disputes, process refunds.
- All P0 bugs fixed; P1 tracked with workaround.

---

## 25) Appendix — Fee Math Example

- Item $50 + ship $6 = $56 charge.
- Stripe fee ~ $1.92 + $0.30 = $2.22.
- Platform 10% on $56 = $5.60.
- Net to seller ≈ $56 − $2.22 − $5.60 = **$48.18**.
- On Growth (8%): platform cut $4.48 → net **$49.30**.
- On Pro (6%): platform cut $3.36 → net **$50.42**.

---

## 26) Future Work (Post-MVP)

- TaxJar auto tax.
- Live shipping rates + label buy (Shippo).
- Visual search (“find similar by photo”).
- Events & workshops ticketing.
- Gift cards.
- Multi-seller unified cart with one payment.
- Loyalty (buyer points), referrals.

---

### Final Notes for the Agent

- Build for **Chicago first**. Buyers can browse without login; account needed to buy.
- Sellers handle **shipping or pickup**.
- Use **Stripe Connect Express**.
- Keep flows short. Keep pages fast. Keep copy simple.
- Ship MVP, seed supply, watch funnels, iterate fast.
