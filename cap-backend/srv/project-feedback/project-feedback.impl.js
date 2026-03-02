'use strict';

const ProjectFeedbackDomainService = require('./project-feedback.domain.service');

module.exports = (srv) => {
  const domain = new ProjectFeedbackDomainService(srv);

  srv.before('CREATE', 'ProjectFeedback', (req) => domain.beforeCreate(req));
};
