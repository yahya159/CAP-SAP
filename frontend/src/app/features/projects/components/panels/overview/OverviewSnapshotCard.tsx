import React from 'react';
import { PROJECT_DELIVERY_TYPE_LABELS } from '@/app/types/entities';
import type { OverviewPanelViewModel } from '../OverviewPanel';

interface OverviewSnapshotCardProps {
  vm: OverviewPanelViewModel;
}

export const OverviewSnapshotCard: React.FC<OverviewSnapshotCardProps> = ({ vm }) => {
  return (
    <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5 space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Project Snapshot</h3>
      <p className="text-sm text-muted-foreground">{vm.project.description}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="p-3 rounded border border-border">
          <div className="text-xs text-muted-foreground">Manager</div>
          <div className="font-medium text-foreground">{vm.managerName}</div>
        </div>
        <div className="p-3 rounded border border-border">
          <div className="text-xs text-muted-foreground">Start Date</div>
          <div className="font-medium text-foreground">
            {new Date(vm.project.startDate).toLocaleDateString()}
          </div>
        </div>
        <div className="p-3 rounded border border-border">
          <div className="text-xs text-muted-foreground">End Date</div>
          <div className="font-medium text-foreground">
            {new Date(vm.project.endDate).toLocaleDateString()}
          </div>
        </div>
        <div className="p-3 rounded border border-border">
          <div className="text-xs text-muted-foreground">Project Type</div>
          <div className="font-medium text-foreground">
            {PROJECT_DELIVERY_TYPE_LABELS[vm.project.projectType ?? 'BUILD']}
          </div>
        </div>
        <div className="p-3 rounded border border-border">
          <div className="text-xs text-muted-foreground">WRICEF</div>
          <div className="font-medium text-foreground">
            {vm.wricefObjectCount !== undefined ? `${vm.wricefObjectCount} objects` : 'Not imported'}
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Global Progress</span>
          <span className="font-medium text-foreground">{vm.project.progress ?? 0}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div className="h-2 bg-primary rounded-full" style={{ width: `${vm.project.progress ?? 0}%` }} />
        </div>
      </div>
    </div>
  );
};
