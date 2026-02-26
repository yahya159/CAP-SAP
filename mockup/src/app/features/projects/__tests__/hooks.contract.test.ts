import { describe, expect, it, vi } from 'vitest';
import { ProjectDetailsAPI } from '../api';
import { loadProjectDetailsBootstrap } from '../hooks';

describe('projects hooks contract', () => {
  it('returns an empty bootstrap state when project id is missing', async () => {
    const spy = vi.spyOn(ProjectDetailsAPI, 'getBootstrapData');

    const result = await loadProjectDetailsBootstrap(undefined);

    expect(spy).not.toHaveBeenCalled();
    expect(result.project).toBeNull();
    expect(result.tasks).toEqual([]);
    expect(result.tickets).toEqual([]);
    expect(result.documentationObjects).toEqual([]);
    expect(result.wricefObjects).toEqual([]);
  });

  it('passes through bootstrap data from the API (server-side filtering)', async () => {
    vi.spyOn(ProjectDetailsAPI, 'getBootstrapData').mockResolvedValueOnce({
      project: {
        id: 'p-1',
        name: 'Project One',
        managerId: 'u-1',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        status: 'ACTIVE',
        priority: 'MEDIUM',
        description: 'desc',
      },
      tasks: [],
      allocations: [],
      users: [],
      deliverables: [],
      tickets: [
        {
          id: 't-1',
          ticketCode: 'TK-1',
          projectId: 'p-1',
          createdBy: 'u-1',
          status: 'NEW',
          priority: 'MEDIUM',
          nature: 'PROGRAMME',
          title: 'In project',
          description: 'In project',
          createdAt: '2026-01-01',
          history: [],
          effortHours: 0,
          wricefId: 'W-1',
          module: 'ABAP',
          estimationHours: 2,
          complexity: 'SIMPLE',
        },
      ],
      abaques: [],
      documentationObjects: [
        {
          id: 'd-1',
          title: 'doc',
          description: 'desc',
          type: 'SFD',
          content: 'content',
          attachedFiles: [],
          relatedTicketIds: [],
          projectId: 'p-1',
          authorId: 'u-1',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      wricefObjects: [],
    });

    const result = await loadProjectDetailsBootstrap('p-1');

    expect(result.tickets).toHaveLength(1);
    expect(result.tickets[0].id).toBe('t-1');
    expect(result.documentationObjects).toHaveLength(1);
    expect(result.documentationObjects[0].id).toBe('d-1');
  });
});
