'use strict';

const cds = require('@sap/cds');
const { ENTITIES } = require('../shared/services/validation');

class AllocationRepo {
  async findById(id) {
    return cds.db.run(SELECT.one.from(ENTITIES.Allocations).where({ ID: id }));
  }
}

module.exports = AllocationRepo;
