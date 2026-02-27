'use strict';
/**
 * ticket.repo.js – ALL DB operations for Tickets.
 * NO business rules here. Only SELECT / INSERT / UPDATE / DELETE.
 */
const cds = require('@sap/cds');

class TicketRepo {
  /** Check whether a ticket code already exists */
  async existsByTicketCode(ticketCode) {
    const existing = await cds.db.run(
      SELECT.one.from('sap.performance.dashboard.db.Tickets')
        .columns('ID')
        .where({ ticketCode })
    );
    return Boolean(existing);
  }

  /** Check whether a project exists */
  async existsProjectById(projectId) {
    const existing = await cds.db.run(
      SELECT.one.from('sap.performance.dashboard.db.Projects')
        .columns('ID')
        .where({ ID: projectId })
    );
    return Boolean(existing);
  }

  /** Check whether a user exists */
  async existsUserById(userId) {
    const existing = await cds.db.run(
      SELECT.one.from('sap.performance.dashboard.db.Users')
        .columns('ID')
        .where({ ID: userId })
    );
    return Boolean(existing);
  }

  /** Fetch a ticket by ID */
  async findById(id) {
    return cds.db.run(SELECT.one.from('sap.performance.dashboard.db.Tickets').where({ ID: id }));
  }

  /** Persist a new ticket */
  async insert(data) {
    await cds.db.run(INSERT.into('sap.performance.dashboard.db.Tickets').entries(data));
    return cds.db.run(SELECT.one.from('sap.performance.dashboard.db.Tickets').where({ ID: data.ID }));
  }

  /** Update ticket fields */
  async update(id, changes) {
    await cds.db.run(UPDATE('sap.performance.dashboard.db.Tickets').where({ ID: id }).with(changes));
    return cds.db.run(SELECT.one.from('sap.performance.dashboard.db.Tickets').where({ ID: id }));
  }
}

module.exports = TicketRepo;
