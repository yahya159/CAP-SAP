'use strict';

const CommentDomainService = require('./comment.domain.service');

module.exports = (srv) => {
  const domain = new CommentDomainService(srv);

  srv.before('READ', 'TicketComments', (req) => domain.beforeRead(req));
  srv.before('CREATE', 'TicketComments', (req) => domain.beforeCreate(req));
  srv.before('UPDATE', 'TicketComments', (req) => domain.beforeUpdate(req));
};
