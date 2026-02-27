// CAP OData v4 client – shared infrastructure (config, fetch, CRUD helpers, types)

import type {
  User,
  Project,
  Timesheet,
  Evaluation,
  Deliverable,
  Ticket,
  Notification,
  ReferenceData,
  Allocation,
  LeaveRequest,
  TimeLog,
  Imputation,
  ImputationPeriod,
  DocumentationObject,
  Wricef,
  WricefObject,
  Abaque,
} from '../../types/entities';

// Re-export entity types so per-API modules need only import from core
export type {
  User,
  Project,
  Timesheet,
  Evaluation,
  Deliverable,
  Ticket,
  Notification,
  ReferenceData,
  Allocation,
  LeaveRequest,
  TimeLog,
  Imputation,
  ImputationPeriod,
  DocumentationObject,
  Wricef,
  WricefObject,
  Abaque,
};

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ODATA_BASE_URL = import.meta.env.VITE_ODATA_BASE_URL || '/odata/v4/performance';
const ODATA_OBSERVABILITY_ENABLED = import.meta.env.VITE_ODATA_OBSERVABILITY === 'true';
const ODATA_AUTH_TOKEN_STORAGE_KEY = 'odata.auth.token';

export interface ODataClientConfig {
  credentials: RequestCredentials;
  csrf: {
    enabled: boolean;
    headerName: string;
  };
  observability: {
    enabled: boolean;
    requestIdHeader: string;
    logger?: (event: ODataRequestLogEvent) => void;
  };
}

let odataClientConfig: ODataClientConfig = {
  credentials: 'same-origin',
  csrf: {
    enabled: false,
    headerName: 'x-csrf-token',
  },
  observability: {
    enabled: ODATA_OBSERVABILITY_ENABLED,
    requestIdHeader: 'x-request-id',
    logger: ODATA_OBSERVABILITY_ENABLED
      ? (event) => {
          // eslint-disable-next-line no-console
          console.debug('[ODataClient]', event);
        }
      : undefined,
  },
};

const readStoredAuthToken = (): string | null => {
  try {
    const token = localStorage.getItem(ODATA_AUTH_TOKEN_STORAGE_KEY);
    return token && token.trim() ? token : null;
  } catch {
    return null;
  }
};

