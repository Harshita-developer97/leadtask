import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from './logger';

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors?: Record<string, string[]> | null;
}

export function ok<T>(data: T, message = 'OK', status = 200) {
  const body: ApiSuccess<T> = { success: true, message, data };
  return NextResponse.json(body, { status });
}

export function created<T>(data: T, message = 'Created') {
  return ok(data, message, 201);
}

export function fail(message: string, status = 400, errors: Record<string, string[]> | null = null) {
  const body: ApiFailure = { success: false, message, errors };
  return NextResponse.json(body, { status });
}

export function unauthorized(message = 'Authentication required') {
  return fail(message, 401);
}

export function forbidden(message = 'You do not have permission to perform this action') {
  return fail(message, 403);
}

export function notFound(message = 'Resource not found') {
  return fail(message, 404);
}

/**
 * Wraps a route handler so that every unhandled error is caught, logged
 * server-side, and turned into a safe structured response. Stack traces
 * are never sent to the client.
 */
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.flatten().fieldErrors as Record<string, string[]>;
        return fail('Validation failed', 422, errors);
      }

      if (error instanceof ApiError) {
        return fail(error.message, error.status);
      }

      logger.error('Unhandled route error', {
        error: error instanceof Error ? error.message : String(error),
      });

      return fail('Something went wrong. Please try again later.', 500);
    }
  };
}

/**
 * Thrown by services when a known, expected business-rule failure occurs
 * (e.g. "email already registered"). Caught by withErrorHandling and turned
 * into the right status code instead of a generic 500.
 */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}
