import React from 'react';
import { Abaque, AbaqueTicketNature, Project } from '@/app/types/entities';
import { OverviewAbaqueConfigCard } from './overview/OverviewAbaqueConfigCard';
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
  abaques: Abaque[];
  selectedAbaque: Abaque | null;
  abaqueTicketNatures: AbaqueTicketNature[];
  abaqueSaving: boolean;
  onLinkedAbaqueChange: (linkedAbaqueId: string) => void;
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
        <OverviewAbaqueConfigCard vm={vm} />
        <OverviewEstimatorCard vm={vm} />
      </section>
    </>
  );
};
