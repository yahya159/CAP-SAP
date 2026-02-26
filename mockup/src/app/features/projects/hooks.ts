import { useCallback, useEffect, useRef, useState } from 'react';
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
import { ProjectDetailsAPI } from './api';

export interface ProjectDetailsBootstrapState {
  project: Project | null;
  abaques: Abaque[];
  tasks: Task[];
  allocations: Allocation[];
  users: User[];
  deliverables: Deliverable[];
  tickets: Ticket[];
  documentationObjects: DocumentationObject[];
  wricefObjects: WricefObject[];
}

const EMPTY_BOOTSTRAP_STATE: ProjectDetailsBootstrapState = {
  project: null,
  abaques: [],
  tasks: [],
  allocations: [],
  users: [],
  deliverables: [],
  tickets: [],
  documentationObjects: [],
  wricefObjects: [],
};

const isAbortError = (error: unknown): boolean =>
  Boolean(
    error &&
      typeof error === 'object' &&
      'isAbort' in error &&
      (error as { isAbort?: boolean }).isAbort
  );

export const loadProjectDetailsBootstrap = async (
  projectId?: string,
  signal?: AbortSignal
): Promise<ProjectDetailsBootstrapState> => {
  if (!projectId) return { ...EMPTY_BOOTSTRAP_STATE };

  const data = await ProjectDetailsAPI.getBootstrapData(projectId, { signal });
  return {
    project: data.project,
    tasks: data.tasks,
    allocations: data.allocations,
    users: data.users,
    deliverables: data.deliverables,
    tickets: data.tickets,
    abaques: data.abaques,
    documentationObjects: data.documentationObjects,
    wricefObjects: data.wricefObjects,
  };
};

export const useProjectDetailsBootstrap = (projectId?: string) => {
  const [project, setProject] = useState<Project | null>(null);
  const [abaques, setAbaques] = useState<Abaque[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [documentationObjects, setDocumentationObjects] = useState<DocumentationObject[]>([]);
  const [wricefObjects, setWricefObjects] = useState<WricefObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError(null);

    try {
      const data = await loadProjectDetailsBootstrap(projectId, controller.signal);
      if (controller.signal.aborted) return;

      setProject(data.project);
      setTasks(data.tasks);
      setAllocations(data.allocations);
      setUsers(data.users);
      setDeliverables(data.deliverables);
      setTickets(data.tickets);
      setAbaques(data.abaques);
      setDocumentationObjects(data.documentationObjects);
      setWricefObjects(data.wricefObjects);
    } catch (err) {
      if (!isAbortError(err)) {
        console.error('[useProjectDetailsBootstrap] Failed to load bootstrap data', err);
        setError(err instanceof Error ? err.message : 'Failed to load project data');
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  }, [projectId]);

  useEffect(() => {
    void reload();

    return () => {
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, [reload]);

  return {
    project,
    setProject,
    abaques,
    setAbaques,
    tasks,
    setTasks,
    allocations,
    setAllocations,
    users,
    setUsers,
    deliverables,
    setDeliverables,
    tickets,
    setTickets,
    documentationObjects,
    setDocumentationObjects,
    wricefObjects,
    setWricefObjects,
    loading,
    error,
    reload,
  };
};
