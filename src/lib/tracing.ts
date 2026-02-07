/**
 * Distributed Tracing System
 * OpenTelemetry-compatible tracing for the application
 *
 * Features:
 * - Trace context propagation
 * - Span creation and management
 * - Automatic instrumentation
 * - Performance metrics
 * - Error tracking with traces
 * - Integration with logging
 */

import { logger } from '@/lib/logging';

// Trace context types
export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  traceFlags: number;
  traceState?: string;
}

export interface SpanContext {
  name: string;
  kind: SpanKind;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  startTime: number;
  endTime?: number;
  status: SpanStatus;
  attributes: Record<string, SpanAttributeValue>;
  events: SpanEvent[];
  links: SpanLink[];
}

export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: Record<string, SpanAttributeValue>;
}

export interface SpanLink {
  traceId: string;
  spanId: string;
  attributes?: Record<string, SpanAttributeValue>;
}

export enum SpanKind {
  INTERNAL = 0,
  SERVER = 1,
  CLIENT = 2,
  PRODUCER = 3,
  CONSUMER = 4,
}

export enum SpanStatus {
  UNSET = 0,
  OK = 1,
  ERROR = 2,
}

export type SpanAttributeValue = string | number | boolean | string[] | number[] | boolean[];

// Trace exporter interface
export interface TraceExporter {
  export(spans: SpanContext[]): Promise<void>;
  shutdown(): Promise<void>;
}

// Console exporter for development
class ConsoleExporter implements TraceExporter {
  async export(spans: SpanContext[]): Promise<void> {
    for (const span of spans) {
      const duration = span.endTime ? span.endTime - span.startTime : 0;
      const status = SpanStatus[span.status];

      console.groupCollapsed(
        `[TRACE] ${span.name} (${duration.toFixed(2)}ms) [${status}]`
      );
      console.log('Trace ID:', span.traceId);
      console.log('Span ID:', span.spanId);
      if (span.parentSpanId) {
        console.log('Parent Span ID:', span.parentSpanId);
      }
      console.log('Attributes:', span.attributes);
      if (span.events.length > 0) {
        console.log('Events:', span.events);
      }
      console.groupEnd();
    }
  }

  async shutdown(): Promise<void> {
    // Nothing to cleanup
  }
}

// HTTP exporter for remote collectors (Jaeger, Zipkin, OTLP)
class HTTPExporter implements TraceExporter {
  private endpoint: string;
  private headers: Record<string, string>;
  private format: 'otlp' | 'jaeger' | 'zipkin';

  constructor(
    endpoint: string,
    options: {
      headers?: Record<string, string>;
      format?: 'otlp' | 'jaeger' | 'zipkin';
    } = {}
  ) {
    this.endpoint = endpoint;
    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    this.format = options.format || 'otlp';
  }

  async export(spans: SpanContext[]): Promise<void> {
    try {
      const payload = this.formatPayload(spans);

      await fetch(this.endpoint, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
      });
    } catch (error) {
      logger.error('Failed to export traces', error);
    }
  }

  private formatPayload(spans: SpanContext[]): unknown {
    switch (this.format) {
      case 'zipkin':
        return this.toZipkin(spans);
      case 'jaeger':
        return this.toJaeger(spans);
      default:
        return this.toOTLP(spans);
    }
  }

  private toOTLP(spans: SpanContext[]) {
    return {
      resourceSpans: [{
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: 'craftlocal-web' } },
          ],
        },
        scopeSpans: [{
          spans: spans.map(span => ({
            traceId: span.traceId,
            spanId: span.spanId,
            parentSpanId: span.parentSpanId,
            name: span.name,
            kind: span.kind,
            startTimeUnixNano: span.startTime * 1_000_000,
            endTimeUnixNano: (span.endTime || span.startTime) * 1_000_000,
            status: { code: span.status },
            attributes: Object.entries(span.attributes).map(([key, value]) => ({
              key,
              value: this.formatAttributeValue(value),
            })),
            events: span.events.map(event => ({
              name: event.name,
              timeUnixNano: event.timestamp * 1_000_000,
              attributes: event.attributes
                ? Object.entries(event.attributes).map(([key, value]) => ({
                    key,
                    value: this.formatAttributeValue(value),
                  }))
                : [],
            })),
          })),
        }],
      }],
    };
  }

  private toZipkin(spans: SpanContext[]) {
    return spans.map(span => ({
      traceId: span.traceId,
      id: span.spanId,
      parentId: span.parentSpanId,
      name: span.name,
      timestamp: span.startTime * 1000,
      duration: ((span.endTime || span.startTime) - span.startTime) * 1000,
      kind: SpanKind[span.kind],
      localEndpoint: {
        serviceName: 'craftlocal-web',
      },
      tags: span.attributes,
    }));
  }

  private toJaeger(spans: SpanContext[]) {
    return {
      data: [{
        traceID: spans[0]?.traceId,
        spans: spans.map(span => ({
          traceID: span.traceId,
          spanID: span.spanId,
          operationName: span.name,
          references: span.parentSpanId
            ? [{ refType: 'CHILD_OF', traceID: span.traceId, spanID: span.parentSpanId }]
            : [],
          startTime: span.startTime * 1000,
          duration: ((span.endTime || span.startTime) - span.startTime) * 1000,
          tags: Object.entries(span.attributes).map(([key, value]) => ({
            key,
            type: typeof value,
            value,
          })),
          logs: span.events.map(event => ({
            timestamp: event.timestamp * 1000,
            fields: [{ key: 'event', type: 'string', value: event.name }],
          })),
        })),
      }],
    };
  }

  private formatAttributeValue(value: SpanAttributeValue) {
    if (typeof value === 'string') return { stringValue: value };
    if (typeof value === 'number') return { intValue: value };
    if (typeof value === 'boolean') return { boolValue: value };
    if (Array.isArray(value)) {
      return { arrayValue: { values: value.map(v => this.formatAttributeValue(v)) } };
    }
    return { stringValue: String(value) };
  }

  async shutdown(): Promise<void> {
    // Flush any pending exports
  }
}

