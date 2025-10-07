/**
 * Health check endpoints
 */

import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config/environment.js";

const router = Router();

router.get("/", async (req, res) => {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.env,
    version: "1.0.0",
  };

  res.json(health);
});

router.get("/detailed", async (req, res) => {
  const checks: any = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: {
      server: "ok",
      supabase: "checking",
      redis: "checking",
    },
  };

  // Check Supabase connection
  try {
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    const { error } = await supabase.from("profiles").select("count").limit(1);
    checks.checks.supabase = error ? "error" : "ok";
  } catch (error) {
    checks.checks.supabase = "error";
    checks.status = "degraded";
  }

  // TODO: Add Redis health check when implemented

  res.json(checks);
});

export const healthRouter = router;
