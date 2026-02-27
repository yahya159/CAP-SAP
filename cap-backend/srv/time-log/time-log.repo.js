'use strict';

const cds = require('@sap/cds');
const { ENTITIES } = require('../shared/services/validation');

class TimeLogRepo {
  async findById(id) {
    return cds.db.run(SELECT.one.from(ENTITIES.TimeLogs).where({ ID: id }));
  }

  async updateById(id, changes) {
    await cds.db.run(
      UPDATE(ENTITIES.TimeLogs)
        .where({ ID: id })
        .with(changes)
    );
    return this.findById(id);
  }
}

module.exports = TimeLogRepo;
