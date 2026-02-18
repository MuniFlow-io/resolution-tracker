type LogContext = Record<string, unknown>;

function write(level: "info" | "warn" | "error", message: string, context?: LogContext) {
  const payload = context ? ` ${JSON.stringify(context)}` : "";
  if (level === "error") {
    console.error(`[${level.toUpperCase()}] ${message}${payload}`);
    return;
  }
  if (level === "warn") {
    console.warn(`[${level.toUpperCase()}] ${message}${payload}`);
    return;
  }
  console.info(`[${level.toUpperCase()}] ${message}${payload}`);
}

export const logger = {
  info: (message: string, context?: LogContext) => write("info", message, context),
  warn: (message: string, context?: LogContext) => write("warn", message, context),
  error: (message: string, context?: LogContext) => write("error", message, context),
};

