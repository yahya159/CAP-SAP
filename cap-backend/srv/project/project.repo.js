'use strict';

const cds = require('@sap/cds');
const { ENTITIES } = require('../shared/services/validation');

class ProjectRepo {
  async existsActiveUserById(userId) {
    const existing = await cds.db.run(
      SELECT.one
        .from(ENTITIES.Users)
        .columns('ID')
        .where({ ID: userId, active: true })
    );
    return Boolean(existing);
  }

  async findById(id) {
    return cds.db.run(SELECT.one.from(ENTITIES.Projects).where({ ID: id }));
  }

  async hasRelatedRecords(projectId) {
    const checks = [
      [ENTITIES.Tickets, { projectId }],
      [ENTITIES.Allocations, { projectId }],
      [ENTITIES.Deliverables, { projectId }],
      [ENTITIES.Timesheets, { projectId }],
      [ENTITIES.TimeLogs, { projectId }],
      [ENTITIES.Imputations, { projectId }],
      [ENTITIES.Wricefs, { projectId }],
      [ENTITIES.DocumentationObjects, { projectId }],
    ];

    for (const [entity, where] of checks) {
      const existing = await cds.db.run(SELECT.one.from(entity).columns('ID').where(where));
      if (existing) return true;
    }
    return false;
  }
}

module.exports = ProjectRepo;
