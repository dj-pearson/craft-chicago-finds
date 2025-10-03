import { serviceRegistry, ServiceDefinition } from './service-registry';
import { eventBus } from './event-bus';

export interface RouteDefinition {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  serviceId: string;
  targetPath: string;
  requiresAuth: boolean;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  timeout?: number;
  retries?: number;
  circuitBreaker?: {
    failureThreshold: number;
    resetTimeoutMs: number;
  };
  middleware?: string[];
}

export interface RequestContext {
  requestId: string;
  userId?: string;
  userRole?: string;
  startTime: number;
  metadata: Record<string, any>;
}

export interface CircuitBreakerState {
  serviceId: string;
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

export interface RateLimitState {
  key: string;
  requests: number;
  windowStart: number;
}

export class APIGateway {
  private static instance: APIGateway;
  private routes: Map<string, RouteDefinition> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private rateLimiters: Map<string, RateLimitState> = new Map();
  private middleware: Map<string, (req: any, res: any, next: () => void) => void> = new Map();

  static getInstance(): APIGateway {
    if (!APIGateway.instance) {
      APIGateway.instance = new APIGateway();
    }
    return APIGateway.instance;
  }

  /**
   * Initialize the API Gateway
   */
  async initialize(): Promise<void> {
    await this.loadRoutesFromDatabase();
    this.setupDefaultMiddleware();
    console.log('API Gateway initialized');
  }

  /**
   * Register a route
   */
  async registerRoute(route: RouteDefinition): Promise<void> {
    try {
      // Validate service exists
      const service = serviceRegistry.getService(route.serviceId);
      if (!service) {
        throw new Error(`Service not found: ${route.serviceId}`);
      }

      // Store route
      this.routes.set(this.getRouteKey(route.method, route.path), route);

      // Store in database
      const { error } = await supabase
        .from('api_routes')
        .upsert({
          route_id: route.id,
          path: route.path,
          method: route.method,
          service_id: route.serviceId,
          target_path: route.targetPath,
          requires_auth: route.requiresAuth,
          rate_limit: route.rateLimit,
          timeout: route.timeout,
          retries: route.retries,
          circuit_breaker: route.circuitBreaker,
          middleware: route.middleware,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      console.log(`Route registered: ${route.method} ${route.path} -> ${route.serviceId}`);
    } catch (error) {
      console.error('Failed to register route:', error);
      throw error;
    }
  }

  /**
   * Handle incoming request
   */
  async handleRequest(
    method: string,
    path: string,
    headers: Record<string, string>,
    body?: any,
    query?: Record<string, string>
  ): Promise<{
    status: number;
    headers: Record<string, string>;
    body: any;
  }> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      // Find matching route
      const route = this.findRoute(method as any, path);
      if (!route) {
        return {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
          body: { error: 'Route not found' }
        };
      }

      // Create request context
      const context: RequestContext = {
        requestId,
        startTime,
        metadata: { originalPath: path, route: route.id }
      };

      // Extract user info from headers if available
      if (headers.authorization) {
        // TODO: Implement JWT token parsing
        context.userId = 'extracted-from-jwt';
        context.userRole = 'extracted-from-jwt';
      }

      // Apply middleware
      const middlewareResult = await this.applyMiddleware(route, context, headers, body);
      if (middlewareResult.blocked) {
        return middlewareResult.response!;
      }

      // Check circuit breaker
      if (this.isCircuitBreakerOpen(route.serviceId)) {
        return {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
          body: { error: 'Service temporarily unavailable' }
        };
      }

      // Forward request to service
      const response = await this.forwardRequest(route, context, headers, body, query);

      // Update circuit breaker on success
      this.recordSuccess(route.serviceId);

      // Log successful request
      await this.logRequest(context, route, response.status, Date.now() - startTime);

      return response;
    } catch (error) {
      console.error(`Request failed (${requestId}):`, error);

      // Update circuit breaker on failure
      const route = this.findRoute(method as any, path);
      if (route) {
        this.recordFailure(route.serviceId);
      }

      // Log failed request
      if (route) {
        await this.logRequest({
          requestId,
          startTime,
          metadata: { originalPath: path, route: route.id }
        }, route, 500, Date.now() - startTime, error instanceof Error ? error.message : 'Unknown error');
      }

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Internal server error', requestId }
      };
    }
  }

