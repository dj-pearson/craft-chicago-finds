import { supabase } from '@/integrations/supabase/client';
import { serviceRegistry } from './service-registry';

export interface EventMessage {
  id: string;
  type: string;
  source: string;
  target?: string; // Optional - for direct messaging
  payload: any;
  timestamp: Date;
  correlationId?: string;
  retryCount?: number;
  maxRetries?: number;
  metadata: Record<string, any>;
}

export interface EventHandler {
  eventType: string;
  handler: (event: EventMessage) => Promise<void>;
  options?: {
    maxRetries?: number;
    timeout?: number;
    priority?: number;
  };
}

export interface EventSubscription {
  id: string;
  serviceId: string;
  eventType: string;
  endpoint: string;
  isActive: boolean;
  filterCriteria?: Record<string, any>;
}

export class EventBus {
  private static instance: EventBus;
  private handlers: Map<string, EventHandler[]> = new Map();
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private eventQueue: EventMessage[] = [];
  private processingQueue = false;
  private retryQueue: EventMessage[] = [];

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Initialize the event bus
   */
  async initialize(): Promise<void> {
    await this.loadSubscriptionsFromDatabase();
    this.startEventProcessing();
    this.startRetryProcessing();
    console.log('Event bus initialized');
  }

  /**
   * Publish an event to the bus
   */
  async publishEvent(event: Omit<EventMessage, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: EventMessage = {
      id: this.generateEventId(),
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: event.maxRetries || 3,
      ...event
    };

    try {
      // Store event in database for persistence and audit
      await this.storeEvent(fullEvent);

      // Add to processing queue
      this.eventQueue.push(fullEvent);

      // Trigger immediate processing if not already running
      if (!this.processingQueue) {
        this.processEventQueue();
      }

      console.log(`Event published: ${fullEvent.type} from ${fullEvent.source}`);
    } catch (error) {
      console.error('Failed to publish event:', error);
      throw error;
    }
  }

  /**
   * Subscribe to events
   */
  async subscribe(subscription: Omit<EventSubscription, 'id'>): Promise<string> {
    const fullSubscription: EventSubscription = {
      id: this.generateSubscriptionId(),
      ...subscription
    };

    try {
      // Store subscription in database
      const { error } = await supabase
        .from('event_subscriptions')
        .upsert({
          subscription_id: fullSubscription.id,
          service_id: fullSubscription.serviceId,
          event_type: fullSubscription.eventType,
          endpoint: fullSubscription.endpoint,
          is_active: fullSubscription.isActive,
          filter_criteria: fullSubscription.filterCriteria,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Add to local subscriptions
      const eventSubscriptions = this.subscriptions.get(fullSubscription.eventType) || [];
      eventSubscriptions.push(fullSubscription);
      this.subscriptions.set(fullSubscription.eventType, eventSubscriptions);

      console.log(`Subscription created: ${fullSubscription.serviceId} -> ${fullSubscription.eventType}`);
      return fullSubscription.id;
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from events
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    try {
      // Update database
      const { error } = await supabase
        .from('event_subscriptions')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('subscription_id', subscriptionId);

      if (error) throw error;

      // Remove from local subscriptions
      for (const [eventType, subscriptions] of this.subscriptions.entries()) {
        const filtered = subscriptions.filter(s => s.id !== subscriptionId);
        this.subscriptions.set(eventType, filtered);
      }

      console.log(`Subscription removed: ${subscriptionId}`);
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      throw error;
    }
  }

  /**
   * Register local event handler
   */
  registerHandler(handler: EventHandler): void {
    const handlers = this.handlers.get(handler.eventType) || [];
    handlers.push(handler);
    this.handlers.set(handler.eventType, handlers);
    
    console.log(`Handler registered for event type: ${handler.eventType}`);
  }

  /**
   * Unregister local event handler
   */
  unregisterHandler(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType) || [];
    const filtered = handlers.filter(h => h !== handler);
    this.handlers.set(eventType, filtered);
  }

  /**
   * Get event history
   */
  async getEventHistory(filters: {
    eventType?: string;
    source?: string;
    target?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  }): Promise<EventMessage[]> {
    try {
      let query = supabase
        .from('event_messages')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType);
      }
      if (filters.source) {
        query = query.eq('source', filters.source);
      }
      if (filters.target) {
        query = query.eq('target', filters.target);
      }
      if (filters.startTime) {
        query = query.gte('timestamp', filters.startTime.toISOString());
      }
      if (filters.endTime) {
        query = query.lte('timestamp', filters.endTime.toISOString());
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(event => ({
        id: event.event_id,
        type: event.event_type,
        source: event.source,
        target: event.target,
        payload: event.payload,
        timestamp: new Date(event.timestamp),
        correlationId: event.correlation_id,
        retryCount: event.retry_count,
        maxRetries: event.max_retries,
        metadata: event.metadata || {}
      }));
    } catch (error) {
      console.error('Failed to get event history:', error);
      return [];
    }
  }

  /**
   * Process event queue
   */
  private async processEventQueue(): Promise<void> {
    if (this.processingQueue || this.eventQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        if (event) {
          await this.processEvent(event);
        }
      }
    } catch (error) {
      console.error('Error processing event queue:', error);
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Process individual event
   */
  private async processEvent(event: EventMessage): Promise<void> {
    try {
      // Process local handlers first
      await this.processLocalHandlers(event);

      // Process remote subscriptions
      await this.processRemoteSubscriptions(event);

      // Update event status
      await this.updateEventStatus(event.id, 'processed');
    } catch (error) {
      console.error(`Failed to process event ${event.id}:`, error);
      
      // Add to retry queue if retries available
      if ((event.retryCount || 0) < (event.maxRetries || 3)) {
        event.retryCount = (event.retryCount || 0) + 1;
        this.retryQueue.push(event);
        await this.updateEventStatus(event.id, 'retry_scheduled');
      } else {
        await this.updateEventStatus(event.id, 'failed');
      }
    }
  }

  /**
   * Process local event handlers
   */
  private async processLocalHandlers(event: EventMessage): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    
    const promises = handlers.map(async handler => {
      try {
        const timeout = handler.options?.timeout || 30000; // 30 seconds default
        
        await Promise.race([
          handler.handler(event),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Handler timeout')), timeout)
          )
        ]);
      } catch (error) {
        console.error(`Local handler failed for event ${event.id}:`, error);
        throw error;
      }
    });

    await Promise.all(promises);
  }

