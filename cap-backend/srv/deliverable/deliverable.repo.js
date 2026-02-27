'use strict';

const cds = require('@sap/cds');
const { ENTITIES } = require('../shared/services/validation');

class DeliverableRepo {
  async findById(id) {
    return cds.db.run(SELECT.one.from(ENTITIES.Deliverables).where({ ID: id }));
  }
}

module.exports = DeliverableRepo;
