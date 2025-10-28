/**
 * CORS Headers Configuration
 * Centralized CORS handling for all edge functions
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreFlight(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export const handleCorsOptions = () => {
  return new Response('ok', { headers: corsHeaders });
};

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(response: Response): Response {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
