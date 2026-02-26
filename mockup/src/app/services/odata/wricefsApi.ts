import type { Wricef } from './core';
import type { ODataRequestOptions } from './core';
import { listEntities, createEntity, deleteEntity, quoteLiteral } from './core';

export const WricefsAPI = {
  async getAll(requestOptions?: ODataRequestOptions): Promise<Wricef[]> {
    return await listEntities<Wricef>('Wricefs', undefined, requestOptions);
  },

  async getByProject(projectId: string, requestOptions?: ODataRequestOptions): Promise<Wricef[]> {
    return await listEntities<Wricef>(
      'Wricefs',
      { $filter: `projectId eq ${quoteLiteral(projectId)}` },
      requestOptions
    );
  },

  async create(wricef: Omit<Wricef, 'id' | 'createdAt' | 'updatedAt'>, requestOptions?: ODataRequestOptions): Promise<Wricef> {
    return await createEntity<Wricef>('Wricefs', wricef, requestOptions);
  },

  async delete(id: string, requestOptions?: ODataRequestOptions): Promise<void> {
    await deleteEntity('Wricefs', id, requestOptions);
  }
};
