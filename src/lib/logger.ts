// Logger utility for consistent logging across the application
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private level: LogLevel;
  private context?: string;

  constructor(level: LogLevel = LogLevel.INFO, context?: string) {
    this.level = level;
    this.context = context;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(level: LogLevel, message: string, data?: Record<string, unknown>, error?: Error): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const context = this.context ? `[${this.context}]` : '';
    
    let formatted = `${timestamp} ${levelName}${context}: ${message}`;
    
    if (data && Object.keys(data).length > 0) {
      formatted += ` | Data: ${JSON.stringify(data)}`;
    }
    
    if (error) {
      formatted += ` | Error: ${error.message}`;
      if (error.stack) {
        formatted += ` | Stack: ${error.stack}`;
      }
    }
    
    return formatted;
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, data, error);

    switch (level) {
      case LogLevel.DEBUG:
        if (process.env.NODE_ENV === 'development') {
          console.debug(formattedMessage);
        }
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }

    // In production, you might want to send logs to a service like Sentry
    if (level === LogLevel.ERROR && process.env.NODE_ENV === 'production') {
      this.sendToErrorService(error || new Error(message), data);
    }
  }

  private sendToErrorService(error: Error, data?: Record<string, unknown>): void {
    // TODO: Implement error reporting service (Sentry, LogRocket, etc.)
    // For now, we'll just log to console in production
    if (typeof window !== 'undefined') {
      // Client-side error reporting
      console.error('Production error:', error, data);
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: Record<string, unknown>, error?: Error): void {
    this.log(LogLevel.WARN, message, data, error);
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, data, error);
  }

  // Convenience methods for common scenarios
  apiError(endpoint: string, status: number, message: string, data?: Record<string, unknown>): void {
    this.error(`API Error [${endpoint}] (${status}): ${message}`, undefined, {
      endpoint,
      status,
      ...data,
    });
  }

  walletError(operation: string, error: Error, data?: Record<string, unknown>): void {
    this.error(`Wallet Error [${operation}]: ${error.message}`, error, {
      operation,
      ...data,
    });
  }

  transactionError(operation: string, txId: string, error: Error, data?: Record<string, unknown>): void {
    this.error(`Transaction Error [${operation}]: ${error.message}`, error, {
      operation,
      txId,
      ...data,
    });
  }

  // Create a logger with context
  withContext(context: string): Logger {
    return new Logger(this.level, context);
  }
}

// Default logger instance
export const logger = new Logger(
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
);

// Specialized loggers for different parts of the application
export const apiLogger = logger.withContext('API');
export const walletLogger = logger.withContext('Wallet');
export const transactionLogger = logger.withContext('Transaction');
export const authLogger = logger.withContext('Auth');
export const dbLogger = logger.withContext('Database');
export const uiLogger = logger.withContext('UI');
