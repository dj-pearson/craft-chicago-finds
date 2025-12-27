#!/bin/bash

# CraftLocal Stripe Products Setup Script
# This script creates the required Stripe products and prices for CraftLocal subscription plans
#
# Prerequisites:
# 1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
# 2. Login to Stripe: stripe login
#
# Usage:
# ./scripts/setup-stripe-products.sh [--live]
#
# By default, this creates products in TEST mode.
# Use --live flag to create in production (be careful!)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if using live mode
LIVE_MODE=false
if [[ "$1" == "--live" ]]; then
    LIVE_MODE=true
    echo -e "${RED}⚠️  WARNING: Running in LIVE mode!${NC}"
    echo "This will create products in your production Stripe account."
    read -p "Are you sure you want to continue? (y/N): " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        echo "Aborted."
        exit 1
    fi
fi

echo -e "${BLUE}🚀 CraftLocal Stripe Products Setup${NC}"
echo "========================================"
echo ""

# Verify Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo -e "${RED}Error: Stripe CLI is not installed.${NC}"
    echo "Install it from: https://stripe.com/docs/stripe-cli"
    exit 1
fi

# Check if logged in
if ! stripe config --list &> /dev/null; then
    echo -e "${YELLOW}You need to login to Stripe CLI first.${NC}"
    echo "Run: stripe login"
    exit 1
fi

echo -e "${GREEN}✓ Stripe CLI is installed and configured${NC}"
echo ""

# Build Stripe CLI arguments
STRIPE_ARGS=""
if [[ "$LIVE_MODE" == true ]]; then
    STRIPE_ARGS="--live"
fi

# Store created IDs
declare -A PRODUCT_IDS
declare -A PRICE_IDS

# Function to create a product
create_product() {
    local name="$1"
    local description="$2"
    local key="$3"

    echo -e "${BLUE}Creating product: $name${NC}"

    # Create the product
    local result=$(stripe products create $STRIPE_ARGS \
        --name="$name" \
        --description="$description" \
        --metadata[platform]=craftlocal \
        --metadata[key]="$key" \
        2>&1)

    # Extract product ID
    local product_id=$(echo "$result" | grep -o '"id": "prod_[^"]*"' | head -1 | cut -d'"' -f4)

    if [[ -z "$product_id" ]]; then
        echo -e "${RED}Failed to create product: $name${NC}"
        echo "$result"
        exit 1
    fi

    PRODUCT_IDS[$key]=$product_id
    echo -e "${GREEN}✓ Created product: $product_id${NC}"
}

# Function to create a price
create_price() {
    local product_id="$1"
    local amount="$2"  # in cents
    local interval="$3"
    local key="$4"
    local nickname="$5"

    echo -e "${BLUE}Creating price: $nickname ($amount cents / $interval)${NC}"

    local result
    if [[ "$interval" == "one_time" ]]; then
        # For one-time prices (like the Free plan, though it's $0)
        result=$(stripe prices create $STRIPE_ARGS \
            --product="$product_id" \
            --currency=usd \
            --unit-amount="$amount" \
            --nickname="$nickname" \
            --metadata[key]="$key" \
            2>&1)
    else
        # For recurring prices
        result=$(stripe prices create $STRIPE_ARGS \
            --product="$product_id" \
            --currency=usd \
            --unit-amount="$amount" \
            --recurring[interval]="$interval" \
            --nickname="$nickname" \
            --metadata[key]="$key" \
            2>&1)
    fi

    # Extract price ID
    local price_id=$(echo "$result" | grep -o '"id": "price_[^"]*"' | head -1 | cut -d'"' -f4)

    if [[ -z "$price_id" ]]; then
        echo -e "${RED}Failed to create price: $nickname${NC}"
        echo "$result"
        exit 1
    fi

    PRICE_IDS[$key]=$price_id
    echo -e "${GREEN}✓ Created price: $price_id${NC}"
}

echo "Step 1: Creating Products"
echo "-------------------------"

# Create CraftLocal Free product (for reference, even though $0)
create_product \
    "CraftLocal Free" \
    "Free tier for CraftLocal marketplace - 5 listings, basic analytics" \
    "free"

# Create CraftLocal Pro product
create_product \
    "CraftLocal Pro" \
    "Professional seller plan - Unlimited listings, 3 featured slots, advanced analytics, priority support, custom branding" \
    "pro"

