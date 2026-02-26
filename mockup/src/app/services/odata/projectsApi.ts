import type { Project } from './core';
import type { ODataQueryOptions, ODataRequestOptions } from './core';
import { listEntities, getEntityById, createEntity, updateEntity, deleteEntity } from './core';

export const ProjectsAPI = {
  async list(
    options?: ODataQueryOptions,
    requestOptions?: ODataRequestOptions
  ): Promise<Project[]> {
    return await listEntities<Project>('Projects', options, requestOptions, true);
  },

  async getAll(requestOptions?: ODataRequestOptions): Promise<Project[]> {
    return await ProjectsAPI.list(undefined, requestOptions);
  },

  async getById(id: string, requestOptions?: ODataRequestOptions): Promise<Project | null> {
    return await getEntityById<Project>('Projects', id, requestOptions);
  },

  async create(
    project: Omit<Project, 'id'>,
    requestOptions?: ODataRequestOptions
  ): Promise<Project> {
    return await createEntity<Project>('Projects', project, requestOptions);
  },

  async update(
    id: string,
    project: Partial<Project>,
    requestOptions?: ODataRequestOptions
  ): Promise<Project> {
    return await updateEntity<Project>('Projects', id, project, requestOptions);
  },

  async delete(id: string, requestOptions?: ODataRequestOptions): Promise<void> {
    await deleteEntity('Projects', id, requestOptions);
  },
};
