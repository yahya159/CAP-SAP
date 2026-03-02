import type { ReferenceData } from './core';
import { listEntities, createEntity, updateEntity, deleteEntity } from './core';

export const ReferenceDataAPI = {
  async getAll(): Promise<ReferenceData[]> {
    return await listEntities<ReferenceData>('ReferenceData');
  },

  async create(data: Omit<ReferenceData, 'id'>): Promise<ReferenceData> {
    return await createEntity<ReferenceData>('ReferenceData', data);
  },

  async update(id: string, data: Partial<ReferenceData>): Promise<ReferenceData> {
    return await updateEntity<ReferenceData>('ReferenceData', id, data);
  },

  async delete(id: string): Promise<void> {
    await deleteEntity('ReferenceData', id);
  },
};
