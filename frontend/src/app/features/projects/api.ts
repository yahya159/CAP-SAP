import { AbaquesAPI as ODataAbaquesAPI } from '../../services/odata/abaquesApi';
import { AllocationsAPI as ODataAllocationsAPI } from '../../services/odata/allocationsApi';
import type { ODataRequestOptions } from '../../services/odata/core';
import { DeliverablesAPI as ODataDeliverablesAPI } from '../../services/odata/deliverablesApi';
import { DocumentationAPI as ODataDocumentationAPI } from '../../services/odata/documentationApi';
import { ProjectsAPI as ODataProjectsAPI } from '../../services/odata/projectsApi';
import { TicketsAPI as ODataTicketsAPI } from '../../services/odata/ticketsApi';
import { UsersAPI as ODataUsersAPI } from '../../services/odata/usersApi';
import { WricefObjectsAPI as ODataWricefObjectsAPI } from '../../services/odata/wricefObjectsApi';
import {
  Abaque,
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
  abaques: Abaque[];
  documentationObjects: DocumentationObject[];
  wricefObjects: WricefObject[];
}

export const ProjectDetailsAPI = {
  async getBootstrapData(
    projectId: string,
    requestOptions?: ODataRequestOptions
  ): Promise<ProjectDetailsBootstrapData> {
    const [project, allocations, users, deliverables, tickets, abaques, documentationObjects, wricefObjects] =
      await Promise.all([
        ODataProjectsAPI.getById(projectId, requestOptions),
        ODataAllocationsAPI.getByProject(projectId, requestOptions),
        ODataUsersAPI.getActive(requestOptions),
        ODataDeliverablesAPI.getByProject(projectId, requestOptions),
        ODataTicketsAPI.getByProject(projectId, requestOptions),
        ODataAbaquesAPI.getAll(requestOptions),
        ODataDocumentationAPI.getByProject(projectId, requestOptions),
        ODataWricefObjectsAPI.getByProject(projectId, requestOptions),
      ]);

    return {
      project,
      allocations,
      users,
      deliverables,
      tickets,
      abaques,
      documentationObjects,
      wricefObjects,
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
  AbaquesAPI: {
    getAll: ODataAbaquesAPI.getAll,
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
  AbaquesAPI,
  DocumentationAPI,
  WricefObjectsAPI,
} = ProjectDetailsAPI;