const persistAuthToken = (token: string | null): void => {
  try {
    if (token) localStorage.setItem(ODATA_AUTH_TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(ODATA_AUTH_TOKEN_STORAGE_KEY);
  } catch {
    // ignore storage failures
  }
};

let odataAuthToken: string | null = readStoredAuthToken();

export const getODataClientConfig = (): ODataClientConfig => odataClientConfig;
export const getODataAuthToken = (): string | null => odataAuthToken;

export const setODataAuthToken = (token: string | null): void => {
  const normalized = token?.trim() || null;
  odataAuthToken = normalized;
  persistAuthToken(normalized);
};

// ---------------------------------------------------------------------------
// Token expiry / 401 event bus
// ---------------------------------------------------------------------------

type AuthExpiredListener = () => void;
const authExpiredListeners = new Set<AuthExpiredListener>();

/** Register a callback invoked when the server returns 401 (token expired/invalid). */
export const onAuthExpired = (listener: AuthExpiredListener): (() => void) => {
  authExpiredListeners.add(listener);
  return () => { authExpiredListeners.delete(listener); };
};

const notifyAuthExpired = (): void => {
  authExpiredListeners.forEach((listener) => {
    try { listener(); } catch { /* listener errors should not break the client */ }
  });
};

export const configureODataClient = (config: Partial<ODataClientConfig>): void => {
  odataClientConfig = {
    ...odataClientConfig,
    ...config,
    csrf: {
      ...odataClientConfig.csrf,
      ...(config.csrf ?? {}),
    },
    observability: {
      ...odataClientConfig.observability,
      ...(config.observability ?? {}),
    },
  };
};

// ---------------------------------------------------------------------------
// OData types
// ---------------------------------------------------------------------------

export interface ODataQueryOptions {
  $filter?: string;
  $select?: string;
  $expand?: string;
  $orderby?: string;
  $top?: number;
  $skip?: number;
  $count?: boolean;
  $search?: string;
}

export interface ODataResponse<T> {
  '@odata.context'?: string;
  '@odata.count'?: number;
  '@odata.nextLink'?: string;
  value: T[];
}

export interface ODataSingleResponse<T> {
  '@odata.context'?: string;
  '@odata.etag'?: string;
  value?: T;
}

type ODataRawMessage =
  | string
  | {
      lang?: string;
      value?: string;
      message?: string;
    };

interface ODataRawDetail {
  code?: string | number;
  message?: ODataRawMessage;
  target?: string;
  severity?: string;
}

interface ODataRawErrorPayload {
  code?: string | number;
  message?: ODataRawMessage;
  target?: string;
  details?: ODataRawDetail[];
  innererror?: {
    errordetails?: ODataRawDetail[];
    details?: ODataRawDetail[];
    message?: ODataRawMessage;
    originalMessage?: ODataRawMessage;
    cause?: unknown;
  };
}

export interface ODataError {
  error?: ODataRawErrorPayload;
  code?: string | number;
  message?: ODataRawMessage;
  details?: ODataRawDetail[];
  target?: string;
  innererror?: ODataRawErrorPayload['innererror'];
}

export interface ODataNormalizedError {
  name: 'ODataClientError';
  message: string;
  status: number;
  statusText: string;
  code: string;
  target?: string;
  details: Array<{
    code: string;
    message: string;
    target?: string;
  }>;
  isAbort: boolean;
  endpoint: string;
  requestId?: string;
}

export interface ODataRequestOptions extends RequestInit {
  timeoutMs?: number;
  ifMatch?: string;
  requestId?: string;
}

export interface ODataPagedResult<T> {
  items: T[];
  count?: number;
  nextLink?: string;
}

export interface ODataListAllOptions {
  maxPages?: number;
}

export interface ODataRequestLogEvent {
  stage: 'request' | 'response' | 'error';
  requestId: string;
  endpoint: string;
  method: string;
  status?: number;
  durationMs?: number;
  message?: string;
  errorCode?: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

export function buildQueryString(options?: ODataQueryOptions): string {
  if (!options) return '';

  const params = new URLSearchParams();
  if (options.$filter) params.append('$filter', options.$filter);
  if (options.$select) params.append('$select', options.$select);
  if (options.$expand) params.append('$expand', options.$expand);
  if (options.$orderby) params.append('$orderby', options.$orderby);
  if (options.$top !== undefined) params.append('$top', options.$top.toString());
  if (options.$skip !== undefined) params.append('$skip', options.$skip.toString());
  if (options.$count) params.append('$count', 'true');
  if (options.$search) params.append('$search', options.$search);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

export const normalizeEntityRecord = <T>(value: T): T => {
  const record = asRecord(value);
  if (!record) return value;

  const normalized = { ...record };
  if ('ID' in record && !('id' in record)) {
    normalized.id = record.ID;
  }
  if ('modifiedAt' in record && !('updatedAt' in record)) {
    normalized.updatedAt = record.modifiedAt;
  }

  return normalized as T;
};

const normalizeEntityArray = <T>(items: T[]): T[] => items.map((item) => normalizeEntityRecord(item));

const toODataEntityPayload = (payload: unknown): unknown => {
  const record = asRecord(payload);
  if (!record) return payload;

  const normalized = { ...record };
  if ('id' in record && !('ID' in record)) {
    normalized.ID = record.id;
    delete normalized.id;
  }
  if ('updatedAt' in record && !('modifiedAt' in record)) {
    normalized.modifiedAt = record.updatedAt;
    delete normalized.updatedAt;
  }

  return normalized;
};

const toRawMessage = (value: unknown): ODataRawMessage | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  const record = asRecord(value);
  if (!record) return undefined;
  const message = typeof record.message === 'string' ? record.message : undefined;
  const nestedValue = typeof record.value === 'string' ? record.value : undefined;
  const lang = typeof record.lang === 'string' ? record.lang : undefined;
  if (!message && !nestedValue && !lang) return undefined;
  return {
    ...(lang ? { lang } : {}),
    ...(nestedValue ? { value: nestedValue } : {}),
    ...(message ? { message } : {}),
  };
};

const toRawDetail = (value: unknown): ODataRawDetail | null => {
  const record = asRecord(value);
  if (!record) return null;
  return {
    ...(typeof record.code === 'string' || typeof record.code === 'number'
      ? { code: record.code }
      : {}),
    ...(toRawMessage(record.message) ? { message: toRawMessage(record.message) } : {}),
    ...(typeof record.target === 'string' ? { target: record.target } : {}),
    ...(typeof record.severity === 'string' ? { severity: record.severity } : {}),
  };
};

const toRawDetailArray = (value: unknown): ODataRawDetail[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => toRawDetail(item))
    .filter((item): item is ODataRawDetail => Boolean(item));
};

function normalizeODataError(input: {
  endpoint: string;
  status?: number;
  statusText?: string;
  code?: string;
  message?: string;
  target?: string;
  details?: Array<{ code: string; message: string; target?: string }>;
  isAbort?: boolean;
  requestId?: string;
}): ODataNormalizedError {
  return {
    name: 'ODataClientError',
    message: input.message ?? 'OData request failed',
    status: input.status ?? 0,
    statusText: input.statusText ?? '',
    code: input.code ?? 'UNKNOWN',
    target: input.target,
    details: input.details ?? [],
    isAbort: Boolean(input.isAbort),
    endpoint: input.endpoint,
    requestId: input.requestId,
  };
}

function asErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Unknown error';
}

