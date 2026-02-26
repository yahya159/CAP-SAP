import {
  AllocationsAPI as ODataAllocationsAPI,
  AbaquesAPI as ODataAbaquesAPI,
  DocumentationAPI as ODataDocumentationAPI,
  DeliverablesAPI as ODataDeliverablesAPI,
  ProjectsAPI as ODataProjectsAPI,
  TasksAPI as ODataTasksAPI,
  TicketsAPI as ODataTicketsAPI,
  UsersAPI as ODataUsersAPI,
  WricefObjectsAPI as ODataWricefObjectsAPI,
  type ODataRequestOptions,
} from '../../services/odataClient';
import {
  Abaque,
  Allocation,
  Deliverable,
  DocumentationObject,
  Project,
  Task,
  Ticket,
  User,
  WricefObject,
} from '../../types/entities';

export interface ProjectDetailsBootstrapData {
  project: Project | null;
  tasks: Task[];
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
    const [project, tasks, allocations, users, deliverables, tickets, abaques, documentationObjects, wricefObjects] =
      await Promise.all([
        ODataProjectsAPI.getById(projectId, requestOptions),
        ODataTasksAPI.getByProject(projectId, requestOptions),
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
      tasks,
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
  TasksAPI: {
    getByProject: ODataTasksAPI.getByProject,
    update: ODataTasksAPI.update,
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
};

export const {
  ProjectsAPI,
  TasksAPI,
  AllocationsAPI,
  UsersAPI,
  DeliverablesAPI,
  TicketsAPI,
  AbaquesAPI,
  DocumentationAPI,
} = ProjectDetailsAPI;
