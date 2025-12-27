#!/usr/bin/env node

/**
 * CraftLocal Stripe Products Setup Script
 *
 * This script creates the required Stripe products and prices for CraftLocal subscription plans.
 *
 * Prerequisites:
 * 1. Set STRIPE_SECRET_KEY environment variable
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_xxx node scripts/setup-stripe-products.js
 *
 * Or create a .env.local file with:
 *   STRIPE_SECRET_KEY=sk_test_xxx
 *
 * Then run:
 *   node scripts/setup-stripe-products.js
 */

const fs = require("fs");
const path = require("path");

// Load environment variables from .env.local if it exists
const envLocalPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join("=").trim();
    }
  });
}

// Check for Stripe secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error("Error: STRIPE_SECRET_KEY environment variable is not set.");
  console.error("");
  console.error("Usage:");
  console.error(
    "  STRIPE_SECRET_KEY=sk_test_xxx node scripts/setup-stripe-products.js"
  );
  console.error("");
  console.error("Or create a .env.local file with:");
  console.error("  STRIPE_SECRET_KEY=sk_test_xxx");
  process.exit(1);
}

// Warn if using live mode
const isLiveMode = stripeSecretKey.startsWith("sk_live_");
if (isLiveMode) {
  console.log("\x1b[31m⚠️  WARNING: Running in LIVE mode!\x1b[0m");
  console.log("This will create products in your production Stripe account.");
  console.log("Press Ctrl+C to cancel or wait 5 seconds to continue...");

  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Give user 5 seconds to cancel
  setTimeout(() => {
    rl.close();
    runSetup();
  }, 5000);
} else {
  runSetup();
}

