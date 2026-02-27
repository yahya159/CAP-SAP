'use strict';
/**
 * performance-service.js
 *
 * Top-level handler module loaded by CAP when it finds a .cds with the same name.
 * Responsibilities:
 *   1. Load ticket-domain handlers (via ticket.impl.js)
 *   2. Register action handlers for Imputations, ImputationPeriods, TimeLogs
 *   3. Register after-READ handlers to deserialize LargeString JSON fields on
 *      all other entity sets that use JSON array storage.
 *
 * No CSRF. No business logic (business logic lives in domain services).
 */

const cds = require('@sap/cds');
const crypto = require('node:crypto');
const { nowIso } = require('./shared/utils/timestamp');

// Ticket domain handler – registered via require
const ticketImpl = require('./ticket/ticket.impl');
const projectImpl = require('./project/project.impl');
const userImpl = require('./user/user.impl');
const allocationImpl = require('./allocation/allocation.impl');
const leaveRequestImpl = require('./leave-request/leave-request.impl');
const deliverableImpl = require('./deliverable/deliverable.impl');
const evaluationImpl = require('./evaluation/evaluation.impl');
const timesheetImpl = require('./timesheet/timesheet.impl');
const timeLogImpl = require('./time-log/time-log.impl');
const imputationImpl = require('./imputation/imputation.impl');
const imputationPeriodImpl = require('./imputation-period/imputation-period.impl');
const wricefImpl = require('./wricef/wricef.impl');
const notificationImpl = require('./notification/notification.impl');
const documentationImpl = require('./documentation/documentation.impl');
const referenceDataImpl = require('./reference-data/reference-data.impl');

const DEMO_PASSWORD_BY_EMAIL = Object.freeze({
  'alice.admin@inetum.com': 'Admin#2026',
  'marc.manager@inetum.com': 'Manager#2026',
  'theo.tech@inetum.com': 'Tech#2026',
  'fatima.fonc@inetum.com': 'Func#2026',
  'pierre.pm@inetum.com': 'PM#2026',
  'diana.devco@inetum.com': 'DevCo#2026',
});

const JWT_SECRET = process.env.MOCK_JWT_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.MOCK_JWT_SECRET) {
  // Avoid shipping a static repo secret in shared environments.
  // Tokens remain valid only for the current process lifetime.
  // eslint-disable-next-line no-console
  console.warn('[auth] MOCK_JWT_SECRET is not set; using ephemeral process-local secret.');
}
const JWT_TTL_SECONDS = Number(process.env.MOCK_JWT_TTL_SECONDS || 8 * 60 * 60);
const REVIEWER_ROLES = new Set(['ADMIN', 'MANAGER', 'PROJECT_MANAGER']);
const PUBLIC_EVENTS = new Set(['authenticate', 'quickAccessAccounts']);
const QUICK_ACCESS_EMAILS = new Set(Object.keys(DEMO_PASSWORD_BY_EMAIL));