  /**
   * Find matching route
   */
  private findRoute(method: RouteDefinition['method'], path: string): RouteDefinition | null {
    // First try exact match
    const exactKey = this.getRouteKey(method, path);
    const exactRoute = this.routes.get(exactKey);
    if (exactRoute) {
      return exactRoute;
    }

    // Try pattern matching
    for (const [key, route] of this.routes.entries()) {
      if (route.method === method && this.matchesPattern(route.path, path)) {
        return route;
      }
    }

    return null;
  }

  /**
   * Check if path matches route pattern
   */
  private matchesPattern(pattern: string, path: string): boolean {
    // Convert route pattern to regex
    const regexPattern = pattern
      .replace(/:[^/]+/g, '([^/]+)') // Replace :param with capture group
      .replace(/\*/g, '.*'); // Replace * with wildcard

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  /**
   * Apply middleware to request
   */
  private async applyMiddleware(
    route: RouteDefinition,
    context: RequestContext,
    headers: Record<string, string>,
    body: any
  ): Promise<{
    blocked: boolean;
    response?: {
      status: number;
      headers: Record<string, string>;
      body: any;
    };
  }> {
    // Authentication middleware
    if (route.requiresAuth) {
      if (!headers.authorization) {
        return {
          blocked: true,
          response: {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
            body: { error: 'Authentication required' }
          }
        };
      }
    }

    // Rate limiting middleware
    if (route.rateLimit) {
      const rateLimitKey = `${context.userId || 'anonymous'}:${route.id}`;
      if (this.isRateLimited(rateLimitKey, route.rateLimit)) {
        return {
          blocked: true,
          response: {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
            body: { error: 'Rate limit exceeded' }
          }
        };
      }
    }

    // Custom middleware
    if (route.middleware) {
      for (const middlewareName of route.middleware) {
        const middleware = this.middleware.get(middlewareName);
        if (middleware) {
          // TODO: Implement middleware execution
          // This would need to be adapted for the specific middleware system
        }
      }
    }

    return { blocked: false };
  }

  /**
   * Forward request to target service
   */
  private async forwardRequest(
    route: RouteDefinition,
    context: RequestContext,
    headers: Record<string, string>,
    body: any,
    query?: Record<string, string>
  ): Promise<{
    status: number;
    headers: Record<string, string>;
    body: any;
  }> {
    // Get healthy service instance
    const healthyInstances = serviceRegistry.getHealthyInstances(route.serviceId);
    if (healthyInstances.length === 0) {
      throw new Error(`No healthy instances available for service: ${route.serviceId}`);
    }

    // Load balance (simple round-robin for now)
    const instance = healthyInstances[Math.floor(Math.random() * healthyInstances.length)];
    
    // Build target URL
    const targetUrl = `${instance.endpoint}${route.targetPath}`;
    const url = new URL(targetUrl);
    
    // Add query parameters
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    // Prepare headers
    const forwardHeaders = {
      ...headers,
      'X-Request-ID': context.requestId,
      'X-Forwarded-For': 'api-gateway',
      'X-Original-Path': context.metadata.originalPath
    };

    // Remove hop-by-hop headers
    delete forwardHeaders.connection;
    delete forwardHeaders['transfer-encoding'];

    const timeout = route.timeout || 30000; // 30 seconds default
    const maxRetries = route.retries || 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url.toString(), {
          method: route.method,
          headers: forwardHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Read response
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        let responseBody;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          responseBody = await response.json();
        } else {
          responseBody = await response.text();
        }

        return {
          status: response.status,
          headers: responseHeaders,
          body: responseBody
        };
      } catch (error) {
        console.error(`Request attempt ${attempt + 1} failed:`, error);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new Error('All retry attempts failed');
  }

  /**
   * Check if service circuit breaker is open
   */
  private isCircuitBreakerOpen(serviceId: string): boolean {
    const breaker = this.circuitBreakers.get(serviceId);
    if (!breaker) {
      return false;
    }

    const now = Date.now();

    if (breaker.state === 'open') {
      if (now >= breaker.nextAttemptTime) {
        // Transition to half-open
        breaker.state = 'half-open';
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Record successful request for circuit breaker
   */
  private recordSuccess(serviceId: string): void {
    const breaker = this.circuitBreakers.get(serviceId);
    if (breaker) {
      breaker.failureCount = 0;
      breaker.state = 'closed';
    }
  }

  /**
   * Record failed request for circuit breaker
   */
  private recordFailure(serviceId: string): void {
    let breaker = this.circuitBreakers.get(serviceId);
    if (!breaker) {
      breaker = {
        serviceId,
        state: 'closed',
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0
      };
      this.circuitBreakers.set(serviceId, breaker);
    }

    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();

    // Check if we should open the circuit
    const route = Array.from(this.routes.values()).find(r => r.serviceId === serviceId);
    const threshold = route?.circuitBreaker?.failureThreshold || 5;
    const resetTimeout = route?.circuitBreaker?.resetTimeoutMs || 60000;

    if (breaker.failureCount >= threshold) {
      breaker.state = 'open';
      breaker.nextAttemptTime = Date.now() + resetTimeout;
    }
  }

  /**
   * Check rate limiting
   */
  private isRateLimited(key: string, rateLimit: { requests: number; windowMs: number }): boolean {
    const now = Date.now();
    let state = this.rateLimiters.get(key);

    if (!state || now - state.windowStart >= rateLimit.windowMs) {
      // New window
      state = {
        key,
        requests: 1,
        windowStart: now
      };
      this.rateLimiters.set(key, state);
      return false;
    }

    if (state.requests >= rateLimit.requests) {
      return true; // Rate limited
    }

    state.requests++;
    return false;
  }

  /**
   * Log request for analytics
   */
  private async logRequest(
    context: RequestContext,
    route: RouteDefinition,
    status: number,
    duration: number,
    error?: string
  ): Promise<void> {
    try {
      await eventBus.publishEvent({
        type: 'gateway.request.completed',
        source: 'api-gateway',
        payload: {
          requestId: context.requestId,
          route: route.id,
          method: route.method,
          path: route.path,
          serviceId: route.serviceId,
          status,
          duration,
          error,
          userId: context.userId,
          timestamp: new Date().toISOString()
        },
        metadata: {
          category: 'gateway-analytics'
        }
      });
    } catch (error) {
      console.error('Failed to log request:', error);
    }
  }

  /**
   * Load routes from database
   */
  private async loadRoutesFromDatabase(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('api_routes')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      (data || []).forEach(route => {
        const routeDefinition: RouteDefinition = {
          id: route.route_id,
          path: route.path,
          method: route.method,
          serviceId: route.service_id,
          targetPath: route.target_path,
          requiresAuth: route.requires_auth,
          rateLimit: route.rate_limit,
          timeout: route.timeout,
          retries: route.retries,
          circuitBreaker: route.circuit_breaker,
          middleware: route.middleware || []
        };

        this.routes.set(this.getRouteKey(routeDefinition.method, routeDefinition.path), routeDefinition);
      });

      console.log(`Loaded ${this.routes.size} API routes`);
    } catch (error) {
      console.error('Failed to load routes:', error);
    }
  }

  /**
   * Setup default middleware
   */
  private setupDefaultMiddleware(): void {
    // CORS middleware
    this.middleware.set('cors', (req: any, res: any, next: () => void) => {
      res.headers['Access-Control-Allow-Origin'] = '*';
      res.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      res.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
      next();
    });

    // Logging middleware
    this.middleware.set('logging', (req: any, res: any, next: () => void) => {
      console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
      next();
    });
  }

  /**
   * Get route key
   */
  private getRouteKey(method: string, path: string): string {
    return `${method}:${path}`;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get gateway statistics
   */
  getStatistics(): Record<string, any> {
    const circuitBreakerStats = Array.from(this.circuitBreakers.values()).reduce((acc, breaker) => {
      acc[breaker.serviceId] = {
        state: breaker.state,
        failureCount: breaker.failureCount
      };
      return acc;
    }, {} as Record<string, any>);

    return {
      totalRoutes: this.routes.size,
      circuitBreakers: circuitBreakerStats,
      rateLimiters: this.rateLimiters.size,
      middleware: Array.from(this.middleware.keys())
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.routes.clear();
    this.circuitBreakers.clear();
    this.rateLimiters.clear();
    this.middleware.clear();
  }
}

// Export singleton instance
export const apiGateway = APIGateway.getInstance();
