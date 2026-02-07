/**
 * useTracing Hook
 * React hook for distributed tracing in components
 */

import { useCallback, useEffect, useRef } from 'react';
import { tracer, Span, SpanKind, SpanStatus, SpanAttributeValue } from '@/lib/tracing';
import { useAuth } from '@/hooks/useAuth';

interface UseTracingOptions {
  component?: string;
  attributes?: Record<string, SpanAttributeValue>;
}

interface TracingMethods {
  startSpan: (name: string, attributes?: Record<string, SpanAttributeValue>) => Span;
  withSpan: <T>(name: string, fn: () => T | Promise<T>, attributes?: Record<string, SpanAttributeValue>) => Promise<T>;
  traceAsync: <T>(name: string, fn: () => Promise<T>, attributes?: Record<string, SpanAttributeValue>) => Promise<T>;
  traceCallback: <T extends (...args: unknown[]) => unknown>(
    name: string,
    fn: T,
    attributes?: Record<string, SpanAttributeValue>
  ) => T;
  traceEvent: (eventName: string, attributes?: Record<string, SpanAttributeValue>) => void;
  getCurrentTraceId: () => string | undefined;
}

export function useTracing(options: UseTracingOptions = {}): TracingMethods {
  const { user } = useAuth();
  const componentRef = useRef(options.component);
  const componentSpanRef = useRef<Span | null>(null);

  // Start component span on mount
  useEffect(() => {
    if (componentRef.current) {
      componentSpanRef.current = tracer.startSpan(`component:${componentRef.current}`, {
        kind: SpanKind.INTERNAL,
        attributes: {
          'component.name': componentRef.current,
          'user.id': user?.id || 'anonymous',
          ...options.attributes,
        },
      });
    }

    return () => {
      if (componentSpanRef.current) {
        componentSpanRef.current.end();
        componentSpanRef.current = null;
      }
    };
  }, [user?.id, options.attributes]);

  // Start a new span
  const startSpan = useCallback((
    name: string,
    attributes?: Record<string, SpanAttributeValue>
  ): Span => {
    const fullName = componentRef.current ? `${componentRef.current}.${name}` : name;
    return tracer.startSpan(fullName, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'component.name': componentRef.current || 'unknown',
        ...attributes,
      },
    });
  }, []);

  // Wrap a function with a span
  const withSpan = useCallback(async <T,>(
    name: string,
    fn: () => T | Promise<T>,
    attributes?: Record<string, SpanAttributeValue>
  ): Promise<T> => {
    const span = startSpan(name, attributes);

    try {
      const result = await fn();
      span.setStatus(SpanStatus.OK);
      return result;
    } catch (error) {
      if (error instanceof Error) {
        span.recordException(error);
      }
      span.setStatus(SpanStatus.ERROR);
      throw error;
    } finally {
      span.end();
    }
  }, [startSpan]);

  // Trace an async function
  const traceAsync = useCallback(<T,>(
    name: string,
    fn: () => Promise<T>,
    attributes?: Record<string, SpanAttributeValue>
  ): Promise<T> => {
    return withSpan(name, fn, attributes);
  }, [withSpan]);

  // Create a traced callback
  const traceCallback = useCallback(<T extends (...args: unknown[]) => unknown>(
    name: string,
    fn: T,
    attributes?: Record<string, SpanAttributeValue>
  ): T => {
    return ((...args: unknown[]) => {
      const span = startSpan(name, attributes);

      try {
        const result = fn(...args);

        if (result instanceof Promise) {
          return result
            .then((res) => {
              span.setStatus(SpanStatus.OK);
              span.end();
              return res;
            })
            .catch((err) => {
              if (err instanceof Error) {
                span.recordException(err);
              }
              span.setStatus(SpanStatus.ERROR);
              span.end();
              throw err;
            });
        }

        span.setStatus(SpanStatus.OK);
        span.end();
        return result;
      } catch (error) {
        if (error instanceof Error) {
          span.recordException(error);
        }
        span.setStatus(SpanStatus.ERROR);
        span.end();
        throw error;
      }
    }) as T;
  }, [startSpan]);

  // Record a trace event
  const traceEvent = useCallback((
    eventName: string,
    attributes?: Record<string, SpanAttributeValue>
  ): void => {
    const currentSpan = tracer.getCurrentSpan();
    if (currentSpan) {
      currentSpan.addEvent(eventName, attributes);
    } else if (componentSpanRef.current) {
      componentSpanRef.current.addEvent(eventName, attributes);
    }
  }, []);

  // Get current trace ID
  const getCurrentTraceId = useCallback((): string | undefined => {
    const currentSpan = tracer.getCurrentSpan();
    return currentSpan?.getContext().traceId;
  }, []);

  return {
    startSpan,
    withSpan,
    traceAsync,
    traceCallback,
    traceEvent,
    getCurrentTraceId,
  };
}

// Higher-order component for automatic tracing
export function withTracing<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function TracedComponent(props: P) {
    const tracing = useTracing({ component: componentName });

    // Component is automatically traced via useTracing
    return <WrappedComponent {...props} />;
  };
}

// Hook for tracing user interactions
export function useInteractionTracing() {
  const tracing = useTracing({ component: 'interactions' });

  const traceClick = useCallback((
    elementName: string,
    handler: () => void,
    attributes?: Record<string, SpanAttributeValue>
  ) => {
    return () => {
      tracing.withSpan(`click:${elementName}`, handler, {
        'interaction.type': 'click',
        'interaction.element': elementName,
        ...attributes,
      });
    };
  }, [tracing]);

  const traceSubmit = useCallback(<T,>(
    formName: string,
    handler: () => Promise<T>,
    attributes?: Record<string, SpanAttributeValue>
  ): (() => Promise<T>) => {
    return () => {
      return tracing.withSpan(`submit:${formName}`, handler, {
        'interaction.type': 'submit',
        'interaction.form': formName,
        ...attributes,
      });
    };
  }, [tracing]);

  const traceNavigation = useCallback((
    destination: string,
    attributes?: Record<string, SpanAttributeValue>
  ) => {
    const span = tracing.startSpan(`navigate:${destination}`, {
      'navigation.destination': destination,
      'navigation.from': typeof window !== 'undefined' ? window.location.pathname : '',
      ...attributes,
    });
    span.end();
  }, [tracing]);

  return {
    traceClick,
    traceSubmit,
    traceNavigation,
    ...tracing,
  };
}

// Hook for tracing API calls
export function useApiTracing() {
  const tracing = useTracing({ component: 'api' });

  const traceApiCall = useCallback(<T,>(
    endpoint: string,
    method: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    return tracing.withSpan(`api:${method} ${endpoint}`, fn, {
      'http.method': method,
      'http.url': endpoint,
      'span.kind': 'client',
    });
  }, [tracing]);

  const traceQuery = useCallback(<T,>(
    queryName: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    return tracing.withSpan(`query:${queryName}`, fn, {
      'db.operation': 'query',
      'db.query.name': queryName,
    });
  }, [tracing]);

  const traceMutation = useCallback(<T,>(
    mutationName: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    return tracing.withSpan(`mutation:${mutationName}`, fn, {
      'db.operation': 'mutation',
      'db.mutation.name': mutationName,
    });
  }, [tracing]);

  return {
    traceApiCall,
    traceQuery,
    traceMutation,
    ...tracing,
  };
}

export default useTracing;
