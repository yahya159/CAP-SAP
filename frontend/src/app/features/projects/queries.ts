import { useQuery } from '@tanstack/react-query';
import { ProjectDetailsAPI } from './api';

export const projectKeys = {
  all: ['projects'] as const,
  details: (id: string) => [...projectKeys.all, id] as const,
  bootstrap: (id: string) => [...projectKeys.details(id), 'bootstrap'] as const,
  tickets: (id: string) => [...projectKeys.details(id), 'tickets'] as const,
  wricefObjects: (id: string) => [...projectKeys.details(id), 'wricefObjects'] as const,
  documentation: (id: string) => [...projectKeys.details(id), 'documentation'] as const,
  deliverables: (id: string) => [...projectKeys.details(id), 'deliverables'] as const,
  allocations: (id: string) => [...projectKeys.details(id), 'allocations'] as const,
  users: ['users', 'active'] as const,
};

export const useProjectDetails = (projectId?: string) => {
  return useQuery({
    queryKey: projectKeys.details(projectId || ''),
    queryFn: ({ signal }) => ProjectDetailsAPI.ProjectsAPI.getById(projectId!, { signal }),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useProjectTickets = (projectId?: string) => {
  return useQuery({
    queryKey: projectKeys.tickets(projectId || ''),
    queryFn: ({ signal }) => ProjectDetailsAPI.TicketsAPI.getByProject(projectId!, { signal }),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useProjectWricefObjects = (projectId?: string) => {
  return useQuery({
    queryKey: projectKeys.wricefObjects(projectId || ''),
    queryFn: ({ signal }) => ProjectDetailsAPI.WricefObjectsAPI?.getByProject(projectId!, { signal }),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useProjectDocumentation = (projectId?: string) => {
  return useQuery({
    queryKey: projectKeys.documentation(projectId || ''),
    queryFn: ({ signal }) => ProjectDetailsAPI.DocumentationAPI.getByProject(projectId!, { signal }),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useProjectDeliverables = (projectId?: string) => {
  return useQuery({
    queryKey: projectKeys.deliverables(projectId || ''),
    queryFn: ({ signal }) => ProjectDetailsAPI.DeliverablesAPI.getByProject(projectId!, { signal }),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useProjectAllocations = (projectId?: string) => {
  return useQuery({
    queryKey: projectKeys.allocations(projectId || ''),
    queryFn: ({ signal }) => ProjectDetailsAPI.AllocationsAPI.getByProject(projectId!, { signal }),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useActiveUsers = () => {
  return useQuery({
    queryKey: projectKeys.users,
    queryFn: ({ signal }) => ProjectDetailsAPI.UsersAPI.getActive({ signal }),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

