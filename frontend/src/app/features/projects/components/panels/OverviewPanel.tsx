import React from 'react';
import { Project } from '@/app/types/entities';
import { OverviewEstimatorCard } from './overview/OverviewEstimatorCard';
import { OverviewLiveMetricsCard } from './overview/OverviewLiveMetricsCard';
import { OverviewSnapshotCard } from './overview/OverviewSnapshotCard';

export interface OverviewPanelViewModel {
  project: Project;
  managerName: string;
  ticketsCount: number;
  deliverablesCount: number;
  openTicketsCount: number;
  wricefObjectCount?: number;
  blockedTicketsCount: number;
  criticalTicketsCount: number;
  onOpenCreateTicket: () => void;
}

interface OverviewPanelProps {
  active: boolean;
  vm: OverviewPanelViewModel;
}

export const OverviewPanel: React.FC<OverviewPanelProps> = ({ active, vm }) => {
  if (!active) return null;

  return (
    <>
      <section
        id="project-panel-overview"
        role="tabpanel"
        tabIndex={0}
        aria-labelledby="project-tab-overview"
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        <OverviewSnapshotCard vm={vm} />
        <OverviewLiveMetricsCard vm={vm} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <OverviewEstimatorCard vm={vm} />
      </section>
    </>
  );
};