function extractODataMessage(message: ODataRawMessage | undefined): string | undefined {
  if (!message) return undefined;
  if (typeof message === 'string') return message;
  if (typeof message.value === 'string') return message.value;
  if (typeof message.message === 'string') return message.message;
  return undefined;
}

function normalizeODataDetails(details: ODataRawDetail[] | undefined): Array<{
  code: string;
  message: string;
  target?: string;
}> {
  if (!details || details.length === 0) return [];

  const normalized: Array<{ code: string; message: string; target?: string }> = [];
  details.forEach((detail) => {
    const message = extractODataMessage(detail.message);
    if (!message) return;

    normalized.push({
      code: String(detail.code ?? 'DETAIL'),
      message,
      ...(detail.target ? { target: detail.target } : {}),
    });
  });

  return normalized;
}

function pickODataErrorPayload(payload: unknown): ODataRawErrorPayload {
  const root = asRecord(payload);
  if (!root) return {};

  const nestedError =
    asRecord(root.error)?.error && asRecord(asRecord(root.error)?.error)
      ? asRecord(asRecord(root.error)?.error)
      : asRecord(root.error);

  const source = nestedError ?? root;
  const innererrorRecord = asRecord(source.innererror);

  const messageCandidate =
    toRawMessage(source.message) ??
    toRawMessage(source.error_description) ??
    toRawMessage(innererrorRecord?.message) ??
    toRawMessage(innererrorRecord?.originalMessage);

  return {
    ...(typeof source.code === 'string' || typeof source.code === 'number'
      ? { code: source.code }
      : {}),
    ...(messageCandidate ? { message: messageCandidate } : {}),
    ...(typeof source.target === 'string' ? { target: source.target } : {}),
    details: toRawDetailArray(source.details),
    innererror: innererrorRecord
      ? {
          errordetails: toRawDetailArray(innererrorRecord.errordetails),
          details: toRawDetailArray(innererrorRecord.details),
          ...(toRawMessage(innererrorRecord.message)
            ? { message: toRawMessage(innererrorRecord.message) }
            : {}),
          ...(toRawMessage(innererrorRecord.originalMessage)
            ? { originalMessage: toRawMessage(innererrorRecord.originalMessage) }
            : {}),
          ...(innererrorRecord.cause !== undefined ? { cause: innererrorRecord.cause } : {}),
        }
      : undefined,
  };
}

const createRequestId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const reportRequestEvent = (event: ODataRequestLogEvent): void => {
  if (!odataClientConfig.observability.enabled) return;
  odataClientConfig.observability.logger?.(event);
};

