'use strict';

const cds = require('@sap/cds');

class WricefRepo {
  async existsProjectById(projectId) {
    const existing = await cds.db.run(
      SELECT.one.from('sap.performance.dashboard.db.Projects').columns('ID').where({ ID: projectId })
    );
    return Boolean(existing);
  }

  async existsWricefById(wricefId) {
    const existing = await cds.db.run(
      SELECT.one.from('sap.performance.dashboard.db.Wricefs').columns('ID').where({ ID: wricefId })
    );
    return Boolean(existing);
  }

  async deleteObjectsByWricefId(wricefId) {
    return cds.db.run(
      DELETE.from('sap.performance.dashboard.db.WricefObjects').where({ wricefId })
    );
  }
}

module.exports = WricefRepo;
