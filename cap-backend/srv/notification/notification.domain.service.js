'use strict';

const { assertEntityExists, ENTITIES } = require('../shared/services/validation');

class NotificationDomainService {
  constructor(_srv) {
  }

  async beforeCreate(req) {
    await assertEntityExists(ENTITIES.Users, req.data.userId, 'userId', req);
  }
}

module.exports = NotificationDomainService;
