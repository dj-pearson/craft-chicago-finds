/**
 * OAuth discovery endpoints
 * Implements OAuth 2.1 and OpenID Connect discovery
 */

import { Router } from "express";
import { config } from "../config/environment.js";

const router = Router();

/**
 * OAuth Protected Resource metadata
 * Required for ChatGPT to discover OAuth configuration
 */
router.get("/oauth-protected-resource", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const oauthBaseUrl = config.oauth.useSupabaseAuth
    ? `${config.supabase.url}/auth/v1`
    : `https://${config.oauth.auth0.domain}`;

  res.json({
    resource: baseUrl,
    authorization_endpoint: `${oauthBaseUrl}/authorize`,
    token_endpoint: `${oauthBaseUrl}/token`,
    revocation_endpoint: `${oauthBaseUrl}/revoke`,
    introspection_endpoint: `${oauthBaseUrl}/introspect`,
    scopes_supported: [
      "listings.read",
      "listings.write",
      "orders.read",
      "orders.write",
      "seller.manage",
    ],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: [
      "client_secret_basic",
      "client_secret_post",
    ],
    code_challenge_methods_supported: ["S256"],
  });
});

/**
 * OpenID Connect Configuration
 */
router.get("/openid-configuration", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const oauthBaseUrl = config.oauth.useSupabaseAuth
    ? `${config.supabase.url}/auth/v1`
    : `https://${config.oauth.auth0.domain}`;

  res.json({
    issuer: config.oauth.jwt.issuer,
    authorization_endpoint: `${oauthBaseUrl}/authorize`,
    token_endpoint: `${oauthBaseUrl}/token`,
    userinfo_endpoint: `${oauthBaseUrl}/userinfo`,
    jwks_uri: `${oauthBaseUrl}/.well-known/jwks.json`,
    registration_endpoint: `${oauthBaseUrl}/register`,
    scopes_supported: [
      "openid",
      "profile",
      "email",
      "listings.read",
      "listings.write",
      "orders.read",
      "orders.write",
      "seller.manage",
    ],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    token_endpoint_auth_methods_supported: [
      "client_secret_basic",
      "client_secret_post",
    ],
    claims_supported: [
      "sub",
      "iss",
      "aud",
      "exp",
      "iat",
      "email",
      "email_verified",
      "name",
    ],
    code_challenge_methods_supported: ["S256"],
  });
});

/**
 * JWKS endpoint (if using custom OAuth)
 * If using Supabase or Auth0, this will proxy to their JWKS endpoint
 */
router.get("/jwks.json", async (req, res) => {
  const jwksUrl = config.oauth.useSupabaseAuth
    ? `${config.supabase.url}/auth/v1/.well-known/jwks.json`
    : `https://${config.oauth.auth0.domain}/.well-known/jwks.json`;

  try {
    // Proxy request to actual JWKS endpoint
    const response = await fetch(jwksUrl);
    const jwks = await response.json();
    res.json(jwks);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch JWKS",
    });
  }
});

export const oauthRouter = router;
