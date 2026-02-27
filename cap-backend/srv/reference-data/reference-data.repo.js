'use strict';

const cds = require('@sap/cds');

class ReferenceDataRepo {
  async findByTypeAndCode(type, code) {
    return cds.db.run(
      SELECT.one
        .from('sap.performance.dashboard.db.ReferenceData')
        .columns('ID')
        .where({ type, code })
    );
  }

  async findById(id) {
    return cds.db.run(SELECT.one.from('sap.performance.dashboard.db.ReferenceData').where({ ID: id }));
  }
}

module.exports = ReferenceDataRepo;
