'use strict';

const ReferenceDataRepo = require('./reference-data.repo');

const extractEntityId = (req) => req.params?.[0]?.ID ?? req.params?.[0] ?? req.data?.ID;

class ReferenceDataDomainService {
  constructor(_srv) {
    this.repo = new ReferenceDataRepo();
  }

  async beforeCreate(req) {
    const type = String(req.data?.type ?? '').trim();
    const code = String(req.data?.code ?? '').trim();
    if (!type) req.error(400, 'type is required');
    if (!code) req.error(400, 'code is required');

    const existing = await this.repo.findByTypeAndCode(type, code);
    if (existing) req.reject(409, `ReferenceData with type '${type}' and code '${code}' already exists`);
  }

  async beforeUpdate(req) {
    const id = extractEntityId(req);
    if (!id) return;

    const current = await this.repo.findById(id);
    if (!current) return;

    const type = req.data?.type !== undefined ? String(req.data.type).trim() : current.type;
    const code = req.data?.code !== undefined ? String(req.data.code).trim() : current.code;
    if (!type) req.error(400, 'type is required');
    if (!code) req.error(400, 'code is required');

    const existing = await this.repo.findByTypeAndCode(type, code);
    if (existing && String(existing.ID) !== String(id)) {
      req.reject(409, `ReferenceData with type '${type}' and code '${code}' already exists`);
    }
  }
}

module.exports = ReferenceDataDomainService;
