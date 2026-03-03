import type { ReferenceData } from './core';
import { listEntities, createEntity, updateEntity, deleteEntity } from './core';

export const ReferenceDataAPI = {
  async getAll(): Promise<ReferenceData[]> {
    return await listEntities<ReferenceData>('core', 'ReferenceData');
  },

  async create(data: Omit<ReferenceData, 'id'>): Promise<ReferenceData> {
    return await createEntity<ReferenceData>('core', 'ReferenceData', data);
  },

  async update(id: string, data: Partial<ReferenceData>): Promise<ReferenceData> {
    return await updateEntity<ReferenceData>('core', 'ReferenceData', id, data);
  },

  async delete(id: string): Promise<void> {
    await deleteEntity('core', 'ReferenceData', id);
  },
};
