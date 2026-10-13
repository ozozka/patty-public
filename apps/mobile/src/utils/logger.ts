/**
 * Centralized logging service for the application.
 * Replaces console.error with structured logging.
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

class Logger {
  private logs: LogEntry[] = [];
  private readonly maxLogs = 100;

  private stringify(obj: unknown): string {
    return JSON.stringify(obj, (key, value) => {
      if (value instanceof Error) {
        return {
          name: value.name,
          message: value.message,
          stack: value.stack,
        };
      }
      return value;
    });
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
  ) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    const output = this.stringify(entry);

    switch (level) {
      case 'error':
        console.error(output);
        // In production, you would typically forward this to an error monitoring service
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'info':
        if (__DEV__) {
          console.log(output);
        }
        break;
      case 'debug':
        if (__DEV__) {
          console.log(output);
        }
        break;
    }
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log('error', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level);
    }
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = new Logger();
