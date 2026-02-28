import React from 'react';
import type { OverviewPanelViewModel } from '../OverviewPanel';

interface OverviewLiveMetricsCardProps {
  vm: OverviewPanelViewModel;
}

export const OverviewLiveMetricsCard: React.FC<OverviewLiveMetricsCardProps> = ({ vm }) => {
  return (
    <div className="bg-card border border-border rounded-lg p-5 space-y-3">
      <h3 className="text-lg font-semibold text-foreground">Live Metrics</h3>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Tickets</span>
        <span className="font-medium text-foreground">{vm.ticketsCount}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Deliverables</span>
        <span className="font-medium text-foreground">{vm.deliverablesCount}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Open Tickets</span>
        <span className="font-medium text-foreground">{vm.openTicketsCount}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Critical Tickets</span>
        <span className="font-medium text-destructive">{vm.criticalTicketsCount}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Blocked</span>
        <span className="font-medium text-accent-foreground">{vm.blockedTicketsCount}</span>
      </div>
    </div>
  );
};
