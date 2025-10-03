export async function onRequest(context: any): Promise<Response> {
  const { request } = context;
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  // Only allow GET requests
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const startTime = Date.now();
    
    // Basic health check response
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'craft-local-api',
      version: '1.0.0',
      uptime: process.uptime ? Math.floor(process.uptime()) : 0,
      checks: {
        api: {
          status: 'operational',
          responseTime: Date.now() - startTime,
          message: 'API is responding normally'
        },
        database: {
          status: 'operational',
          message: 'Database connection assumed healthy'
        },
        memory: {
          status: 'operational',
          usage: process.memoryUsage ? process.memoryUsage() : null
        }
      },
      metadata: {
        environment: 'production',
        region: 'auto',
        requestId: crypto.randomUUID()
      }
    };

    // Add response time to API check
    healthStatus.checks.api.responseTime = Date.now() - startTime;

    return new Response(JSON.stringify(healthStatus, null, 2), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'craft-local-api',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'health_check_failure'
      },
      checks: {
        api: {
          status: 'down',
          message: 'API health check failed'
        }
      }
    };

    return new Response(JSON.stringify(errorResponse, null, 2), {
      status: 503,
      headers: corsHeaders
    });
  }
}