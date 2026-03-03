'use strict';

const cds = require('@sap/cds');
const { assertEntityExists, ENTITIES } = require('../shared/services/validation');

class NotificationDomainService {
  constructor(_srv) {
  }

  async beforeCreate(req) {
    const claims = req._authClaims;
    if (!claims || (claims.role !== 'ADMIN' && req.data.userId !== claims.sub)) {
      req.reject(403, 'Not authorized to create notifications for other users');
    }
    await assertEntityExists(ENTITIES.Users, req.data.userId, 'userId', req);
  }

  beforeRead(req) {
    const claims = req._authClaims;
    if (!claims || claims.role === 'ADMIN') return;

    const select = req.query?.SELECT;
    if (!select) return;

    const ownershipFilter = [{ ref: ['userId'] }, '=', { val: claims.sub }];
    if (Array.isArray(select.where) && select.where.length > 0) {
      select.where = ['(', ...select.where, ')', 'and', ...ownershipFilter];
    } else {
      select.where = ownershipFilter;
    }
  }

  async beforeUpdate(req) {
    await this._checkOwnership(req);
  }

  async beforeDelete(req) {
    await this._checkOwnership(req);
  }

  async _checkOwnership(req) {
    const id = req.data?.ID ?? req.params?.[0]?.ID ?? req.params?.[0];
    const claims = req._authClaims;
    if (!id || !claims || claims.role === 'ADMIN') return;

    const notif = await cds.db.run(SELECT.one.from(ENTITIES.Notifications).where({ ID: id }));
    if (notif && notif.userId !== claims.sub) {
      req.reject(403, 'Not authorized to modify this notification');
    }
  }
}

module.exports = NotificationDomainService;
