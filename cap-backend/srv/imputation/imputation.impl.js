'use strict';

const ImputationDomainService = require('./imputation.domain.service');

module.exports = (srv) => {
  const domain = new ImputationDomainService(srv);

  srv.before('CREATE', 'Imputations', (req) => domain.beforeCreate(req));
  srv.before('UPDATE', 'Imputations', (req) => domain.beforeUpdate(req));
  srv.before('DELETE', 'Imputations', (req) => domain.beforeDelete(req));
};
