import React from 'react';
import { Calendar, Send } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { IMPUTATION_VALIDATION_LABELS } from '@/app/types/entities';
import { validationColor } from '../model';
import { CurrentPeriodEntry, PeriodData } from '../hooks/useCalendarImputations';

interface SubmissionToolbarProps {
  currentPeriods: CurrentPeriodEntry[];
  periodData: (key: string) => PeriodData;
  submitPeriod: (key: string) => void;
}

export const SubmissionToolbar: React.FC<SubmissionToolbarProps> = ({
  currentPeriods,
  periodData,
  submitPeriod,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium">Bi-weekly Submission</span>
      {currentPeriods.map((cp) => {
        const pd = periodData(cp.key);
        const canSubmit = pd.totalHours > 0 && (!pd.period || pd.period.status === 'DRAFT' || pd.period.status === 'REJECTED');
        return (
          <div key={cp.key} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{cp.label}:</span>
            <span className="text-sm font-medium">{pd.totalHours}h</span>
            {canSubmit && (
              <Button size="sm" variant="outline" onClick={() => submitPeriod(cp.key)}>
                <Send className="h-3 w-3 mr-1" /> Submit
              </Button>
            )}
            {pd.period && pd.period.status !== 'DRAFT' && (
              <Badge className={validationColor[pd.period.status] + ' text-[10px]'}>
                {IMPUTATION_VALIDATION_LABELS[pd.period.status as keyof typeof IMPUTATION_VALIDATION_LABELS]}
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
};
