'use strict';

const cds = require('@sap/cds');

class DocumentationRepo {
  async existsProjectById(projectId) {
    const existing = await cds.db.run(
      SELECT.one.from('sap.performance.dashboard.db.Projects').columns('ID').where({ ID: projectId })
    );
    return Boolean(existing);
  }

  async existsUserById(userId) {
    const existing = await cds.db.run(
      SELECT.one.from('sap.performance.dashboard.db.Users').columns('ID').where({ ID: userId })
    );
    return Boolean(existing);
  }
}

module.exports = DocumentationRepo;