function combineAbortSignals(
  externalSignal?: AbortSignal | null,
  timeoutMs?: number
): { signal?: AbortSignal; cleanup: () => void } {
  if (!externalSignal && !timeoutMs) {
    return { signal: undefined, cleanup: () => undefined };
  }

  const controller = new AbortController();
  const cleanups: Array<() => void> = [];

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      const onAbort = () => controller.abort();
      externalSignal.addEventListener('abort', onAbort, { once: true });
      cleanups.push(() => externalSignal.removeEventListener('abort', onAbort));
    }
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  if (timeoutMs && timeoutMs > 0) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      cleanups.forEach((cleanup) => cleanup());
      if (timeoutId) clearTimeout(timeoutId);
    },
  };
}

async function parseODataErrorResponse(
  response: Response,
  endpoint: string,
  requestId?: string
): Promise<ODataNormalizedError> {
  const rawBody = await response.text();
  if (!rawBody) {
    return normalizeODataError({
      endpoint,
      status: response.status,
      statusText: response.statusText,
      code: String(response.status),
      message: response.statusText || 'OData request failed',
      requestId,
    });
  }

  let payload: unknown = null;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return normalizeODataError({
      endpoint,
      status: response.status,
      statusText: response.statusText,
      code: String(response.status),
      message: rawBody || response.statusText || 'OData request failed',
      requestId,
    });
  }

  const errorPayload = pickODataErrorPayload(payload);
  const details = normalizeODataDetails([
    ...(errorPayload.details ?? []),
    ...(errorPayload.innererror?.errordetails ?? []),
    ...(errorPayload.innererror?.details ?? []),
  ]);
  const messageFromPayload =
    extractODataMessage(errorPayload.message) ||
    extractODataMessage(errorPayload.innererror?.message) ||
    extractODataMessage(errorPayload.innererror?.originalMessage);
  const fallbackMessage = details[0]?.message || response.statusText || 'OData request failed';

  return normalizeODataError({
    endpoint,
    status: response.status,
    statusText: response.statusText,
    code: String(errorPayload.code ?? response.status),
    message: messageFromPayload ?? fallbackMessage,
    target: errorPayload.target,
    details,
    requestId,
  });
}

// ---------------------------------------------------------------------------
// Core fetch
// ---------------------------------------------------------------------------

export async function odataFetch<T>(endpoint: string, options?: ODataRequestOptions): Promise<T | undefined> {
  const {
    timeoutMs,
    ifMatch,
    requestId: requestIdOverride,
    headers,
    signal,
    credentials,
    ...requestInit
  } = options ?? {};
  const { signal: combinedSignal, cleanup } = combineAbortSignals(signal, timeoutMs);
  const requestId = requestIdOverride ?? createRequestId();
  const method = (requestInit.method ?? 'GET').toUpperCase();

  const requestHeaders = new Headers({
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(headers ?? {}),
  });

  if (ifMatch) {
    requestHeaders.set('If-Match', ifMatch);
  }

  if (!requestHeaders.has('Authorization') && odataAuthToken) {
    requestHeaders.set('Authorization', `Bearer ${odataAuthToken}`);
  }

  if (odataClientConfig.observability.enabled && odataClientConfig.observability.requestIdHeader) {
    requestHeaders.set(odataClientConfig.observability.requestIdHeader, requestId);
  }

  // TODO: CSRF placeholder only (intentionally not implemented in frontend yet).
  // if (odataClientConfig.csrf.enabled) {}
  const startedAt = Date.now();
  reportRequestEvent({
    stage: 'request',
    requestId,
    endpoint,
    method,
  });

  try {
    const response = await fetch(`${ODATA_BASE_URL}${endpoint}`, {
      ...requestInit,
      signal: combinedSignal,
      credentials: credentials ?? odataClientConfig.credentials,
      headers: requestHeaders,
    });

    const durationMs = Date.now() - startedAt;
    if (!response.ok) {
      // Detect expired/invalid token and notify listeners before throwing
      if (response.status === 401) {
        notifyAuthExpired();
      }
      throw await parseODataErrorResponse(response, endpoint, requestId);
    }

    reportRequestEvent({
      stage: 'response',
      requestId,
      endpoint,
      method,
      status: response.status,
      durationMs,
    });

    if (response.status === 204 || response.status === 205) {
      return undefined;
    }

    const raw = await response.text();
    if (!raw) return undefined;
    return JSON.parse(raw) as T;
  } catch (error) {
    if ((error as ODataNormalizedError)?.name === 'ODataClientError') {
      const normalized = error as ODataNormalizedError;
      reportRequestEvent({
        stage: 'error',
        requestId,
        endpoint,
        method,
        status: normalized.status || undefined,
        durationMs: Date.now() - startedAt,
        errorCode: normalized.code,
        message: normalized.message,
      });
      throw error;
    }

    if (
      error instanceof DOMException &&
      error.name === 'AbortError'
    ) {
      const normalized = normalizeODataError({
        endpoint,
        code: 'ABORTED',
        message: 'Request aborted',
        isAbort: true,
        requestId,
      });
      reportRequestEvent({
        stage: 'error',
        requestId,
        endpoint,
        method,
        durationMs: Date.now() - startedAt,
        errorCode: normalized.code,
        message: normalized.message,
      });
      throw normalized;
    }

    const normalized = normalizeODataError({
      endpoint,
      code: 'NETWORK_ERROR',
      message: asErrorMessage(error),
      requestId,
    });
    reportRequestEvent({
      stage: 'error',
      requestId,
      endpoint,
      method,
      durationMs: Date.now() - startedAt,
      errorCode: normalized.code,
      message: normalized.message,
    });
    throw normalized;
  } finally {
    cleanup();
  }
}

