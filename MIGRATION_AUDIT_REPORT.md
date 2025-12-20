# Self-Hosted Supabase Migration Audit Report

**Date**: December 20, 2024
**Purpose**: Comprehensive audit to ensure all connections route to self-hosted Supabase at `api.craftlocal.net` and verify real data/functionality

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Critical Issues - Immediate Action Required](#critical-issues---immediate-action-required)
3. [Configuration Status](#configuration-status)
4. [Hardcoded Data & Mock Data](#hardcoded-data--mock-data)
5. [Stubbed Functionality](#stubbed-functionality)
6. [Missing Database Tables](#missing-database-tables)
7. [Remediation Checklist](#remediation-checklist)

---

## Executive Summary

### Current State
- **Primary Supabase URL**: `https://api.craftlocal.net` (self-hosted) ✅
- **Edge Functions Domain**: `https://functions.craftlocal.net` (configured)
- **Old Cloud Project ID**: `slamtlgebisrimijeoid` (references still exist)

### Overall Assessment
| Category | Status | Count |
|----------|--------|-------|
| Critical Security Issues | 🔴 | 3 |
| Configuration Issues | 🟡 | 5 |
| Mock/Hardcoded Data | 🟡 | 80+ instances |
| Stubbed Functionality | 🟡 | 95+ TODO items |
| Missing Database Tables | 🔴 | 13 tables |

---

## Critical Issues - Immediate Action Required

### 1. Old Project Reference File (COMMITTED TO GIT)
**File**: `supabase/.temp/project-ref`
**Content**: `slamtlgebisrimijeoid`
**Risk**: HIGH - Exposes old project ID, file is tracked by Git

**Fix Required**:
```bash
# Add to .gitignore
echo "supabase/.temp/" >> .gitignore

# Remove from git tracking
git rm --cached supabase/.temp/project-ref
```

### 2. Hardcoded JWT Token in Source Code
**Files**:
- `src/integrations/supabase/client.ts` (lines 8-10)
- `wrangler.toml` (lines 18, 26)

**Current Code**:
```typescript
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

**Risk**: HIGH - Token exposed in committed file
**Fix Required**: Remove fallback token, require env variable

### 3. Admin Email Hardcoded Check
**File**: `src/components/disputes/DisputeDetail.tsx` (line 114)
**Content**: `user?.email === 'admin@example.com'`
**Risk**: MEDIUM - Placeholder admin check, not functional

---

## Configuration Status

### ✅ Correctly Configured Files

| File | Status | Details |
|------|--------|---------|
| `src/integrations/supabase/client.ts` | ✅ | Points to `api.craftlocal.net` |
| `wrangler.toml` | ✅ | Uses `api.craftlocal.net` |
| `public/_headers` | ✅ | CSP includes `api.craftlocal.net` |
| `public/service-worker.js` | ✅ | Updated to check `api.craftlocal.net` |
| `vite.config.ts` | ✅ | CSP includes `api.craftlocal.net` |
| `supabase/functions/_shared/cors.ts` | ✅ | Includes `craftlocal.net` domains |
| `mobile/src/config/supabase.js` | ✅ | Points to `api.craftlocal.net` |
| `chatgpt-integration/mcp-server/.env.example` | ✅ | Uses `api.craftlocal.net` |

### ⚠️ Files with Documentation References to Old URLs

These are documentation/example files that contain `supabase.co` references for educational purposes only:

| File | Line | Notes |
|------|------|-------|
| `SECURITY_REMEDIATIONS.md` | 40, 695, 729 | Example CSP configurations |
| `CODE_AUDIT_REPORT.md` | 314 | Sitemap redirect example |
| `SEO_DUPLICATION_GUIDE.md` | 351, 584, 753, 814 | pg_dump and deployment examples |
| `PAYMENT_SYSTEM_IMPLEMENTATION_GUIDE.md` | 105-237 | Stripe webhook examples |
| `deployment/edge-functions/*.md` | Various | Documentation only |
| `GETTING-STARTED.md` | 72, 275, 276 | Dashboard link examples |

**Action**: Update documentation examples to use `api.craftlocal.net` for consistency

---

## Hardcoded Data & Mock Data

### High Priority - Affects Core Functionality

#### 1. Chicago Craft Index Data
**File**: `src/hooks/useChicagoCraftIndexData.ts`

| Line | Issue | Current Value |
|------|-------|---------------|
| 94 | Hardcoded Chicago UUID | `bf6e733a-52de-44c2-99f3-4d5c9f14e8c3` |
| 186-191 | Fallback neighborhood data | Wicker Park, Pilsen, Logan Square, etc. |
| 288 | Fallback makers count | 523 |
| 294 | Fallback listings count | 8400 |

#### 2. A/B Testing Mock Data
**File**: `src/components/seller/ABTestSlots.tsx` (lines 126-184)
- Mock listing IDs: `sample-1`, `sample-2`
- Fake metrics: views (1250, 1180), clicks (89, 126)
- Placeholder Unsplash images

#### 3. Platform Analytics Mock Data
**File**: `src/components/admin/ProactiveOperationsDashboard.tsx` (lines 124-145)
- Hardcoded platform health score: 98
- Hardcoded system status: 'operational'

### Medium Priority - Educational/Demo Components

#### 4. Craft Learning Hub
**File**: `src/components/education/CraftLearningHub.tsx` (lines 193-324)
- Mock instructors: Sarah Chen, Marcus Johnson, Elena Rodriguez
- Fake course prices, ratings, student counts
- Sample challenge with $2500 prize pool

#### 5. Maker Mentorship
**File**: `src/components/education/MakerMentorship.tsx` (lines 208-343)
- Mock mentors with fake experience, ratings, hourly rates
- Placeholder Zoom link: `https://zoom.us/j/example`

#### 6. Maker Livestreams
**File**: `src/components/community/MakerLivestreams.tsx` (lines 181-291)
- Mock livestream data with fake shop names
- Hardcoded chat messages from fake users

#### 7. Local Pickup Meetups
**File**: `src/components/community/LocalPickupMeetups.tsx` (lines 166-258)
- Hardcoded Chicago addresses (real locations)
- Fake phone: `+1 (312) 555-0123`
- Fake email: `pickup@craftlocal.net`

#### 8. One-Click Reorder
**File**: `src/components/product/OneClickReorder.tsx` (lines 149-187)
- Mock consumable products (candles, tea, soap, coffee)
- Fake seller names

### Low Priority - Placeholder Images

**Multiple files contain Unsplash placeholder images**:
- `photo-1578662996442-48f60103fc96` (ceramics)
- `photo-1556909114-f6e7ad7d3136` (workshop)
- `photo-1494790108755-2616b612b5bc` (avatars)
- `photo-1472099645785-5658abf4ff4e` (avatars)

---

## Stubbed Functionality

### 🔴 Critical - Core Features Not Implemented

#### 1. Profile Updates
**File**: `src/components/profile/ProfileForm.tsx` (line 52)
```typescript
// TODO: Implement profile update in Supabase
console.log("Profile update data:", validatedData);
```

#### 2. Seller Settings
**File**: `src/components/profile/SellerSettings.tsx` (line 48)
```typescript
// TODO: Implement seller settings update in Supabase
```

#### 3. Payment Processing Gaps
**File**: `supabase/functions/validate-payment/index.ts`
- Line 191: Platform fee rate hardcoded (10%)
- Line 229: Buyer account standing check not implemented

**File**: `supabase/functions/reconcile-revenue/index.ts`
- Line 123: Stripe fees not fetched from API
- Line 158: Chargeback tracking not implemented

### 🟡 Medium - Feature Gaps

#### 4. Support System (Entire module stubbed)
**Files affected**:
- `src/components/admin/support/SupportHub.tsx` - All queries commented out
- `src/components/admin/support/TicketDetail.tsx` - Returns empty arrays
- `src/components/admin/support/CannedResponseSelector.tsx` - No database queries
- `src/components/admin/support/SupportAnalytics.tsx` - All mock data

#### 5. Social Features (Waiting for tables)
| Feature | File | Status |
|---------|------|--------|
| Shop Following | `FollowShopButton.tsx` | Shows "coming soon" toast |
| Collection Following | `CollectionCard.tsx` | Not implemented |
| Wishlist Sharing | `ShareWishlistDialog.tsx` | Not implemented |

#### 6. Product Features
| Feature | File | Status |
|---------|------|--------|
| Bundle Discounts | `BundleBuilder.tsx` | Stubbed, returns empty |
| Personalization | `ProductInfo.tsx` | Not implemented |

### 🟢 Low - Edge Cases

#### 7. Email Digest Test
**File**: `src/components/profile/EmailDigestSettings.tsx` (lines 87-94)
```typescript
// TODO: Implement test digest when backend supports it
console.log('Test digest not yet implemented:', digestType);
```

#### 8. Sitemap Generation Gaps
**File**: `supabase/functions/generate-sitemap/index.ts`
- Line 172: Seller profiles sitemap placeholder
- Line 238: Blog posts sitemap placeholder

---

## Missing Database Tables

These tables are referenced in code but may not exist:

| Table Name | Used In | Purpose |
|------------|---------|---------|
| `support_tickets` | Support Hub | Customer support tickets |
| `support_messages` | Ticket Detail | Support conversation messages |
| `support_canned_responses` | Canned Responses | Pre-written support replies |
| `shop_follows` | Follow Shop Button | Shop subscription tracking |
| `collection_follows` | Collection Card | Collection subscription tracking |
| `shared_wishlists` | Share Wishlist | Wishlist sharing feature |
| `product_bundles` | Bundle Builder | Product bundle configurations |
| `cart_bundles` | Bundle Builder | Bundle cart items |
| `personalization_options` | Product Info | Product customization options |
| `email_digest_preferences` | Email Digest | User digest settings |
| `platform_fee_config` | Validate Payment | Dynamic fee configuration |
| `seller_profiles` | Generate Sitemap | Seller public profiles |
| `blog_posts` | Generate Sitemap | Blog content |

---

## Remediation Checklist

### Phase 1: Critical Security Fixes (Do First) ✅ COMPLETED

- [x] **1.1** Add `supabase/.temp/` to `.gitignore`
- [x] **1.2** Remove `supabase/.temp/project-ref` from git tracking
- [x] **1.3** Remove hardcoded JWT fallback from `src/integrations/supabase/client.ts`
- [ ] **1.4** Move JWT token from `wrangler.toml` to Cloudflare dashboard secrets *(requires manual action)*
- [x] **1.5** Fix admin email check in `DisputeDetail.tsx`

### Phase 2: Database Schema Updates ✅ COMPLETED

- [x] **2.1** Create `support_tickets` table with RLS
- [x] **2.2** Create `support_messages` table with RLS
- [x] **2.3** Create `support_canned_responses` table
- [x] **2.4** Create `shop_follows` table with RLS *(already exists in migration 20251113)*
- [x] **2.5** Create `collection_follows` table with RLS *(already exists in migration 20251113)*
- [x] **2.6** Create `shared_wishlists` table with RLS *(already exists in migration 20250929)*
- [x] **2.7** Create `product_bundles` table with RLS *(already exists in migration 20251113)*
- [x] **2.8** Create `personalization_options` table with RLS *(already exists in migration 20251113)*
- [x] **2.9** Create `email_digest_preferences` table with RLS *(already exists in migration 20251113)*
- [x] **2.10** Create `platform_fee_config` table *(already exists in migration 20251030)*

### Phase 3: Implement Stubbed Features ✅ COMPLETED

- [x] **3.1** Implement profile update in `ProfileForm.tsx`
- [x] **3.2** Implement seller settings update in `SellerSettings.tsx`
- [x] **3.3** Uncomment and enable Support Hub queries
- [x] **3.4** Implement shop following functionality in `FollowShopButton.tsx`
- [x] **3.5** Implement collection following in `CollectionCard.tsx`
- [x] **3.6** Implement wishlist sharing in `ShareWishlistDialog.tsx`
- [x] **3.7** Implement bundle discounts in `BundleBuilder.tsx` (seller + product)
- [x] **3.8** Implement product personalization in `ProductInfo.tsx`

### Phase 4: Replace Mock Data ✅ MOSTLY COMPLETED

- [x] **4.1** Make Chicago city ID dynamic in `useChicagoCraftIndexData.ts`
- [x] **4.2** Remove fallback neighborhood data (use real queries)
- [x] **4.3** Replace mock A/B test data with real experiments in `ABTestSlots.tsx`
- [x] **4.4** Connect platform analytics to real data *(SupportAnalytics now uses real data)*
- [x] **4.5** Remove mock course/mentor/challenge data from education components
- [ ] **4.6** Replace placeholder images with real product images *(needs content)*

### Phase 5: Documentation Updates ✅ PARTIALLY COMPLETED

- [x] **5.4** Update `PAYMENT_SYSTEM_IMPLEMENTATION_GUIDE.md` - Updated all project URLs to use `functions.craftlocal.net`
- [ ] **5.1-5.3, 5.5** Other documentation files contain references to Supabase's external documentation (supabase.com/docs) which are intentional external links, not project-specific URLs

**Note:** References to `supabase.com/docs` are links to Supabase's official documentation and should not be changed. Only project-specific URLs (like edge function endpoints) need to point to `api.craftlocal.net` or `functions.craftlocal.net`.

### Phase 6: Mobile & ChatGPT Integration ✅ VERIFIED

- [x] **6.1** Verify mobile app connects to `api.craftlocal.net` - Confirmed in `mobile/src/config/supabase.js`
- [ ] **6.2** Update certificate pinning in mobile app *(optional for self-hosted)*
- [x] **6.3** ChatGPT integration uses environment variables - Configured in `chatgpt-integration/mcp-server/src/config/environment.ts`
- [x] **6.4** Seller dashboard API implemented in `chatgpt-integration/mcp-server/src/tools/seller-dashboard.ts`

### Phase 7: User Favorites Migration ✅ COMPLETED

- [x] **7.1** Updated `useFavorites.ts` hook to use `user_favorites` database table
- [x] **7.2** Added automatic migration from localStorage to database on login
- [x] **7.3** Added optimistic updates with rollback on error
- [x] **7.4** Maintained localStorage fallback for offline access

### Phase 8: Remove Mock Data from Components ✅ COMPLETED

- [x] **8.1** MakerLivestreams: Replaced `generateMockStreams` and `generateMockChatMessages` with real database queries
- [x] **8.2** LocalPickupMeetups: Removed unused `generateMockMeetups` function (already using real queries)
- [x] **8.3** OneClickReorder: Replaced `generateMockOrders` with real order database queries
- [x] **8.4** All components now gracefully handle missing tables with empty states

**Note:** ProactiveOperationsDashboard uses mock platform health metrics. This is intentional as real-time platform monitoring would require dedicated observability infrastructure (e.g., Prometheus, Grafana) which is outside the scope of this migration.

---

## Verification Steps

After completing remediations:

1. **Search for old references**:
   ```bash
   grep -r "supabase.co" --include="*.ts" --include="*.tsx" --include="*.js"
   grep -r "slamtlgebisrimijeoid" .
   ```

2. **Test connections**:
   ```bash
   curl https://api.craftlocal.net/rest/v1/ -H "apikey: YOUR_ANON_KEY"
   ```

3. **Verify environment**:
   - Check Cloudflare Pages environment variables
   - Confirm `VITE_SUPABASE_URL` points to `api.craftlocal.net`
   - Confirm anon key matches Kong gateway configuration

4. **Run full build**:
   ```bash
   npm run build
   npm run lint
   ```

---

## Notes

- All main application routes are correctly pointing to `api.craftlocal.net`
- CORS is configured for `craftlocal.net` domains
- CSP headers are updated in both `public/_headers` and `vite.config.ts`
- Service worker correctly routes API calls to the self-hosted Supabase
- Mobile app configuration points to correct URL (needs env var at runtime)

**Last Updated**: December 20, 2025
