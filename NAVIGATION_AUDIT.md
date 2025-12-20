# Navigation & Page Functionality Audit

**Date:** 2025-12-20
**Branch:** claude/navigation-page-functionality-4zAuh

## Executive Summary

This audit covers the navigation structure, routing, and page functionality for the Craft Chicago Finds marketplace application. The audit identifies routes, navigation components, protected routes, and pages missing critical UI components.

---

## 1. Routes Inventory (44 routes total)

### Public Routes
1. `/` - Landing page
2. `/marketplace` - NationalMarketplace
3. `/browse` - NationalBrowse
4. `/auth` - Auth (Sign In/Sign Up)
5. `/auth/reset-password` - ResetPassword
6. `/blog` - Blog listing
7. `/:citySlug/blog/:slug` - BlogArticle (dynamic)
8. `/:city/browse` - Browse (city-specific)
9. `/:city/product/:id` - ProductDetail (city-specific product)
10. `/:city` - City page (dynamic city landing)
11. `/order-confirmation` - OrderConfirmation
12. `/terms` - Terms of Service
13. `/privacy` - Privacy Policy
14. `/dmca` - DMCA Policy
15. `/prohibited-items` - Prohibited Items
16. `/fee-schedule` - Fee Schedule
17. `/food-safety` - Food Safety Guidelines
18. `/seller-standards` - Seller Standards
19. `/dmca-notice` - DMCA Notice form
20. `/dispute-resolution` - Dispute Resolution Guide
21. `/safety-guidelines` - Safety Guidelines
22. `/cookie-policy` - Cookie Policy
23. `/w9-submission` - W9 Submission form
24. `/featured-makers` - Featured Makers
25. `/tools/pricing-calculator` - Pricing Calculator
26. `/chicago-craft-index` - Chicago Craft Index
27. `/for-craft-fairs` - For Craft Fairs
28. `/about` - About Us
29. `/sell` - Sell landing page
30. `*` - NotFound (catch-all 404)

### Protected Routes (Authenticated Users)
31. `/messages` - Messages (requireAuth)
32. `/orders` - Orders (requireAuth)
33. `/profile` - Profile (requireAuth)
34. `/disputes` - Disputes (requireAuth)
35. `/dashboard` - SellerDashboard (requireAuth)
36. `/dashboard/orders` - SellerOrders (requireAuth)
37. `/dashboard/listing/new` - CreateEditListing (requireAuth)
38. `/dashboard/listing/:id/edit` - CreateEditListing (requireAuth)

### Protected Routes (Admin Only)
39. `/admin` - AdminDashboard (requireAdmin)
40. `/admin/seo` - SEODashboard (requireAdmin)

### Stripe-Wrapped Routes
41. `/cart` - Cart (wrapped in StripeProvider)
42. `/checkout` - Checkout (wrapped in StripeProvider)
43. `/guest-checkout` - GuestCheckout (wrapped in StripeProvider)
44. `/pricing` - Pricing (wrapped in StripeProvider)

---

## 2. Navigation Components

### 2.1 Header Component (`src/components/Header.tsx`)
**Location:** Sticky top navigation bar
**Visibility:** All screen sizes
**Features:**
- Logo with click-to-home functionality
- City selector (desktop: visible, mobile: in menu)
- QuickSearch (desktop: visible, mobile: in menu)
- Main navigation links (desktop):
  - Marketplace → `/marketplace`
  - Browse → `/browse`
  - Sell → `/sell`
  - Pricing → `/pricing`
- Accessibility panel (desktop only)
- Notification center (logged-in users only)
- Cart indicator with count
- User dropdown menu (logged-in) or Sign In button (guests)
- Mobile hamburger menu

**User Dropdown Menu (Logged In):**
- Profile → `/profile`
- Admin Dashboard → `/admin` (admin only)
- Seller Dashboard → `/dashboard` (sellers only)
- Messages → `/messages`
- My Orders → `/orders`
- Sign Out

**Mobile Menu Items:**
- City Selector
- QuickSearch
- National Marketplace → `/marketplace`
- Browse Categories → `/browse`
- Start Selling → `/sell`
- Pricing → `/pricing`