const extractEntityId = (req) => req.params?.[0]?.ID ?? req.params?.[0];
const normalizeEmail = (value) => String(value ?? '').trim().toLowerCase();

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left ?? ''), 'utf8');
  const rightBuffer = Buffer.from(String(right ?? ''), 'utf8');
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const toBase64Url = (value) =>
  Buffer.from(value, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const fromBase64Url = (value) => {
  const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return Buffer.from(padded, 'base64').toString('utf8');
};

const signMockJwt = (claims) => {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = toBase64Url(JSON.stringify(claims));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  return `${header}.${payload}.${signature}`;
};

const verifyMockJwt = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const expected = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  if (!safeEqual(signature, expected)) return null;
  try {
    const decoded = JSON.parse(fromBase64Url(payload));
    if (decoded.exp && Number(decoded.exp) <= Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
};

const getAuthHeader = (req) =>
  req?.headers?.authorization ??
  req?.http?.req?.headers?.authorization ??
  req?._?.req?.headers?.authorization ??
  '';

const extractBearerToken = (req) => {
  const authHeader = String(getAuthHeader(req) || '');
  const [scheme, token] = authHeader.split(' ');
  if (!/^Bearer$/i.test(scheme) || !token) return null;
  return token.trim();
};

const authenticateRequest = (req) => {
  const token = extractBearerToken(req);
  if (!token) req.reject(401, 'Missing Bearer token');
  const claims = verifyMockJwt(token);
  if (!claims?.sub || !claims?.role) req.reject(401, 'Invalid or expired token');
  return claims;
};
const getRequestClaims = (req) => req._authClaims ?? authenticateRequest(req);

const requireReviewerRole = (req, _current, claims) => {
  if (!REVIEWER_ROLES.has(String(claims.role))) {
    req.reject(403, 'Only reviewers can execute this action');
  }
};

const requireOwnerOrReviewer = (ownerField) => (req, current, claims) => {
  const isOwner = String(current?.[ownerField] ?? '') === String(claims.sub ?? '');
  if (!isOwner && !REVIEWER_ROLES.has(String(claims.role))) {
    req.reject(403, 'You are not allowed to execute this action for this record');
  }
};

module.exports = (srv) => {
  // ---- Register Ticket domain handlers -----------------------------------
  ticketImpl(srv);
  projectImpl(srv);
  userImpl(srv);
  allocationImpl(srv);
  leaveRequestImpl(srv);
  deliverableImpl(srv);
  evaluationImpl(srv);
  timesheetImpl(srv);
  timeLogImpl(srv);
  imputationImpl(srv);
  imputationPeriodImpl(srv);
  wricefImpl(srv);
  notificationImpl(srv);
  documentationImpl(srv);
  referenceDataImpl(srv);

  // ---- Protect all operations except explicit public actions -------------
  srv.before('*', (req) => {
    if (PUBLIC_EVENTS.has(req.event)) return;
    req._authClaims = authenticateRequest(req);
  });


  // ---- Default createdAt on entities without `managed` timestamp ---------
  const NEEDS_CREATEDAT = [];

  NEEDS_CREATEDAT.forEach((name) => {
    srv.before('CREATE', name, (req) => {
      if (!req.data.createdAt) req.data.createdAt = nowIso();
    });
  });

  // =========================================================================
  // AUTHENTICATION ACTION
  // =========================================================================

  // POST /authenticate { email, password }
  srv.on('authenticate', async (req) => {
    const email = normalizeEmail(req.data?.email);
    const password = String(req.data?.password ?? '');

    if (!email || !password) {
      req.reject(401, 'Invalid credentials');
      return;
    }

    const expectedPassword = DEMO_PASSWORD_BY_EMAIL[email];
    if (!expectedPassword || !safeEqual(password, expectedPassword)) {
      req.reject(401, 'Invalid credentials');
      return;
    }

    const { Users } = srv.entities;
    const user = await cds.db.run(
      SELECT.one(Users).where({
        email,
        active: true,
      })
    );
    if (!user) {
      req.reject(401, 'Invalid credentials');
      return;
    }

    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAtEpoch = issuedAt + JWT_TTL_SECONDS;
    const token = signMockJwt({
      iss: 'sap-performance-dashboard',
      aud: 'sap-performance-dashboard-ui',
      iat: issuedAt,
      exp: expiresAtEpoch,
      sub: user.ID,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      token,
      expiresAt: new Date(expiresAtEpoch * 1000).toISOString(),
      user: {
        id: user.ID,
        name: user.name,
        email: user.email,
        role: user.role,
        active: Boolean(user.active),
        skills: user.skills ?? '[]',
        certifications: user.certifications ?? '[]',
        availabilityPercent: Number(user.availabilityPercent ?? 100),
        teamId: user.teamId ?? null,
        avatarUrl: user.avatarUrl ?? null,
      },
    };
  });

  srv.on('quickAccessAccounts', async () => {
    const { Users } = srv.entities;
    const users = await cds.db.run(
      SELECT.from(Users)
        .columns('ID', 'name', 'email', 'role')
        .where({ active: true })
    );

    return users
      .filter((user) => QUICK_ACCESS_EMAILS.has(normalizeEmail(user.email)))
      .map((user) => ({
        id: user.ID,
        name: user.name,
        email: user.email,
        role: user.role,
      }));
  });

  // =========================================================================
  // STATE-MACHINE: allowed transitions
  // =========================================================================

  /** Allowed validationStatus transitions for Imputations */
  const IMPUTATION_TRANSITIONS = {
    validate: { from: ['DRAFT', 'SUBMITTED', 'REJECTED'], to: 'VALIDATED' },
    reject:   { from: ['DRAFT', 'SUBMITTED'],              to: 'REJECTED' },
  };

  /** Allowed status transitions for ImputationPeriods */
  const PERIOD_TRANSITIONS = {
    submit:   { from: ['DRAFT', 'REJECTED'],              to: 'SUBMITTED' },
    validate: { from: ['SUBMITTED'],                       to: 'VALIDATED' },
    reject:   { from: ['SUBMITTED'],                       to: 'REJECTED' },
  };

  // =========================================================================
  // SHARED ACTION HELPER – reduces per-action boilerplate
  // =========================================================================

  /**
   * Generic bound-action handler:
   *   1. Extract entity ID
   *   2. Fetch current record (fail 404 if missing)
   *   3. Optionally validate state-machine transition
   *   4. Apply changes and re-read
   */
  const registerBoundAction = ({
    action,
    entitySetName,
    statusField,
    transitions,
    authorize,
    buildChanges,
  }) => {
    srv.on(action, entitySetName, async (req) => {
      const EntitySet = srv.entities[entitySetName];
      const id = extractEntityId(req);
      if (!id) return req.reject(400, `Missing ${entitySetName} ID`);

      // Fetch current record
      const current = await cds.db.run(SELECT.one(EntitySet).where({ ID: id }));
      if (!current) return req.error(404, `${entitySetName} '${id}' not found`);

      const claims = authorize ? getRequestClaims(req) : null;
      if (authorize) authorize(req, current, claims);

      // State-machine guard
      if (transitions) {
        const rule = transitions[action];
        if (rule) {
          const currentStatus = current[statusField];
          if (!rule.from.includes(currentStatus)) {
            return req.reject(
              409,
              `Cannot ${action} ${entitySetName} '${id}': current ${statusField} is '${currentStatus}', expected one of [${rule.from.join(', ')}]`
            );
          }
        }
      }

      const changes = buildChanges(req, current);
      await cds.db.run(UPDATE(EntitySet).where({ ID: id }).with(changes));
      return cds.db.run(SELECT.one(EntitySet).where({ ID: id }));
    });
  };

  // =========================================================================
  // IMPUTATION ACTIONS
  // =========================================================================

  registerBoundAction({
    action: 'validate',
    entitySetName: 'Imputations',
    statusField: 'validationStatus',
    transitions: IMPUTATION_TRANSITIONS,
    authorize: requireReviewerRole,
    buildChanges: (req) => ({
      validationStatus: 'VALIDATED',
      validatedBy: req.data?.validatedBy || null,
      validatedAt: nowIso(),
    }),
  });

  registerBoundAction({
    action: 'reject',
    entitySetName: 'Imputations',
    statusField: 'validationStatus',
    transitions: IMPUTATION_TRANSITIONS,
    authorize: requireReviewerRole,
    buildChanges: (req) => ({
      validationStatus: 'REJECTED',
      validatedBy: req.data?.validatedBy || null,
      validatedAt: nowIso(),
    }),
  });

  // =========================================================================
  // IMPUTATION PERIOD ACTIONS
  // =========================================================================

  registerBoundAction({
    action: 'submit',
    entitySetName: 'ImputationPeriods',
    statusField: 'status',
    transitions: PERIOD_TRANSITIONS,
    authorize: requireOwnerOrReviewer('consultantId'),
    buildChanges: () => ({ status: 'SUBMITTED', submittedAt: nowIso() }),
  });

  registerBoundAction({
    action: 'validate',
    entitySetName: 'ImputationPeriods',
    statusField: 'status',
    transitions: PERIOD_TRANSITIONS,
    authorize: requireReviewerRole,
    buildChanges: (req) => ({
      status: 'VALIDATED',
      validatedBy: req.data?.validatedBy,
      validatedAt: nowIso(),
    }),
  });

  registerBoundAction({
    action: 'reject',
    entitySetName: 'ImputationPeriods',
    statusField: 'status',
    transitions: PERIOD_TRANSITIONS,
    authorize: requireReviewerRole,
    buildChanges: (req) => ({
      status: 'REJECTED',
      validatedBy: req.data?.validatedBy,
      validatedAt: nowIso(),
    }),
  });

  registerBoundAction({
    action: 'sendToStraTIME',
    entitySetName: 'ImputationPeriods',
    statusField: 'status',
    transitions: null, // no state-machine guard — can send anytime
    authorize: requireReviewerRole,
    buildChanges: (req) => ({
      sentToStraTIME: true,
      sentBy: req.data?.sentBy,
      sentAt: nowIso(),
    }),
  });

  // =========================================================================
  // TIME LOG ACTIONS
  // =========================================================================

  registerBoundAction({
    action: 'sendToStraTIME',
    entitySetName: 'TimeLogs',
    statusField: null,
    transitions: null,
    authorize: requireOwnerOrReviewer('consultantId'),
    buildChanges: () => ({ sentToStraTIME: true, sentAt: nowIso() }),
  });
};

