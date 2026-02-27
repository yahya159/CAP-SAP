'use strict';

const LeaveRequestDomainService = require('./leave-request.domain.service');

module.exports = (srv) => {
  const domain = new LeaveRequestDomainService(srv);

  srv.before('CREATE', 'LeaveRequests', (req) => domain.beforeCreate(req));
  srv.before('UPDATE', 'LeaveRequests', (req) => domain.beforeUpdate(req));
};
