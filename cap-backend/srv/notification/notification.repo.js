'use strict';

const cds = require('@sap/cds');

class NotificationRepo {
  async existsUserById(userId) {
    const existing = await cds.db.run(
      SELECT.one.from('sap.performance.dashboard.db.Users').columns('ID').where({ ID: userId })
    );
    return Boolean(existing);
  }
}

module.exports = NotificationRepo;
