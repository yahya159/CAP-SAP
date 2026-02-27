import { useCallback, useEffect, useRef, useState } from 'react';
import { Project, Ticket, User } from '../../types/entities';
import { isAbortError } from '../../utils/async';
import { ManagerTicketsAPI } from './api';

export const useManagerTicketsBootstrap = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
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
      const data = await ManagerTicketsAPI.getBootstrapData({ signal: controller.signal });
      if (controller.signal.aborted) return;

      setProjects(data.projects);
      setUsers(data.users);
      setTickets(data.tickets);
    } catch (err) {
      if (!isAbortError(err)) {
        console.error('[useManagerTicketsBootstrap] Failed to load bootstrap data', err);
        setError(err instanceof Error ? err.message : 'Failed to load ticket data');
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void reload();

    return () => {
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, [reload]);

  return {
    projects,
    setProjects,
    users,
    setUsers,
    tickets,
    setTickets,
    loading,
    error,
    reload,
  };
};

export const useManagerTicketsMutations = () => {
  return {
    updateTicket: ManagerTicketsAPI.updateTicket,
    getAbaqueById: ManagerTicketsAPI.getAbaqueById,
    createNotification: ManagerTicketsAPI.createNotification,
  };
};
