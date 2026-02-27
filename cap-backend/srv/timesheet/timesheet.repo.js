'use strict';

const cds = require('@sap/cds');
const { ENTITIES } = require('../shared/services/validation');

class TimesheetRepo {
  async findById(id) {
    return cds.db.run(SELECT.one.from(ENTITIES.Timesheets).where({ ID: id }));
  }
}

module.exports = TimesheetRepo;
