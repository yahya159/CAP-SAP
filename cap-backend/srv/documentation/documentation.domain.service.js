'use strict';

const { assertEntityExists, ENTITIES } = require('../shared/services/validation');
const { nowIso } = require('../shared/utils/timestamp');

class DocumentationDomainService {
  constructor(_srv) {
  }

  async beforeCreate(req) {
    const data = req.data;
    const userId = String(req._authClaims?.sub ?? '').trim();

    if (!userId) req.reject(401, 'Missing authenticated user');
    if (data.authorId !== undefined && String(data.authorId) !== userId) {
      req.reject(403, 'authorId must match the authenticated user');
    }
    data.authorId = userId;

    await assertEntityExists(ENTITIES.Projects, data.projectId, 'projectId', req);
    await assertEntityExists(ENTITIES.Users, data.authorId, 'authorId', req);

    const timestamp = nowIso();
    data.createdAt = timestamp;
    data.updatedAt = timestamp;
  }

  async beforeUpdate(req) {
    const data = req.data;
    const userId = String(req._authClaims?.sub ?? '').trim();

    if (data.authorId !== undefined) {
      if (!userId) req.reject(401, 'Missing authenticated user');
      if (String(data.authorId) !== userId) {
        req.reject(403, 'authorId cannot be reassigned to another user');
      }
      data.authorId = userId;
    }

    data.updatedAt = nowIso();

    await assertEntityExists(ENTITIES.Projects, data.projectId, 'projectId', req);
    await assertEntityExists(ENTITIES.Users, data.authorId, 'authorId', req);
  }
}

module.exports = DocumentationDomainService;
