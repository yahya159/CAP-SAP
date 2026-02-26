import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { DensityProvider } from '../../../context/DensityContext';
import { OverviewPanel } from '../components/panels/OverviewPanel';
import { TicketsPanel } from '../components/panels/TicketsPanel';
import { TeamPanel } from '../components/panels/TeamPanel';
import { WricefPanel } from '../components/panels/WricefPanel';
import { DocumentationPanel } from '../components/panels/DocumentationPanel';

const baseProject = {
  id: 'p-1',
  name: 'Project One',
  managerId: 'u-1',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  status: 'ACTIVE' as const,
  priority: 'MEDIUM' as const,
  description: 'Project description',
  progress: 25,
};

const withDensity = (node: React.ReactElement) => (
  <DensityProvider>{node}</DensityProvider>
);

describe('project panels smoke', () => {
  it('renders OverviewPanel', () => {
    const html = renderToStaticMarkup(
      withDensity(<OverviewPanel
        active
        vm={{
          project: baseProject,
          managerName: 'Manager',
          tasksCount: 1,
          deliverablesCount: 1,
          openTicketsCount: 1,
          blockedTasksCount: 0,
          criticalTasksCount: 0,
          abaques: [{ id: 'a-1', name: 'Abaque', entries: [] }],
          selectedAbaque: { id: 'a-1', name: 'Abaque', entries: [] },
          abaqueTaskNatures: [],
          abaqueSaving: false,
          onLinkedAbaqueChange: vi.fn(),
            onOpenCreateTicket: vi.fn(),
          }}
      />)
    );

    expect(html).toContain('Project Snapshot');
  });

  it('renders TicketsPanel', () => {
    const html = renderToStaticMarkup(
      withDensity(<TicketsPanel
        active
        vm={{
          tickets: [],
          paginatedTickets: [],
          filteredTickets: [],
          ticketsSearch: '',
          ticketsStatusFilter: '',
          ticketsPage: 1,
          ticketsPageSize: 10,
          ticketsTotalPages: 1,
          selectedTicketId: '',
          selectedTicket: null,
          selectedTicketHistory: [],
          wricefStatusColor: {
            NEW: '',
            IN_PROGRESS: '',
            IN_TEST: '',
            BLOCKED: '',
            DONE: '',
            REJECTED: '',
          },
          wricefPriorityColor: {
            LOW: '',
            MEDIUM: '',
            HIGH: '',
            CRITICAL: '',
          },
          onTicketsSearchChange: vi.fn(),
          onTicketsStatusFilterChange: vi.fn(),
          onTicketsPageChange: vi.fn(),
          onTicketsPageSizeChange: vi.fn(),
          onSelectTicket: vi.fn(),
          onOpenTicketDetails: vi.fn(),
          onOpenCreateTicket: vi.fn(),
          formatTicketEventTime: (value) => value,
          renderTicketEvent: () => 'event',
            resolveUserName: () => 'User',
          }}
      />)
    );

    expect(html).toContain('Create Ticket');
  });

  it('renders TeamPanel', () => {
    const html = renderToStaticMarkup(
      withDensity(<TeamPanel
        active
        allocations={[
          {
            id: 'al-1',
            userId: 'u-1',
            projectId: 'p-1',
            allocationPercent: 50,
            startDate: '2026-01-01',
            endDate: '2026-06-01',
          },
        ]}
        users={[
          {
            id: 'u-1',
            name: 'User',
            email: 'u@test.com',
            role: 'MANAGER',
            active: true,
            skills: [],
            certifications: [],
            availabilityPercent: 80,
          },
        ]}
      />)
    );

    expect(html).toContain('Consultant');
  });

  it('renders WricefPanel', () => {
    const html = renderToStaticMarkup(
      withDensity(<WricefPanel
        active
        vm={{
          objectsSearch: '',
          objectsTypeFilter: '',
          objectsComplexityFilter: '',
          objectsModuleFilter: '',
          objectsPage: 1,
          objectsPageSize: 10,
          objectsTotalPages: 1,
          filteredObjectsCount: 0,
          wricefObjectCount: 0,
          wricefTotalTickets: 0,
          wricefTotalDocuments: 0,
          wricefImporting: false,
          onObjectsSearchChange: vi.fn(),
          onObjectsTypeFilterChange: vi.fn(),
          onObjectsComplexityFilterChange: vi.fn(),
          onObjectsModuleFilterChange: vi.fn(),
          onObjectsPageChange: vi.fn(),
          onObjectsPageSizeChange: vi.fn(),
          onClearFilters: vi.fn(),
          onOpenCreateTicket: vi.fn(),
          onImportWricefFile: vi.fn(),
          table: {
            objects: [],
            expandedObjectIds: new Set<string>(),
            wricefObjectTicketStats: new Map(),
            wricefTypeBadgeClass: { W: '', R: '', I: '', C: '', E: '', F: '' },
            complexityBadgeClass: {
              SIMPLE: '',
              MOYEN: '',
              COMPLEXE: '',
              TRES_COMPLEXE: '',
            },
            wricefStatusColor: {
              NEW: '',
              IN_PROGRESS: '',
              IN_TEST: '',
              BLOCKED: '',
              DONE: '',
              REJECTED: '',
            },
            wricefPriorityColor: {
              LOW: '',
              MEDIUM: '',
              HIGH: '',
              CRITICAL: '',
            },
            getObjectTicketRows: () => [],
            getObjectDocs: () => [],
            resolveUserName: () => 'User',
            onToggleExpandObject: vi.fn(),
            onOpenCreateTicket: vi.fn(),
            onOpenCreateDocument: vi.fn(),
            onOpenTicketDetails: vi.fn(),
            onViewDocument: vi.fn(),
            emptyMessage: 'No WRICEF objects imported yet. Upload a WRICEF Excel file to get started.',
          },
        }}
      />)
    );

    expect(html).toContain('Total Objects');
  });

  it('renders DocumentationPanel', () => {
    const html = renderToStaticMarkup(
      withDensity(<DocumentationPanel
        active
        vm={{
          projectKeywords: ['ABAP'],
          documentationObjects: [],
          docText: '',
          docSaving: false,
          onDocTextChange: vi.fn(),
          onSaveDocText: vi.fn(),
          onCreateDocument: vi.fn(),
          onViewDocument: vi.fn(),
          resolveUserName: () => 'User',
          getCountByType: () => 0,
        }}
      />)
    );

    expect(html).toContain('Documentation Objects');
  });
});
