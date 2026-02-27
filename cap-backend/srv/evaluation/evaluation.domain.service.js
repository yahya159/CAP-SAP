'use strict';

const EvaluationRepo = require('./evaluation.repo');
const { assertPositiveNumber } = require('../shared/utils/validation');

class EvaluationDomainService {
  constructor(_srv) {
    this.repo = new EvaluationRepo();
  }

  async beforeCreate(req) {
    const data = req.data;

    const userExists = await this.repo.existsUserById(data.userId);
    if (!userExists) req.error(400, `Unknown userId '${data.userId}'`);

    const evaluatorExists = await this.repo.existsUserById(data.evaluatorId);
    if (!evaluatorExists) req.error(400, `Unknown evaluatorId '${data.evaluatorId}'`);

    const projectExists = await this.repo.existsProjectById(data.projectId);
    if (!projectExists) req.error(400, `Unknown projectId '${data.projectId}'`);

    assertPositiveNumber(data.score, 'score', req);
  }
}

module.exports = EvaluationDomainService;
