'use strict';

const TimesheetDomainService = require('./timesheet.domain.service');

module.exports = (srv) => {
  const domain = new TimesheetDomainService(srv);

  srv.before('CREATE', 'Timesheets', (req) => domain.beforeCreate(req));
  srv.before('UPDATE', 'Timesheets', (req) => domain.beforeUpdate(req));
};
