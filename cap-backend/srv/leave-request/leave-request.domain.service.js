'use strict';

const LeaveRequestRepo = require('./leave-request.repo');
const { nowIso } = require('../shared/utils/timestamp');
const { assertEntityExists, assertDateRange, ENTITIES, MANAGER_ROLES, requireRole } = require('../shared/services/validation');

const LEAVE_TRANSITIONS = {
  PENDING: new Set(['APPROVED', 'REJECTED']),
  APPROVED: new Set([]),
  REJECTED: new Set(['PENDING']),
};

const extractEntityId = (req) => req.params?.[0]?.ID ?? req.params?.[0] ?? req.data?.ID;

class LeaveRequestDomainService {
  constructor(_srv) {
    this.repo = new LeaveRequestRepo();
  }

  async beforeCreate(req) {
    const data = req.data;

    await assertEntityExists(ENTITIES.Users, data.consultantId, 'consultantId', req);
    await assertEntityExists(ENTITIES.Users, data.managerId, 'managerId', req);

    assertDateRange(data.startDate, data.endDate, req);
    if (data.status === undefined) data.status = 'PENDING';
  }

  async beforeUpdate(req) {
    const data = req.data;
    const id = extractEntityId(req);
    const current = id ? await this.repo.findById(id) : null;

    await assertEntityExists(ENTITIES.Users, data.consultantId, 'consultantId', req);
    await assertEntityExists(ENTITIES.Users, data.managerId, 'managerId', req);

    if (data.startDate !== undefined || data.endDate !== undefined) {
      const startDate = data.startDate ?? current?.startDate;
      const endDate = data.endDate ?? current?.endDate;
      assertDateRange(startDate, endDate, req);
    }

    if (data.status !== undefined && current && data.status !== current.status) {
      requireRole(req, MANAGER_ROLES, 'Only managers can approve/reject leave requests');
      const allowed = LEAVE_TRANSITIONS[current.status] || new Set();
      if (!allowed.has(data.status)) {
        req.reject(409, `Invalid leave request status transition: ${current.status} -> ${data.status}`);
      }
      if (data.status === 'APPROVED' || data.status === 'REJECTED') {
        data.reviewedAt = nowIso();
      }
    }
  }
}

module.exports = LeaveRequestDomainService;
