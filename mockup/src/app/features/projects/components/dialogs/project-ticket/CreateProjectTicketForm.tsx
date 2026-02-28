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
  AbaqueComplexity,
  Ticket,
  TicketNature,
  TICKET_NATURE_LABELS,
} from '@/app/types/entities';
import type { CreateProjectTicketDialogViewModel } from '../CreateProjectTicketDialog';
import { CreateProjectTicketContextBlock } from './CreateProjectTicketContextBlock';

interface CreateProjectTicketFormProps {
  vm: CreateProjectTicketDialogViewModel;
}

export const CreateProjectTicketForm: React.FC<CreateProjectTicketFormProps> = ({ vm }) => {
  return (
    <div className="space-y-4">
      <CreateProjectTicketContextBlock vm={vm} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="project-ticket-title">Title *</Label>
          <Input id="project-ticket-title" value={vm.form.title} onChange={(event) => vm.onFormChange({ ...vm.form, title: event.target.value })} placeholder="Ticket title" />
        </div>
        <div className="space-y-1.5">
          <Label>Ticket Nature</Label>
          <Select
            value={vm.form.nature}
            onValueChange={(value) => {
              vm.onFormChange({ ...vm.form, nature: value as TicketNature });
              vm.onEstimatedByAbaqueChange(false);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(TICKET_NATURE_LABELS) as [TicketNature, string][]).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Complexity</Label>
          <Select
            value={vm.form.complexity}
            onValueChange={(value) => {
              vm.onFormChange({ ...vm.form, complexity: value as AbaqueComplexity });
              vm.onEstimatedByAbaqueChange(false);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
            </SelectContent>
          </Select>
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
          <Label htmlFor="project-ticket-due-date">Due Date</Label>
          <Input id="project-ticket-due-date" type="date" value={vm.form.dueDate} onChange={(event) => vm.onFormChange({ ...vm.form, dueDate: event.target.value })} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="project-ticket-effort">Effort (Hours)</Label>
            <Button type="button" size="sm" variant="outline" onClick={vm.onApplyAbaqueEstimate} disabled={!vm.selectedAbaque}>
              <Calculator className="h-3.5 w-3.5 mr-1" />
              Use Abaque Estimate
            </Button>
          </div>
          <Input
            id="project-ticket-effort"
            type="number"
            min={0}
            step={0.5}
            value={vm.form.effortHours}
            onChange={(event) => {
              vm.onFormChange({ ...vm.form, effortHours: Number(event.target.value || 0) });
              vm.onEstimatedByAbaqueChange(false);
            }}
          />
          {vm.isEstimatedByAbaque && (
            <Badge variant="secondary" className="inline-flex items-center gap-1">
              <Scale className="h-3 w-3" />
              Standard guideline match
            </Badge>
          )}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="project-ticket-description">Description</Label>
          <Textarea id="project-ticket-description" value={vm.form.description} onChange={(event) => vm.onFormChange({ ...vm.form, description: event.target.value })} rows={4} />
        </div>
      </div>
    </div>
  );
};
