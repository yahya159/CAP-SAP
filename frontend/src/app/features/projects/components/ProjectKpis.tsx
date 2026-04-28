import React from 'react';
import { useTranslation } from 'react-i18next';

interface ProjectKpisProps {
  active: boolean;
  kpis: {
    onTrack: number;
    late: number;
    blocked: number;
    completed: number;
    critical: number;
    productivity: number;
  };
  totalActualHours: number;
  totalEstimatedHours: number;
}

export const ProjectKpis: React.FC<ProjectKpisProps> = ({
  active,
  kpis,
  totalActualHours,
  totalEstimatedHours,
}) => {
  const { t } = useTranslation();
  if (!active) return null;

  return (
    <section
      id="project-panel-kpi"
      role="tabpanel"
      tabIndex={0}
      aria-labelledby="project-tab-kpi"
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground">{t('projects.details.kpis.onTrack')}</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">{kpis.onTrack}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground">{t('projects.details.kpis.late')}</div>
          <div className="mt-1 text-2xl font-semibold text-destructive">{kpis.late}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground">{t('projects.details.kpis.blocked')}</div>
          <div className="mt-1 text-2xl font-semibold text-amber-600">{kpis.blocked}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground">{t('projects.details.kpis.completed')}</div>
          <div className="mt-1 text-2xl font-semibold text-emerald-600">{kpis.completed}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground">{t('projects.details.kpis.critical')}</div>
          <div className="mt-1 text-2xl font-semibold text-destructive">{kpis.critical}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground">{t('projects.details.kpis.productivity')}</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">
            {Math.round(kpis.productivity)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground">{t('projects.details.kpis.actualHours')}</div>
          <div className="mt-1 text-xl font-semibold text-foreground">
            {totalActualHours.toFixed(1)}h
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground">{t('projects.details.kpis.estimatedHours')}</div>
          <div className="mt-1 text-xl font-semibold text-foreground">
            {totalEstimatedHours.toFixed(1)}h
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground">{t('projects.details.kpis.variance')}</div>
          <div
            className={`mt-1 text-xl font-semibold ${
              totalActualHours > totalEstimatedHours ? 'text-destructive' : 'text-emerald-600'
            }`}
          >
            {(totalActualHours - totalEstimatedHours).toFixed(1)}h
          </div>
        </div>
      </div>
    </section>
  );
};
