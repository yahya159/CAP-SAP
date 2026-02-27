// Vite dev-server plugin that intercepts /odata/v4/performance/* requests
// and serves in-memory mock data when the real CAP backend is unavailable.
//
// Entity routing:
//   GET  /odata/v4/performance/{EntitySet}          → list
//   GET  /odata/v4/performance/{EntitySet}('{id}')  → single
//   POST /odata/v4/performance/{EntitySet}           → create
//   PATCH/PUT /odata/v4/performance/{EntitySet}('{id}') → update
//   DELETE /odata/v4/performance/{EntitySet}('{id}') → delete
//   POST  /odata/v4/performance/{EntitySet}('{id}')/actionName → action (echo)

import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import crypto from 'node:crypto';
import { store, newId } from './mockData';

const ODATA_PREFIX = '/odata/v4/performance';
const DEMO_PASSWORD_BY_EMAIL: Record<string, string> = {
  'alice.admin@inetum.com': 'Admin#2026',
  'marc.manager@inetum.com': 'Manager#2026',
  'theo.tech@inetum.com': 'Tech#2026',
  'fatima.fonc@inetum.com': 'Func#2026',
  'pierre.pm@inetum.com': 'PM#2026',
  'diana.devco@inetum.com': 'DevCo#2026',
};
const MOCK_JWT_SECRET = process.env.MOCK_JWT_SECRET || 'mock-odata-dev-secret';
const MOCK_JWT_TTL_SECONDS = Number(process.env.MOCK_JWT_TTL_SECONDS || 8 * 60 * 60);
const QUICK_ACCESS_EMAILS = new Set(Object.keys(DEMO_PASSWORD_BY_EMAIL));

// Matches: /EntitySet  or  /EntitySet(filter)  or  /EntitySet(id)/action
const ENTITY_SET_RE = /^\/([A-Za-z]+)(\(([^)]*)\))?(?:\/(\w+))?$/;

interface Parsed {
  entitySet: string;
  id: string | null;
  action: string | null;
}

function parseEntitySet(url: string): Parsed | null {
  const pathname = url.split('?')[0];
  if (!pathname.startsWith(ODATA_PREFIX)) return null;
  const relative = pathname.slice(ODATA_PREFIX.length);
  const m = ENTITY_SET_RE.exec(relative);
  if (!m) return null;

  const entitySet = m[1];
  let id: string | null = null;
  if (m[3] !== undefined) {
    id = m[3].replace(/^'+|'+$/g, ''); // strip surrounding single-quotes
  }
  const action: string | null = m[4] ?? null;

  return { entitySet, id, action };
}

function jsonResponse(res: ServerResponse, body: unknown, status = 200) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'OData-Version': '4.0',
  });
  res.end(payload);
}

function noContent(res: ServerResponse) {
  res.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
  res.end();
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk: Buffer) => { raw += chunk.toString(); });
    req.on('end', () => {
      try { resolve(JSON.parse(raw)); } catch { resolve({}); }
    });
  });
}

