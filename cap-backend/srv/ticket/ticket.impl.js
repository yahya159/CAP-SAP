'use strict';

const TicketDomainService = require('./ticket.domain.service');

module.exports = (srv) => {
  const domain = new TicketDomainService(srv);
  srv.before('CREATE', 'Tickets', (req) => domain.beforeCreate(req));
  srv.before('UPDATE', 'Tickets', (req) => domain.beforeUpdate(req));
  srv.before('DELETE', 'Tickets', (req) => {
    const { MANAGER_ROLES, requireRole } = require('../shared/services/validation');
    requireRole(req, MANAGER_ROLES, 'Only managers can delete tickets');
  });
  srv.after(['READ', 'CREATE', 'UPDATE'], 'Tickets', (data) => domain.afterRead(data));
};
