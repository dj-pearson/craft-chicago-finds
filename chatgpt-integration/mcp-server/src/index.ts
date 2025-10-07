/**
 * CraftLocal MCP Server
 * Entry point for the Model Context Protocol server
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config/environment.js";
import { logger } from "./utils/logger.js";
import { mcpRouter } from "./routes/mcp.js";
import { oauthRouter } from "./routes/oauth.js";
import { healthRouter } from "./routes/health.js";
import { errorHandler } from "./middleware/error-handler.js";
import { requestLogger } from "./middleware/request-logger.js";

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Configured separately for widgets
  })
);

// CORS configuration
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use(requestLogger);

// Routes
app.use("/health", healthRouter);
app.use("/.well-known", oauthRouter); // OAuth discovery endpoints
app.use("/mcp", mcpRouter); // MCP protocol endpoints

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "CraftLocal MCP Server",
    version: "1.0.0",
    status: "operational",
    documentation: "https://docs.craftlocal.net/mcp",
    endpoints: {
      health: "/health",
      mcp: "/mcp",
      oauth_discovery: "/.well-known/oauth-protected-resource",
    },
  });
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = config.server.port;
const HOST = config.server.host;

app.listen(PORT, HOST, () => {
  logger.info(`🚀 CraftLocal MCP Server started`, {
    port: PORT,
    host: HOST,
    env: config.server.env,
    nodeVersion: process.version,
  });

  logger.info("📡 Server endpoints:", {
    health: `http://${HOST}:${PORT}/health`,
    mcp: `http://${HOST}:${PORT}/mcp`,
    oauth: `http://${HOST}:${PORT}/.well-known/oauth-protected-resource`,
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully...");
  process.exit(0);
});

// Unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", { promise, reason });
});

export default app;
