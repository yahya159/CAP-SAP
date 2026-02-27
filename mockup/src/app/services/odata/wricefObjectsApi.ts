import type { WricefObject } from './core';
import type { ODataRequestOptions } from './core';
import { listEntities, createEntity, deleteEntity, quoteLiteral, updateEntity } from './core';

export const WricefObjectsAPI = {
  async getAll(requestOptions?: ODataRequestOptions): Promise<WricefObject[]> {
    return await listEntities<WricefObject>('WricefObjects', undefined, requestOptions);
  },

  async getByProject(projectId: string, requestOptions?: ODataRequestOptions): Promise<WricefObject[]> {
    return await listEntities<WricefObject>(
      'WricefObjects',
      { $filter: `projectId eq ${quoteLiteral(projectId)}` },
      requestOptions
    );
  },

  async getByWricef(wricefId: string, requestOptions?: ODataRequestOptions): Promise<WricefObject[]> {
    return await listEntities<WricefObject>(
      'WricefObjects',
      { $filter: `wricefId eq ${quoteLiteral(wricefId)}` },
      requestOptions
    );
  },

  async create(wricefObj: Omit<WricefObject, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }, requestOptions?: ODataRequestOptions): Promise<WricefObject> {
    return await createEntity<WricefObject>('WricefObjects', wricefObj, requestOptions);
  },

  async update(id: string, data: Partial<WricefObject>, requestOptions?: ODataRequestOptions): Promise<WricefObject> {
    return await updateEntity<WricefObject>('WricefObjects', id, data, requestOptions);
  },

  async delete(id: string, requestOptions?: ODataRequestOptions): Promise<void> {
    await deleteEntity('WricefObjects', id, requestOptions);
  }
};
