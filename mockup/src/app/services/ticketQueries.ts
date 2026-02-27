import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TicketsAPI } from './odata/ticketsApi';
import type { Ticket } from './odata/core';

export const ticketKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...ticketKeys.lists(), { filters }] as const,
  details: () => [...ticketKeys.all, 'detail'] as const,
  detail: (id: string) => [...ticketKeys.details(), id] as const,
};

export const useGetTickets = () => {
  return useQuery({
    queryKey: ticketKeys.lists(),
    queryFn: () => TicketsAPI.getAll(),
  });
};

export const useGetTicketById = (id: string) => {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => TicketsAPI.getById(id),
    enabled: !!id,
  });
};

export const useGetTicketsByProject = (projectId: string) => {
  return useQuery({
    queryKey: ticketKeys.list({ projectId }),
    queryFn: () => TicketsAPI.getByProject(projectId),
    enabled: !!projectId,
  });
};

export const useGetTicketsByUser = (userId: string) => {
  return useQuery({
    queryKey: ticketKeys.list({ userId }),
    queryFn: () => TicketsAPI.getByUser(userId),
    enabled: !!userId,
  });
};

export const useCreateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newTicket: Omit<Ticket, 'id' | 'createdAt' | 'ticketCode'>) =>
      TicketsAPI.create(newTicket),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
};

export const useUpdateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ticket }: { id: string; ticket: Partial<Ticket> }) =>
      TicketsAPI.update(id, ticket),
    onSuccess: (data, variables) => {
      // Invalidate specific ticket and lists
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
};
