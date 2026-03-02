import React from 'react';
import { Calculator, Scale } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Ticket,
  TicketComplexity,
  TICKET_COMPLEXITY_LABELS,
  TICKET_NATURE_LABELS,
} from '@/app/types/entities';
import type { TicketCreateDialogViewModel } from '../../TicketCreateDialog';

interface TicketCreateEffortFieldsProps {
  vm: TicketCreateDialogViewModel;
}

export const TicketCreateEffortFields: React.FC<TicketCreateEffortFieldsProps> = ({ vm }) => {
  return (
    <>
      <div className="space-y-1.5">
        <Label>Complexity *</Label>
        <Select value={vm.form.complexity} onValueChange={(value) => vm.onFormChange({ ...vm.form, complexity: value as TicketComplexity })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(TICKET_COMPLEXITY_LABELS) as TicketComplexity[]).map((complexity) => (
              <SelectItem key={complexity} value={complexity}>
                {TICKET_COMPLEXITY_LABELS[complexity]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <div className="flex items-center justify-between gap-2">
          <Label>Estimation (hours)</Label>
          <Button type="button" size="sm" variant="outline" onClick={vm.onApplyAbaqueEstimate} disabled={!vm.linkedAbaque}>
            <Calculator className="h-3.5 w-3.5 mr-1" />
            Use Abaque Estimate
          </Button>
        </div>
        <Input
          type="number"
          min={0}
          step={0.5}
          value={vm.form.estimationHours}
          onChange={(event) => {
            vm.onFormChange({ ...vm.form, estimationHours: Number(event.target.value) });
            vm.onEstimatedByAbaqueChange(false);
          }}
        />
        {vm.isEstimatedByAbaque && (
          <Badge variant="secondary" className="inline-flex items-center gap-1">
            <Scale className="h-3 w-3" />
            Standard guideline match
          </Badge>
        )}
        {vm.abaqueEntry && !vm.isEstimatedByAbaque && (
          <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs">
            <Calculator className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground">
              Abaque suggests <span className="font-semibold text-foreground">{vm.abaqueEntry.standardHours}h</span> for {TICKET_NATURE_LABELS[vm.form.nature]} x {TICKET_COMPLEXITY_LABELS[vm.form.complexity]}
            </span>
            {vm.form.estimationHours !== vm.abaqueEntry.standardHours && (
              <button type="button" onClick={() => { vm.onFormChange({ ...vm.form, estimationHours: vm.abaqueEntry!.standardHours }); vm.onEstimatedByAbaqueChange(true); }} className="ml-auto text-[10px] font-medium text-primary hover:underline whitespace-nowrap">
                Apply
              </button>
            )}
          </div>
        )}
        {vm.linkedAbaque && !vm.abaqueEntry && !vm.isEstimatedByAbaque && (
          <p className="text-[10px] text-muted-foreground">
            No abaque entry for {TICKET_NATURE_LABELS[vm.form.nature]} x {TICKET_COMPLEXITY_LABELS[vm.form.complexity]} in "{vm.linkedAbaque.name}"
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label>Priority</Label>
        <Select value={vm.form.priority} onValueChange={(value) => vm.onFormChange({ ...vm.form, priority: value as Ticket['priority'] })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Due Date</Label>
        <Input type="date" value={vm.form.dueDate} onChange={(event) => vm.onFormChange({ ...vm.form, dueDate: event.target.value })} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Description</Label>
        <Textarea value={vm.form.description} onChange={(event) => vm.onFormChange({ ...vm.form, description: event.target.value })} rows={3} />
      </div>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={vm.onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={vm.isSubmitting}>
          {vm.isSubmitting ? 'Creating...' : 'Create'}
        </Button>
      </div>
    </>
  );
};
