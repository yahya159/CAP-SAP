import type { Wricef } from './core';
import type { ODataRequestOptions } from './core';
import { listEntities, createEntity, updateEntity, deleteEntity, quoteLiteral, odataFetch, entityPath, normalizeEntityRecord } from './core';

export const WricefsAPI = {
  async getAll(requestOptions?: ODataRequestOptions): Promise<Wricef[]> {
    return await listEntities<Wricef>('core', 'Wricefs', undefined, requestOptions);
  },

  async getByProject(projectId: string, requestOptions?: ODataRequestOptions): Promise<Wricef[]> {
    return await listEntities<Wricef>('core', 'Wricefs',
      { $filter: `projectId eq ${quoteLiteral(projectId)}` },
      requestOptions
    );
  },

  async getByStatus(status: string, requestOptions?: ODataRequestOptions): Promise<Wricef[]> {
    return await listEntities<Wricef>('core', 'Wricefs',
      { $filter: `status eq ${quoteLiteral(status)}` },
      requestOptions
    );
  },

  async create(wricef: Omit<Wricef, 'id' | 'createdAt' | 'updatedAt'>, requestOptions?: ODataRequestOptions): Promise<Wricef> {
    return await createEntity<Wricef>('core', 'Wricefs', wricef, requestOptions);
  },

  async update(id: string, data: Partial<Wricef>, requestOptions?: ODataRequestOptions): Promise<Wricef> {
    return await updateEntity<Wricef>('core', 'Wricefs', id, data, requestOptions);
  },

  async delete(id: string, requestOptions?: ODataRequestOptions): Promise<void> {
    await deleteEntity('core', 'Wricefs', id, requestOptions);
  },

  async submitWricef(id: string, requestOptions?: ODataRequestOptions): Promise<Wricef> {
    const data = await odataFetch<Wricef>('core', `${entityPath('Wricefs', id)}/submitWricef`, {
      ...requestOptions,
      method: 'POST',
      body: JSON.stringify({}),
    });
    if (!data) throw new Error(`submitWricef returned no data for WRICEF '${id}'`);
    return normalizeEntityRecord(data);
  },

  async validateWricef(id: string, requestOptions?: ODataRequestOptions): Promise<Wricef> {
    const data = await odataFetch<Wricef>('core', `${entityPath('Wricefs', id)}/validateWricef`, {
      ...requestOptions,
      method: 'POST',
      body: JSON.stringify({}),
    });
    if (!data) throw new Error(`validateWricef returned no data for WRICEF '${id}'`);
    return normalizeEntityRecord(data);
  },

  async rejectWricef(id: string, reason: string, requestOptions?: ODataRequestOptions): Promise<Wricef> {
    const data = await odataFetch<Wricef>('core', `${entityPath('Wricefs', id)}/rejectWricef`, {
      ...requestOptions,
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    if (!data) throw new Error(`rejectWricef returned no data for WRICEF '${id}'`);
    return normalizeEntityRecord(data);
  },
};
