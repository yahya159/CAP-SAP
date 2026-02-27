'use strict';

const cds = require('@sap/cds');

class UserRepo {
  async findByEmail(email) {
    return cds.db.run(
      SELECT.one.from('sap.performance.dashboard.db.Users').columns('ID').where({ email })
    );
  }

  async hasReferences(userId) {
    const checks = [
      ['sap.performance.dashboard.db.Tickets', { createdBy: userId }],
      ['sap.performance.dashboard.db.Tickets', { assignedTo: userId }],
      ['sap.performance.dashboard.db.Projects', { managerId: userId }],
      ['sap.performance.dashboard.db.Allocations', { userId }],
      ['sap.performance.dashboard.db.LeaveRequests', { consultantId: userId }],
      ['sap.performance.dashboard.db.LeaveRequests', { managerId: userId }],
      ['sap.performance.dashboard.db.Timesheets', { userId }],
      ['sap.performance.dashboard.db.TimeLogs', { consultantId: userId }],
      ['sap.performance.dashboard.db.Imputations', { consultantId: userId }],
      ['sap.performance.dashboard.db.ImputationPeriods', { consultantId: userId }],
    ];

    for (const [entity, where] of checks) {
      const existing = await cds.db.run(SELECT.one.from(entity).columns('ID').where(where));
      if (existing) return true;
    }
    return false;
  }
}

module.exports = UserRepo;
