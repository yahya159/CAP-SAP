import { useProjectDetails, useProjectTickets, useProjectDeliverables, useProjectWricefObjects, useActiveUsers } from '../queries';
import { useMemo } from 'react';
import { computeProjectKpis } from '../model';

export const useOverviewPanel = (projectId: string) => {
  const { data: project } = useProjectDetails(projectId);
  const { data: tickets = [] } = useProjectTickets(projectId);
  const { data: deliverables = [] } = useProjectDeliverables(projectId);
  const { data: wricefObjects = [] } = useProjectWricefObjects(projectId);
  const { data: users = [] } = useActiveUsers();

  const manager = useMemo(
    () => (project ? users.find((u) => u.id === project.managerId) ?? null : null),
    [project, users]
  );

  const kpis = useMemo(() => computeProjectKpis(tickets), [tickets]);

  return {
    project: project!,
    managerName: manager?.name ?? 'Unknown',
    ticketsCount: tickets.length,
    deliverablesCount: deliverables.length,
    openTicketsCount: tickets.filter((t) => t.status !== 'DONE' && t.status !== 'REJECTED').length,
    wricefObjectCount: wricefObjects.length,
    blockedTicketsCount: kpis.blocked,
    criticalTicketsCount: kpis.critical,
  };
};
