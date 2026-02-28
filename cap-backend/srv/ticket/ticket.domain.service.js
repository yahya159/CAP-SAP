'use strict';
/**
 * ticket.domain.service.js – ALL business rules for Tickets.
 * NO direct DB calls; delegate to TicketRepo.
 * NO HTTP/CDS request handling; called by ticket.impl.js.
 */
const TicketRepo = require('./ticket.repo');
const { generateTicketCode } = require('../shared/utils/id');
const { nowIso } = require('../shared/utils/timestamp');
const { assertEntityExists, ENTITIES, MANAGER_ROLES, requireRole } = require('../shared/services/validation');

const CONSULTANT_ROLES = new Set(['CONSULTANT_TECHNIQUE', 'CONSULTANT_FONCTIONNEL']);

const TICKET_STATUS_TRANSITIONS = {
  NEW: new Set(['IN_PROGRESS', 'BLOCKED', 'REJECTED']),
  IN_PROGRESS: new Set(['IN_TEST', 'BLOCKED', 'DONE', 'REJECTED']),
  IN_TEST: new Set(['IN_PROGRESS', 'DONE', 'REJECTED']),
  BLOCKED: new Set(['IN_PROGRESS', 'REJECTED']),
  DONE: new Set([]),
  REJECTED: new Set(['NEW']),
};

class TicketDomainService {
  constructor(_srv) {
    this.repo = new TicketRepo();
  }

  /**
   * beforeRead – enforce data visibility.
   * Consultants only see tickets assigned to themselves.
   */
  beforeRead(req) {
    const claims = req._authClaims;
    const role = String(claims?.role ?? '');
    const userId = String(claims?.sub ?? '').trim();
    if (!CONSULTANT_ROLES.has(role) || !userId) return;

    const select = req.query?.SELECT;
    if (!select) return;

    const assignedToSelf = [{ ref: ['assignedTo'] }, '=', { val: userId }];
    if (Array.isArray(select.where) && select.where.length > 0) {
      select.where = ['(', ...select.where, ')', 'and', ...assignedToSelf];
      return;
    }

    select.where = assignedToSelf;
  }

  /**
   * beforeCreate – called by impl before CAP inserts the record.
   * Injects: ticketCode, createdAt, default status/effortHours/history.
   */
  async beforeCreate(req) {
    const data = req.data;

    // Guard required fields
    if (!data.projectId) req.error(400, 'projectId is required');
    if (!data.createdBy) req.error(400, 'createdBy is required');
    if (!data.title)     req.error(400, 'title is required');
    if (!data.nature)    req.error(400, 'nature is required');

    if (typeof data.assignedTo === 'string' && !data.assignedTo.trim()) data.assignedTo = null;
    if (typeof data.functionalTesterId === 'string' && !data.functionalTesterId.trim()) data.functionalTesterId = null;

    await assertEntityExists(ENTITIES.Projects, data.projectId, 'projectId', req);
    await assertEntityExists(ENTITIES.Users, data.createdBy, 'createdBy', req);
    if (data.assignedTo) await assertEntityExists(ENTITIES.Users, data.assignedTo, 'assignedTo', req);
    if (data.functionalTesterId) await assertEntityExists(ENTITIES.Users, data.functionalTesterId, 'functionalTesterId', req);

    // Auto-generate ticketCode: TK-YYYY-XXXXXX
    const year = new Date().getFullYear();
    data.ticketCode = await this._allocateTicketCode(year);

    // Defaults
    data.status        = data.status       || 'NEW';
    data.effortHours   = data.effortHours  ?? 0;
    data.estimationHours = data.estimationHours ?? 0;
    data.createdAt     = data.createdAt    || nowIso();

    if (data.history !== undefined) {
      data.history = this._coerceHistoryRows(data.history);
    }
    if (data.tags !== undefined) {
      data.tags = this._coerceTagRows(data.tags);
    }
    if (data.documentationObjectIds !== undefined) {
      data.documentationObjectIds = this._coerceDocumentationRows(data.documentationObjectIds);
    }
  }

