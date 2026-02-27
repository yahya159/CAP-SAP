'use strict';

const AllocationDomainService = require('./allocation.domain.service');

module.exports = (srv) => {
  const domain = new AllocationDomainService(srv);

  srv.before('CREATE', 'Allocations', (req) => domain.beforeCreate(req));
  srv.before('UPDATE', 'Allocations', (req) => domain.beforeUpdate(req));
};
