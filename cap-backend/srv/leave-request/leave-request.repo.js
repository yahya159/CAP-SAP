'use strict';

const cds = require('@sap/cds');

class LeaveRequestRepo {
  async existsUserById(userId) {
    const existing = await cds.db.run(
      SELECT.one.from('sap.performance.dashboard.db.Users').columns('ID').where({ ID: userId })
    );
    return Boolean(existing);
  }

  async findById(id) {
    return cds.db.run(SELECT.one.from('sap.performance.dashboard.db.LeaveRequests').where({ ID: id }));
  }
}

module.exports = LeaveRequestRepo;
