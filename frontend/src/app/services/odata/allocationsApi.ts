import type { Allocation } from './core';
import type { ODataQueryOptions, ODataRequestOptions } from './core';
import { listEntities, updateEntity, createEntity, deleteEntity, quoteLiteral } from './core';

export const AllocationsAPI = {
  async list(
    options?: ODataQueryOptions,
    requestOptions?: ODataRequestOptions
  ): Promise<Allocation[]> {
    return await listEntities<Allocation>('user', 'Allocations', options, requestOptions, true);
  },

  async getAll(requestOptions?: ODataRequestOptions): Promise<Allocation[]> {
    return await AllocationsAPI.list(undefined, requestOptions);
  },

  async getByProject(
    projectId: string,
    requestOptions?: ODataRequestOptions
  ): Promise<Allocation[]> {
    return await AllocationsAPI.list(
      {
        $filter: `projectId eq ${quoteLiteral(projectId)}`,
      },
      requestOptions
    );
  },

  async update(
    id: string,
    allocation: Partial<Allocation>,
    requestOptions?: ODataRequestOptions
  ): Promise<Allocation> {
    return await updateEntity<Allocation>('user', 'Allocations', id, allocation, requestOptions);
  },

  async create(
    allocation: Omit<Allocation, 'id'>,
    requestOptions?: ODataRequestOptions
  ): Promise<Allocation> {
    return await createEntity<Allocation>('user', 'Allocations', allocation, requestOptions);
  },

  async delete(id: string, requestOptions?: ODataRequestOptions): Promise<void> {
    await deleteEntity('user', 'Allocations', id, requestOptions);
  },
};
