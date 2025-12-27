# CraftLocal Scripts

This directory contains utility scripts for setting up and managing the CraftLocal marketplace.

## Stripe Products Setup

### `setup-stripe-products.js` (Recommended)

Node.js script to create the required Stripe products and prices for CraftLocal subscription plans.

**Prerequisites:**

1. Have Stripe secret key (from [Stripe Dashboard](https://dashboard.stripe.com/apikeys))
2. Node.js 20+ installed

**Usage:**

```bash
# Set the Stripe secret key and run
STRIPE_SECRET_KEY=sk_test_xxx npm run stripe:setup

# Or create .env.local with STRIPE_SECRET_KEY and run
npm run stripe:setup
```

**What it creates:**

| Product              | Price ID Key             | Amount      | Interval |
| -------------------- | ------------------------ | ----------- | -------- |
| CraftLocal Free      | `price_free`             | $0/month    | Monthly  |
| CraftLocal Pro       | `price_pro_monthly`      | $19.99/mo   | Monthly  |
| CraftLocal Pro       | `price_pro_yearly`       | $199.99/yr  | Yearly   |
| CraftLocal Premium   | `price_premium_monthly`  | $49.99/mo   | Monthly  |
| CraftLocal Premium   | `price_premium_yearly`   | $499.99/yr  | Yearly   |

The script will:

1. Create 3 products in Stripe (Free, Pro, Premium)
2. Create 5 prices linked to those products
3. Output the SQL to update your database
4. Create a migration file automatically in `supabase/migrations/`

### `setup-stripe-products.sh` (Alternative - Bash/CLI)

Alternative bash script using Stripe CLI.

**Prerequisites:**

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Login with `stripe login`

**Usage:**

```bash
# Test mode (default)
./scripts/setup-stripe-products.sh

# Live mode (production)
./scripts/setup-stripe-products.sh --live
```

## Image Optimization

### `optimize-images.mjs`

Optimizes images for the web using Sharp.

```bash
node scripts/optimize-images.mjs
```

### `optimize-existing.mjs`

Optimizes existing images in the project.

```bash
node scripts/optimize-existing.mjs
```
