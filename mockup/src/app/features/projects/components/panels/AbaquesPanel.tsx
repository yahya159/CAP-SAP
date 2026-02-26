import React from 'react';
import { AbaqueEstimatorCard } from '../../../../components/business/AbaqueEstimatorCard';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import {
  AbaqueEstimateResult,
  Project,
  ProjectAbaqueCriteria,
} from '../../../../types/entities';

export interface AbaquesPanelViewModel {
  project: Project;
  hasAbaqueEstimate: boolean;
  forceEstimatorVisible: boolean;
  projectEstimateSaving: boolean;
  estimatedDays: number;
  totalActualDays: number;
  totalActualHours: number;
  estimateConsumptionPercent: number;
  estimateDeltaDays: number;
  usageBarClass: string;
  onApplyEstimate: (
    criteria: ProjectAbaqueCriteria,
    result: AbaqueEstimateResult
  ) => Promise<void>;
  onRerunEstimate: () => void;
}

interface AbaquesPanelProps {
  active: boolean;
  vm: AbaquesPanelViewModel;
}

export const AbaquesPanel: React.FC<AbaquesPanelProps> = ({ active, vm }) => {
  if (!active) return null;

  return (
    <section
      id="project-panel-abaques"
      role="tabpanel"
      tabIndex={0}
      aria-labelledby="project-tab-abaques"
      className="space-y-6"
    >
      {!vm.hasAbaqueEstimate || vm.forceEstimatorVisible ? (
        <AbaqueEstimatorCard
          initialCriteria={vm.project.abaqueEstimate?.criteria}
          applying={vm.projectEstimateSaving}
          onApply={vm.onApplyEstimate}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-xs text-muted-foreground">Estimated Consulting Days</div>
              <div className="mt-1 text-3xl font-semibold text-foreground">
                {vm.estimatedDays}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-xs text-muted-foreground">Actual Tracked Days</div>
              <div className="mt-1 text-3xl font-semibold text-foreground">
                {vm.totalActualDays.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">
                ({vm.totalActualHours.toFixed(1)}h logged)
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-xs text-muted-foreground">Recommended Team</div>
              <div className="mt-1 text-3xl font-semibold text-foreground">
                {vm.project.abaqueEstimate?.result.recommendedTeamSize}
              </div>
              <div className="text-xs text-muted-foreground">
                Complexity {vm.project.abaqueEstimate?.result.complexity}
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Initial Estimate vs Current Execution
                </h3>
                <p className="text-sm text-muted-foreground">
                  Compare real tracked effort with the initial abaque baseline.
                </p>
              </div>
              <Badge variant="outline">
                Estimated on{' '}
                {vm.project.abaqueEstimate?.estimatedAt
                  ? new Date(vm.project.abaqueEstimate.estimatedAt).toLocaleDateString()
                  : '-'}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Consumption of estimated days</span>
                <span className="font-semibold text-foreground">
                  {vm.estimateConsumptionPercent}% used
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${vm.usageBarClass}`}
                  style={{ width: `${Math.min(vm.estimateConsumptionPercent, 100)}%` }}
                />
              </div>
              <p
                className={`text-sm font-medium ${
                  vm.estimateDeltaDays < 0 ? 'text-destructive' : 'text-emerald-600'
                }`}
              >
                {vm.estimateDeltaDays >= 0 ? '+' : ''}
                {vm.estimateDeltaDays.toFixed(1)} days vs baseline remaining
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-md border border-border/70 bg-muted/20 p-3">
                <div className="text-xs text-muted-foreground">Complexity</div>
                <div className="mt-1 text-sm font-semibold text-foreground">
                  {vm.project.abaqueEstimate?.criteria.customizationLevel}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={vm.onRerunEstimate}>
              Re-run Estimation
            </Button>
          </div>
        </>
      )}
    </section>
  );
};
