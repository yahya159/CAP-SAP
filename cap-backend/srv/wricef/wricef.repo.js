'use strict';

const cds = require('@sap/cds');
const { ENTITIES } = require('../shared/services/validation');

class WricefRepo {
  // ─── WRICEF queries ─────────────────────────────────────────────────

  async existsWricefById(wricefId) {
    const existing = await cds.db.run(
      SELECT.one.from(ENTITIES.Wricefs).columns('ID').where({ ID: wricefId })
    );
    return Boolean(existing);
  }

  async findById(id) {
    return cds.db.run(SELECT.one.from(ENTITIES.Wricefs).where({ ID: id }));
  }

  async updateById(id, changes) {
    await cds.db.run(UPDATE(ENTITIES.Wricefs).where({ ID: id }).with(changes));
    return this.findById(id);
  }

  async findByStatus(status) {
    return cds.db.run(SELECT.from(ENTITIES.Wricefs).where({ status }));
  }

  // ─── WricefObject queries ──────────────────────────────────────────

  async findObjectById(id) {
    return cds.db.run(SELECT.one.from(ENTITIES.WricefObjects).where({ ID: id }));
  }

  async findObjectsByWricefId(wricefId) {
    return cds.db.run(SELECT.from(ENTITIES.WricefObjects).where({ wricefId }));
  }

  async updateObjectById(id, changes) {
    await cds.db.run(UPDATE(ENTITIES.WricefObjects).where({ ID: id }).with(changes));
    return this.findObjectById(id);
  }

  /**
   * Bulk-update objects of a given WRICEF from one status to another.
   */
  async updateObjectsStatusByWricefId(wricefId, fromStatus, toStatus) {
    return cds.db.run(
      UPDATE(ENTITIES.WricefObjects)
        .where({ wricefId, status: fromStatus })
        .with({ status: toStatus })
    );
  }

  async deleteObjectsByWricefId(wricefId) {
    return cds.db.run(
      DELETE.from(ENTITIES.WricefObjects).where({ wricefId })
    );
  }
}

module.exports = WricefRepo;