  /**
   * Process remote subscriptions
   */
  private async processRemoteSubscriptions(event: EventMessage): Promise<void> {
    const subscriptions = this.subscriptions.get(event.type) || [];
    const activeSubscriptions = subscriptions.filter(s => s.isActive);

    // Filter by target if specified
    const targetedSubscriptions = event.target 
      ? activeSubscriptions.filter(s => s.serviceId === event.target)
      : activeSubscriptions;

    const promises = targetedSubscriptions.map(async subscription => {
      try {
        // Check if service instance is healthy
        const healthyInstances = serviceRegistry.getHealthyInstances(subscription.serviceId);
        if (healthyInstances.length === 0) {
          throw new Error(`No healthy instances for service ${subscription.serviceId}`);
        }

        // Apply filter criteria if specified
        if (subscription.filterCriteria && !this.matchesFilter(event, subscription.filterCriteria)) {
          return; // Skip this subscription
        }

        // Send event to service endpoint
        const response = await fetch(subscription.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Event-Id': event.id,
            'X-Event-Type': event.type,
            'X-Source-Service': event.source
          },
          body: JSON.stringify(event),
          timeout: 10000 // 10 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        console.log(`Event delivered to ${subscription.serviceId}: ${event.type}`);
      } catch (error) {
        console.error(`Failed to deliver event to ${subscription.serviceId}:`, error);
        throw error;
      }
    });

    await Promise.all(promises);
  }

  /**
   * Check if event matches filter criteria
   */
  private matchesFilter(event: EventMessage, criteria: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(criteria)) {
      const eventValue = this.getNestedValue(event, key);
      if (eventValue !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Store event in database
   */
  private async storeEvent(event: EventMessage): Promise<void> {
    const { error } = await supabase
      .from('event_messages')
      .insert({
        event_id: event.id,
        event_type: event.type,
        source: event.source,
        target: event.target,
        payload: event.payload,
        timestamp: event.timestamp.toISOString(),
        correlation_id: event.correlationId,
        retry_count: event.retryCount || 0,
        max_retries: event.maxRetries || 3,
        metadata: event.metadata,
        status: 'queued'
      });

    if (error) throw error;
  }

  /**
   * Update event status
   */
  private async updateEventStatus(eventId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('event_messages')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('event_id', eventId);

    if (error) {
      console.error('Failed to update event status:', error);
    }
  }

  /**
   * Load subscriptions from database
   */
  private async loadSubscriptionsFromDatabase(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('event_subscriptions')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      (data || []).forEach(sub => {
        const subscription: EventSubscription = {
          id: sub.subscription_id,
          serviceId: sub.service_id,
          eventType: sub.event_type,
          endpoint: sub.endpoint,
          isActive: sub.is_active,
          filterCriteria: sub.filter_criteria
        };

        const eventSubscriptions = this.subscriptions.get(subscription.eventType) || [];
        eventSubscriptions.push(subscription);
        this.subscriptions.set(subscription.eventType, eventSubscriptions);
      });

      console.log(`Loaded ${Array.from(this.subscriptions.values()).flat().length} event subscriptions`);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    }
  }

  /**
   * Start retry processing
   */
  private startRetryProcessing(): void {
    setInterval(async () => {
      if (this.retryQueue.length > 0) {
        const retryEvents = [...this.retryQueue];
        this.retryQueue = [];
        
        for (const event of retryEvents) {
          await this.processEvent(event);
        }
      }
    }, 60000); // Process retries every minute
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get event bus statistics
   */
  getStatistics(): Record<string, any> {
    const subscriptionCount = Array.from(this.subscriptions.values()).flat().length;
    const handlerCount = Array.from(this.handlers.values()).flat().length;

    return {
      queuedEvents: this.eventQueue.length,
      retryQueueEvents: this.retryQueue.length,
      totalSubscriptions: subscriptionCount,
      totalHandlers: handlerCount,
      subscriptionsByType: Object.fromEntries(
        Array.from(this.subscriptions.entries()).map(([type, subs]) => [type, subs.length])
      ),
      handlersByType: Object.fromEntries(
        Array.from(this.handlers.entries()).map(([type, handlers]) => [type, handlers.length])
      )
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.handlers.clear();
    this.subscriptions.clear();
    this.eventQueue = [];
    this.retryQueue = [];
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance();
