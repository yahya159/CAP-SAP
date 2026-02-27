'use strict';

const WricefRepo = require('./wricef.repo');
const { assertInEnum } = require('../shared/utils/validation');

const WRICEF_TYPES = ['W', 'R', 'I', 'C', 'E', 'F'];
const extractEntityId = (req) => req.params?.[0]?.ID ?? req.params?.[0] ?? req.data?.ID;

class WricefDomainService {
  constructor(_srv) {
    this.repo = new WricefRepo();
  }

  async beforeCreate(req) {
    const existsProject = await this.repo.existsProjectById(req.data.projectId);
    if (!existsProject) req.error(400, `Unknown projectId '${req.data.projectId}'`);
  }

  async beforeDelete(req) {
    const id = extractEntityId(req);
    if (!id) return;
    await this.repo.deleteObjectsByWricefId(id);
  }

  async beforeCreateObject(req) {
    const data = req.data;

    const existsWricef = await this.repo.existsWricefById(data.wricefId);
    if (!existsWricef) req.error(400, `Unknown wricefId '${data.wricefId}'`);

    const existsProject = await this.repo.existsProjectById(data.projectId);
    if (!existsProject) req.error(400, `Unknown projectId '${data.projectId}'`);

    assertInEnum(data.type, WRICEF_TYPES, 'type', req);
    if (!String(data.title ?? '').trim()) req.error(400, 'title is required');
  }

  async beforeUpdateObject(req) {
    const data = req.data;

    if (data.wricefId !== undefined) {
      const existsWricef = await this.repo.existsWricefById(data.wricefId);
      if (!existsWricef) req.error(400, `Unknown wricefId '${data.wricefId}'`);
    }
    if (data.projectId !== undefined) {
      const existsProject = await this.repo.existsProjectById(data.projectId);
      if (!existsProject) req.error(400, `Unknown projectId '${data.projectId}'`);
    }
  }
}

module.exports = WricefDomainService;
