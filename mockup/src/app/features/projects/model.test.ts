import { describe, expect, it } from 'vitest';
import { DocumentationObject, Task, Ticket, WricefObject } from '../../types/entities';
import {
  buildObjectTicketRows,
  buildWricefObjectTicketStats,
  computeEffortTotals,
  computeEstimateConsumption,
  computeProjectKpis,
  countDocumentationByType,
  filterProjectObjects,
  filterProjectTickets,
  isTicketLinkedToObject,
  normalizeWricefRef,
  paginateItems,
} from './model';

const objects: WricefObject[] = [
  {
    id: 'W-001',
    type: 'W',
    title: 'Workflow Approval',
    description: 'Purchase workflow',
    complexity: 'SIMPLE',
    module: 'ABAP',
    wricefId: 'W-1',
    projectId: 'P-1',
  },
  {
    id: 'R-001',
    type: 'R',
    title: 'Reporting Export',
    description: 'Finance reporting object',
    complexity: 'COMPLEXE',
    module: 'FI',
    wricefId: 'W-1',
    projectId: 'P-1',
  },
];

const makeTask = (overrides: Partial<Task>): Task => ({
  id: 'task-1',
  projectId: 'p-1',
  title: 'Task',
  description: 'desc',
  status: 'IN_PROGRESS',
  priority: 'MEDIUM',
  plannedStart: '2026-01-01',
  plannedEnd: '2099-01-01',
  progressPercent: 50,
  estimatedHours: 8,
  actualHours: 4,
  effortHours: 4,
  isCritical: false,
  riskLevel: 'LOW',
  ...overrides,
});

const makeTicket = (overrides: Partial<Ticket>): Ticket => ({
  id: 't-1',
  ticketCode: 'TK-2026-0001',
  projectId: 'p-1',
  createdBy: 'u-1',
  status: 'NEW',
  priority: 'MEDIUM',
  nature: 'PROGRAMME',
  title: 'Default',
  description: 'Default',
  createdAt: '2026-02-01T00:00:00.000Z',
  history: [],
  effortHours: 0,
  wricefId: 'W-001',
  module: 'ABAP',
  estimationHours: 4,
  complexity: 'SIMPLE',
  ...overrides,
});

describe('projects model', () => {
  it('filters objects by query and type', () => {
    const result = filterProjectObjects(objects, 'workflow', 'W', '', '');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('W-001');
  });

  it('filters tickets by status and query', () => {
    const tickets = [
      makeTicket({ id: '1', status: 'IN_PROGRESS', title: 'Workflow integration', wricefId: 'W-002' }),
      makeTicket({ id: '2', status: 'DONE', title: 'Legacy cleanup', wricefId: 'R-001' }),
    ];

    const result = filterProjectTickets(tickets, 'workflow', 'IN_PROGRESS');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('computes project KPIs from task list', () => {
    const tasks = [
      makeTask({ id: '1', status: 'DONE', progressPercent: 100 }),
      makeTask({ id: '2', status: 'BLOCKED', isCritical: true, plannedEnd: '2020-01-01' }),
      makeTask({ id: '3', status: 'IN_PROGRESS', plannedEnd: '2020-01-01' }),
    ];

    const kpis = computeProjectKpis(tasks);
    expect(kpis.completed).toBe(1);
    expect(kpis.blocked).toBe(1);
    expect(kpis.late).toBe(2);
    expect(kpis.critical).toBe(1);
  });

  it('computes effort totals', () => {
    const totals = computeEffortTotals([
      makeTask({ actualHours: 8, estimatedHours: 10 }),
      makeTask({ actualHours: 4, estimatedHours: 5 }),
    ]);

    expect(totals.totalActualHours).toBe(12);
    expect(totals.totalEstimatedHours).toBe(15);
    expect(totals.totalActualDays).toBe(1.5);
  });

  it('computes estimate consumption', () => {
    const consumption = computeEstimateConsumption(10, 8);
    expect(consumption.estimateConsumptionPercent).toBe(80);
    expect(consumption.estimateDeltaDays).toBe(2);
  });

  it('normalizes wricef refs', () => {
    expect(normalizeWricefRef(' W-001 / TK ')).toBe('w-001tk');
  });

  it('matches tickets to object references robustly', () => {
    expect(isTicketLinkedToObject('W-001', 'W-001')).toBe(true);
    expect(isTicketLinkedToObject('w001-tk-01', 'W-001')).toBe(true);
    expect(isTicketLinkedToObject('R-001', 'W-001')).toBe(false);
  });

  it('builds object ticket stats map', () => {
    const tickets = [
      makeTicket({ id: 't-live-1', wricefId: 'W-001' }),
      makeTicket({ id: 't-live-2', wricefId: 'W-001-TK-77' }),
    ];
    const stats = buildWricefObjectTicketStats(objects, tickets);

    expect(stats.get('W-001')?.available).toBeGreaterThanOrEqual(2);
  });

  it('paginates items', () => {
    const page = paginateItems([1, 2, 3, 4, 5], 2, 2);
    expect(page).toEqual([3, 4]);
  });

  it('counts docs by type', () => {
    const docs: DocumentationObject[] = [
      {
        id: 'd1',
        title: 'Doc1',
        description: '',
        type: 'SFD',
        content: '',
        attachedFiles: [],
        relatedTicketIds: [],
        projectId: 'p1',
        authorId: 'u1',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'd2',
        title: 'Doc2',
        description: '',
        type: 'GUIDE',
        content: '',
        attachedFiles: [],
        relatedTicketIds: [],
        projectId: 'p1',
        authorId: 'u1',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];

    expect(countDocumentationByType(docs, 'SFD')).toBe(1);
    expect(countDocumentationByType(docs, 'GUIDE')).toBe(1);
  });
});
