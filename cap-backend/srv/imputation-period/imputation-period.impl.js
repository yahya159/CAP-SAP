'use strict';

const ImputationPeriodDomainService = require('./imputation-period.domain.service');

module.exports = (srv) => {
  const domain = new ImputationPeriodDomainService(srv);

  srv.before('CREATE', 'ImputationPeriods', (req) => domain.beforeCreate(req));
  srv.before('UPDATE', 'ImputationPeriods', (req) => domain.beforeUpdate(req));
};
