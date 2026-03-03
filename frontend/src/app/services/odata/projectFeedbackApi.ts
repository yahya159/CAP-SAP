import type { ProjectFeedback } from './core';
import { listEntities, createEntity, quoteLiteral } from './core';

export const ProjectFeedbackAPI = {
  async getByProject(projectId: string): Promise<ProjectFeedback[]> {
    return await listEntities<ProjectFeedback>('core', 'ProjectFeedback', {
      $filter: `projectId eq ${quoteLiteral(projectId)}`,
      $orderby: 'createdAt desc',
    });
  },

  async create(
    feedback: Omit<ProjectFeedback, 'id' | 'createdAt'>
  ): Promise<ProjectFeedback> {
    return await createEntity<ProjectFeedback>('core', 'ProjectFeedback', feedback);
  },
};
