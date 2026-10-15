/** The reasons the API gives for refusing or failing a request. */
export type ApiErrorCode =
  | 'bad_request'
  | 'forbidden'
  | 'not_found'
  | 'payload_too_large'
  | 'rate_limited'
  | 'unavailable'
  | 'internal';

/** An error that is safe to show to the caller: its message is written for them. */
export class ApiError extends Error {
  constructor(
    readonly status: 400 | 401 | 403 | 404 | 413 | 429 | 500 | 503,
    readonly code: ApiErrorCode,
    message: string,
    readonly retryAt?: string,
  ) {
    super(message);
  }
}

/** The JSON every failed request returns, with the id to quote when reporting it. */
export function errorBody(error: ApiError, requestId: string) {
  return {
    error: {
      code: error.code,
      message: error.message,
      ...(error.retryAt && { retryAt: error.retryAt }),
    },
    requestId,
  };
}

/** Methods that can change something, and so must come from the site itself. */
const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

/** True when a request is allowed to change something: it came from the site's own origin. */
export function fromSiteOrigin(method: string, origin: string | null, own: string, site?: string) {
  if (SAFE.has(method)) return true;
  if (!origin) return false;
  return origin === own || (site !== undefined && origin === site);
}
