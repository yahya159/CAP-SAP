import React from 'react';
import { Calculator, Scale } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Textarea } from '../../../components/ui/textarea';
import {
  ABAQUE_TASK_NATURE_LABELS,
  Abaque,
  AbaqueEntry,
  Project,
  SAPModule,
  SAP_MODULE_LABELS,
  Ticket,
  TicketComplexity,
  TicketNature,
  TICKET_COMPLEXITY_LABELS,
  TICKET_NATURE_LABELS,
  User,
  WricefObject,
} from '../../../types/entities';
import { TicketForm } from './types';

export interface TicketCreateDialogViewModel {
  projects: Project[];
  users: User[];
  selectedProject: Project | undefined;
  wricefObjects: WricefObject[];
  linkedAbaque: Abaque | null;
  abaqueTaskNatures: string[];
  abaqueEntry: AbaqueEntry | null;
  form: TicketForm;
  isManualWricef: boolean;
  isEstimatedByAbaque: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: React.FormEvent) => void;
  onFormChange: (form: TicketForm) => void;
  onManualWricefChange: (value: boolean) => void;
  onEstimatedByAbaqueChange: (value: boolean) => void;
  onApplyAbaqueEstimate: () => void;
  onCancel: () => void;
}

interface TicketCreateDialogProps {
  open: boolean;
  vm: TicketCreateDialogViewModel;
}

