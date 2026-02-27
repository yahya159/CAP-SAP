'use strict';

const AllocationRepo = require('./allocation.repo');
const { assertDateRange } = require('../shared/utils/validation');

const extractEntityId = (req) => req.params?.[0]?.ID ?? req.params?.[0] ?? req.data?.ID;

const assertPercent = (value, req) => {
  if (value === undefined || value === null) return;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0 || num > 100) {
    req.error(400, 'allocationPercent must be between 0 and 100');
  }
};

class AllocationDomainService {
  constructor(_srv) {
    this.repo = new AllocationRepo();
  }

  async beforeCreate(req) {
    const data = req.data;

    if (data.userId !== undefined) {
      const existsUser = await this.repo.existsUserById(data.userId);
      if (!existsUser) req.error(400, `Unknown userId '${data.userId}'`);
    }
    if (data.projectId !== undefined) {
      const existsProject = await this.repo.existsProjectById(data.projectId);
      if (!existsProject) req.error(400, `Unknown projectId '${data.projectId}'`);
    }

    assertPercent(data.allocationPercent, req);
    assertDateRange(data.startDate, data.endDate, req);
  }

  async beforeUpdate(req) {
    const data = req.data;

    if (data.userId !== undefined) {
      const existsUser = await this.repo.existsUserById(data.userId);
      if (!existsUser) req.error(400, `Unknown userId '${data.userId}'`);
    }
    if (data.projectId !== undefined) {
      const existsProject = await this.repo.existsProjectById(data.projectId);
      if (!existsProject) req.error(400, `Unknown projectId '${data.projectId}'`);
    }

    assertPercent(data.allocationPercent, req);

    if (data.startDate !== undefined || data.endDate !== undefined) {
      const id = extractEntityId(req);
      const current = id ? await this.repo.findById(id) : null;
      const startDate = data.startDate ?? current?.startDate;
      const endDate = data.endDate ?? current?.endDate;
      assertDateRange(startDate, endDate, req);
    }
  }
}

module.exports = AllocationDomainService;
