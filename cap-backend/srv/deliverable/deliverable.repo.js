'use strict';

const cds = require('@sap/cds');

class DeliverableRepo {
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
    return cds.db.run(SELECT.one.from('sap.performance.dashboard.db.Deliverables').where({ ID: id }));
  }
}

module.exports = DeliverableRepo;
