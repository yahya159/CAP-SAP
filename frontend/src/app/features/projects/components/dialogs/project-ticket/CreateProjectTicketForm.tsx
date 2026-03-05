import React from 'react';
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
            onValueChange={(value) => vm.setValue('nature', value)}
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
            onValueChange={(value) => vm.setValue('complexity', value)}
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
          <Label htmlFor="project-ticket-effort">Effort (Hours)</Label>
          <Input
            id="project-ticket-effort"
            type="number"
            min={0}
            name={vm.register('effortHours', { valueAsNumber: true }).name}
            onChange={vm.register('effortHours', { valueAsNumber: true }).onChange}
            onBlur={vm.register('effortHours', { valueAsNumber: true }).onBlur}
          />
          {vm.errors.effortHours && <span className="text-xs text-destructive">{vm.errors.effortHours.message}</span>}
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