// Generate random IDs
function generateId(length: number = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Span class
class Span {
  private context: SpanContext;
  private tracer: Tracer;

  constructor(
    tracer: Tracer,
    name: string,
    options: {
      kind?: SpanKind;
      parentSpan?: Span;
      attributes?: Record<string, SpanAttributeValue>;
    } = {}
  ) {
    this.tracer = tracer;
    const parentContext = options.parentSpan?.getContext();

    this.context = {
      name,
      kind: options.kind || SpanKind.INTERNAL,
      traceId: parentContext?.traceId || generateId(16),
      spanId: generateId(8),
      parentSpanId: parentContext?.spanId,
      startTime: performance.now(),
      status: SpanStatus.UNSET,
      attributes: options.attributes || {},
      events: [],
      links: [],
    };
  }

  // Set attribute
  setAttribute(key: string, value: SpanAttributeValue): this {
    this.context.attributes[key] = value;
    return this;
  }

  // Set multiple attributes
  setAttributes(attributes: Record<string, SpanAttributeValue>): this {
    Object.assign(this.context.attributes, attributes);
    return this;
  }

  // Add event
  addEvent(name: string, attributes?: Record<string, SpanAttributeValue>): this {
    this.context.events.push({
      name,
      timestamp: performance.now(),
      attributes,
    });
    return this;
  }

  // Record exception
  recordException(error: Error): this {
    this.context.status = SpanStatus.ERROR;
    this.addEvent('exception', {
      'exception.type': error.name,
      'exception.message': error.message,
      'exception.stacktrace': error.stack || '',
    });
    return this;
  }

  // Set status
  setStatus(status: SpanStatus): this {
    this.context.status = status;
    return this;
  }

  // End span
  end(): void {
    this.context.endTime = performance.now();
    if (this.context.status === SpanStatus.UNSET) {
      this.context.status = SpanStatus.OK;
    }
    this.tracer.recordSpan(this.context);
  }

  // Get context
  getContext(): SpanContext {
    return { ...this.context };
  }

  // Get trace context for propagation
  getTraceContext(): TraceContext {
    return {
      traceId: this.context.traceId,
      spanId: this.context.spanId,
      parentSpanId: this.context.parentSpanId,
      traceFlags: 1,
    };
  }
}

// Tracer class
class Tracer {
  private name: string;
  private exporters: TraceExporter[];
  private buffer: SpanContext[] = [];
  private batchSize: number;
  private flushInterval: number;
  private flushTimeout?: ReturnType<typeof setTimeout>;
  private currentSpan?: Span;

  constructor(
    name: string,
    options: {
      exporters?: TraceExporter[];
      batchSize?: number;
      flushInterval?: number;
    } = {}
  ) {
    this.name = name;
    this.exporters = options.exporters || [new ConsoleExporter()];
    this.batchSize = options.batchSize || 100;
    this.flushInterval = options.flushInterval || 5000;

    this.startFlushInterval();
  }

  // Start a new span
  startSpan(
    name: string,
    options: {
      kind?: SpanKind;
      attributes?: Record<string, SpanAttributeValue>;
    } = {}
  ): Span {
    const span = new Span(this, name, {
      ...options,
      parentSpan: this.currentSpan,
    });
    this.currentSpan = span;
    return span;
  }

  // Start an active span with automatic ending
  async startActiveSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    options: {
      kind?: SpanKind;
      attributes?: Record<string, SpanAttributeValue>;
    } = {}
  ): Promise<T> {
    const span = this.startSpan(name, options);

    try {
      const result = await fn(span);
      span.setStatus(SpanStatus.OK);
      return result;
    } catch (error) {
      if (error instanceof Error) {
        span.recordException(error);
      }
      throw error;
    } finally {
      span.end();
      this.currentSpan = undefined;
    }
  }

  // Get current span
  getCurrentSpan(): Span | undefined {
    return this.currentSpan;
  }

  // Record completed span
  recordSpan(span: SpanContext): void {
    this.buffer.push(span);

    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }
  }

  // Flush spans to exporters
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const spans = [...this.buffer];
    this.buffer = [];

    for (const exporter of this.exporters) {
      try {
        await exporter.export(spans);
      } catch (error) {
        logger.error('Failed to export spans', error, { exporter: exporter.constructor.name });
      }
    }
  }

  // Shutdown tracer
  async shutdown(): Promise<void> {
    if (this.flushTimeout) {
      clearInterval(this.flushTimeout);
    }

    await this.flush();

    for (const exporter of this.exporters) {
      await exporter.shutdown();
    }
  }

  private startFlushInterval(): void {
    if (typeof window !== 'undefined') {
      this.flushTimeout = setInterval(() => {
        this.flush();
      }, this.flushInterval);

      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }
}

