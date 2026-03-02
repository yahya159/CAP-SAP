import { useProjectDetails, useProjectTickets, useProjectDeliverables, useProjectWricefObjects, useAbaques, useActiveUsers } from '../queries';
import { useMemo } from 'react';
import { computeProjectKpis, buildAbaqueTicketNatures } from '../model';

export const useOverviewPanel = (projectId: string) => {
  const { data: project } = useProjectDetails(projectId);
  const { data: tickets = [] } = useProjectTickets(projectId);
  const { data: deliverables = [] } = useProjectDeliverables(projectId);
  const { data: wricefObjects = [] } = useProjectWricefObjects(projectId);
  const { data: abaques = [] } = useAbaques();
  const { data: users = [] } = useActiveUsers();

  const manager = useMemo(
    () => (project ? users.find((u) => u.id === project.managerId) ?? null : null),
    [project, users]
  );

  const kpis = useMemo(() => computeProjectKpis(tickets), [tickets]);

  const selectedAbaque = useMemo(
    () => abaques.find((a) => a.id === project?.linkedAbaqueId) ?? null,
    [abaques, project?.linkedAbaqueId]
  );

  const abaqueTicketNatures = useMemo(
    () => buildAbaqueTicketNatures(selectedAbaque),
    [selectedAbaque]
  );

  return {
    project: project!,
    managerName: manager?.name ?? 'Unknown',
    ticketsCount: tickets.length,
    deliverablesCount: deliverables.length,
    openTicketsCount: tickets.filter((t) => t.status !== 'DONE' && t.status !== 'REJECTED').length,
    wricefObjectCount: wricefObjects.length,
    blockedTicketsCount: kpis.blocked,
    criticalTicketsCount: kpis.critical,
    abaques,
    selectedAbaque,
    abaqueTicketNatures,
    abaqueSaving: false,
    onLinkedAbaqueChange: async (value: string) => { /* To be implemented in component or hook */ },
  };
};
