/**
 * Centralized logger. In production this writes structured JSON lines that
 * can be shipped to any log aggregator (Vercel Log Drains, Datadog, etc).
 * No `console.log` is used anywhere else in the codebase — every log goes
 * through this module so the format and destination stay consistent.
 */

type LogCategory = 'auth' | 'lead' | 'assignment' | 'error' | 'http';

interface LogPayload {
  category: LogCategory;
  message: string;
  meta?: Record<string, unknown>;
  userId?: string;
}

function write(level: 'info' | 'warn' | 'error', payload: LogPayload) {
  const entry = {
    level,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else if (process.env.NODE_ENV !== 'production') {
    console.info(line);
  }
}

export const logger = {
  auth: (message: string, meta?: Record<string, unknown>) => write('info', { category: 'auth', message, meta }),
  lead: (message: string, meta?: Record<string, unknown>) => write('info', { category: 'lead', message, meta }),
  assignment: (message: string, meta?: Record<string, unknown>) =>
    write('info', { category: 'assignment', message, meta }),
  http: (message: string, meta?: Record<string, unknown>) => write('info', { category: 'http', message, meta }),
  error: (message: string, meta?: Record<string, unknown>) => write('error', { category: 'error', message, meta }),
};