// Trace context propagation (W3C Trace Context)
export const traceContextPropagator = {
  // Inject trace context into headers
  inject(context: TraceContext, headers: Record<string, string>): void {
    headers['traceparent'] = `00-${context.traceId}-${context.spanId}-0${context.traceFlags}`;
    if (context.traceState) {
      headers['tracestate'] = context.traceState;
    }
  },

  // Extract trace context from headers
  extract(headers: Record<string, string | undefined>): TraceContext | null {
    const traceparent = headers['traceparent'];
    if (!traceparent) return null;

    const parts = traceparent.split('-');
    if (parts.length !== 4) return null;

    return {
      traceId: parts[1],
      spanId: parts[2],
      traceFlags: parseInt(parts[3], 16),
      traceState: headers['tracestate'],
    };
  },
};

// Fetch instrumentation
export function instrumentFetch(tracer: Tracer): void {
  const originalFetch = window.fetch;

  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method || 'GET';

    return tracer.startActiveSpan(
      `HTTP ${method}`,
      async (span) => {
        span.setAttributes({
          'http.method': method,
          'http.url': url,
          'span.kind': 'client',
        });

        // Inject trace context
        const headers = new Headers(init?.headers);
        const traceContext = span.getTraceContext();
        traceContextPropagator.inject(traceContext, {
          traceparent: '',
          tracestate: '',
        });

        try {
          const response = await originalFetch(input, {
            ...init,
            headers,
          });

          span.setAttributes({
            'http.status_code': response.status,
            'http.response_content_length': response.headers.get('content-length') || 0,
          });

          if (!response.ok) {
            span.setStatus(SpanStatus.ERROR);
          }

          return response;
        } catch (error) {
          span.setStatus(SpanStatus.ERROR);
          throw error;
        }
      },
      { kind: SpanKind.CLIENT }
    );
  };
}

// Create default tracer
const tracerExporters: TraceExporter[] = [new ConsoleExporter()];

// Add remote exporter if configured
if (typeof import.meta !== 'undefined' && import.meta.env) {
  const jaegerEndpoint = import.meta.env.VITE_JAEGER_ENDPOINT;
  if (jaegerEndpoint) {
    tracerExporters.push(new HTTPExporter(jaegerEndpoint, { format: 'jaeger' }));
  }

  const otlpEndpoint = import.meta.env.VITE_OTLP_ENDPOINT;
  if (otlpEndpoint) {
    tracerExporters.push(new HTTPExporter(otlpEndpoint, { format: 'otlp' }));
  }
}

export const tracer = new Tracer('craftlocal-web', {
  exporters: tracerExporters,
});

// Export classes
export { Tracer, Span, ConsoleExporter, HTTPExporter };
export default tracer;
