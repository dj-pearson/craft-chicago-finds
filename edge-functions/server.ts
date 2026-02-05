/**
 * Self-Hosted Supabase Edge Functions Server
 * Craft Local - Chicago Finds Marketplace
 *
 * A custom Deno HTTP server that dynamically loads and serves
 * Supabase Edge Functions from the /functions directory.
 *
 * Features:
 * - Dynamic function discovery and loading
 * - Health check endpoint
 * - CORS support
 * - Environment variable management
 * - Error handling and logging
 *
 * Deployment:
 * Configure SUPABASE_URL and FUNCTIONS_URL environment variables
 * for your self-hosted instance.
 */

const PORT = parseInt(Deno.env.get('PORT') || '8000');
const FUNCTIONS_DIR = '/app/functions';

// Self-hosted URLs from environment variables
const SUPABASE_API_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
const FUNCTIONS_URL = Deno.env.get('FUNCTIONS_URL') || `http://localhost:${PORT}`;

// Allowed origins for CORS (production domains + localhost for development)
const ALLOWED_ORIGINS = [
  'https://craftlocal.net',
  'https://www.craftlocal.net',
  'https://craft-chicago-finds.pages.dev',
  'http://localhost:8080',
  'http://localhost:3000',
];

/**
 * Get CORS origin based on request origin
 * Returns the request origin if it's in the allowed list, otherwise returns the first allowed origin
 */
function getCorsOrigin(request: Request): string {
  const origin = request.headers.get('Origin');
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  // Default to first production origin
  return ALLOWED_ORIGINS[0];
}

// CORS headers function - returns headers with dynamic origin
function getCorsHeaders(request: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(request),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Get list of available functions by scanning the functions directory
 */
async function getAvailableFunctions(): Promise<string[]> {
  const functions: string[] = [];
  
  try {
    for await (const entry of Deno.readDir(FUNCTIONS_DIR)) {
      if (entry.isDirectory && !entry.name.startsWith('_')) {
        // Check if index.ts exists in the function directory
        try {
          const indexPath = `${FUNCTIONS_DIR}/${entry.name}/index.ts`;
          await Deno.stat(indexPath);
          functions.push(entry.name);
        } catch {
          // index.ts doesn't exist, skip this directory
        }
      }
    }
  } catch (error) {
    console.error('Error reading functions directory:', error);
  }
  
  return functions.sort();
}

/**
 * Health check endpoint handler
 */
async function handleHealthCheck(req: Request): Promise<Response> {
  const functions = await getAvailableFunctions();

  const healthData = {
    status: 'healthy',
    service: 'craft-local-edge-functions',
    timestamp: new Date().toISOString(),
    runtime: 'deno',
    version: Deno.version.deno,
    environment: {
      supabaseUrlConfigured: !!Deno.env.get('SUPABASE_URL'),
      anonKeyConfigured: !!Deno.env.get('SUPABASE_ANON_KEY'),
      serviceRoleKeyConfigured: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    },
    functions: {
      total: functions.length,
      available: functions,
    },
  };

  return new Response(
    JSON.stringify(healthData, null, 2),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(req),
      },
    }
  );
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
function handleOptions(req: Request): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

/**
 * Main request handler
 */
async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${path}`);
  
  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    return handleOptions(req);
  }

  // Health check endpoint
  if (path === '/_health' || path === '/health') {
    return await handleHealthCheck(req);
  }

  // Root endpoint - return welcome message
  if (path === '/') {
    const functions = await getAvailableFunctions();
    return new Response(
      JSON.stringify({
        service: 'Craft Local Edge Functions',
        version: '1.0.0',
        supabaseUrl: SUPABASE_API_URL,
        functionsUrl: FUNCTIONS_URL,
        functions: functions,
        usage: 'POST /{function-name} with JSON body',
        healthCheck: '/_health',
      }, null, 2),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(req),
        },
      }
    );
  }

  // Extract function name from path
  const functionName = path.split('/')[1];

  if (!functionName) {
    return new Response(
      JSON.stringify({ error: 'Function name required' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(req),
        },
      }
    );
  }

  // Build function path
  const functionPath = `${FUNCTIONS_DIR}/${functionName}/index.ts`;

  // Check if function exists
  try {
    await Deno.stat(functionPath);
  } catch {
    return new Response(
      JSON.stringify({
        error: `Function '${functionName}' not found`,
        availableFunctions: await getAvailableFunctions(),
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(req),
        },
      }
    );
  }

  // Dynamically import and execute the function
  try {
    console.log(`Loading function: ${functionName}`);

    // Import the function module
    const functionModule = await import(`file://${functionPath}`);

    // Create a new Request object to pass to the function
    const functionRequest = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: req.body,
    });

    // If the module exports a handler, call it directly
    if (typeof functionModule.default === 'function') {
      const response = await functionModule.default(functionRequest);

      // Add CORS headers to the response
      const headers = new Headers(response.headers);
      Object.entries(getCorsHeaders(req)).forEach(([key, value]) => {
        headers.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    // If no handler is exported, return an error
    return new Response(
      JSON.stringify({
        error: `Function '${functionName}' does not export a handler`,
        hint: 'Functions should use Deno.serve() or export a default handler function',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(req),
        },
      }
    );

  } catch (error) {
    console.error(`Error executing function '${functionName}':`, error);

    return new Response(
      JSON.stringify({
        error: 'Function execution failed',
        message: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(req),
        },
      }
    );
  }
}

/**
 * Start the server
 */
console.log('🚀 Craft Local Edge Functions Server');
console.log(`📍 Supabase API: ${SUPABASE_API_URL}`);
console.log(`📍 Functions URL: ${FUNCTIONS_URL}`);
console.log(`🔌 Starting server on port ${PORT}`);
console.log(`📁 Functions directory: ${FUNCTIONS_DIR}`);
console.log(`🌐 CORS enabled`);

// List available functions on startup
getAvailableFunctions().then(functions => {
  console.log(`✅ Found ${functions.length} function(s):`);
  functions.forEach(fn => console.log(`   - ${fn}`));
  console.log('');
  console.log(`✅ Server running at http://localhost:${PORT}/`);
  console.log(`✅ Health check: http://localhost:${PORT}/_health`);
});

Deno.serve({ port: PORT }, handleRequest);
