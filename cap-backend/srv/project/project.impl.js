'use strict';

const ProjectDomainService = require('./project.domain.service');

module.exports = (srv) => {
  const domain = new ProjectDomainService(srv);

  srv.before('CREATE', 'Projects', (req) => domain.beforeCreate(req));
  srv.before('UPDATE', 'Projects', (req) => domain.beforeUpdate(req));
  srv.before('DELETE', 'Projects', (req) => domain.beforeDelete(req));
};