### 2.2 Footer Component (`src/components/Footer.tsx`)
**Location:** Bottom of pages
**Features:**
- Brand/company info
- Newsletter signup form (functional with Supabase edge function)
- Contact info (location, email)
- Link sections:
  - **Shop:** Marketplace, All Categories, Blog, Featured Makers, Safety
  - **Sell:** Start Selling, Seller Standards, Food Safety, Fees, Prohibited Items
  - **Infrastructure:** About, Chicago Craft Index, For Craft Fairs, Pricing Calculator
  - **Stay Connected:** Newsletter signup
- Bottom bar with copyright and legal links:
  - Terms, Privacy, Cookie Policy, DMCA, Prohibited Items, Seller Standards, Dispute Resolution, CCPA

### 2.3 BottomNav Component (`src/components/mobile/BottomNav.tsx`)
**Location:** Fixed bottom navigation (mobile only)
**Visibility:** Mobile devices only (md:hidden)
**Features:**
- 5 navigation items:
  1. Home → `/`
  2. Browse → `/chicago/browse` **⚠️ ISSUE: Hardcoded city**
  3. Sell → `/sell` or `/dashboard`
  4. Messages → `/messages`
  5. Profile → `/profile`
- Floating cart button (shows when cart has items)
- Active state highlighting

**⚠️ CRITICAL ISSUE:**
- Line 22: `href: "/chicago/browse"` is hardcoded instead of using dynamic city context
- Should use `useCityContext()` to get current city

### 2.4 ProtectedRoute Component (`src/components/ProtectedRoute.tsx`)
**Features:**
- Redirects unauthenticated users to `/auth?redirect={fullPath}`
- Supports `requireAuth`, `requireAdmin`, `requireSeller` props
- Shows loading spinner while checking auth status
- Preserves redirect URL including search params and hash

**⚠️ ISSUE:**
- `requireSeller` prop is not fully implemented (TODO comment on line 49)

---

## 3. Pages Using Header/Footer

### Pages WITH Header (39 pages):
About, AdminDashboard, Blog, BlogArticle, Browse, Cart, Checkout, ChicagoCraftIndex, City, CookiePolicy, CreateEditListing, DisputeResolutionGuide, Disputes, DMCA, DMCANotice, FeaturedMakers, FeeSchedule, FoodSafetyGuidelines, ForCraftFairs, Index, Landing, Messages, NationalBrowse, NationalMarketplace, OrderConfirmation, Orders, Pricing, PricingCalculator, Privacy, ProductDetail, Profile, ProhibitedItems, ResetPassword, SafetyGuidelines, Sell, SellerDashboard, SellerOrders, SellerStandards, SEODashboard, Terms, W9Submission

### Pages WITH Footer (27 pages):
About, Blog, Browse, ChicagoCraftIndex, City, CreateEditListing, DMCA, DMCANotice, FeaturedMakers, FeeSchedule, FoodSafetyGuidelines, ForCraftFairs, Index, Landing, Messages, NationalBrowse, NationalMarketplace, OrderConfirmation, Privacy, ProductDetail, Profile, ProhibitedItems, Sell, SellerDashboard, SellerOrders, SellerStandards, Terms

### Pages WITHOUT Header (6 pages):
**⚠️ POTENTIAL ISSUES:**
1. Auth
2. BlogArticle
3. Checkout
4. NotFound
5. ResetPassword (has Header per grep, need to verify)
6. W9Submission (has Header per grep, need to verify)

### Pages WITHOUT Footer (18 pages):
**Some intentionally don't have footer:**
1. AdminDashboard (uses sidebar, intentional)
2. Auth (intentional, focused UI)
3. BlogArticle (needs verification)
4. Cart (checkout flow, may be intentional)
5. Checkout (intentional, focused checkout)
6. CookiePolicy (needs footer for consistency)
7. DisputeResolutionGuide (needs footer)
8. Disputes (needs footer)
9. NotFound (needs footer)
10. Orders (needs footer)
11. Pricing (needs footer for consistency)
12. PricingCalculator (needs footer)
13. ResetPassword (intentional, focused UI)
14. SafetyGuidelines (needs footer)
15. SEODashboard (admin tool, may be intentional)
16. W9Submission (needs footer)

