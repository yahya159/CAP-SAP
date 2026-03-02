// Shared async utilities for feature hooks

/**
 * Checks whether an error is an OData abort error (request was cancelled).
 * These should typically be ignored in UI error handling.
 */
export const isAbortError = (error: unknown): boolean =>
  Boolean(
    error &&
      typeof error === 'object' &&
      'isAbort' in error &&
      (error as { isAbort?: boolean }).isAbort
  );