  /**
   * beforeUpdate – called by impl before CAP updates the record.
   * Injects updatedAt and re-serializes any JSON array fields.
   */
  async beforeUpdate(req) {
    const data = req.data;
    data.updatedAt = nowIso();
    const id = req.params?.[0]?.ID ?? req.params?.[0] ?? data.ID;

    if (typeof data.assignedTo === 'string' && !data.assignedTo.trim()) data.assignedTo = null;
    if (typeof data.functionalTesterId === 'string' && !data.functionalTesterId.trim()) data.functionalTesterId = null;

    if (data.status !== undefined && id) {
      const current = await this.repo.findById(id);
      if (current && data.status !== current.status) {
        const allowed = TICKET_STATUS_TRANSITIONS[current.status] || new Set();
        if (!allowed.has(data.status)) {
          req.reject(409, `Invalid ticket status transition: ${current.status} -> ${data.status}`);
        }
      }
    }

    if (data.projectId !== undefined) await assertEntityExists(ENTITIES.Projects, data.projectId, 'projectId', req);
    if (data.createdBy !== undefined) await assertEntityExists(ENTITIES.Users, data.createdBy, 'createdBy', req);
    if (data.assignedTo !== undefined && data.assignedTo !== null) {
      await assertEntityExists(ENTITIES.Users, data.assignedTo, 'assignedTo', req);
    }
    if (data.functionalTesterId !== undefined && data.functionalTesterId !== null) {
      await assertEntityExists(ENTITIES.Users, data.functionalTesterId, 'functionalTesterId', req);
    }

    if (data.history !== undefined) {
      data.history = this._coerceHistoryRows(data.history);
    }
    if (data.tags !== undefined) {
      data.tags = this._coerceTagRows(data.tags);
    }
    if (data.documentationObjectIds !== undefined) {
      data.documentationObjectIds = this._coerceDocumentationRows(data.documentationObjectIds);
    }
  }

  /**
   * afterRead – deserialize JSON array fields back into arrays.
   * Called after READ, CREATE, UPDATE to hydrate the response.
   */
  afterRead(data) {
    if (!data) return;
    const rows = Array.isArray(data) ? data : [data];
    for (const row of rows) {
      if (!row || typeof row !== 'object') continue;
      row.history                = this._deserializeArray(row.history);
      row.tags                   = this._deserializeArray(row.tags);
      row.documentationObjectIds = this._deserializeArray(row.documentationObjectIds);
    }
  }

  // ---- Private helpers ---------------------------------------------------

  _toArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim().startsWith('[')) {
      try { return JSON.parse(value); } catch { return []; }
    }
    return [];
  }

  _coerceTagRows(value) {
    const rows = this._toArray(value);
    return rows
      .map((row) => {
        if (row && typeof row === 'object') {
          const tag = String(row.tag ?? '').trim();
          return tag ? { tag } : null;
        }
        const tag = String(row ?? '').trim();
        return tag ? { tag } : null;
      })
      .filter(Boolean);
  }

  _coerceDocumentationRows(value) {
    const rows = this._toArray(value);
    return rows
      .map((row) => {
        if (row && typeof row === 'object') {
          const docObjectId = String(row.docObjectId ?? '').trim();
          return docObjectId ? { docObjectId } : null;
        }
        const docObjectId = String(row ?? '').trim();
        return docObjectId ? { docObjectId } : null;
      })
      .filter(Boolean);
  }

  _coerceHistoryRows(value) {
    const rows = this._toArray(value);
    return rows
      .map((row) => {
        if (!row || typeof row !== 'object') {
          const details = String(row ?? '').trim();
          return details ? { event: 'LEGACY', details } : null;
        }
        const event = String(row.event ?? row.action ?? 'UPDATE').trim();
        const details = row.details !== undefined ? row.details : JSON.stringify(row);
        return {
          event: event || 'UPDATE',
          details: String(details ?? ''),
        };
      })
      .filter(Boolean);
  }

  _deserializeArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim().startsWith('[')) {
      try { return JSON.parse(value); } catch { return []; }
    }
    return [];
  }

  async _allocateTicketCode(year) {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const candidate = generateTicketCode(year);
      // Randomized suffix makes collisions unlikely, this guards against rare duplicates.
      if (!(await this.repo.existsByTicketCode(candidate))) {
        return candidate;
      }
    }
    throw new Error('Unable to allocate a unique ticketCode');
  }
}

module.exports = TicketDomainService;
