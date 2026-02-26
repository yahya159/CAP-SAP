import type { Deliverable } from './core';
import type { ODataQueryOptions, ODataRequestOptions } from './core';
import { listEntities, createEntity, updateEntity, quoteLiteral } from './core';

export const DeliverablesAPI = {
  async list(
    options?: ODataQueryOptions,
    requestOptions?: ODataRequestOptions
  ): Promise<Deliverable[]> {
    return await listEntities<Deliverable>('Deliverables', options, requestOptions, true);
  },

  async getAll(requestOptions?: ODataRequestOptions): Promise<Deliverable[]> {
    return await DeliverablesAPI.list(undefined, requestOptions);
  },

  async getByProject(
    projectId: string,
    requestOptions?: ODataRequestOptions
  ): Promise<Deliverable[]> {
    return await DeliverablesAPI.list(
      {
        $filter: `projectId eq ${quoteLiteral(projectId)}`,
      },
      requestOptions
    );
  },

  async create(
    deliverable: Omit<Deliverable, 'id' | 'createdAt'>,
    requestOptions?: ODataRequestOptions
  ): Promise<Deliverable> {
    return await createEntity<Deliverable>('Deliverables', deliverable, requestOptions);
  },

  async update(
    id: string,
    deliverable: Partial<Deliverable>,
    requestOptions?: ODataRequestOptions
  ): Promise<Deliverable> {
    return await updateEntity<Deliverable>('Deliverables', id, deliverable, requestOptions);
  },
};
