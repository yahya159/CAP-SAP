import type { Task } from './core';
import type { ODataQueryOptions, ODataRequestOptions } from './core';
import { listEntities, updateEntity, createEntity, quoteLiteral } from './core';

export const TasksAPI = {
  async list(
    options?: ODataQueryOptions,
    requestOptions?: ODataRequestOptions
  ): Promise<Task[]> {
    return await listEntities<Task>('Tasks', options, requestOptions, true);
  },

  async getAll(requestOptions?: ODataRequestOptions): Promise<Task[]> {
    return await TasksAPI.list(undefined, requestOptions);
  },

  async getByProject(
    projectId: string,
    requestOptions?: ODataRequestOptions
  ): Promise<Task[]> {
    return await TasksAPI.list(
      {
        $filter: `projectId eq ${quoteLiteral(projectId)}`,
      },
      requestOptions
    );
  },

  async getByUser(userId: string, requestOptions?: ODataRequestOptions): Promise<Task[]> {
    return await TasksAPI.list(
      {
        $filter: `assigneeId eq ${quoteLiteral(userId)}`,
      },
      requestOptions
    );
  },

  async update(id: string, task: Partial<Task>, requestOptions?: ODataRequestOptions): Promise<Task> {
    return await updateEntity<Task>('Tasks', id, task, requestOptions);
  },

  async create(task: Omit<Task, 'id'>, requestOptions?: ODataRequestOptions): Promise<Task> {
    return await createEntity<Task>('Tasks', task, requestOptions);
  },
};