export const TicketCreateDialog: React.FC<TicketCreateDialogProps> = ({ open, vm }) => {
  return (
    <Dialog open={open} onOpenChange={vm.onOpenChange}>
      <DialogContent className="max-w-5xl sm:max-w-5xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            New Ticket
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <form onSubmit={vm.onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Project *</Label>
              <Select
                value={vm.form.projectId}
                onValueChange={(value) => vm.onFormChange({ ...vm.form, projectId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {vm.projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assign To</Label>
              <Select
                value={vm.form.assignedTo}
                onValueChange={(value) => vm.onFormChange({ ...vm.form, assignedTo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {vm.users
                    .filter((user) => user.role !== 'ADMIN')
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Title *</Label>
              <Input
                value={vm.form.title}
                onChange={(event) => vm.onFormChange({ ...vm.form, title: event.target.value })}
              />
            </div>
            <div className="space-y-1.5 flex flex-col justify-end">
              <div className="flex items-center justify-between">
                <Label>{vm.isManualWricef ? 'WRICEF ID' : 'Existing Object'}</Label>
                <button
                  type="button"
                  onClick={() => vm.onManualWricefChange(!vm.isManualWricef)}
                  className="text-[10px] text-primary hover:underline hover:text-primary/80"
                >
                  {vm.isManualWricef ? 'Select Existing Object' : 'Manual Entry'}
                </button>
              </div>
              {!vm.isManualWricef ? (
                <Select
                  value={vm.form.wricefId}
                  onValueChange={(value) => {
                    const object = vm.wricefObjects.find((item) => item.id === value);
                    if (object) {
                      vm.onFormChange({
                        ...vm.form,
                        wricefId: object.id,
                        title: vm.form.title || object.title,
                        description: vm.form.description || object.description,
                        complexity: object.complexity,
                      });
                    } else {
                      vm.onFormChange({ ...vm.form, wricefId: value });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select imported object" />
                  </SelectTrigger>
                  <SelectContent>
                    {vm.wricefObjects.length > 0 ? (
                      vm.wricefObjects.map((object) => (
                        <SelectItem key={object.id} value={object.id}>
                          {object.id} - {object.title}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        No objects imported for this project.
                      </div>
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={vm.form.wricefId}
                  onChange={(event) => vm.onFormChange({ ...vm.form, wricefId: event.target.value })}
                  placeholder="e.g. W-001, R-015"
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Module *</Label>
              <Select
                value={vm.form.module}
                onValueChange={(value) => vm.onFormChange({ ...vm.form, module: value as SAPModule })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SAP_MODULE_LABELS) as SAPModule[]).map((module) => (
                    <SelectItem key={module} value={module}>
                      {SAP_MODULE_LABELS[module]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nature *</Label>
              <Select
                value={vm.form.nature}
                onValueChange={(value) => vm.onFormChange({ ...vm.form, nature: value as TicketNature })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['WORKFLOW', 'FORMULAIRE', 'PROGRAMME', 'ENHANCEMENT', 'MODULE', 'REPORT'] as TicketNature[]).map((nature) => (
                    <SelectItem key={nature} value={nature}>
                      {TICKET_NATURE_LABELS[nature]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Complexity *</Label>
              <Select
                value={vm.form.complexity}
                onValueChange={(value) => vm.onFormChange({ ...vm.form, complexity: value as TicketComplexity })}
              >
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
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={vm.onApplyAbaqueEstimate}
                  disabled={!vm.linkedAbaque}
                >
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
                  vm.onFormChange({
                    ...vm.form,
                    estimationHours: Number(event.target.value),
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
              {vm.abaqueEntry && !vm.isEstimatedByAbaque && (
                <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs">
                  <Calculator className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-muted-foreground">
                    Abaque suggests{' '}
                    <span className="font-semibold text-foreground">
                      {vm.abaqueEntry.standardHours}h
                    </span>{' '}
                    for {TICKET_NATURE_LABELS[vm.form.nature]} x{' '}
                    {TICKET_COMPLEXITY_LABELS[vm.form.complexity]}
                  </span>
                  {vm.form.estimationHours !== vm.abaqueEntry.standardHours && (
                    <button
                      type="button"
                      onClick={() => {
                        vm.onFormChange({
                          ...vm.form,
                          estimationHours: vm.abaqueEntry!.standardHours,
                        });
                        vm.onEstimatedByAbaqueChange(true);
                      }}
                      className="ml-auto text-[10px] font-medium text-primary hover:underline whitespace-nowrap"
                    >
                      Apply
                    </button>
                  )}
                </div>
              )}
              {vm.linkedAbaque && !vm.abaqueEntry && !vm.isEstimatedByAbaque && (
                <p className="text-[10px] text-muted-foreground">
                  No abaque entry for {TICKET_NATURE_LABELS[vm.form.nature]} x{' '}
                  {TICKET_COMPLEXITY_LABELS[vm.form.complexity]} in "{vm.linkedAbaque.name}"
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={vm.form.priority}
                onValueChange={(value) =>
                  vm.onFormChange({ ...vm.form, priority: value as Ticket['priority'] })
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
              <Label>Due Date</Label>
              <Input
                type="date"
                value={vm.form.dueDate}
                onChange={(event) => vm.onFormChange({ ...vm.form, dueDate: event.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={vm.form.description}
                onChange={(event) => vm.onFormChange({ ...vm.form, description: event.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="outline" onClick={vm.onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={vm.isSubmitting}>
                {vm.isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>

          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground">Abaque Reference</div>
            {vm.selectedProject && (
              <div className="rounded border border-border/70 bg-muted/30 p-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Project:</span> {vm.selectedProject.name}
                </p>
                <p>
                  <span className="text-muted-foreground">Abaque:</span>{' '}
                  {vm.linkedAbaque?.name ?? 'No linked abaque'}
                </p>
              </div>
            )}
            {!vm.linkedAbaque ? (
              <div className="rounded-lg border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                {vm.form.projectId
                  ? 'Link an abaque to the project to see standard effort values.'
                  : 'Select a project to view abaque reference.'}
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
                      const low = vm.linkedAbaque?.entries.find(
                        (entry) => entry.taskNature === taskNature && entry.complexity === 'LOW'
                      )?.standardHours;
                      const medium = vm.linkedAbaque?.entries.find(
                        (entry) => entry.taskNature === taskNature && entry.complexity === 'MEDIUM'
                      )?.standardHours;
                      const high = vm.linkedAbaque?.entries.find(
                        (entry) => entry.taskNature === taskNature && entry.complexity === 'HIGH'
                      )?.standardHours;
                      const activeRow = taskNature === vm.form.nature;
                      return (
                        <TableRow key={taskNature} className={activeRow ? 'bg-primary/10' : undefined}>
                          <TableCell className="px-3 py-2 text-xs font-medium">
                            {ABAQUE_TASK_NATURE_LABELS[taskNature as keyof typeof ABAQUE_TASK_NATURE_LABELS]}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-center text-xs">{low ?? '-'}</TableCell>
                          <TableCell className="px-3 py-2 text-center text-xs">{medium ?? '-'}</TableCell>
                          <TableCell className="px-3 py-2 text-center text-xs">{high ?? '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
