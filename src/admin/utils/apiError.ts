// src/admin/utils/apiError.ts
// Typed error extraction — replaces `err: any` throughout the codebase.

/**
 * Extracts a human-readable error message from an unknown Axios/API error.
 * Never uses `any`; safe for TypeScript strict mode.
 */
export function getApiError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;

    // Axios-style: err.response.data.message
    const response = e.response as Record<string, unknown> | undefined;
    if (response) {
      const data = response.data as Record<string, unknown> | undefined;
      if (typeof data?.message === 'string') return data.message;
      if (typeof data?.error === 'string') return data.error;
    }

    // Standard Error object
    if (typeof e.message === 'string') return e.message;
  }
  return fallback;
}