async function runSetup() {
  // Dynamic import for ESM compatibility
  const Stripe = require("stripe").default || require("stripe");
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16",
  });

  console.log("\x1b[34m🚀 CraftLocal Stripe Products Setup\x1b[0m");
  console.log("========================================");
  console.log("");
  console.log(
    `Mode: ${isLiveMode ? "\x1b[31mLIVE\x1b[0m" : "\x1b[32mTEST\x1b[0m"}`
  );
  console.log("");

  const productIds = {};
  const priceIds = {};

  // Define products
  const products = [
    {
      key: "free",
      name: "CraftLocal Free",
      description:
        "Free tier for CraftLocal marketplace - 5 listings, basic analytics",
    },
    {
      key: "pro",
      name: "CraftLocal Pro",
      description:
        "Professional seller plan - Unlimited listings, 3 featured slots, advanced analytics, priority support, custom branding",
    },
    {
      key: "premium",
      name: "CraftLocal Premium",
      description:
        "Premium seller plan - Unlimited listings, 10 featured slots, advanced analytics, priority support, custom branding, API access",
    },
  ];

  // Define prices
  const prices = [
    {
      productKey: "free",
      key: "price_free",
      amount: 0,
      interval: "month",
      nickname: "CraftLocal Free Monthly",
    },
    {
      productKey: "pro",
      key: "price_pro_monthly",
      amount: 1999, // $19.99
      interval: "month",
      nickname: "CraftLocal Pro Monthly",
    },
    {
      productKey: "pro",
      key: "price_pro_yearly",
      amount: 19999, // $199.99
      interval: "year",
      nickname: "CraftLocal Pro Yearly (Save 20%)",
    },
    {
      productKey: "premium",
      key: "price_premium_monthly",
      amount: 4999, // $49.99
      interval: "month",
      nickname: "CraftLocal Premium Monthly",
    },
    {
      productKey: "premium",
      key: "price_premium_yearly",
      amount: 49999, // $499.99
      interval: "year",
      nickname: "CraftLocal Premium Yearly (Save 20%)",
    },
  ];

  try {
    // Step 1: Create Products
    console.log("Step 1: Creating Products");
    console.log("-------------------------");

    for (const product of products) {
      console.log(`\x1b[34mCreating product: ${product.name}\x1b[0m`);

      const createdProduct = await stripe.products.create({
        name: product.name,
        description: product.description,
        metadata: {
          platform: "craftlocal",
          key: product.key,
        },
      });

      productIds[product.key] = createdProduct.id;
      console.log(`\x1b[32m✓ Created product: ${createdProduct.id}\x1b[0m`);
    }

    console.log("");

    // Step 2: Create Prices
    console.log("Step 2: Creating Prices");
    console.log("-----------------------");

    for (const price of prices) {
      console.log(
        `\x1b[34mCreating price: ${price.nickname} (${price.amount} cents / ${price.interval})\x1b[0m`
      );

      const priceData = {
        product: productIds[price.productKey],
        currency: "usd",
        unit_amount: price.amount,
        nickname: price.nickname,
        metadata: {
          key: price.key,
        },
      };

      // Add recurring interval for subscription prices
      if (price.amount > 0) {
        priceData.recurring = {
          interval: price.interval,
        };
      }

      const createdPrice = await stripe.prices.create(priceData);

      priceIds[price.key] = createdPrice.id;
      console.log(`\x1b[32m✓ Created price: ${createdPrice.id}\x1b[0m`);
    }

    console.log("");
    console.log("========================================");
    console.log(
      "\x1b[32m✅ Stripe products and prices created successfully!\x1b[0m"
    );
    console.log("========================================");
    console.log("");

    // Display results
    console.log("Product IDs:");
    console.log("------------");
    for (const [key, id] of Object.entries(productIds)) {
      console.log(`  ${key}: ${id}`);
    }
    console.log("");

    console.log("Price IDs (use these in your database):");
    console.log("----------------------------------------");
    for (const [key, id] of Object.entries(priceIds)) {
      console.log(`  ${key}: ${id}`);
    }
    console.log("");

    // Generate SQL
    console.log("SQL to update your database:");
    console.log("----------------------------");
    console.log(
      `UPDATE public.plans SET stripe_price_id = '${priceIds["price_free"]}' WHERE stripe_price_id = 'price_free';`
    );
    console.log(
      `UPDATE public.plans SET stripe_price_id = '${priceIds["price_pro_monthly"]}' WHERE stripe_price_id = 'price_pro_monthly';`
    );
    console.log(
      `UPDATE public.plans SET stripe_price_id = '${priceIds["price_pro_yearly"]}' WHERE stripe_price_id = 'price_pro_yearly';`
    );
    console.log(
      `UPDATE public.plans SET stripe_price_id = '${priceIds["price_premium_monthly"]}' WHERE stripe_price_id = 'price_premium_monthly';`
    );
    console.log(
      `UPDATE public.plans SET stripe_price_id = '${priceIds["price_premium_yearly"]}' WHERE stripe_price_id = 'price_premium_yearly';`
    );
    console.log("");

    // Generate migration file
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T]/g, "")
      .slice(0, 14);
    const migrationContent = `-- Update Stripe price IDs with real values
-- Generated by setup-stripe-products.js on ${new Date().toISOString()}
-- Mode: ${isLiveMode ? "LIVE" : "TEST"}

UPDATE public.plans SET stripe_price_id = '${priceIds["price_free"]}' WHERE stripe_price_id = 'price_free';
UPDATE public.plans SET stripe_price_id = '${priceIds["price_pro_monthly"]}' WHERE stripe_price_id = 'price_pro_monthly';
UPDATE public.plans SET stripe_price_id = '${priceIds["price_pro_yearly"]}' WHERE stripe_price_id = 'price_pro_yearly';
UPDATE public.plans SET stripe_price_id = '${priceIds["price_premium_monthly"]}' WHERE stripe_price_id = 'price_premium_monthly';
UPDATE public.plans SET stripe_price_id = '${priceIds["price_premium_yearly"]}' WHERE stripe_price_id = 'price_premium_yearly';
`;

    const migrationDir = path.join(__dirname, "..", "supabase", "migrations");
    const migrationFilename = `${timestamp}_update_stripe_price_ids.sql`;
    const migrationPath = path.join(migrationDir, migrationFilename);

    fs.writeFileSync(migrationPath, migrationContent);
    console.log(`\x1b[32mMigration file created: ${migrationFilename}\x1b[0m`);
    console.log("");

    // Save output to file
    const outputFile = `stripe-setup-output-${Date.now()}.json`;
    const outputPath = path.join(__dirname, outputFile);
    const output = {
      createdAt: new Date().toISOString(),
      mode: isLiveMode ? "live" : "test",
      products: productIds,
      prices: priceIds,
    };
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`\x1b[32mOutput saved to: scripts/${outputFile}\x1b[0m`);
    console.log("");

    console.log("Next steps:");
    console.log(
      "1. Apply the migration: npx supabase db push (or run SQL in Supabase dashboard)"
    );
    console.log(
      "2. Configure Stripe webhook in Stripe Dashboard → Developers → Webhooks"
    );
    console.log(
      "3. Set STRIPE_WEBHOOK_SECRET in Supabase Edge Functions secrets"
    );
    console.log("");
  } catch (error) {
    console.error("\x1b[31mError:\x1b[0m", error.message);
    if (error.raw) {
      console.error("Details:", error.raw.message);
    }
    process.exit(1);
  }
}
