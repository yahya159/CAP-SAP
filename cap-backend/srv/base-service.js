'use strict';

const fs = require('node:fs');
const path = require('node:path');
const cds = require('@sap/cds');
const AuthDomainService = require('./auth/auth.domain.service');
const { attachAuditLog } = require('./shared/services/audit');

// Maps each domain directory to the primary entity it owns.
// Used to guard against registering impl hooks in services that don't expose that entity.
const DOMAIN_ENTITY_MAP = {
  allocation: 'Allocations',
  comment: 'TicketComments',
  deliverable: 'Deliverables',
  documentation: 'DocumentationObjects',
  evaluation: 'Evaluations',
  imputation: 'Imputations',
  'imputation-period': 'ImputationPeriods',
  'leave-request': 'LeaveRequests',
  notification: 'Notifications',
  project: 'Projects',
  'project-feedback': 'ProjectFeedback',
  'reference-data': 'ReferenceData',
  ticket: 'Tickets',
  'time-log': 'TimeLogs',
  timesheet: 'Timesheets',
  user: 'Users',
  wricef: 'Wricefs',
};

const registerDomainImpls = (srv) => {
  const entries = fs.readdirSync(__dirname, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === 'shared') continue;
    const implPath = path.join(__dirname, entry.name, `${entry.name}.impl.js`);
    if (!fs.existsSync(implPath)) continue;

    // Auth domain exposes actions (not entities) — always register in every service
    if (entry.name !== 'auth') {
      const primaryEntity = DOMAIN_ENTITY_MAP[entry.name];
      // Skip if the service does not expose the entity this domain handles
      if (primaryEntity && !srv.entities[primaryEntity]) continue;
    }

    const register = require(implPath);
    if (typeof register === 'function') register(srv);
  }
};

module.exports = function (srv) {
  const auth = new AuthDomainService(srv);

  srv.before('*', (req) => {
    if (auth.isPublicEvent(req.event)) return;
    req._authClaims = auth.authenticateRequest(req);
  });

  // Enforce server-side pagination: cap $top at 500, default to 100 if omitted
  const MAX_PAGE_SIZE = 500;
  const DEFAULT_PAGE_SIZE = 100;
  srv.before('READ', '*', (req) => {
    const select = req.query?.SELECT;
    if (!select) return;
    const limit = select.limit ?? {};
    const rows = limit.rows?.val;
    if (rows === undefined || rows === null) {
      select.limit = { ...limit, rows: { val: DEFAULT_PAGE_SIZE } };
    } else if (typeof rows === 'number' && rows > MAX_PAGE_SIZE) {
      select.limit = { ...limit, rows: { val: MAX_PAGE_SIZE } };
    }
  });

  registerDomainImpls(srv);

  // Audit trail – logs every CREATE / UPDATE / DELETE
  attachAuditLog(srv);
};
