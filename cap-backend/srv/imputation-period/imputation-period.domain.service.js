'use strict';

const ImputationPeriodRepo = require('./imputation-period.repo');
const { assertDateRange } = require('../shared/utils/validation');

const extractEntityId = (req) => req.params?.[0]?.ID ?? req.params?.[0] ?? req.data?.ID;

class ImputationPeriodDomainService {
  constructor(_srv) {
    this.repo = new ImputationPeriodRepo();
  }

  async beforeCreate(req) {
    const data = req.data;

    const consultantExists = await this.repo.existsUserById(data.consultantId);
    if (!consultantExists) req.error(400, `Unknown consultantId '${data.consultantId}'`);

    if (!String(data.periodKey ?? '').trim()) req.error(400, 'periodKey is required');
    assertDateRange(data.startDate, data.endDate, req);
    if (data.status === undefined) data.status = 'DRAFT';
  }

  async beforeUpdate(req) {
    const data = req.data;
    const id = extractEntityId(req);
    const current = id ? await this.repo.findById(id) : null;

    if (data.status !== undefined && current && data.status !== current.status) {
      req.reject(403, 'Use submit/validate/reject actions to change status');
    }

    if (data.consultantId !== undefined) {
      const consultantExists = await this.repo.existsUserById(data.consultantId);
      if (!consultantExists) req.error(400, `Unknown consultantId '${data.consultantId}'`);
    }
    if (data.periodKey !== undefined && !String(data.periodKey).trim()) {
      req.error(400, 'periodKey is required');
    }
    if (data.startDate !== undefined || data.endDate !== undefined) {
      const startDate = data.startDate ?? current?.startDate;
      const endDate = data.endDate ?? current?.endDate;
      assertDateRange(startDate, endDate, req);
    }
  }
}

module.exports = ImputationPeriodDomainService;
