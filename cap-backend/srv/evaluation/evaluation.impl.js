'use strict';

const EvaluationDomainService = require('./evaluation.domain.service');

module.exports = (srv) => {
  const domain = new EvaluationDomainService(srv);

  srv.before('READ', 'Evaluations', (req) => domain.beforeRead(req));
  srv.before('CREATE', 'Evaluations', (req) => domain.beforeCreate(req));
};
