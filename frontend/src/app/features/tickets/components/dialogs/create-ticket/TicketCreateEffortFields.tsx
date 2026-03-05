import React from 'react';
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
        <Label>Estimation (hours)</Label>
        <Input
          type="number"
          min={0}
          step={0.5}
          value={vm.form.estimationHours}
          onChange={(event) => {
            vm.onFormChange({ ...vm.form, estimationHours: Number(event.target.value) });
          }}
        />
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
