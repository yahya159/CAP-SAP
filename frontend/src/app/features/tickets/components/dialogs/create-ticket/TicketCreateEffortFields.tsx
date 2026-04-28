import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator, Scale } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { Ticket, TicketComplexity, TICKET_COMPLEXITY_LABELS } from '@/app/types/entities';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import type { TicketCreateDialogViewModel } from '../../TicketCreateDialog';

interface TicketCreateEffortFieldsProps {
  vm: TicketCreateDialogViewModel;
}

export const TicketCreateEffortFields: React.FC<TicketCreateEffortFieldsProps> = ({ vm }) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="space-y-1.5">
        <Label>{t('tickets.create.complexity')}</Label>
        <Select value={vm.form.complexity} onValueChange={(value) => vm.onFormChange({ ...vm.form, complexity: value as TicketComplexity })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(TICKET_COMPLEXITY_LABELS) as TicketComplexity[]).map((complexity) => (
              <SelectItem key={complexity} value={complexity}>
                {t(`entities.ticketComplexity.${complexity}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <div className="flex items-center justify-between gap-2">
          <Label>{t('tickets.create.estimation')}</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={vm.onApplyAbaqueEstimate}
            disabled={vm.abaqueSuggestedHours === null}
          >
            <Calculator className="h-3.5 w-3.5 mr-1" />
            {t('tickets.create.useAbaque')}
          </Button>
        </div>
        <Input
          type="number"
          min={0}
          step={0.5}
          value={vm.form.estimationHours}
          onChange={(event) => {
            vm.onEstimatedByAbaqueChange(false);
            vm.onFormChange({ ...vm.form, estimationHours: Number(event.target.value) });
          }}
        />
        {vm.abaqueSuggestedHours !== null && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{t('tickets.create.abaqueSuggest', { hours: vm.abaqueSuggestedHours })}</span>
            {vm.isEstimatedByAbaque && (
              <Badge variant="secondary" className="inline-flex items-center gap-1">
                <Scale className="h-3 w-3" />
                {t('tickets.create.abaqueApplied')}
              </Badge>
            )}
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        <Label>{t('tickets.create.priority')}</Label>
        <Select value={vm.form.priority} onValueChange={(value) => vm.onFormChange({ ...vm.form, priority: value as Ticket['priority'] })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LOW">{t('tickets.priority.LOW')}</SelectItem>
            <SelectItem value="MEDIUM">{t('tickets.priority.MEDIUM')}</SelectItem>
            <SelectItem value="HIGH">{t('tickets.priority.HIGH')}</SelectItem>
            <SelectItem value="CRITICAL">{t('tickets.priority.CRITICAL')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>{t('tickets.create.dueDate')}</Label>
        <Input type="date" value={vm.form.dueDate} onChange={(event) => vm.onFormChange({ ...vm.form, dueDate: event.target.value })} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label>{t('tickets.create.description')}</Label>
        <Textarea value={vm.form.description} onChange={(event) => vm.onFormChange({ ...vm.form, description: event.target.value })} rows={3} />
      </div>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={vm.onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={vm.isSubmitting}>
          {vm.isSubmitting ? t('tickets.create.submitting') : t('tickets.create.submit')}
        </Button>
      </div>
    </>
  );
};
