import { supabase } from '@/integrations/supabase/client';

export interface ServiceDefinition {
  id: string;
  name: string;
  version: string;
  endpoint: string;
  healthEndpoint: string;
  capabilities: string[];
  dependencies: string[];
  metadata: Record<string, any>;
}

export interface ServiceInstance {
  id: string;
  serviceId: string;
  instanceId: string;
  endpoint: string;
  status: 'healthy' | 'unhealthy' | 'starting' | 'stopping';
  lastHeartbeat: Date;
  metadata: Record<string, any>;
}

export interface ServiceHealth {
  serviceId: string;
  instanceId: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  timestamp: Date;
  details: Record<string, any>;
}

export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, ServiceDefinition> = new Map();
  private instances: Map<string, ServiceInstance[]> = new Map();
  private healthChecks: Map<string, ServiceHealth> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Initialize the service registry
   */
  async initialize(): Promise<void> {
    await this.loadServicesFromDatabase();
    this.startHeartbeatMonitoring();
    console.log('Service registry initialized');
  }

  /**
   * Register a new service
   */
  async registerService(service: ServiceDefinition): Promise<void> {
    try {
      // Store in local registry
      this.services.set(service.id, service);

      // Store in database for persistence
      const { error } = await supabase
        .from('service_registry')
        .upsert({
          service_id: service.id,
          name: service.name,
          version: service.version,
          endpoint: service.endpoint,
          health_endpoint: service.healthEndpoint,
          capabilities: service.capabilities,
          dependencies: service.dependencies,
          metadata: service.metadata,
          status: 'active',
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      console.log(`Service registered: ${service.name} (${service.id})`);
    } catch (error) {
      console.error('Failed to register service:', error);
      throw error;
    }
  }

  /**
   * Register a service instance
   */
  async registerInstance(instance: ServiceInstance): Promise<void> {
    try {
      // Add to local registry
      const instances = this.instances.get(instance.serviceId) || [];
      const existingIndex = instances.findIndex(i => i.instanceId === instance.instanceId);
      
      if (existingIndex >= 0) {
        instances[existingIndex] = instance;
      } else {
        instances.push(instance);
      }
      
      this.instances.set(instance.serviceId, instances);

      // Store in database
      const { error } = await supabase
        .from('service_instances')
        .upsert({
          instance_id: instance.instanceId,
          service_id: instance.serviceId,
          endpoint: instance.endpoint,
          status: instance.status,
          last_heartbeat: instance.lastHeartbeat.toISOString(),
          metadata: instance.metadata,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      console.log(`Service instance registered: ${instance.serviceId}/${instance.instanceId}`);
    } catch (error) {
      console.error('Failed to register service instance:', error);
      throw error;
    }
  }

  /**
   * Deregister a service instance
   */
  async deregisterInstance(serviceId: string, instanceId: string): Promise<void> {
    try {
      // Remove from local registry
      const instances = this.instances.get(serviceId) || [];
      const filteredInstances = instances.filter(i => i.instanceId !== instanceId);
      this.instances.set(serviceId, filteredInstances);

      // Update database
      const { error } = await supabase
        .from('service_instances')
        .update({ 
          status: 'stopping',
          updated_at: new Date().toISOString()
        })
        .eq('service_id', serviceId)
        .eq('instance_id', instanceId);

      if (error) throw error;

      console.log(`Service instance deregistered: ${serviceId}/${instanceId}`);
    } catch (error) {
      console.error('Failed to deregister service instance:', error);
    }
  }

  /**
   * Discover services by capability
   */
  discoverServices(capability: string): ServiceDefinition[] {
    return Array.from(this.services.values())
      .filter(service => service.capabilities.includes(capability));
  }

  /**
   * Get healthy instances for a service
   */
  getHealthyInstances(serviceId: string): ServiceInstance[] {
    const instances = this.instances.get(serviceId) || [];
    return instances.filter(instance => {
      const health = this.healthChecks.get(`${serviceId}/${instance.instanceId}`);
      return instance.status === 'healthy' && 
             health?.status === 'healthy' &&
             (Date.now() - instance.lastHeartbeat.getTime()) < 30000; // 30 seconds
    });
  }

  /**
   * Get service by ID
   */
  getService(serviceId: string): ServiceDefinition | undefined {
    return this.services.get(serviceId);
  }

  /**
   * Get all services
   */
  getAllServices(): ServiceDefinition[] {
    return Array.from(this.services.values());
  }

  /**
   * Update service health
   */
  async updateServiceHealth(health: ServiceHealth): Promise<void> {
    try {
      const key = `${health.serviceId}/${health.instanceId}`;
      this.healthChecks.set(key, health);

      // Store health check in database
      const { error } = await supabase
        .from('service_health_checks')
        .insert({
          service_id: health.serviceId,
          instance_id: health.instanceId,
          status: health.status,
          response_time: health.responseTime,
          details: health.details,
          timestamp: health.timestamp.toISOString()
        });

      if (error) throw error;

      // Update instance status if needed
      const instances = this.instances.get(health.serviceId) || [];
      const instance = instances.find(i => i.instanceId === health.instanceId);
      
      if (instance && instance.status !== health.status) {
        instance.status = health.status === 'healthy' ? 'healthy' : 'unhealthy';
        await this.registerInstance(instance);
      }
    } catch (error) {
      console.error('Failed to update service health:', error);
    }
  }

  /**
   * Perform health check on service instance
   */
  async performHealthCheck(serviceId: string, instanceId: string): Promise<ServiceHealth> {
    const instances = this.instances.get(serviceId) || [];
    const instance = instances.find(i => i.instanceId === instanceId);
    
    if (!instance) {
      throw new Error(`Instance not found: ${serviceId}/${instanceId}`);
    }

    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }

    const startTime = Date.now();
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'unhealthy';
    let details: Record<string, any> = {};

    try {
      // Perform health check request
      const healthUrl = `${instance.endpoint}${service.healthEndpoint}`;
      const response = await fetch(healthUrl, {
        method: 'GET',
        timeout: 5000, // 5 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const healthData = await response.json();
        status = healthData.status || 'healthy';
        details = healthData.details || {};
      } else {
        status = 'unhealthy';
        details = { error: `HTTP ${response.status}` };
      }

      const health: ServiceHealth = {
        serviceId,
        instanceId,
        status,
        responseTime,
        timestamp: new Date(),
        details
      };

      await this.updateServiceHealth(health);
      return health;
    } catch (error) {
      const health: ServiceHealth = {
        serviceId,
        instanceId,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };

      await this.updateServiceHealth(health);
      return health;
    }
  }

  /**
   * Load services from database
   */
  private async loadServicesFromDatabase(): Promise<void> {
    try {
      const { data: services, error: servicesError } = await supabase
        .from('service_registry')
        .select('*')
        .eq('status', 'active');

      if (servicesError) throw servicesError;

      const { data: instances, error: instancesError } = await supabase
        .from('service_instances')
        .select('*')
        .in('status', ['healthy', 'unhealthy', 'starting']);

      if (instancesError) throw instancesError;

      // Load services
      (services || []).forEach(service => {
        this.services.set(service.service_id, {
          id: service.service_id,
          name: service.name,
          version: service.version,
          endpoint: service.endpoint,
          healthEndpoint: service.health_endpoint,
          capabilities: service.capabilities || [],
          dependencies: service.dependencies || [],
          metadata: service.metadata || {}
        });
      });

      // Load instances
      (instances || []).forEach(instance => {
        const serviceInstances = this.instances.get(instance.service_id) || [];
        serviceInstances.push({
          id: instance.id,
          serviceId: instance.service_id,
          instanceId: instance.instance_id,
          endpoint: instance.endpoint,
          status: instance.status,
          lastHeartbeat: new Date(instance.last_heartbeat),
          metadata: instance.metadata || {}
        });
        this.instances.set(instance.service_id, serviceInstances);
      });

      console.log(`Loaded ${this.services.size} services and ${Array.from(this.instances.values()).flat().length} instances`);
    } catch (error) {
      console.error('Failed to load services from database:', error);
    }
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeatMonitoring(): void {
    this.heartbeatInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Perform health checks on all instances
   */
  private async performHealthChecks(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const [serviceId, instances] of this.instances.entries()) {
      for (const instance of instances) {
        if (instance.status === 'healthy' || instance.status === 'unhealthy') {
          promises.push(
            this.performHealthCheck(serviceId, instance.instanceId)
              .then(() => {})
              .catch(error => {
                console.error(`Health check failed for ${serviceId}/${instance.instanceId}:`, error);
              })
          );
        }
      }
    }

    await Promise.all(promises);
  }

  /**
   * Get service statistics
   */
  getServiceStatistics(): Record<string, any> {
    const stats = {
      totalServices: this.services.size,
      totalInstances: 0,
      healthyInstances: 0,
      unhealthyInstances: 0,
      serviceBreakdown: {} as Record<string, any>
    };

    for (const [serviceId, instances] of this.instances.entries()) {
      const service = this.services.get(serviceId);
      const healthy = instances.filter(i => i.status === 'healthy').length;
      const unhealthy = instances.filter(i => i.status === 'unhealthy').length;

      stats.totalInstances += instances.length;
      stats.healthyInstances += healthy;
      stats.unhealthyInstances += unhealthy;

      stats.serviceBreakdown[serviceId] = {
        name: service?.name || serviceId,
        totalInstances: instances.length,
        healthyInstances: healthy,
        unhealthyInstances: unhealthy,
        healthRate: instances.length > 0 ? (healthy / instances.length) * 100 : 0
      };
    }

    return stats;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.services.clear();
    this.instances.clear();
    this.healthChecks.clear();
  }
}

// Export singleton instance
export const serviceRegistry = ServiceRegistry.getInstance();