---

## 4. Critical Issues Identified

### High Priority
1. **BottomNav hardcoded city route** (`/chicago/browse`)
   - File: `src/components/mobile/BottomNav.tsx:22`
   - Impact: Mobile users cannot browse other cities
   - Fix: Use `useCityContext()` to get dynamic city

2. **ProtectedRoute `requireSeller` not implemented**
   - File: `src/components/ProtectedRoute.tsx:46-50`
   - Impact: Seller-only routes not properly protected
   - Fix: Implement seller check using profile data

3. **Missing Footer on key pages**
   - Pages like CookiePolicy, DisputeResolutionGuide, SafetyGuidelines, W9Submission should have footer
   - Impact: Inconsistent UX, poor navigation

### Medium Priority
4. **Header search button on mobile doesn't work**
   - File: `src/components/Header.tsx:110-113`
   - Button has no onClick handler, just shows "Search" icon
   - Impact: Mobile users can't quick access search

5. **Pages missing Header**
   - Need to verify if Auth, NotFound, BlogArticle intentionally exclude Header
   - If not intentional, add Header

### Low Priority
6. **Inconsistent page layout patterns**
   - Some pages have Header+Footer, some only Header
   - Document which pages should/shouldn't have these components

---

## 5. Navigation Flow Analysis

### Guest User Flow
1. Landing page (/) → Header with "Sign In" button
2. Browse/Marketplace → Can view products, add to cart
3. Cart → Can proceed to guest checkout
4. Guest Checkout → Complete purchase without account
5. Protected routes → Redirect to `/auth` with return URL

### Logged-In User Flow
1. All pages → Header shows user dropdown
2. User menu → Profile, Messages, Orders, Sign Out
3. Cart → Can proceed to authenticated checkout
4. Protected routes → Access granted

### Seller Flow
1. Logged in as seller → User menu shows "Seller Dashboard"
2. Seller Dashboard → Access to:
   - Dashboard overview (`/dashboard`)
   - Orders (`/dashboard/orders`)
   - Create listing (`/dashboard/listing/new`)
   - Edit listing (`/dashboard/listing/:id/edit`)

### Admin Flow
1. Logged in as admin → User menu shows "Admin Dashboard"
2. Admin Dashboard → Access to admin tools
3. SEO Dashboard → `/admin/seo`

---

## 6. Recommendations

### Immediate Actions Required:
1. ✅ Fix BottomNav hardcoded city route
2. ✅ Add Footer to pages missing it (where appropriate)
3. ✅ Implement requireSeller protection
4. ✅ Fix mobile search button functionality
5. ✅ Verify and document intentional Header/Footer exclusions

### Future Enhancements:
1. Add breadcrumb navigation for deep pages
2. Add "Back" button on detail pages
3. Improve mobile menu UX with icons
4. Add keyboard navigation shortcuts
5. Implement search history/suggestions

---

## 7. Next Steps

1. Fix critical BottomNav issue
2. Add missing Footer components
3. Test navigation flows:
   - Guest user flow
   - Authenticated user flow
   - Seller flow
   - Admin flow
4. Audit each page for:
   - Button functionality
   - Form submissions
   - Popup/modal behavior
5. Document any intentional design decisions

---

## Appendix: Route Protection Matrix

| Route | Auth Required | Seller Required | Admin Required | Redirect |
|-------|---------------|-----------------|----------------|----------|
| /dashboard | ✅ | ❌ | ❌ | /auth |
| /dashboard/orders | ✅ | ❌ | ❌ | /auth |
| /dashboard/listing/new | ✅ | ❌ | ❌ | /auth |
| /dashboard/listing/:id/edit | ✅ | ❌ | ❌ | /auth |
| /messages | ✅ | ❌ | ❌ | /auth |
| /orders | ✅ | ❌ | ❌ | /auth |
| /profile | ✅ | ❌ | ❌ | /auth |
| /disputes | ✅ | ❌ | ❌ | /auth |
| /admin | ✅ | ❌ | ✅ | / |
| /admin/seo | ✅ | ❌ | ✅ | / |

---

**End of Audit**
