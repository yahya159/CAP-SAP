'use strict';
/**
 * ticket.domain.service.js – ALL business rules for Tickets.
 * NO direct DB calls; delegate to TicketRepo.
 * NO HTTP/CDS request handling; called by ticket.impl.js.
 */
const TicketRepo = require('./ticket.repo');
const { generateTicketCode } = require('../shared/utils/id');
const { nowIso } = require('../shared/utils/timestamp');

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

    await this._assertProjectExists(req, data.projectId);
    await this._assertUserExists(req, data.createdBy, 'createdBy');
    if (data.assignedTo) await this._assertUserExists(req, data.assignedTo, 'assignedTo');
    if (data.functionalTesterId) await this._assertUserExists(req, data.functionalTesterId, 'functionalTesterId');

    // Auto-generate ticketCode: TK-YYYY-XXXXXX
    const year = new Date().getFullYear();
    data.ticketCode = await this._allocateTicketCode(year);

    // Defaults
    data.status        = data.status       || 'NEW';
    data.effortHours   = data.effortHours  ?? 0;
    data.estimationHours = data.estimationHours ?? 0;
    data.createdAt     = data.createdAt    || nowIso();

    // Serialize JSON arrays
    data.history       = this._serializeArray(data.history ?? []);
    data.tags          = this._serializeArray(data.tags ?? []);
    data.documentationObjectIds = this._serializeArray(data.documentationObjectIds ?? []);
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

    if (data.projectId !== undefined) await this._assertProjectExists(req, data.projectId);
    if (data.createdBy !== undefined) await this._assertUserExists(req, data.createdBy, 'createdBy');
    if (data.assignedTo !== undefined && data.assignedTo !== null) {
      await this._assertUserExists(req, data.assignedTo, 'assignedTo');
    }
    if (data.functionalTesterId !== undefined && data.functionalTesterId !== null) {
      await this._assertUserExists(req, data.functionalTesterId, 'functionalTesterId');
    }

    // Re-serialize JSON arrays if they were provided as arrays
    if (Array.isArray(data.history)) {
      data.history = JSON.stringify(data.history);
    }
    if (Array.isArray(data.tags)) {
      data.tags = JSON.stringify(data.tags);
    }
    if (Array.isArray(data.documentationObjectIds)) {
      data.documentationObjectIds = JSON.stringify(data.documentationObjectIds);
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

  _serializeArray(value) {
    if (Array.isArray(value)) return JSON.stringify(value);
    if (typeof value === 'string') return value; // already serialized
    return '[]';
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

  async _assertProjectExists(req, projectId) {
    if (!projectId) return;
    const exists = await this.repo.existsProjectById(projectId);
    if (!exists) req.error(400, `Unknown projectId '${projectId}'`);
  }

  async _assertUserExists(req, userId, fieldName) {
    if (!userId) return;
    const exists = await this.repo.existsUserById(userId);
    if (!exists) req.error(400, `Unknown ${fieldName} '${userId}'`);
  }
}

module.exports = TicketDomainService;
