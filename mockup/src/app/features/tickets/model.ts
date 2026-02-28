import {
  Abaque,
  AbaqueComplexity,
  Project,
  SAPModule,
  Ticket,
  TicketComplexity,
  TicketNature,
} from '../../types/entities';

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

export const mapTicketComplexityToAbaque = (
  complexity: TicketComplexity
): AbaqueComplexity => {
  switch (complexity) {
    case 'SIMPLE':
      return 'LOW';
    case 'MOYEN':
      return 'MEDIUM';
    case 'COMPLEXE':
    case 'TRES_COMPLEXE':
      return 'HIGH';
  }
};

export const getAbaqueEstimateForTicket = (
  abaque: Abaque,
  taskNature: TicketNature,
  complexity: AbaqueComplexity
): number | null => {
  const direct = abaque.entries.find(
    (entry) => entry.taskNature === taskNature && entry.complexity === complexity
  );
  if (direct) return direct.standardHours;

  const fallbackByNature: Record<TicketNature, 'FEATURE' | 'DOCUMENTATION' | 'SUPPORT'> = {
    PROGRAMME: 'FEATURE',
    MODULE: 'FEATURE',
    ENHANCEMENT: 'FEATURE',
    FORMULAIRE: 'DOCUMENTATION',
    REPORT: 'DOCUMENTATION',
    WORKFLOW: 'SUPPORT',
  };

  return (
    abaque.entries.find(
      (entry) =>
        entry.taskNature === fallbackByNature[taskNature] && entry.complexity === complexity
    )?.standardHours ?? null
  );
};

export interface CalendarDayCell {
  date: string;
  day: number;
  isCurrentMonth: boolean;
}

export const buildCalendarDays = (calendarMonth: string): CalendarDayCell[] => {
  const [year, month] = calendarMonth.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const days: CalendarDayCell[] = [];

  for (
    let index = -startOffset;
    index <= lastDay.getDate() + (6 - ((lastDay.getDay() + 6) % 7));
    index += 1
  ) {
    const date = new Date(year, month - 1, index + 1);
    days.push({
      date: date.toISOString().slice(0, 10),
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month - 1,
    });
  }

  return days;
};
