'use strict';

const EvaluationDomainService = require('./evaluation.domain.service');

module.exports = (srv) => {
  const domain = new EvaluationDomainService(srv);

  srv.before('CREATE', 'Evaluations', (req) => domain.beforeCreate(req));
};
