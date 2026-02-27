'use strict';

const TimeLogRepo = require('./time-log.repo');
const AuthDomainService = require('../auth/auth.domain.service');
const { assertEntityExists, ENTITIES } = require('../shared/services/validation');
const { nowIso } = require('../shared/utils/timestamp');

const extractEntityId = (req) => req.params?.[0]?.ID ?? req.params?.[0] ?? req.data?.ID;

const assertDuration = (value, req) => {
  if (value === undefined || value === null) return;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0 || num > 1440) {
    req.error(400, 'durationMinutes must be between 0 and 1440');
  }
};

class TimeLogDomainService {
  constructor(_srv) {
    this.repo = new TimeLogRepo();
    this.auth = new AuthDomainService();
  }

  async beforeCreate(req) {
    const data = req.data;

    await assertEntityExists(ENTITIES.Users, data.consultantId, 'consultantId', req);
    await assertEntityExists(ENTITIES.Tickets, data.ticketId, 'ticketId', req);
    await assertEntityExists(ENTITIES.Projects, data.projectId, 'projectId', req);

    assertDuration(data.durationMinutes, req);
    if (!data.date) req.error(400, 'date is required');
  }

  async beforeUpdate(req) {
    const data = req.data;
    const id = extractEntityId(req);
    const current = id ? await this.repo.findById(id) : null;

    if (current?.sentToStraTIME) {
      req.reject(409, 'TimeLog is immutable once sent to StraTIME');
    }

    const protectedFields = ['sentToStraTIME', 'sentAt'];
    for (const field of protectedFields) {
      if (data[field] !== undefined && current && data[field] !== current[field]) {
        req.reject(403, 'Use sendToStraTIME action to update StraTIME metadata');
      }
    }

    if (data.consultantId !== undefined) {
      await assertEntityExists(ENTITIES.Users, data.consultantId, 'consultantId', req);
    }
    if (data.ticketId !== undefined) {
      await assertEntityExists(ENTITIES.Tickets, data.ticketId, 'ticketId', req);
    }
    if (data.projectId !== undefined) {
      await assertEntityExists(ENTITIES.Projects, data.projectId, 'projectId', req);
    }

    assertDuration(data.durationMinutes, req);
    if (data.date !== undefined && !data.date) req.error(400, 'date is required');
  }

  async sendToStraTIME(req) {
    const id = extractEntityId(req);
    if (!id) req.reject(400, 'Missing TimeLogs ID');

    const current = await this.repo.findById(id);
    if (!current) req.reject(404, `TimeLogs '${id}' not found`);

    const claims = this.auth.getRequestClaims(req);
    this.auth.requireOwnerOrReviewer(req, current, 'consultantId', claims);

    return this.repo.updateById(id, {
      sentToStraTIME: true,
      sentAt: nowIso(),
    });
  }
}

module.exports = TimeLogDomainService;
