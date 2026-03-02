'use strict';

const TicketDomainService = require('./ticket.domain.service');

module.exports = (srv) => {
  const domain = new TicketDomainService(srv);
  srv.before('READ', 'Tickets', (req) => domain.beforeRead(req));
  srv.before('CREATE', 'Tickets', (req) => domain.beforeCreate(req));
  srv.before('UPDATE', 'Tickets', (req) => domain.beforeUpdate(req));
  srv.before('DELETE', 'Tickets', (req) => {
    const { MANAGER_ROLES, requireRole } = require('../shared/services/validation');
    requireRole(req, MANAGER_ROLES, 'Only managers can delete tickets');
  });
  srv.on('approveTicket', 'Tickets', (req) => domain.approveTicket(req));
  srv.on('rejectTicket', 'Tickets', (req) => domain.rejectTicket(req));
  srv.after(['READ', 'CREATE', 'UPDATE'], 'Tickets', (data) => domain.afterRead(data));
};
