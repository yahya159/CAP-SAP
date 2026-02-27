'use strict';

const DocumentationRepo = require('./documentation.repo');
const { nowIso } = require('../shared/utils/timestamp');

class DocumentationDomainService {
  constructor(_srv) {
    this.repo = new DocumentationRepo();
  }

  async beforeCreate(req) {
    const data = req.data;

    const existsProject = await this.repo.existsProjectById(data.projectId);
    if (!existsProject) req.error(400, `Unknown projectId '${data.projectId}'`);

    const existsAuthor = await this.repo.existsUserById(data.authorId);
    if (!existsAuthor) req.error(400, `Unknown authorId '${data.authorId}'`);

    const timestamp = nowIso();
    data.createdAt = timestamp;
    data.updatedAt = timestamp;
  }

  async beforeUpdate(req) {
    const data = req.data;
    data.updatedAt = nowIso();

    if (data.projectId !== undefined) {
      const existsProject = await this.repo.existsProjectById(data.projectId);
      if (!existsProject) req.error(400, `Unknown projectId '${data.projectId}'`);
    }
    if (data.authorId !== undefined) {
      const existsAuthor = await this.repo.existsUserById(data.authorId);
      if (!existsAuthor) req.error(400, `Unknown authorId '${data.authorId}'`);
    }
  }
}

module.exports = DocumentationDomainService;
