/**
 * Centralized Logging System
 * Provides structured logging with multiple backend support
 *
 * Supports:
 * - Console logging (development)
 * - Remote logging (Datadog, ELK, Splunk)
 * - Log levels (debug, info, warn, error)
 * - Structured log entries
 * - Automatic context enrichment
 * - Performance tracking
 * - Error aggregation
 */

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Log entry structure
export interface LogEntry {
  timestamp: string;
  level: keyof typeof LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata: {
    service: string;
    environment: string;
    version: string;
    sessionId?: string;
    userId?: string;
    requestId?: string;
    traceId?: string;
    spanId?: string;
  };
  performance?: {
    duration?: number;
    memoryUsage?: number;
  };
}

// Logger configuration
export interface LoggerConfig {
  service: string;
  environment: string;
  version: string;
  minLevel: LogLevel;
  enabled: boolean;
  backends: LogBackend[];
  sanitize: boolean;
  maxLogSize: number;
  batchSize: number;
  flushInterval: number;
}

// Log backend interface
export interface LogBackend {
  name: string;
  send(entries: LogEntry[]): Promise<void>;
  isAvailable(): boolean;
}

// Sensitive data patterns to sanitize
const SENSITIVE_PATTERNS = [
  { pattern: /password['":\s]*['"][^'"]+['"]/gi, replacement: 'password: "[REDACTED]"' },
  { pattern: /token['":\s]*['"][^'"]+['"]/gi, replacement: 'token: "[REDACTED]"' },
  { pattern: /api[_-]?key['":\s]*['"][^'"]+['"]/gi, replacement: 'api_key: "[REDACTED]"' },
  { pattern: /secret['":\s]*['"][^'"]+['"]/gi, replacement: 'secret: "[REDACTED]"' },
  { pattern: /bearer\s+[a-zA-Z0-9._-]+/gi, replacement: 'Bearer [REDACTED]' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL]' },
  { pattern: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, replacement: '[CARD]' },
];

// Console backend
class ConsoleBackend implements LogBackend {
  name = 'console';

  async send(entries: LogEntry[]): Promise<void> {
    for (const entry of entries) {
      const color = this.getColor(entry.level);
      const timestamp = new Date(entry.timestamp).toISOString();
      const prefix = `[${timestamp}] [${entry.level}]`;

      if (entry.error) {
        console[this.getMethod(entry.level)](
          `${color}${prefix} ${entry.message}`,
          entry.context || '',
          '\n',
          entry.error.stack || entry.error.message
        );
      } else {
        console[this.getMethod(entry.level)](
          `${color}${prefix} ${entry.message}`,
          entry.context || ''
        );
      }
    }
  }

  isAvailable(): boolean {
    return typeof console !== 'undefined';
  }

  private getColor(level: string): string {
    if (typeof window === 'undefined') {
      // Node.js colors
      switch (level) {
        case 'DEBUG': return '\x1b[36m'; // Cyan
        case 'INFO': return '\x1b[32m';  // Green
        case 'WARN': return '\x1b[33m';  // Yellow
        case 'ERROR': return '\x1b[31m'; // Red
        default: return '\x1b[0m';
      }
    }
    return ''; // Browser doesn't need colors
  }

  private getMethod(level: string): 'debug' | 'info' | 'warn' | 'error' {
    switch (level) {
      case 'DEBUG': return 'debug';
      case 'INFO': return 'info';
      case 'WARN': return 'warn';
      case 'ERROR': return 'error';
      default: return 'log';
    }
  }
}

// Remote HTTP backend (for Datadog, ELK, custom endpoints)
class RemoteBackend implements LogBackend {
  name: string;
  private endpoint: string;
  private apiKey?: string;
  private headers: Record<string, string>;

  constructor(
    name: string,
    endpoint: string,
    options: { apiKey?: string; headers?: Record<string, string> } = {}
  ) {
    this.name = name;
    this.endpoint = endpoint;
    this.apiKey = options.apiKey;
    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      this.headers['DD-API-KEY'] = this.apiKey; // Datadog format
      this.headers['Authorization'] = `Bearer ${this.apiKey}`; // Generic format
    }
  }

  async send(entries: LogEntry[]): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(entries),
      });

      if (!response.ok) {
        console.error(`[${this.name}] Failed to send logs: ${response.status}`);
      }
    } catch (error) {
      console.error(`[${this.name}] Error sending logs:`, error);
    }
  }

  isAvailable(): boolean {
    return typeof fetch !== 'undefined' && !!this.endpoint;
  }
}

// Datadog backend with specific formatting
class DatadogBackend extends RemoteBackend {
  constructor(apiKey: string, site: string = 'datadoghq.com') {
    super(
      'datadog',
      `https://http-intake.logs.${site}/api/v2/logs`,
      { apiKey }
    );
  }

  async send(entries: LogEntry[]): Promise<void> {
    // Transform to Datadog format
    const datadogEntries = entries.map(entry => ({
      ddsource: entry.metadata.service,
      ddtags: `env:${entry.metadata.environment},version:${entry.metadata.version}`,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
      message: entry.message,
      status: entry.level.toLowerCase(),
      ...entry.context,
      error: entry.error,
      trace_id: entry.metadata.traceId,
      span_id: entry.metadata.spanId,
    }));

    await super.send(datadogEntries as unknown as LogEntry[]);
  }
}

// Logger class
class Logger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private sessionId: string;
  private flushTimeout?: ReturnType<typeof setTimeout>;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      service: config.service || 'craftlocal',
      environment: config.environment || this.getEnvironment(),
      version: config.version || '1.0.0',
      minLevel: config.minLevel ?? (this.isDevelopment() ? LogLevel.DEBUG : LogLevel.INFO),
      enabled: config.enabled ?? true,
      backends: config.backends || [new ConsoleBackend()],
      sanitize: config.sanitize ?? true,
      maxLogSize: config.maxLogSize ?? 10000,
      batchSize: config.batchSize ?? 10,
      flushInterval: config.flushInterval ?? 5000,
    };

    this.sessionId = this.generateSessionId();
    this.startFlushInterval();
  }

  // Public logging methods
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    const errorDetails = error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : error
        ? { name: 'Error', message: String(error) }
        : undefined;

    this.log(LogLevel.ERROR, message, context, errorDetails);
  }

  // Performance logging
  startTimer(operationName: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.info(`[PERF] ${operationName} completed`, {
        operation: operationName,
        duration: Math.round(duration * 100) / 100,
        durationUnit: 'ms',
      });
    };
  }

  // Group related logs
  group(groupName: string): { end: () => void; log: Logger } {
    const groupLogger = this.child({ group: groupName });
    groupLogger.debug(`[GROUP START] ${groupName}`);

    return {
      log: groupLogger,
      end: () => {
        groupLogger.debug(`[GROUP END] ${groupName}`);
      },
    };
  }

  // Create child logger with additional context
  child(additionalContext: Record<string, unknown>): Logger {
    const childLogger = new Logger({ ...this.config });
    childLogger.sessionId = this.sessionId;
    // Attach additional context that will be included in all logs
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level: LogLevel, message: string, context?: Record<string, unknown>, error?: LogEntry['error']) => {
      originalLog(level, message, { ...additionalContext, ...context }, error);
    };
    return childLogger;
  }

  // Set user context
  setUser(userId: string): void {
    this.info('User context set', { userId });
  }

  // Set request/trace context
  setTraceContext(traceId: string, spanId?: string): void {
    // This would typically be stored and included in subsequent logs
    this.debug('Trace context set', { traceId, spanId });
  }

  // Flush buffered logs immediately
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    const sendPromises = this.config.backends
      .filter(backend => backend.isAvailable())
      .map(backend => backend.send(entries).catch(err => {
        console.error(`Failed to send logs to ${backend.name}:`, err);
      }));

    await Promise.all(sendPromises);
  }

  // Private methods
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: LogEntry['error']
  ): void {
    if (!this.config.enabled) return;
    if (level < this.config.minLevel) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level] as keyof typeof LogLevel,
      message: this.sanitizeMessage(message),
      context: context ? this.sanitizeContext(context) : undefined,
      error,
      metadata: {
        service: this.config.service,
        environment: this.config.environment,
        version: this.config.version,
        sessionId: this.sessionId,
      },
    };

    // Add performance data for errors
    if (level === LogLevel.ERROR && typeof performance !== 'undefined') {
      entry.performance = {
        memoryUsage: this.getMemoryUsage(),
      };
    }

    this.buffer.push(entry);

    // Flush immediately for errors
    if (level === LogLevel.ERROR) {
      this.flush();
    } else if (this.buffer.length >= this.config.batchSize) {
      this.flush();
    }
  }

  private sanitizeMessage(message: string): string {
    if (!this.config.sanitize) return message;

    let sanitized = message;
    for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, replacement);
    }
    return sanitized.substring(0, this.config.maxLogSize);
  }

  private sanitizeContext(context: Record<string, unknown>): Record<string, unknown> {
    if (!this.config.sanitize) return context;

    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'api_key', 'authorization', 'cookie'];

    for (const [key, value] of Object.entries(context)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string') {
        sanitized[key] = this.sanitizeMessage(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeContext(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private getEnvironment(): string {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.MODE || 'development';
    }
    return 'development';
  }

  private isDevelopment(): boolean {
    return this.getEnvironment() === 'development';
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private getMemoryUsage(): number | undefined {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
      return memory?.usedJSHeapSize;
    }
    return undefined;
  }

  private startFlushInterval(): void {
    if (typeof window !== 'undefined') {
      this.flushTimeout = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);

      // Flush on page unload
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  // Cleanup
  destroy(): void {
    if (this.flushTimeout) {
      clearInterval(this.flushTimeout);
    }
    this.flush();
  }
}

// Export singleton instance
const loggerConfig: Partial<LoggerConfig> = {
  service: 'craftlocal-web',
  version: '1.0.0',
  backends: [new ConsoleBackend()],
};

// Add remote backend if configured
if (typeof import.meta !== 'undefined' && import.meta.env) {
  const datadogApiKey = import.meta.env.VITE_DATADOG_API_KEY;
  if (datadogApiKey) {
    loggerConfig.backends?.push(new DatadogBackend(datadogApiKey));
  }

  const elkEndpoint = import.meta.env.VITE_ELK_ENDPOINT;
  if (elkEndpoint) {
    loggerConfig.backends?.push(new RemoteBackend('elk', elkEndpoint));
  }
}

export const logger = new Logger(loggerConfig);

// Export classes for custom configurations
export { Logger, ConsoleBackend, RemoteBackend, DatadogBackend };

// Convenience exports
export default logger;
