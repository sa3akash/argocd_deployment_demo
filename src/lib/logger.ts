// Structured logger with correlation / trace ID support

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  traceId?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
  error?: string;
}

class Logger {
  private isProduction = process.env.NODE_ENV === "production";

  private format(entry: LogEntry): string {
    if (this.isProduction) {
      // In production, emit single-line JSON for easy log aggregation (Elastic, Loki, CloudWatch, Datadog)
      return JSON.stringify(entry);
    }

    // In development / local, emit colored human-readable logs
    const colorMap: Record<LogLevel, string> = {
      DEBUG: "\x1b[36m", // Cyan
      INFO: "\x1b[32m",  // Green
      WARN: "\x1b[33m",  // Yellow
      ERROR: "\x1b[31m", // Red
    };
    const reset = "\x1b[0m";
    const dim = "\x1b[2m";
    const trace = entry.traceId ? ` [trace: ${entry.traceId}]` : "";
    const duration = entry.durationMs !== undefined ? ` (${entry.durationMs.toFixed(1)}ms)` : "";
    const meta = entry.metadata && Object.keys(entry.metadata).length > 0
      ? `\n  ${dim}${JSON.stringify(entry.metadata)}${reset}`
      : "";
    const err = entry.error ? `\n  ${colorMap.ERROR}${entry.error}${reset}` : "";

    return `${dim}${entry.timestamp}${reset} ${colorMap[entry.level]}[${entry.level}]${reset}${trace} ${entry.message}${duration}${meta}${err}`;
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>, traceId?: string, durationMs?: number, err?: unknown) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      traceId,
      durationMs,
      metadata,
      error: err instanceof Error ? `${err.name}: ${err.message}\n${err.stack}` : err ? String(err) : undefined,
    };

    const formatted = this.format(entry);
    switch (level) {
      case "ERROR":
        console.error(formatted);
        break;
      case "WARN":
        console.warn(formatted);
        break;
      default:
        if (!this.isProduction) {
          console.log(formatted);
        }
        break;
    }
  }

  info(message: string, metadata?: Record<string, unknown>, traceId?: string, durationMs?: number) {
    this.log("INFO", message, metadata, traceId, durationMs);
  }

  warn(message: string, metadata?: Record<string, unknown>, traceId?: string, durationMs?: number) {
    this.log("WARN", message, metadata, traceId, durationMs);
  }

  error(message: string, err?: unknown, metadata?: Record<string, unknown>, traceId?: string, durationMs?: number) {
    this.log("ERROR", message, metadata, traceId, durationMs, err);
  }

  debug(message: string, metadata?: Record<string, unknown>, traceId?: string, durationMs?: number) {
    this.log("DEBUG", message, metadata, traceId, durationMs);
  }
}

export const logger = new Logger();
