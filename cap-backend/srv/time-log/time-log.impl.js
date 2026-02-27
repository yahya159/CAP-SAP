'use strict';

const TimeLogDomainService = require('./time-log.domain.service');

module.exports = (srv) => {
  const domain = new TimeLogDomainService(srv);

  srv.before('CREATE', 'TimeLogs', (req) => domain.beforeCreate(req));
  srv.before('UPDATE', 'TimeLogs', (req) => domain.beforeUpdate(req));
};
