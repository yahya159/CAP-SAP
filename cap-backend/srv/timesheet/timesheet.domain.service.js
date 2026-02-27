'use strict';

const { assertEntityExists, ENTITIES } = require('../shared/services/validation');

const assertHoursRange = (hours, req) => {
  if (hours === undefined || hours === null) return;
  const num = Number(hours);
  if (!Number.isFinite(num) || num < 0 || num > 24) {
    req.error(400, 'hours must be between 0 and 24');
  }
};

class TimesheetDomainService {
  constructor(_srv) {
  }

  async beforeCreate(req) {
    const data = req.data;

    await assertEntityExists(ENTITIES.Users, data.userId, 'userId', req);
    await assertEntityExists(ENTITIES.Projects, data.projectId, 'projectId', req);
    await assertEntityExists(ENTITIES.Tickets, data.ticketId, 'ticketId', req);

    assertHoursRange(data.hours, req);
    if (!data.date) req.error(400, 'date is required');
  }

  async beforeUpdate(req) {
    const data = req.data;

    if (data.userId !== undefined) {
      await assertEntityExists(ENTITIES.Users, data.userId, 'userId', req);
    }
    if (data.projectId !== undefined) {
      await assertEntityExists(ENTITIES.Projects, data.projectId, 'projectId', req);
    }
    if (data.ticketId !== undefined) {
      await assertEntityExists(ENTITIES.Tickets, data.ticketId, 'ticketId', req);
    }

    assertHoursRange(data.hours, req);
    if (data.date !== undefined && !data.date) req.error(400, 'date is required');
  }
}

module.exports = TimesheetDomainService;
