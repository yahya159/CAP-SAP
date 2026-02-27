'use strict';

const NotificationRepo = require('./notification.repo');

class NotificationDomainService {
  constructor(_srv) {
    this.repo = new NotificationRepo();
  }

  async beforeCreate(req) {
    const existsUser = await this.repo.existsUserById(req.data.userId);
    if (!existsUser) req.error(400, `Unknown userId '${req.data.userId}'`);
  }
}

module.exports = NotificationDomainService;
