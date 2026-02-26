import type { Evaluation } from './core';
import { listEntities, createEntity, quoteLiteral } from './core';

export const EvaluationsAPI = {
  async getAll(): Promise<Evaluation[]> {
    return await listEntities<Evaluation>('Evaluations');
  },

  async getByUser(userId: string): Promise<Evaluation[]> {
    return await listEntities<Evaluation>('Evaluations', {
      $filter: `userId eq ${quoteLiteral(userId)}`,
    });
  },

  async create(evaluation: Omit<Evaluation, 'id'>): Promise<Evaluation> {
    return await createEntity<Evaluation>('Evaluations', evaluation);
  },
};
