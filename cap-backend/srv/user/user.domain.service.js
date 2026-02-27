'use strict';

const UserRepo = require('./user.repo');
const { ADMIN_ONLY, requireRole } = require('../shared/services/validation');

const extractEntityId = (req) => req.params?.[0]?.ID ?? req.params?.[0] ?? req.data?.ID;
const normalizeEmail = (value) => String(value ?? '').trim().toLowerCase();

class UserDomainService {
  constructor(_srv) {
    this.repo = new UserRepo();
  }

  async beforeCreate(req) {
    requireRole(req, ADMIN_ONLY, 'Only ADMIN can create users');
    const email = normalizeEmail(req.data?.email);
    if (!email) req.reject(400, 'email is required');
    req.data.email = email;

    const existing = await this.repo.findByEmail(email);
    if (existing) req.reject(409, `A user with email '${email}' already exists`);
  }

  async beforeUpdate(req) {
    requireRole(req, ADMIN_ONLY, 'Only ADMIN can update users');
    if (req.data?.email === undefined) return;

    const email = normalizeEmail(req.data.email);
    if (!email) req.reject(400, 'email is required');
    req.data.email = email;

    const id = extractEntityId(req);
    const existing = await this.repo.findByEmail(email);
    if (existing && String(existing.ID) !== String(id)) {
      req.reject(409, `A user with email '${email}' already exists`);
    }
  }

  async beforeDelete(req) {
    requireRole(req, ADMIN_ONLY, 'Only ADMIN can delete users');
    const id = extractEntityId(req);
    if (!id) return;

    const hasReferences = await this.repo.hasReferences(id);
    if (hasReferences) {
      req.reject(409, 'Cannot delete user that is referenced by other records');
    }
  }
}

module.exports = UserDomainService;
