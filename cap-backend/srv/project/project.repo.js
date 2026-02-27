'use strict';

const cds = require('@sap/cds');

class ProjectRepo {
  async existsUserById(userId) {
    const existing = await cds.db.run(
      SELECT.one.from('sap.performance.dashboard.db.Users').columns('ID').where({ ID: userId })
    );
    return Boolean(existing);
  }

  async existsActiveUserById(userId) {
    const existing = await cds.db.run(
      SELECT.one
        .from('sap.performance.dashboard.db.Users')
        .columns('ID')
        .where({ ID: userId, active: true })
    );
    return Boolean(existing);
  }

  async findById(id) {
    return cds.db.run(SELECT.one.from('sap.performance.dashboard.db.Projects').where({ ID: id }));
  }

  async hasRelatedRecords(projectId) {
    const checks = [
      ['sap.performance.dashboard.db.Tickets', { projectId }],
      ['sap.performance.dashboard.db.Allocations', { projectId }],
      ['sap.performance.dashboard.db.Deliverables', { projectId }],
      ['sap.performance.dashboard.db.Timesheets', { projectId }],
      ['sap.performance.dashboard.db.TimeLogs', { projectId }],
      ['sap.performance.dashboard.db.Imputations', { projectId }],
      ['sap.performance.dashboard.db.Wricefs', { projectId }],
      ['sap.performance.dashboard.db.DocumentationObjects', { projectId }],
    ];

    for (const [entity, where] of checks) {
      const existing = await cds.db.run(SELECT.one.from(entity).columns('ID').where(where));
      if (existing) return true;
    }
    return false;
  }
}

module.exports = ProjectRepo;
