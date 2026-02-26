import {
  DocumentationObject,
  DocumentationObjectType,
  SAPModule,
  Task,
  Ticket,
  TicketComplexity,
  TicketStatus,
  WricefObject,
  WricefType,
} from '../../types/entities';

export interface ProjectKpis {
  onTrack: number;
  late: number;
  blocked: number;
  completed: number;
  critical: number;
  productivity: number;
}

export interface EffortTotals {
  totalActualHours: number;
  totalEstimatedHours: number;
  totalActualDays: number;
}

export interface EstimateConsumption {
  estimateConsumptionPercent: number;
  estimateDeltaDays: number;
}

// WricefTicketRow is removed

export const filterProjectObjects = (
  objects: WricefObject[],
  search: string,
  typeFilter: WricefType | '',
  complexityFilter: TicketComplexity | '',
  moduleFilter: SAPModule | ''
): WricefObject[] => {
  return objects.filter((object) => {
    if (search) {
      const query = search.toLowerCase();
      const matchesSearch =
        object.id.toLowerCase().includes(query) ||
        object.title.toLowerCase().includes(query) ||
        object.description.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    if (typeFilter && object.type !== typeFilter) return false;
    if (complexityFilter && object.complexity !== complexityFilter) return false;
    if (moduleFilter && object.module !== moduleFilter) return false;

    return true;
  });
};

export const filterProjectTickets = (
  tickets: Ticket[],
  search: string,
  statusFilter: TicketStatus | ''
): Ticket[] => {
  return tickets.filter((ticket) => {
    if (statusFilter && ticket.status !== statusFilter) return false;

    if (!search) return true;
    const query = search.toLowerCase();

    return (
      (ticket.ticketCode ?? '').toLowerCase().includes(query) ||
      (ticket.title ?? '').toLowerCase().includes(query) ||
      (ticket.description ?? '').toLowerCase().includes(query) ||
      (ticket.wricefId ?? '').toLowerCase().includes(query)
    );
  });
};

export const computeProjectKpis = (tasks: Task[]): ProjectKpis => {
  if (!tasks.length) {
    return {
      onTrack: 0,
      late: 0,
      blocked: 0,
      completed: 0,
      critical: 0,
      productivity: 0,
    };
  }

  const now = new Date();
  const late = tasks.filter((task) => task.status !== 'DONE' && new Date(task.plannedEnd) < now)
    .length;
  const blocked = tasks.filter((task) => task.status === 'BLOCKED').length;
  const completed = tasks.filter((task) => task.status === 'DONE').length;
  const critical = tasks.filter((task) => task.isCritical).length;
  // Tasks that are both blocked AND late should not be double-subtracted
  const blockedAndLate = tasks.filter(
    (task) => task.status === 'BLOCKED' && new Date(task.plannedEnd) < now
  ).length;
  const onTrack = tasks.length - late - blocked + blockedAndLate;
  const productivity = tasks.reduce((sum, task) => sum + task.progressPercent, 0) / tasks.length;

  return { onTrack, late, blocked, completed, critical, productivity };
};

export const computeEffortTotals = (tasks: Task[]): EffortTotals => {
  const totalActualHours = tasks.reduce((sum, task) => sum + task.actualHours, 0);
  const totalEstimatedHours = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
  const totalActualDays = totalActualHours / 8;

  return {
    totalActualHours,
    totalEstimatedHours,
    totalActualDays,
  };
};

export const computeEstimateConsumption = (
  estimatedDays: number,
  totalActualDays: number
): EstimateConsumption => {
  const estimateConsumptionPercent = estimatedDays
    ? Math.round((totalActualDays / estimatedDays) * 100)
    : 0;
  const estimateDeltaDays = estimatedDays - totalActualDays;

  return {
    estimateConsumptionPercent,
    estimateDeltaDays,
  };
};

export const normalizeWricefRef = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

export const isTicketLinkedToObject = (ticketWricefId: string, objectId: string): boolean => {
  const ticketRef = ticketWricefId.trim().toLowerCase();
  const objectRef = objectId.trim().toLowerCase();
  if (ticketRef === objectRef || ticketRef.startsWith(`${objectRef}-tk-`)) return true;

  const normalizedTicketRef = normalizeWricefRef(ticketRef);
  const normalizedObjectRef = normalizeWricefRef(objectRef);
  const compactTicketRef = normalizedTicketRef.replace(/[^a-z0-9]/g, '');
  const compactObjectRef = normalizedObjectRef.replace(/[^a-z0-9]/g, '');
  return (
    normalizedTicketRef === normalizedObjectRef ||
    normalizedTicketRef.startsWith(`${normalizedObjectRef}-tk-`) ||
    compactTicketRef === compactObjectRef ||
    compactTicketRef.startsWith(`${compactObjectRef}tk`)
  );
};

export const buildWricefTicketMap = (tickets: Ticket[]): Map<string, Ticket[]> => {
  const byWricefId = new Map<string, Ticket[]>();
  tickets.forEach((ticket) => {
    if (ticket.wricefId) {
      const key = ticket.wricefId.toLowerCase();
      const existing = byWricefId.get(key);
      if (existing) {
        existing.push(ticket);
      } else {
        byWricefId.set(key, [ticket]);
      }
    }
  });
  return byWricefId;
};

export const buildObjectTicketRows = (
  object: WricefObject,
  tickets: Ticket[]
): Ticket[] => {
  return tickets.filter((ticket) => isTicketLinkedToObject(ticket.wricefId, object.id));
};

export const buildWricefObjectTicketStats = (
  wricefObjects: WricefObject[],
  tickets: Ticket[]
): Map<string, { available: number }> => {
  const stats = new Map<string, { available: number }>();
  wricefObjects.forEach((object) => {
    const linkedTickets = tickets.filter(t => isTicketLinkedToObject(t.wricefId, object.id));
    stats.set(object.id, { available: linkedTickets.length });
  });
  return stats;
};

export const paginateItems = <T,>(items: T[], page: number, pageSize: number): T[] => {
  return items.slice((page - 1) * pageSize, page * pageSize);
};

export const countDocumentationByType = (
  documentationObjects: DocumentationObject[],
  type: DocumentationObjectType
): number => documentationObjects.filter((doc) => doc.type === type).length;
