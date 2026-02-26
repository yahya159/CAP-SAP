import { describe, expect, it } from 'vitest';
import { Ticket } from '../../types/entities';
import { buildTicketsByDate, filterTickets } from './model';

const makeTicket = (overrides: Partial<Ticket>): Ticket => ({
  id: 't-1',
  ticketCode: 'TK-2026-0001',
  projectId: 'p-1',
  createdBy: 'u-1',
  status: 'NEW',
  priority: 'MEDIUM',
  nature: 'PROGRAMME',
  title: 'Default title',
  description: 'Default description',
  createdAt: '2026-02-01T08:00:00.000Z',
  history: [],
  effortHours: 0,
  wricefId: 'W-001',
  module: 'ABAP',
  estimationHours: 6,
  complexity: 'SIMPLE',
  ...overrides,
});

describe('tickets model', () => {
  it('filters by status and search query', () => {
    const tickets: Ticket[] = [
      makeTicket({ id: '1', title: 'Workflow approval', projectId: 'p-1', status: 'IN_PROGRESS' }),
      makeTicket({ id: '2', title: 'Finance report export', projectId: 'p-2', status: 'DONE' }),
    ];

    const result = filterTickets(
      tickets,
      {
        searchQuery: 'workflow',
        statusFilter: 'IN_PROGRESS',
        moduleFilter: 'ALL',
        complexityFilter: 'ALL',
        projectFilter: 'ALL',
        assigneeFilter: 'ALL',
        dateFrom: '',
        dateTo: '',
        wricefFilter: '',
      },
      (projectId) => (projectId === 'p-1' ? 'Project Alpha' : 'Project Beta')
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('groups tickets by dueDate then createdAt fallback', () => {
    const tickets: Ticket[] = [
      makeTicket({ id: '1', dueDate: '2026-02-14', createdAt: '2026-02-10T09:00:00.000Z' }),
      makeTicket({ id: '2', createdAt: '2026-02-10T10:00:00.000Z' }),
    ];

    const grouped = buildTicketsByDate(tickets);

    expect(grouped['2026-02-14']).toHaveLength(1);
    expect(grouped['2026-02-10']).toHaveLength(1);
  });
});
