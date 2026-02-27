'use strict';

const { assertEntityExists, ENTITIES } = require('../shared/services/validation');
const { nowIso } = require('../shared/utils/timestamp');

class DocumentationDomainService {
  constructor(_srv) {
  }

  async beforeCreate(req) {
    const data = req.data;

    await assertEntityExists(ENTITIES.Projects, data.projectId, 'projectId', req);
    await assertEntityExists(ENTITIES.Users, data.authorId, 'authorId', req);

    const timestamp = nowIso();
    data.createdAt = timestamp;
    data.updatedAt = timestamp;
  }

  async beforeUpdate(req) {
    const data = req.data;
    data.updatedAt = nowIso();

    await assertEntityExists(ENTITIES.Projects, data.projectId, 'projectId', req);
    await assertEntityExists(ENTITIES.Users, data.authorId, 'authorId', req);
  }
}

module.exports = DocumentationDomainService;
