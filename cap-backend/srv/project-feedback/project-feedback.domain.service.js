'use strict';

const { assertEntityExists, ENTITIES } = require('../shared/services/validation');

class ProjectFeedbackDomainService {
  constructor(_srv) {
  }

  async beforeCreate(req) {
    await assertEntityExists(ENTITIES.Projects, req.data.projectId, 'projectId', req);
    await assertEntityExists(ENTITIES.Users, req.data.authorId, 'authorId', req);
  }
}

module.exports = ProjectFeedbackDomainService;
