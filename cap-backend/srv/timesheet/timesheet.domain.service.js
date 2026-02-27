'use strict';

const TimesheetRepo = require('./timesheet.repo');

const assertHoursRange = (hours, req) => {
  if (hours === undefined || hours === null) return;
  const num = Number(hours);
  if (!Number.isFinite(num) || num < 0 || num > 24) {
    req.error(400, 'hours must be between 0 and 24');
  }
};

class TimesheetDomainService {
  constructor(_srv) {
    this.repo = new TimesheetRepo();
  }

  async beforeCreate(req) {
    const data = req.data;

    const userExists = await this.repo.existsUserById(data.userId);
    if (!userExists) req.error(400, `Unknown userId '${data.userId}'`);

    const projectExists = await this.repo.existsProjectById(data.projectId);
    if (!projectExists) req.error(400, `Unknown projectId '${data.projectId}'`);

    if (data.ticketId !== undefined && data.ticketId !== null && data.ticketId !== '') {
      const ticketExists = await this.repo.existsTicketById(data.ticketId);
      if (!ticketExists) req.error(400, `Unknown ticketId '${data.ticketId}'`);
    }

    assertHoursRange(data.hours, req);
    if (!data.date) req.error(400, 'date is required');
  }

  async beforeUpdate(req) {
    const data = req.data;

    if (data.userId !== undefined) {
      const userExists = await this.repo.existsUserById(data.userId);
      if (!userExists) req.error(400, `Unknown userId '${data.userId}'`);
    }
    if (data.projectId !== undefined) {
      const projectExists = await this.repo.existsProjectById(data.projectId);
      if (!projectExists) req.error(400, `Unknown projectId '${data.projectId}'`);
    }
    if (data.ticketId !== undefined && data.ticketId !== null && data.ticketId !== '') {
      const ticketExists = await this.repo.existsTicketById(data.ticketId);
      if (!ticketExists) req.error(400, `Unknown ticketId '${data.ticketId}'`);
    }

    assertHoursRange(data.hours, req);
    if (data.date !== undefined && !data.date) req.error(400, 'date is required');
  }
}

module.exports = TimesheetDomainService;
