'use strict';

const cds = require('@sap/cds');
const { ENTITIES } = require('../shared/services/validation');

class CommentRepo {
  async findById(id) {
    return cds.db.run(SELECT.one.from(ENTITIES.TicketComments).where({ ID: id }));
  }

  async findByTicketId(ticketId) {
    return cds.db.run(
      SELECT.from(ENTITIES.TicketComments)
        .where({ ticketId })
        .orderBy('createdAt asc')
    );
  }

  async updateById(id, changes) {
    await cds.db.run(UPDATE(ENTITIES.TicketComments).where({ ID: id }).with(changes));
    return this.findById(id);
  }

  async countUnresolved(ticketId, commentTypes) {
    const rows = await cds.db.run(
      SELECT.from(ENTITIES.TicketComments)
        .columns('count(ID) as cnt')
        .where({ ticketId, resolved: false, commentType: { in: commentTypes } })
    );
    return rows?.[0]?.cnt ?? 0;
  }
}

module.exports = CommentRepo;
