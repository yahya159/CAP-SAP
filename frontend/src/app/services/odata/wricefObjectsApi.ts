import type { WricefObject } from './core';
import type { ODataRequestOptions } from './core';
import { listEntities, createEntity, deleteEntity, quoteLiteral, updateEntity, odataFetch, entityPath, normalizeEntityRecord } from './core';

export const WricefObjectsAPI = {
  async getAll(requestOptions?: ODataRequestOptions): Promise<WricefObject[]> {
    return await listEntities<WricefObject>('core', 'WricefObjects', undefined, requestOptions);
  },

  async getByProject(projectId: string, requestOptions?: ODataRequestOptions): Promise<WricefObject[]> {
    return await listEntities<WricefObject>('core', 'WricefObjects',
      { $filter: `projectId eq ${quoteLiteral(projectId)}` },
      requestOptions
    );
  },

  async getByWricef(wricefId: string, requestOptions?: ODataRequestOptions): Promise<WricefObject[]> {
    return await listEntities<WricefObject>('core', 'WricefObjects',
      { $filter: `wricefId eq ${quoteLiteral(wricefId)}` },
      requestOptions
    );
  },

  async create(wricefObj: Omit<WricefObject, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }, requestOptions?: ODataRequestOptions): Promise<WricefObject> {
    return await createEntity<WricefObject>('core', 'WricefObjects', wricefObj, requestOptions);
  },

  async update(id: string, data: Partial<WricefObject>, requestOptions?: ODataRequestOptions): Promise<WricefObject> {
    return await updateEntity<WricefObject>('core', 'WricefObjects', id, data, requestOptions);
  },

  async delete(id: string, requestOptions?: ODataRequestOptions): Promise<void> {
    await deleteEntity('core', 'WricefObjects', id, requestOptions);
  },

  async approveWricefObject(id: string, requestOptions?: ODataRequestOptions): Promise<WricefObject> {
    const data = await odataFetch<WricefObject>('core', `${entityPath('WricefObjects', id)}/approveWricefObject`, {
      ...requestOptions,
      method: 'POST',
      body: JSON.stringify({}),
    });
    if (!data) throw new Error(`approveWricefObject returned no data for object '${id}'`);
    return normalizeEntityRecord(data);
  },

  async rejectWricefObject(id: string, reason: string, requestOptions?: ODataRequestOptions): Promise<WricefObject> {
    const data = await odataFetch<WricefObject>('core', `${entityPath('WricefObjects', id)}/rejectWricefObject`, {
      ...requestOptions,
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    if (!data) throw new Error(`rejectWricefObject returned no data for object '${id}'`);
    return normalizeEntityRecord(data);
  },
};
