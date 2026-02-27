'use strict';

const ImputationRepo = require('./imputation.repo');

const extractEntityId = (req) => req.params?.[0]?.ID ?? req.params?.[0] ?? req.data?.ID;

const assertHours = (value, req) => {
  if (value === undefined || value === null) return;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0 || num > 24) {
    req.error(400, 'hours must be between 0 and 24');
  }
};

class ImputationDomainService {
  constructor(_srv) {
    this.repo = new ImputationRepo();
  }

  async beforeCreate(req) {
    const data = req.data;

    const consultantExists = await this.repo.existsUserById(data.consultantId);
    if (!consultantExists) req.error(400, `Unknown consultantId '${data.consultantId}'`);

    const ticketExists = await this.repo.existsTicketById(data.ticketId);
    if (!ticketExists) req.error(400, `Unknown ticketId '${data.ticketId}'`);

    const projectExists = await this.repo.existsProjectById(data.projectId);
    if (!projectExists) req.error(400, `Unknown projectId '${data.projectId}'`);

    assertHours(data.hours, req);
    if (!String(data.periodKey ?? '').trim()) req.error(400, 'periodKey is required');
    if (data.validationStatus === undefined) data.validationStatus = 'DRAFT';
  }

  async beforeUpdate(req) {
    const data = req.data;
    const id = extractEntityId(req);
    const current = id ? await this.repo.findById(id) : null;

    if (
      data.validationStatus !== undefined &&
      current &&
      data.validationStatus !== current.validationStatus
    ) {
      req.reject(403, 'Use validate/reject actions to change validation status');
    }

    if (data.consultantId !== undefined) {
      const consultantExists = await this.repo.existsUserById(data.consultantId);
      if (!consultantExists) req.error(400, `Unknown consultantId '${data.consultantId}'`);
    }
    if (data.ticketId !== undefined) {
      const ticketExists = await this.repo.existsTicketById(data.ticketId);
      if (!ticketExists) req.error(400, `Unknown ticketId '${data.ticketId}'`);
    }
    if (data.projectId !== undefined) {
      const projectExists = await this.repo.existsProjectById(data.projectId);
      if (!projectExists) req.error(400, `Unknown projectId '${data.projectId}'`);
    }

    assertHours(data.hours, req);
    if (data.periodKey !== undefined && !String(data.periodKey).trim()) {
      req.error(400, 'periodKey is required');
    }
  }

  async beforeDelete(req) {
    const id = extractEntityId(req);
    if (!id) return;
    const current = await this.repo.findById(id);
    if (current && current.validationStatus !== 'DRAFT') {
      req.reject(409, 'Only DRAFT imputations can be deleted');
    }
  }
}

module.exports = ImputationDomainService;
