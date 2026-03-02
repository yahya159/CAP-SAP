import React from 'react';
import { Allocation, User } from '@/app/types/entities';
import { TeamAllocationTable } from '../tables/TeamAllocationTable';

interface TeamPanelProps {
  active: boolean;
  allocations: Allocation[];
  users: User[];
}

export const TeamPanel: React.FC<TeamPanelProps> = ({ active, allocations, users }) => {
  if (!active) return null;

  return (
    <section
      id="project-panel-team"
      role="tabpanel"
      tabIndex={0}
      aria-labelledby="project-tab-team"
      className="rounded-lg border bg-card"
    >
      <TeamAllocationTable allocations={allocations} users={users} />
    </section>
  );
};
