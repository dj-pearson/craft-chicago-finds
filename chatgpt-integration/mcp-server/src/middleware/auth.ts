/**
 * Authentication middleware for OAuth token verification
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { config } from "../config/environment.js";
import { createError } from "./error-handler.js";
import { logger } from "../utils/logger.js";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        scopes: string[];
        [key: string]: any;
      };
    }
  }
}

// JWKS client for token verification
const jwksClientInstance = jwksClient({
  jwksUri: config.oauth.useSupabaseAuth
    ? `${config.supabase.url}/auth/v1/.well-known/jwks.json`
    : `https://${config.oauth.auth0.domain}/.well-known/jwks.json`,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
});

function getKey(header: any, callback: jwt.SigningKeyCallback) {
  jwksClientInstance.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

/**
 * Verify JWT token
 */
async function verifyToken(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        audience: config.oauth.jwt.audience,
        issuer: config.oauth.jwt.issuer,
        algorithms: ["RS256"],
      },
      (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      }
    );
  });
}

/**
 * Optional authentication middleware
 * Validates token if present, but allows request to proceed if not
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided, continue without user
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);

    // Attach user to request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      scopes: decoded.scope?.split(" ") || [],
      ...decoded,
    };

    logger.debug("User authenticated (optional)", {
      userId: req.user.id,
      scopes: req.user.scopes,
    });

    next();
  } catch (error) {
    // Token verification failed, but since it's optional, continue without user
    logger.warn("Optional auth token verification failed", { error });
    next();
  }
}

/**
 * Required authentication middleware
 * Requires valid OAuth token
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw createError("Authentication required", 401, "UNAUTHORIZED");
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);

    // Attach user to request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      scopes: decoded.scope?.split(" ") || [],
      ...decoded,
    };

    logger.debug("User authenticated", {
      userId: req.user.id,
      scopes: req.user.scopes,
    });

    next();
  } catch (error: any) {
    if (error.statusCode) {
      next(error);
    } else {
      next(createError("Invalid or expired token", 401, "UNAUTHORIZED"));
    }
  }
}

/**
 * Require specific scope(s)
 */
export function requireScope(...requiredScopes: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError("Authentication required", 401, "UNAUTHORIZED"));
    }

    const userScopes = req.user.scopes || [];
    const hasRequiredScope = requiredScopes.some((scope) =>
      userScopes.includes(scope)
    );

    if (!hasRequiredScope) {
      return next(
        createError(
          `Insufficient permissions. Required scope: ${requiredScopes.join(
            " or "
          )}`,
          403,
          "FORBIDDEN",
          { requiredScopes, userScopes }
        )
      );
    }

    logger.debug("Scope check passed", {
      userId: req.user.id,
      requiredScopes,
      userScopes,
    });

    next();
  };
}
