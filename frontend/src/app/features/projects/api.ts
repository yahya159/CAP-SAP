import { AllocationsAPI as ODataAllocationsAPI } from '../../services/odata/allocationsApi';
import type { ODataRequestOptions } from '../../services/odata/core';
import { DeliverablesAPI as ODataDeliverablesAPI } from '../../services/odata/deliverablesApi';
import { DocumentationAPI as ODataDocumentationAPI } from '../../services/odata/documentationApi';
import { ProjectsAPI as ODataProjectsAPI } from '../../services/odata/projectsApi';
import { TicketsAPI as ODataTicketsAPI } from '../../services/odata/ticketsApi';
import { UsersAPI as ODataUsersAPI } from '../../services/odata/usersApi';
import { WricefObjectsAPI as ODataWricefObjectsAPI } from '../../services/odata/wricefObjectsApi';
import {
  Allocation,
  Deliverable,
  DocumentationObject,
  Project,
  Ticket,
  User,
  WricefObject,
} from '../../types/entities';

export interface ProjectDetailsBootstrapData {
  project: Project | null;
  allocations: Allocation[];
  users: User[];
  deliverables: Deliverable[];
  tickets: Ticket[];
  documentationObjects: DocumentationObject[];
  wricefObjects: WricefObject[];
  errors: string[];
}

const toErrorMessage = (label: string, reason: unknown): string => {
  const message = reason instanceof Error ? reason.message : String(reason ?? 'Unknown error');
  return `Failed to load ${label}: ${message}`;
};

export const ProjectDetailsAPI = {
  async getBootstrapData(
    projectId: string,
    requestOptions?: ODataRequestOptions
  ): Promise<ProjectDetailsBootstrapData> {
    const project = await ODataProjectsAPI.getById(projectId, requestOptions);
    const results = await Promise.allSettled([
      ODataAllocationsAPI.getByProject(projectId, requestOptions),
      ODataUsersAPI.getActive(requestOptions),
      ODataDeliverablesAPI.getByProject(projectId, requestOptions),
      ODataTicketsAPI.getByProject(projectId, requestOptions),
      ODataDocumentationAPI.getByProject(projectId, requestOptions),
      ODataWricefObjectsAPI.getByProject(projectId, requestOptions),
    ]);

    const allocations = results[0].status === 'fulfilled' ? results[0].value : [];
    const users = results[1].status === 'fulfilled' ? results[1].value : [];
    const deliverables = results[2].status === 'fulfilled' ? results[2].value : [];
    const tickets = results[3].status === 'fulfilled' ? results[3].value : [];
    const documentationObjects = results[4].status === 'fulfilled' ? results[4].value : [];
    const wricefObjects = results[5].status === 'fulfilled' ? results[5].value : [];
    const errors = [
      results[0].status === 'rejected' ? toErrorMessage('allocations', results[0].reason) : null,
      results[1].status === 'rejected' ? toErrorMessage('users', results[1].reason) : null,
      results[2].status === 'rejected' ? toErrorMessage('deliverables', results[2].reason) : null,
      results[3].status === 'rejected' ? toErrorMessage('tickets', results[3].reason) : null,
      results[4].status === 'rejected' ? toErrorMessage('documentation', results[4].reason) : null,
      results[5].status === 'rejected' ? toErrorMessage('WRICEF objects', results[5].reason) : null,
    ].filter((entry): entry is string => Boolean(entry));

    return {
      project,
      allocations,
      users,
      deliverables,
      tickets,
      documentationObjects,
      wricefObjects,
      errors,
    };
  },

  ProjectsAPI: {
    getById: ODataProjectsAPI.getById,
    update: ODataProjectsAPI.update,
  },
  AllocationsAPI: {
    getAll: ODataAllocationsAPI.getAll,
    getByProject: ODataAllocationsAPI.getByProject,
  },
  UsersAPI: {
    getAll: ODataUsersAPI.getAll,
    getActive: ODataUsersAPI.getActive,
  },
  DeliverablesAPI: {
    getAll: ODataDeliverablesAPI.getAll,
    getByProject: ODataDeliverablesAPI.getByProject,
  },
  TicketsAPI: {
    getAll: ODataTicketsAPI.getAll,
    getByProject: ODataTicketsAPI.getByProject,
    update: ODataTicketsAPI.update,
  },
  DocumentationAPI: {
    getAll: ODataDocumentationAPI.getAll,
    getByProject: ODataDocumentationAPI.getByProject,
    getById: ODataDocumentationAPI.getById,
    create: ODataDocumentationAPI.create,
    update: ODataDocumentationAPI.update,
    delete: ODataDocumentationAPI.delete,
    syncProjectWricef: ODataDocumentationAPI.syncProjectWricef,
    getByTicketId: ODataDocumentationAPI.getByTicketId,
  },
  WricefObjectsAPI: {
    getByProject: ODataWricefObjectsAPI.getByProject,
    create: ODataWricefObjectsAPI.create,
    update: ODataWricefObjectsAPI.update,
  }
};

export const {
  ProjectsAPI,
  AllocationsAPI,
  UsersAPI,
  DeliverablesAPI,
  TicketsAPI,
  DocumentationAPI,
  WricefObjectsAPI,
} = ProjectDetailsAPI;
