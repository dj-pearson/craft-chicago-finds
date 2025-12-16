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
 * - Supabase API: https://api.craftlocal.net
 * - Edge Functions: https://functions.craftlocal.net
 */

const PORT = parseInt(Deno.env.get('PORT') || '8000');
const FUNCTIONS_DIR = '/app/functions';

// CORS headers - Configure for your domain
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // TODO: Change to specific domain in production
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
  'Access-Control-Max-Age': '86400', // 24 hours
};

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
async function handleHealthCheck(): Promise<Response> {
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
        ...corsHeaders,
      },
    }
  );
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
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
    return handleOptions();
  }
  
  // Health check endpoint
  if (path === '/_health' || path === '/health') {
    return await handleHealthCheck();
  }
  
  // Root endpoint - return welcome message
  if (path === '/') {
    const functions = await getAvailableFunctions();
    return new Response(
      JSON.stringify({
        service: 'Craft Local Edge Functions',
        version: '1.0.0',
        supabaseUrl: 'https://api.craftlocal.net',
        functionsUrl: 'https://functions.craftlocal.net',
        functions: functions,
        usage: 'POST /{function-name} with JSON body',
        healthCheck: '/_health',
      }, null, 2),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
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
          ...corsHeaders,
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
          ...corsHeaders,
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
      Object.entries(corsHeaders).forEach(([key, value]) => {
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
          ...corsHeaders,
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
          ...corsHeaders,
        },
      }
    );
  }
}

/**
 * Start the server
 */
console.log('🚀 Craft Local Edge Functions Server');
console.log(`📍 Supabase API: https://api.craftlocal.net`);
console.log(`📍 Functions URL: https://functions.craftlocal.net`);
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
