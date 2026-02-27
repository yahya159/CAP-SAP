'use strict';

const cds = require('@sap/cds');
const { ENTITIES } = require('../shared/services/validation');

class ImputationRepo {
  async findById(id) {
    return cds.db.run(SELECT.one.from(ENTITIES.Imputations).where({ ID: id }));
  }

  async updateById(id, changes) {
    await cds.db.run(
      UPDATE(ENTITIES.Imputations)
        .where({ ID: id })
        .with(changes)
    );
    return this.findById(id);
  }
}

module.exports = ImputationRepo;
