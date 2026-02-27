'use strict';

const cds = require('@sap/cds');

class TimeLogRepo {
  async existsUserById(userId) {
    const existing = await cds.db.run(
      SELECT.one.from('sap.performance.dashboard.db.Users').columns('ID').where({ ID: userId })
    );
    return Boolean(existing);
  }

  async existsProjectById(projectId) {
    const existing = await cds.db.run(
      SELECT.one.from('sap.performance.dashboard.db.Projects').columns('ID').where({ ID: projectId })
    );
    return Boolean(existing);
  }

  async existsTicketById(ticketId) {
    const existing = await cds.db.run(
      SELECT.one.from('sap.performance.dashboard.db.Tickets').columns('ID').where({ ID: ticketId })
    );
    return Boolean(existing);
  }

  async findById(id) {
    return cds.db.run(SELECT.one.from('sap.performance.dashboard.db.TimeLogs').where({ ID: id }));
  }
}

module.exports = TimeLogRepo;
