import { useCallback, useEffect, useRef, useState } from 'react';
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
import { isAbortError } from '../../utils/async';
import { ProjectDetailsAPI } from './api';

export interface ProjectDetailsBootstrapState {
  project: Project | null;
  abaques: Abaque[];
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
  allocations: [],
  users: [],
  deliverables: [],
  tickets: [],
  documentationObjects: [],
  wricefObjects: [],
};

const asArray = <T>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : []);

export const loadProjectDetailsBootstrap = async (
  projectId?: string,
  signal?: AbortSignal
): Promise<ProjectDetailsBootstrapState> => {
  if (!projectId) return { ...EMPTY_BOOTSTRAP_STATE };

  const data = await ProjectDetailsAPI.getBootstrapData(projectId, { signal });
  return {
    project: data.project ?? null,
    allocations: asArray(data.allocations),
    users: asArray(data.users),
    deliverables: asArray(data.deliverables),
    tickets: asArray(data.tickets),
    abaques: asArray(data.abaques),
    documentationObjects: asArray(data.documentationObjects),
    wricefObjects: asArray(data.wricefObjects),
  };
};

export const useProjectDetailsBootstrap = (projectId?: string) => {
  const [project, setProject] = useState<Project | null>(null);
  const [abaques, setAbaques] = useState<Abaque[]>([]);
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