# Create CraftLocal Premium product
create_product \
    "CraftLocal Premium" \
    "Premium seller plan - Unlimited listings, 10 featured slots, advanced analytics, priority support, custom branding, API access" \
    "premium"

echo ""
echo "Step 2: Creating Prices"
echo "-----------------------"

# Free plan price ($0/month - mostly symbolic, for tracking)
create_price \
    "${PRODUCT_IDS[free]}" \
    "0" \
    "month" \
    "price_free" \
    "CraftLocal Free Monthly"

# Pro monthly ($19.99/month = 1999 cents)
create_price \
    "${PRODUCT_IDS[pro]}" \
    "1999" \
    "month" \
    "price_pro_monthly" \
    "CraftLocal Pro Monthly"

# Pro yearly ($199.99/year = 19999 cents)
create_price \
    "${PRODUCT_IDS[pro]}" \
    "19999" \
    "year" \
    "price_pro_yearly" \
    "CraftLocal Pro Yearly (Save 20%)"

# Premium monthly ($49.99/month = 4999 cents)
create_price \
    "${PRODUCT_IDS[premium]}" \
    "4999" \
    "month" \
    "price_premium_monthly" \
    "CraftLocal Premium Monthly"

# Premium yearly ($499.99/year = 49999 cents)
create_price \
    "${PRODUCT_IDS[premium]}" \
    "49999" \
    "year" \
    "price_premium_yearly" \
    "CraftLocal Premium Yearly (Save 20%)"

echo ""
echo "========================================"
echo -e "${GREEN}✅ Stripe products and prices created successfully!${NC}"
echo "========================================"
echo ""
echo "Product IDs:"
echo "------------"
for key in "${!PRODUCT_IDS[@]}"; do
    echo "  $key: ${PRODUCT_IDS[$key]}"
done
echo ""
echo "Price IDs (use these in your database):"
echo "----------------------------------------"
for key in "${!PRICE_IDS[@]}"; do
    echo "  $key: ${PRICE_IDS[$key]}"
done
echo ""

# Generate SQL update statement
echo "SQL to update your database:"
echo "----------------------------"
cat << EOF
UPDATE public.plans SET stripe_price_id = '${PRICE_IDS[price_free]}' WHERE stripe_price_id = 'price_free';
UPDATE public.plans SET stripe_price_id = '${PRICE_IDS[price_pro_monthly]}' WHERE stripe_price_id = 'price_pro_monthly';
UPDATE public.plans SET stripe_price_id = '${PRICE_IDS[price_pro_yearly]}' WHERE stripe_price_id = 'price_pro_yearly';
UPDATE public.plans SET stripe_price_id = '${PRICE_IDS[price_premium_monthly]}' WHERE stripe_price_id = 'price_premium_monthly';
UPDATE public.plans SET stripe_price_id = '${PRICE_IDS[price_premium_yearly]}' WHERE stripe_price_id = 'price_premium_yearly';
EOF

echo ""
echo "Environment Variables to set:"
echo "-----------------------------"
echo "Add these to your Supabase Edge Functions secrets:"
echo ""
echo "STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)"
echo "STRIPE_WEBHOOK_SECRET=whsec_..."
echo ""
echo "Add this to Cloudflare Pages environment:"
echo ""
echo "VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_... for production)"
echo ""

# Save to file for reference
OUTPUT_FILE="stripe-setup-output-$(date +%Y%m%d-%H%M%S).txt"
{
    echo "CraftLocal Stripe Setup - $(date)"
    echo "Mode: $(if $LIVE_MODE; then echo 'LIVE'; else echo 'TEST'; fi)"
    echo ""
    echo "Product IDs:"
    for key in "${!PRODUCT_IDS[@]}"; do
        echo "  $key: ${PRODUCT_IDS[$key]}"
    done
    echo ""
    echo "Price IDs:"
    for key in "${!PRICE_IDS[@]}"; do
        echo "  $key: ${PRICE_IDS[$key]}"
    done
} > "$OUTPUT_FILE"

echo -e "${GREEN}Output saved to: $OUTPUT_FILE${NC}"
echo ""
echo "Next steps:"
echo "1. Run the SQL statements above in your Supabase SQL editor"
echo "2. Or create a migration file with the SQL"
echo "3. Configure Stripe webhook in Stripe Dashboard pointing to your Supabase edge function"
echo ""
