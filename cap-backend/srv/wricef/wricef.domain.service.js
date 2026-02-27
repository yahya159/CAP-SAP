'use strict';

const WricefRepo = require('./wricef.repo');
const { assertEntityExists, assertInEnum, ENTITIES, MANAGER_ROLES, requireRole } = require('../shared/services/validation');

const WRICEF_TYPES = ['W', 'R', 'I', 'C', 'E', 'F'];
const extractEntityId = (req) => req.params?.[0]?.ID ?? req.params?.[0] ?? req.data?.ID;

class WricefDomainService {
  constructor(_srv) {
    this.repo = new WricefRepo();
  }

  async beforeCreate(req) {
    requireRole(req, MANAGER_ROLES, 'Only managers can manage WRICEF data');
    await assertEntityExists(ENTITIES.Projects, req.data.projectId, 'projectId', req);
  }

  async beforeDelete(req) {
    const id = extractEntityId(req);
    if (!id) return;
    await this.repo.deleteObjectsByWricefId(id);
  }

  async beforeCreateObject(req) {
    requireRole(req, MANAGER_ROLES, 'Only managers can manage WRICEF objects');
    const data = req.data;

    const existsWricef = await this.repo.existsWricefById(data.wricefId);
    if (!existsWricef) req.error(400, `Unknown wricefId '${data.wricefId}'`);

    await assertEntityExists(ENTITIES.Projects, data.projectId, 'projectId', req);

    assertInEnum(data.type, WRICEF_TYPES, 'type', req);
    if (!String(data.title ?? '').trim()) req.error(400, 'title is required');
  }

  async beforeUpdateObject(req) {
    requireRole(req, MANAGER_ROLES, 'Only managers can manage WRICEF objects');
    const data = req.data;

    if (data.wricefId !== undefined) {
      const existsWricef = await this.repo.existsWricefById(data.wricefId);
      if (!existsWricef) req.error(400, `Unknown wricefId '${data.wricefId}'`);
    }
    if (data.projectId !== undefined) {
      await assertEntityExists(ENTITIES.Projects, data.projectId, 'projectId', req);
    }
  }
}

module.exports = WricefDomainService;
