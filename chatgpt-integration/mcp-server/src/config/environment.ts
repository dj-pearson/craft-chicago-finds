/**
 * Environment configuration
 */

import dotenv from "dotenv";

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || "3001", 10),
    host: process.env.HOST || "0.0.0.0",
    env: process.env.NODE_ENV || "development",
  },

  supabase: {
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },

  oauth: {
    useSupabaseAuth: process.env.USE_SUPABASE_AUTH === "true",
    auth0: {
      domain: process.env.AUTH0_DOMAIN || "",
      clientId: process.env.AUTH0_CLIENT_ID || "",
      clientSecret: process.env.AUTH0_CLIENT_SECRET || "",
      audience: process.env.AUTH0_AUDIENCE || "",
    },
    jwt: {
      issuer: process.env.JWT_ISSUER || "https://oauth.craftlocal.net",
      audience: process.env.JWT_AUDIENCE || "https://mcp.craftlocal.net",
    },
  },

  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
    password: process.env.REDIS_PASSWORD || undefined,
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  },

  widgets: {
    cdnUrl: process.env.WIDGET_CDN_URL || "http://localhost:3002/widgets",
    version: process.env.WIDGET_VERSION || "1.0.0",
  },

  logging: {
    level: process.env.LOG_LEVEL || "info",
    format: process.env.LOG_FORMAT || "json",
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  },

  cors: {
    origins: (
      process.env.CORS_ORIGIN || "https://chatgpt.com,https://chat.openai.com"
    )
      .split(",")
      .map((origin) => origin.trim()),
  },
};

// Validation
const requiredEnvVars = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "STRIPE_SECRET_KEY",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export default config;
