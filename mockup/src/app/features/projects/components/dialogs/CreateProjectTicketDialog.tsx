import React from 'react';
import { Calculator, Scale } from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../components/ui/table';
import { Textarea } from '../../../../components/ui/textarea';
import {
  ABAQUE_TASK_NATURE_LABELS,
  Abaque,
  AbaqueComplexity,
  AbaqueTaskNature,
  Ticket,
  TicketNature,
  TICKET_NATURE_LABELS,
  WricefObject,
} from '../../../../types/entities';

export interface ProjectTicketForm {
  title: string;
  description: string;
  nature: TicketNature;
  priority: Ticket['priority'];
  complexity: AbaqueComplexity;
  effortHours: number;
  dueDate: string;
  wricefObjectId: string;
}

export interface CreateProjectTicketDialogViewModel {
  projectName: string;
  wricefObjects: WricefObject[];
  selectedAbaque: Abaque | null;
  abaqueTaskNatures: AbaqueTaskNature[];
  form: ProjectTicketForm;
  isEstimatedByAbaque: boolean;
  isCreatingTicket: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: ProjectTicketForm) => void;
  onEstimatedByAbaqueChange: (value: boolean) => void;
  onApplyAbaqueEstimate: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

interface CreateProjectTicketDialogProps {
  open: boolean;
  vm: CreateProjectTicketDialogViewModel;
}

export const CreateProjectTicketDialog: React.FC<CreateProjectTicketDialogProps> = ({
  open,
  vm,
}) => {
  return (
    <Dialog open={open} onOpenChange={vm.onOpenChange}>
      <DialogContent className="max-w-5xl sm:max-w-5xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Create Project Ticket
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="rounded border border-border/70 bg-muted/30 p-3 text-sm">
              <p>
                <span className="text-muted-foreground">Project:</span> {vm.projectName}
              </p>
              <p>
                <span className="text-muted-foreground">Abaque:</span>{' '}
                {vm.selectedAbaque?.name ?? 'No linked abaque'}
              </p>
            </div>

            {vm.wricefObjects.length > 0 && (
              <div className="space-y-1.5">
                <Label>Link to WRICEF Object</Label>
                <Select
                  value={vm.form.wricefObjectId || '_none'}
                  onValueChange={(value) =>
                    vm.onFormChange({
                      ...vm.form,
                      wricefObjectId: value === '_none' ? '' : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No WRICEF object" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">No WRICEF object</SelectItem>
                    {vm.wricefObjects.map((object) => (
                      <SelectItem key={object.id} value={object.id}>
                        {object.id} - {object.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="project-ticket-title">Title *</Label>
                <Input
                  id="project-ticket-title"
                  value={vm.form.title}
                  onChange={(event) =>
                    vm.onFormChange({ ...vm.form, title: event.target.value })
                  }
                  placeholder="Ticket title"
                />
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
                    {(Object.entries(TICKET_NATURE_LABELS) as [TicketNature, string][]).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Complexity</Label>
                <Select
                  value={vm.form.complexity}
                  onValueChange={(value) => {
                    vm.onFormChange({
                      ...vm.form,
                      complexity: value as AbaqueComplexity,
                    });
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
                <Select
                  value={vm.form.priority}
                  onValueChange={(value) =>
                    vm.onFormChange({
                      ...vm.form,
                      priority: value as Ticket['priority'],
                    })
                  }
                >
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
                  value={vm.form.dueDate}
                  onChange={(event) =>
                    vm.onFormChange({ ...vm.form, dueDate: event.target.value })
                  }
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
                    disabled={!vm.selectedAbaque}
                  >
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
                    vm.onFormChange({
                      ...vm.form,
                      effortHours: Number(event.target.value || 0),
                    });
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
                <Textarea
                  id="project-ticket-description"
                  value={vm.form.description}
                  onChange={(event) =>
                    vm.onFormChange({ ...vm.form, description: event.target.value })
                  }
                  rows={4}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground">Abaque Reference</div>
            {!vm.selectedAbaque ? (
              <div className="rounded-lg border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                Link an abaque to the project to see standard effort values.
              </div>
            ) : (
              <div className="rounded-lg border border-border/70 bg-surface-2 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/55">
                    <TableRow>
                      <TableHead className="px-3">Nature</TableHead>
                      <TableHead className="px-3 text-center">L</TableHead>
                      <TableHead className="px-3 text-center">M</TableHead>
                      <TableHead className="px-3 text-center">H</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vm.abaqueTaskNatures.map((taskNature) => {
                      const low = vm.selectedAbaque?.entries.find(
                        (entry) =>
                          entry.taskNature === taskNature && entry.complexity === 'LOW'
                      )?.standardHours;
                      const medium = vm.selectedAbaque?.entries.find(
                        (entry) =>
                          entry.taskNature === taskNature && entry.complexity === 'MEDIUM'
                      )?.standardHours;
                      const high = vm.selectedAbaque?.entries.find(
                        (entry) =>
                          entry.taskNature === taskNature && entry.complexity === 'HIGH'
                      )?.standardHours;
                      const activeRow = taskNature === vm.form.nature;
                      return (
                        <TableRow
                          key={taskNature}
                          className={activeRow ? 'bg-primary/10' : undefined}
                        >
                          <TableCell className="px-3 py-2 text-xs font-medium">
                            {ABAQUE_TASK_NATURE_LABELS[taskNature]}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-center text-xs">
                            {low ?? '-'}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-center text-xs">
                            {medium ?? '-'}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-center text-xs">
                            {high ?? '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="mt-4 pt-4 sm:justify-end">
          <Button type="button" variant="outline" onClick={vm.onCancel}>
            Cancel
          </Button>
          <Button onClick={vm.onSubmit} disabled={vm.isCreatingTicket}>
            {vm.isCreatingTicket ? 'Creating...' : 'Create Ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
