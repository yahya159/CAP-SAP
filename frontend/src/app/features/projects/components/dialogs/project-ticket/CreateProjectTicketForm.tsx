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
  TICKET_COMPLEXITY_LABELS,
  TICKET_NATURE_LABELS,
} from '@/app/types/entities';
import { CreateProjectTicketContextBlock } from './CreateProjectTicketContextBlock';

interface CreateProjectTicketFormProps {
  vm: any;
}

export const CreateProjectTicketForm: React.FC<CreateProjectTicketFormProps> = ({ vm }) => {
  return (
    <div className="space-y-4">
      <CreateProjectTicketContextBlock vm={vm} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="project-ticket-title">Title *</Label>
          <Input
            id="project-ticket-title"
            name={vm.register('title').name}
            onChange={vm.register('title').onChange}
            onBlur={vm.register('title').onBlur}
            placeholder="Ticket title"
          />
          {vm.errors.title && <span className="text-xs text-destructive">{vm.errors.title.message}</span>}
        </div>
        <div className="space-y-1.5">
          <Label>Ticket Nature</Label>
          <Select
            value={vm.formValues.nature}
            onValueChange={(value) => vm.onNatureChange(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TICKET_NATURE_LABELS).map(([value, label]) => (
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
            value={vm.formValues.complexity}
            onValueChange={(value) => vm.onComplexityChange(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TICKET_COMPLEXITY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={vm.formValues.priority} onValueChange={(value) => vm.setValue('priority', value)}>
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
          <Input
            id="project-ticket-due-date"
            type="date"
            name={vm.register('dueDate').name}
            onChange={vm.register('dueDate').onChange}
            onBlur={vm.register('dueDate').onBlur}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="project-ticket-effort">Effort (Hours)</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={vm.onApplyAbaqueEstimate}
              disabled={vm.abaqueSuggestedHours === null}
            >
              <Calculator className="h-3.5 w-3.5 mr-1" />
              Use Matrix Estimate
            </Button>
          </div>
          <Input
            id="project-ticket-effort"
            type="number"
            min={0}
            name={vm.register('effortHours', { valueAsNumber: true }).name}
            onChange={(event) => vm.onEffortHoursChange(Number(event.target.value))}
            onBlur={vm.register('effortHours', { valueAsNumber: true }).onBlur}
          />
          {vm.errors.effortHours && <span className="text-xs text-destructive">{vm.errors.effortHours.message}</span>}
          {vm.abaqueSuggestedHours !== null && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Matrix suggests {vm.abaqueSuggestedHours}h for the selected nature and complexity.</span>
              {vm.isEstimatedByAbaque && (
                <Badge variant="secondary" className="inline-flex items-center gap-1">
                  <Scale className="h-3 w-3" />
                  Matrix applied
                </Badge>
              )}
            </div>
          )}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="project-ticket-description">Description</Label>
          <Textarea
            id="project-ticket-description"
            name={vm.register('description').name}
            onChange={vm.register('description').onChange}
            onBlur={vm.register('description').onBlur}
            rows={4}
          />
        </div>
      </div>
    </div>
  );
};
