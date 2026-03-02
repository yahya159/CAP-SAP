import React, { useState, useMemo, useCallback } from 'react';
import { useProjectTickets, useActiveUsers } from '../queries';
import { TicketStatus, TicketEvent } from '@/app/types/entities';
import { filterProjectTickets, paginateItems, sortTicketHistoryByLatest, WRICEF_STATUS_COLOR, WRICEF_PRIORITY_COLOR } from '../model';
import { Badge } from '@/app/components/ui/badge';

export const useTicketsPanel = (projectId: string) => {
  const { data: tickets = [], isLoading: isLoadingTickets, error: ticketsError } = useProjectTickets(projectId);
  const { data: users = [] } = useActiveUsers();
  
  const [ticketsSearch, setTicketsSearch] = useState('');
  const [ticketsStatusFilter, setTicketsStatusFilter] = useState<TicketStatus | ''>('');
  const [ticketsPage, setTicketsPage] = useState(1);
  const [ticketsPageSize, setTicketsPageSize] = useState(10);
  const [selectedTicketId, setSelectedTicketId] = useState('');

  const filteredTickets = useMemo(
    () => filterProjectTickets(tickets, ticketsSearch, ticketsStatusFilter),
    [tickets, ticketsSearch, ticketsStatusFilter]
  );
  
  const ticketsTotalPages = Math.max(1, Math.ceil(filteredTickets.length / ticketsPageSize));
  
  const paginatedTickets = useMemo(
    () => paginateItems(filteredTickets, ticketsPage, ticketsPageSize),
    [filteredTickets, ticketsPage, ticketsPageSize]
  );

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId]
  );

  const selectedTicketHistory = useMemo(
    () => sortTicketHistoryByLatest(selectedTicket?.history),
    [selectedTicket]
  );

  const resolveUserName = useCallback(
    (uid?: string) => users.find((user) => user.id === uid)?.name ?? '-',
    [users]
  );

  const formatTicketEventTime = useCallback((value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  }, []);

  const renderTicketEvent = useCallback(
    (event: TicketEvent): React.ReactNode => {
      if (event.action === 'CREATED') return 'created this ticket';
      if (event.action === 'STATUS_CHANGE') {
        return React.createElement(
          React.Fragment,
          null,
          'changed status from ',
          React.createElement(
            Badge,
            { variant: 'outline', className: 'text-[10px] mx-0.5' },
            event.fromValue ?? '-'
          ),
          ' to ',
          React.createElement(
            Badge,
            { variant: 'outline', className: 'text-[10px] mx-0.5' },
            event.toValue ?? '-'
          )
        );
      }
      if (event.action === 'ASSIGNED') return `assigned to ${resolveUserName(event.toValue)}`;
      if (event.action === 'PRIORITY_CHANGE') {
        return `changed priority from ${event.fromValue ?? '-'} to ${event.toValue ?? '-'}`;
      }
      if (event.action === 'EFFORT_CHANGE') {
        return `updated effort from ${event.fromValue ?? '-'}h to ${event.toValue ?? '-'}h`;
      }
      if (event.action === 'SENT_TO_TEST') return 'sent ticket to functional testing';
      if (event.action === 'COMMENT') {
        return event.comment ? `commented: ${event.comment}` : 'added a comment';
      }
      return event.action;
    },
    [resolveUserName]
  );

  return {
    tickets,
    isLoading: isLoadingTickets,
    error: ticketsError,
    filteredTickets,
    paginatedTickets,
    ticketsSearch,
    ticketsStatusFilter,
    ticketsPage,
    ticketsPageSize,
    ticketsTotalPages,
    selectedTicketId,
    selectedTicket,
    selectedTicketHistory,
    wricefStatusColor: WRICEF_STATUS_COLOR,
    wricefPriorityColor: WRICEF_PRIORITY_COLOR,
    setTicketsSearch: (val: string) => { setTicketsSearch(val); setTicketsPage(1); },
    setTicketsStatusFilter: (val: TicketStatus | '') => { setTicketsStatusFilter(val); setTicketsPage(1); },
    setTicketsPage,
    setTicketsPageSize: (val: number) => { setTicketsPageSize(val); setTicketsPage(1); },
    setSelectedTicketId,
    resolveUserName,
    formatTicketEventTime,
    renderTicketEvent
  };
};