// ---------------------------------------------------------------------------
// Generic helpers (used by per-entity modules)
// ---------------------------------------------------------------------------

const isNotFoundError = (error: unknown): boolean => {
  const status = (error as ODataNormalizedError)?.status;
  if (typeof status === 'number' && status === 404) return true;
  if (!(error instanceof Error)) return false;
  return /\b404\b/i.test(error.message) || /not found/i.test(error.message);
};

export const quoteLiteral = (value: string): string => `'${value.replace(/'/g, "''")}'`;
export const entityPath = (entitySet: string, id: string): string => `/${entitySet}(${quoteLiteral(id)})`;

export function unwrapSingle<T>(data: T | ODataSingleResponse<T> | undefined): T | null {
  if (!data) return null;
  if (typeof data === 'object' && data !== null && 'value' in data) {
    const wrapped = data as ODataSingleResponse<T>;
    return wrapped.value ? normalizeEntityRecord(wrapped.value) : null;
  }
  return normalizeEntityRecord(data as T);
}

function toPagedResult<T>(data: ODataResponse<T> | T[] | undefined): ODataPagedResult<T> {
  if (!data) return { items: [] };
  if (Array.isArray(data)) return { items: normalizeEntityArray(data) };
  return {
    items: Array.isArray(data.value) ? normalizeEntityArray(data.value) : [],
    count: data['@odata.count'],
    nextLink: data['@odata.nextLink'],
  };
}

export async function listEntitiesPage<T>(
  entitySet: string,
  options?: ODataQueryOptions,
  requestOptions?: ODataRequestOptions
): Promise<ODataPagedResult<T>> {
  const data = await odataFetch<ODataResponse<T> | T[]>(`/${entitySet}${buildQueryString(options)}`, requestOptions);
  return toPagedResult(data);
}

const resolveNextLinkEndpoint = (nextLink: string): string => {
  const ensureLeadingSlash = (path: string): string => (path.startsWith('/') ? path : `/${path}`);

  if (nextLink.startsWith('http://') || nextLink.startsWith('https://')) {
    const url = new URL(nextLink);
    const withQuery = `${url.pathname}${url.search}${url.hash}`;
    if (withQuery.startsWith(ODATA_BASE_URL)) {
      return ensureLeadingSlash(withQuery.slice(ODATA_BASE_URL.length));
    }
    return ensureLeadingSlash(withQuery);
  }

  if (nextLink.startsWith(ODATA_BASE_URL)) {
    return ensureLeadingSlash(nextLink.slice(ODATA_BASE_URL.length));
  }

  if (nextLink.startsWith('/')) {
    return nextLink;
  }

  if (nextLink.startsWith('?')) {
    return `/${nextLink}`;
  }

  return ensureLeadingSlash(nextLink);
};

