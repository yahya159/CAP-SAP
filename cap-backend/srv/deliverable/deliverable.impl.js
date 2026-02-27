'use strict';

const DeliverableDomainService = require('./deliverable.domain.service');

module.exports = (srv) => {
  const domain = new DeliverableDomainService(srv);

  srv.before('CREATE', 'Deliverables', (req) => domain.beforeCreate(req));
  srv.before('UPDATE', 'Deliverables', (req) => domain.beforeUpdate(req));
};