type Entity = Record<string, unknown>;
const entityId = (entity: Entity): string | undefined => {
  const id = entity.id ?? entity.ID;
  return typeof id === 'string' ? id : undefined;
};
const normalizeEmail = (value: unknown): string => String(value ?? '').trim().toLowerCase();
const toBase64Url = (value: string): string =>
  Buffer.from(value, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
const fromBase64Url = (value: string): string => {
  const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return Buffer.from(padded, 'base64').toString('utf8');
};
const signMockJwt = (claims: Record<string, unknown>): string => {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = toBase64Url(JSON.stringify(claims));
  const signature = crypto
    .createHmac('sha256', MOCK_JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  return `${header}.${payload}.${signature}`;
};
const verifyMockJwt = (token: string | null): Record<string, unknown> | null => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const expected = crypto
    .createHmac('sha256', MOCK_JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  if (signature !== expected) return null;
  try {
    const claims = JSON.parse(fromBase64Url(payload)) as Record<string, unknown>;
    if (claims.exp && Number(claims.exp) <= Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
};
const readBearerToken = (req: IncomingMessage): string | null => {
  const authHeader = String(req.headers.authorization ?? '');
  const [scheme, token] = authHeader.split(' ');
  if (!/^Bearer$/i.test(scheme) || !token) return null;
  return token.trim();
};
const quickAccessAccounts = (): Array<{ id: string; name: string; email: string; role: string }> => {
  const usersCollection = (store.Users ?? []) as Entity[];
  return usersCollection
    .filter((candidate) => candidate.active === true && QUICK_ACCESS_EMAILS.has(normalizeEmail(candidate.email)))
    .map((candidate) => ({
      id: String(entityId(candidate) ?? ''),
      name: String(candidate.name ?? ''),
      email: String(candidate.email ?? ''),
      role: String(candidate.role ?? ''),
    }));
};

export function mockODataPlugin(): Plugin {
  return {
    name: 'mock-odata-plugin',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url ?? '';
        if (!url.startsWith(ODATA_PREFIX)) return next();

        const parsed = parseEntitySet(url);
        if (!parsed) return next();

        const { entitySet, id, action } = parsed;
        const method = (req.method ?? 'GET').toUpperCase();

        // ---- OPTIONS (preflight) ----------------------------------------
        if (method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
          });
          res.end();
          return;
        }

        // ---- AUTHENTICATE (unbound action) ---------------------------------
        if (method === 'POST' && entitySet === 'authenticate' && !id && !action) {
          void readBody(req).then((body) => {
            const b = (body ?? {}) as Record<string, unknown>;
            const email = normalizeEmail(b.email);
            const password = typeof b.password === 'string' ? b.password : '';

            const expectedPassword = DEMO_PASSWORD_BY_EMAIL[email];
            const usersCollection = (store.Users ?? []) as Entity[];
            const user = usersCollection.find(
              (candidate) =>
                normalizeEmail(candidate.email) === email && candidate.active === true
            );

            if (!expectedPassword || expectedPassword !== password || !user) {
              jsonResponse(res, { error: { code: '401', message: 'Invalid credentials' } }, 401);
              return;
            }

            const issuedAt = Math.floor(Date.now() / 1000);
            const expiresAtEpoch = issuedAt + MOCK_JWT_TTL_SECONDS;
            const token = signMockJwt({
              iss: 'sap-performance-dashboard-mock',
              aud: 'sap-performance-dashboard-ui',
              iat: issuedAt,
              exp: expiresAtEpoch,
              sub: entityId(user),
              email: user.email,
              role: user.role,
              name: user.name,
            });
            const idValue = entityId(user) ?? '';
            jsonResponse(res, {
              token,
              expiresAt: new Date(expiresAtEpoch * 1000).toISOString(),
              user: {
                ...user,
                id: idValue,
                ID: idValue,
              },
            });
          });
          return;
        }

        // ---- QUICK ACCESS ACCOUNTS (public action) -------------------------
        if ((method === 'GET' || method === 'POST') && entitySet === 'quickAccessAccounts' && !id && !action) {
          jsonResponse(res, quickAccessAccounts());
          return;
        }

        // ---- Protect all non-public routes --------------------------------
        const claims = verifyMockJwt(readBearerToken(req));
        if (!claims) {
          jsonResponse(res, { error: { code: '401', message: 'Missing or invalid Bearer token' } }, 401);
          return;
        }

        const collection = store[entitySet] as Entity[] | undefined;
        if (!collection) {
          if (method === 'GET' && !id) {
            jsonResponse(res, { value: [] });
            return;
          }
          jsonResponse(res, { error: { message: `Entity set '${entitySet}' not found` } }, 404);
          return;
        }

        // ---- LIST --------------------------------------------------------
        if (method === 'GET' && !id) {
          // Parse simple OData $filter: support `field eq 'value'` clauses
          const qp = new URLSearchParams(url.split('?')[1] ?? '');
          const filterStr = qp.get('$filter') ?? '';
          let items: Entity[] = collection;

          if (filterStr) {
            // Match one or more `field eq 'value'` or `field eq true/false` clauses
            const EQ_RE = /(\w+)\s+eq\s+(?:'([^']*)'|(true|false))/g;
            const conditions: Array<{ field: string; value: string | boolean }> = [];
            let m: RegExpExecArray | null;
            while ((m = EQ_RE.exec(filterStr)) !== null) {
              const field = m[1];
              const value: string | boolean = m[3] !== undefined ? m[3] === 'true' : m[2];
              conditions.push({ field, value });
            }
            if (conditions.length > 0) {
              items = collection.filter((entity) =>
                conditions.every(({ field, value }) => entity[field] === value)
              );
            }
          }
          jsonResponse(res, { '@odata.count': items.length, value: items });
          return;
        }

        // ---- SINGLE ------------------------------------------------------
        if (method === 'GET' && id) {
          const entity = collection.find((e) => entityId(e) === id);
          if (!entity) {
            jsonResponse(res, { error: { message: 'Not found' } }, 404);
            return;
          }
          jsonResponse(res, entity);
          return;
        }

        // ---- CREATE ------------------------------------------------------
        if (method === 'POST' && !id) {
          void readBody(req).then((body) => {
            const b = (body ?? {}) as Record<string, unknown>;
            const createdId =
              (typeof b.id === 'string' ? b.id : undefined) ??
              (typeof b.ID === 'string' ? b.ID : undefined) ??
              newId(entitySet.slice(0, 3).toLowerCase());
            const created: Entity = { ...b, id: createdId, ID: createdId };
            collection.push(created);
            jsonResponse(res, created, 201);
          });
          return;
        }

        // ---- ACTION (POST with id + action name) -------------------------
        if (method === 'POST' && id) {
          const entity = collection.find((e) => entityId(e) === id);
          if (!entity) { jsonResponse(res, { error: { message: 'Not found' } }, 404); return; }
          // For any action (validate, submit, sendToStraTIME, reject…) just echo back
          jsonResponse(res, { ...entity, _action: action });
          return;
        }

        // ---- UPDATE (PATCH / PUT) ----------------------------------------
        if ((method === 'PATCH' || method === 'PUT') && id) {
          void readBody(req).then((body) => {
            const b = (body ?? {}) as Record<string, unknown>;
            const idx = collection.findIndex((e) => entityId(e) === id);
            if (idx === -1) { jsonResponse(res, { error: { message: 'Not found' } }, 404); return; }
            collection[idx] = { ...collection[idx], ...b };
            jsonResponse(res, collection[idx]);
          });
          return;
        }

        // ---- DELETE ------------------------------------------------------
        if (method === 'DELETE' && id) {
          const idx = collection.findIndex((e) => entityId(e) === id);
          if (idx !== -1) collection.splice(idx, 1);
          noContent(res);
          return;
        }

        next();
      });
    },
  };
}