export async function fetchNextPage<T>(
  nextLink: string,
  requestOptions?: ODataRequestOptions
): Promise<ODataPagedResult<T>> {
  const endpoint = resolveNextLinkEndpoint(nextLink);
  const data = await odataFetch<ODataResponse<T> | T[]>(endpoint, requestOptions);
  return toPagedResult(data);
}

export async function listAllPages<T>(
  entitySet: string,
  options?: ODataQueryOptions,
  requestOptions?: ODataRequestOptions,
  listAllOptions?: ODataListAllOptions
): Promise<ODataPagedResult<T>> {
  const maxPages = Math.max(1, listAllOptions?.maxPages ?? 100);
  const firstPage = await listEntitiesPage<T>(entitySet, options, requestOptions);
  const items = [...firstPage.items];
  let count = firstPage.count;
  let nextLink = firstPage.nextLink;
  let pageCount = 1;
  const seenLinks = new Set<string>();

  while (nextLink && pageCount < maxPages) {
    if (seenLinks.has(nextLink)) break;
    seenLinks.add(nextLink);
    const page = await fetchNextPage<T>(nextLink, requestOptions);
    items.push(...page.items);
    if (typeof page.count === 'number') {
      count = page.count;
    }
    nextLink = page.nextLink;
    pageCount += 1;
  }

  return {
    items,
    count,
    nextLink,
  };
}

export async function listEntities<T>(
  entitySet: string,
  options?: ODataQueryOptions,
  requestOptions?: ODataRequestOptions,
  fetchAllPages = false
): Promise<T[]> {
  if (fetchAllPages) {
    const pages = await listAllPages<T>(entitySet, options, requestOptions);
    return pages.items;
  }

  const page = await listEntitiesPage<T>(entitySet, options, requestOptions);
  return page.items;
}

export async function countEntities(entitySet: string, filter?: string): Promise<number> {
  const page = await listEntitiesPage<unknown>(entitySet, {
    $count: true,
    $top: 0,
    ...(filter ? { $filter: filter } : {}),
  });

  return page.count ?? 0;
}

export async function getEntityById<T>(
  entitySet: string,
  id: string,
  requestOptions?: ODataRequestOptions
): Promise<T | null> {
  try {
    const data = await odataFetch<T | ODataSingleResponse<T>>(
      entityPath(entitySet, id),
      requestOptions
    );
    return unwrapSingle(data);
  } catch (error) {
    if (isNotFoundError(error)) return null;
    throw error;
  }
}

export async function createEntity<T>(
  entitySet: string,
  payload: unknown,
  requestOptions?: ODataRequestOptions
): Promise<T> {
  const data = await odataFetch<T>(`/${entitySet}`, {
    ...requestOptions,
    method: 'POST',
    body: JSON.stringify(toODataEntityPayload(payload)),
  });
  // POST should always return the created entity; guard against unexpected 204
  if (data === undefined) return normalizeEntityRecord(toODataEntityPayload(payload) as T);
  return normalizeEntityRecord(data);
}

export async function updateEntity<T>(
  entitySet: string,
  id: string,
  payload: unknown,
  requestOptions?: ODataRequestOptions
): Promise<T> {
  const data = await odataFetch<T>(entityPath(entitySet, id), {
    ...requestOptions,
    method: 'PATCH',
    body: JSON.stringify(toODataEntityPayload(payload)),
  });
  // PATCH may return 204 (no content) – return the payload as fallback
  if (data === undefined) {
    const fallback = toODataEntityPayload(payload) as Record<string, unknown>;
    return normalizeEntityRecord({ ...fallback, ID: id } as T);
  }
  return normalizeEntityRecord(data);
}

export async function deleteEntity(
  entitySet: string,
  id: string,
  requestOptions?: ODataRequestOptions
): Promise<void> {
  // DELETE typically returns 204 (no content), odataFetch returns undefined which is fine for void
  await odataFetch<void>(entityPath(entitySet, id), {
    ...requestOptions,
    method: 'DELETE',
  });
}
