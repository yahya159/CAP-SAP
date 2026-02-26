import { Project, SAPModule, Ticket, TicketComplexity } from '../../types/entities';

export interface TicketFilters {
  searchQuery: string;
  statusFilter: Ticket['status'] | 'ALL';
  moduleFilter: SAPModule | 'ALL';
  complexityFilter: TicketComplexity | 'ALL';
  projectFilter: string;
  assigneeFilter: string;
  dateFrom: string;
  dateTo: string;
  wricefFilter: string;
}

export const filterTickets = (
  tickets: Ticket[],
  filters: TicketFilters,
  resolveProjectName: (projectId: string) => string
): Ticket[] => {
  const {
    searchQuery,
    statusFilter,
    moduleFilter,
    complexityFilter,
    projectFilter,
    assigneeFilter,
    dateFrom,
    dateTo,
    wricefFilter,
  } = filters;

  return tickets.filter((ticket) => {
    if (statusFilter !== 'ALL' && ticket.status !== statusFilter) return false;
    if (moduleFilter !== 'ALL' && ticket.module !== moduleFilter) return false;
    if (complexityFilter !== 'ALL' && ticket.complexity !== complexityFilter) return false;
    if (projectFilter !== 'ALL' && ticket.projectId !== projectFilter) return false;
    if (assigneeFilter !== 'ALL' && ticket.assignedTo !== assigneeFilter) return false;
    if (wricefFilter && !(ticket.wricefId ?? '').toLowerCase().includes(wricefFilter.toLowerCase())) return false;
    if (dateFrom && (ticket.createdAt ?? '').slice(0, 10) < dateFrom) return false;
    if (dateTo && (ticket.createdAt ?? '').slice(0, 10) > dateTo) return false;

    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      (ticket.title ?? '').toLowerCase().includes(query) ||
      (ticket.description ?? '').toLowerCase().includes(query) ||
      (ticket.ticketCode ?? '').toLowerCase().includes(query) ||
      (ticket.wricefId ?? '').toLowerCase().includes(query) ||
      resolveProjectName(ticket.projectId).toLowerCase().includes(query)
    );
  });
};

export const buildTicketsByDate = (tickets: Ticket[]): Record<string, Ticket[]> => {
  return tickets.reduce<Record<string, Ticket[]>>((acc, ticket) => {
    const key = ticket.dueDate || ticket.createdAt.slice(0, 10);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(ticket);
    return acc;
  }, {});
};

export const sortProjectsByName = (projects: Project[]): Project[] =>
  [...projects].sort((a, b) => a.name.localeCompare(b.name));
