/**
 * CORS Headers Configuration
 * Secure CORS handling with origin whitelist
 */

const ALLOWED_ORIGINS = [
  'https://craftlocal.net',  // Production domain
  'https://www.craftlocal.net',  // www production domain
  'https://craft-chicago-finds.pages.dev',
  'https://www.craftlocalfinds.com',
  'http://localhost:5173',  // Vite dev server
  'http://localhost:8080',  // Alt dev server
  'http://localhost:3000',  // Preview server
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:3000',
];

/**
 * Get CORS headers for a request based on origin whitelist
 */
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin || '')
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin || ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Legacy export for backwards compatibility
 * DEPRECATED: Use getCorsHeaders() instead
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreFlight(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export const handleCorsOptions = (request: Request) => {
  return new Response('ok', { headers: getCorsHeaders(request) });
};

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(request: Request, response: Response): Response {
  const headers = getCorsHeaders(request);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
