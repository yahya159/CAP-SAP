'use strict';
/**
 * audit.js – Lightweight audit logger.
 * Writes an immutable AuditLogs row for every CUD event that flows through
 * a CAP service registered via `attachAuditLog(srv)`.
 */

const cds = require('@sap/cds');

const AUDIT_ENTITY = 'sap.performance.dashboard.db.AuditLogs';
const SQLITE_AUDIT_TABLE = 'sap_performance_dashboard_db_AuditLogs';

// Events we track – skips drafts, metadata, and custom actions
const CUD_EVENTS = new Set(['CREATE', 'UPDATE', 'DELETE']);

let auditTableReady;

const ensureAuditTable = async () => {
  if (auditTableReady) return auditTableReady;

  auditTableReady = (async () => {
    if (!cds.db?.run) return;

    const dbKind = String(cds.db.kind ?? cds.db.options?.kind ?? '').toLowerCase();
    if (dbKind && dbKind !== 'sqlite') return;

    await cds.db.run(`
      CREATE TABLE IF NOT EXISTS ${SQLITE_AUDIT_TABLE} (
        ID NVARCHAR(36) PRIMARY KEY,
        timestamp TEXT NOT NULL,
        userId NVARCHAR(50),
        userRole NVARCHAR(40),
        "action" NVARCHAR(10) NOT NULL,
        entityName NVARCHAR(100) NOT NULL,
        entityId NVARCHAR(50),
        details NCLOB
      )
    `);
  })();

  return auditTableReady;
};

/**
 * Build a short JSON summary of the changed payload (max 2 KB).
 */
const summarise = (data) => {
  if (!data) return null;
  try {
    const raw = JSON.stringify(data);
    return raw.length > 2048 ? raw.slice(0, 2045) + '...' : raw;
  } catch {
    return null;
  }
};

/**
 * Register after-handlers on the given CDS service to log CUD operations.
 */
const attachAuditLog = (srv) => {
  const auditReady = ensureAuditTable();

  for (const event of CUD_EVENTS) {
    srv.after(event, '*', async (_result, req) => {
      try {
        await auditReady;

        const claims = req._authClaims;
        const entityName =
          req.target?.name ?? req.entity ?? 'unknown';
        const entityId =
          req.data?.ID ??
          req.params?.[0]?.ID ??
          req.params?.[0] ??
          null;

        await cds.db.run(
          INSERT.into(AUDIT_ENTITY).entries({
            timestamp: new Date().toISOString(),
            userId: claims?.sub ?? null,
            userRole: claims?.role ?? null,
            action: event,
            entityName,
            entityId: entityId != null ? String(entityId) : null,
            details: summarise(req.data),
          })
        );
      } catch (err) {
        // Audit failures must never block the main operation
        console.error('[AuditLog] write failed:', err?.message ?? err);
      }
    });
  }
};

module.exports = { attachAuditLog };
