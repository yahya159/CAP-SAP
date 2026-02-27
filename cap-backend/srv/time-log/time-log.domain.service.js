'use strict';

const TimeLogRepo = require('./time-log.repo');

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
  }

  async beforeCreate(req) {
    const data = req.data;

    const consultantExists = await this.repo.existsUserById(data.consultantId);
    if (!consultantExists) req.error(400, `Unknown consultantId '${data.consultantId}'`);

    const ticketExists = await this.repo.existsTicketById(data.ticketId);
    if (!ticketExists) req.error(400, `Unknown ticketId '${data.ticketId}'`);

    const projectExists = await this.repo.existsProjectById(data.projectId);
    if (!projectExists) req.error(400, `Unknown projectId '${data.projectId}'`);

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

    if (data.consultantId !== undefined) {
      const consultantExists = await this.repo.existsUserById(data.consultantId);
      if (!consultantExists) req.error(400, `Unknown consultantId '${data.consultantId}'`);
    }
    if (data.ticketId !== undefined) {
      const ticketExists = await this.repo.existsTicketById(data.ticketId);
      if (!ticketExists) req.error(400, `Unknown ticketId '${data.ticketId}'`);
    }
    if (data.projectId !== undefined) {
      const projectExists = await this.repo.existsProjectById(data.projectId);
      if (!projectExists) req.error(400, `Unknown projectId '${data.projectId}'`);
    }

    assertDuration(data.durationMinutes, req);
    if (data.date !== undefined && !data.date) req.error(400, 'date is required');
  }
}

module.exports = TimeLogDomainService;
