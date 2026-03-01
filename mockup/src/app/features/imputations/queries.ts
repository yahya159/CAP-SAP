import { useQuery } from '@tanstack/react-query';
import { ImputationsAPI } from '@/app/services/odata/imputationsApi';
import { ImputationPeriodsAPI } from '@/app/services/odata/imputationPeriodsApi';
import { TicketsAPI } from '@/app/services/odata/ticketsApi';
import { UsersAPI } from '@/app/services/odata/usersApi';

export const imputationKeys = {
  all: ['imputations'] as const,
  byUser: (userId: string) => [...imputationKeys.all, 'user', userId] as const,
  periods: ['imputationPeriods'] as const,
  periodsByUser: (userId: string) => [...imputationKeys.periods, 'user', userId] as const,
};

export const useImputations = (userId?: string, isGlobal = false) => {
  return useQuery({
    queryKey: isGlobal ? imputationKeys.all : imputationKeys.byUser(userId!),
    queryFn: () => isGlobal ? ImputationsAPI.getAll() : ImputationsAPI.getByConsultant(userId!),
    enabled: isGlobal || !!userId,
  });
};

export const useImputationPeriods = (userId?: string, isGlobal = false) => {
  return useQuery({
    queryKey: isGlobal ? imputationKeys.periods : imputationKeys.periodsByUser(userId!),
    queryFn: () => isGlobal ? ImputationPeriodsAPI.getAll() : ImputationPeriodsAPI.getByConsultant(userId!),
    enabled: isGlobal || !!userId,
  });
};

export const useTickets = () => {
  return useQuery({
    queryKey: ['tickets'],
    queryFn: () => TicketsAPI.getAll(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => UsersAPI.getAll(),
    staleTime: 60 * 60 * 1000,
  });
};
