'use strict';

const cds = require('@sap/cds');
const { ENTITIES } = require('../shared/services/validation');

class LeaveRequestRepo {
  async findById(id) {
    return cds.db.run(SELECT.one.from(ENTITIES.LeaveRequests).where({ ID: id }));
  }
}

module.exports = LeaveRequestRepo;
