import type { Abaque } from './core';
import type { ODataQueryOptions, ODataRequestOptions } from './core';
import { listEntities, getEntityById } from './core';

export const AbaquesAPI = {
  async list(
    options?: ODataQueryOptions,
    requestOptions?: ODataRequestOptions
  ): Promise<Abaque[]> {
    return await listEntities<Abaque>('Abaques', options, requestOptions, true);
  },

  async getAll(requestOptions?: ODataRequestOptions): Promise<Abaque[]> {
    return await AbaquesAPI.list(undefined, requestOptions);
  },

  async getById(id: string, requestOptions?: ODataRequestOptions): Promise<Abaque | null> {
    return await getEntityById<Abaque>('Abaques', id, requestOptions);
  },
};
