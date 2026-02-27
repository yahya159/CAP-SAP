'use strict';

const cds = require('@sap/cds');
const { ENTITIES } = require('../shared/services/validation');

class WricefRepo {
  async existsWricefById(wricefId) {
    const existing = await cds.db.run(
      SELECT.one.from(ENTITIES.Wricefs).columns('ID').where({ ID: wricefId })
    );
    return Boolean(existing);
  }

  async deleteObjectsByWricefId(wricefId) {
    return cds.db.run(
      DELETE.from(ENTITIES.WricefObjects).where({ wricefId })
    );
  }
}

module.exports = WricefRepo;
