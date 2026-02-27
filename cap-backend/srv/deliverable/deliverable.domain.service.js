'use strict';

const DeliverableRepo = require('./deliverable.repo');

const DELIVERABLE_TRANSITIONS = {
  PENDING: new Set(['APPROVED', 'CHANGES_REQUESTED']),
  CHANGES_REQUESTED: new Set(['PENDING', 'APPROVED']),
  APPROVED: new Set([]),
};

const extractEntityId = (req) => req.params?.[0]?.ID ?? req.params?.[0] ?? req.data?.ID;

class DeliverableDomainService {
  constructor(_srv) {
    this.repo = new DeliverableRepo();
  }

  async beforeCreate(req) {
    const data = req.data;

    const existsProject = await this.repo.existsProjectById(data.projectId);
    if (!existsProject) req.error(400, `Unknown projectId '${data.projectId}'`);

    if (data.ticketId !== undefined && data.ticketId !== null && data.ticketId !== '') {
      const existsTicket = await this.repo.existsTicketById(data.ticketId);
      if (!existsTicket) req.error(400, `Unknown ticketId '${data.ticketId}'`);
    }

    if (!String(data.name ?? '').trim()) req.error(400, 'name is required');
    if (data.validationStatus === undefined) data.validationStatus = 'PENDING';
  }

  async beforeUpdate(req) {
    const data = req.data;

    if (data.projectId !== undefined) {
      const existsProject = await this.repo.existsProjectById(data.projectId);
      if (!existsProject) req.error(400, `Unknown projectId '${data.projectId}'`);
    }
    if (data.ticketId !== undefined && data.ticketId !== null && data.ticketId !== '') {
      const existsTicket = await this.repo.existsTicketById(data.ticketId);
      if (!existsTicket) req.error(400, `Unknown ticketId '${data.ticketId}'`);
    }

    if (data.validationStatus !== undefined) {
      const id = extractEntityId(req);
      const current = id ? await this.repo.findById(id) : null;
      if (current && data.validationStatus !== current.validationStatus) {
        const allowed = DELIVERABLE_TRANSITIONS[current.validationStatus] || new Set();
        if (!allowed.has(data.validationStatus)) {
          req.reject(
            409,
            `Invalid deliverable validationStatus transition: ${current.validationStatus} -> ${data.validationStatus}`
          );
        }
      }
    }
  }
}

module.exports = DeliverableDomainService;
