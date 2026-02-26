import React from 'react';
import { Calculator, Scale } from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
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
import {
  ABAQUE_TASK_NATURE_LABELS,
  Abaque,
  AbaqueTaskNature,
  Project,
  PROJECT_DELIVERY_TYPE_LABELS,
} from '../../../../types/entities';

export interface OverviewPanelViewModel {
  project: Project;
  managerName: string;
  tasksCount: number;
  deliverablesCount: number;
  openTicketsCount: number;
  wricefObjectCount?: number;
  blockedTasksCount: number;
  criticalTasksCount: number;
  abaques: Abaque[];
  selectedAbaque: Abaque | null;
  abaqueTaskNatures: AbaqueTaskNature[];
  abaqueSaving: boolean;
  onLinkedAbaqueChange: (linkedAbaqueId: string) => void;
  onOpenCreateTicket: () => void;
}

interface OverviewPanelProps {
  active: boolean;
  vm: OverviewPanelViewModel;
}

export const OverviewPanel: React.FC<OverviewPanelProps> = ({ active, vm }) => {
  if (!active) return null;

  return (
    <>
      <section
        id="project-panel-overview"
        role="tabpanel"
        tabIndex={0}
        aria-labelledby="project-tab-overview"
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Project Snapshot</h3>
          <p className="text-sm text-muted-foreground">{vm.project.description}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="p-3 rounded border border-border">
              <div className="text-xs text-muted-foreground">Manager</div>
              <div className="font-medium text-foreground">{vm.managerName}</div>
            </div>
            <div className="p-3 rounded border border-border">
              <div className="text-xs text-muted-foreground">Start Date</div>
              <div className="font-medium text-foreground">
                {new Date(vm.project.startDate).toLocaleDateString()}
              </div>
            </div>
            <div className="p-3 rounded border border-border">
              <div className="text-xs text-muted-foreground">End Date</div>
              <div className="font-medium text-foreground">
                {new Date(vm.project.endDate).toLocaleDateString()}
              </div>
            </div>
            <div className="p-3 rounded border border-border">
              <div className="text-xs text-muted-foreground">Project Type</div>
              <div className="font-medium text-foreground">
                {PROJECT_DELIVERY_TYPE_LABELS[vm.project.projectType ?? 'BUILD']}
              </div>
            </div>
            <div className="p-3 rounded border border-border">
              <div className="text-xs text-muted-foreground">WRICEF</div>
              <div className="font-medium text-foreground">
                {vm.wricefObjectCount !== undefined ? `${vm.wricefObjectCount} objects` : 'Not imported'}
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Global Progress</span>
              <span className="font-medium text-foreground">{vm.project.progress ?? 0}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="h-2 bg-primary rounded-full"
                style={{ width: `${vm.project.progress ?? 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Live Metrics</h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tasks</span>
            <span className="font-medium text-foreground">{vm.tasksCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Deliverables</span>
            <span className="font-medium text-foreground">{vm.deliverablesCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Open Tickets</span>
            <span className="font-medium text-foreground">{vm.openTicketsCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Critical Tasks</span>
            <span className="font-medium text-destructive">{vm.criticalTasksCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Blocked</span>
            <span className="font-medium text-accent-foreground">{vm.blockedTasksCount}</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Configuration</h3>
            </div>
            <Badge variant="outline">Abaques de Chiffrage</Badge>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-abaque-select">Linked Abaque</Label>
            <Select
              value={vm.project.linkedAbaqueId ?? '__none'}
              onValueChange={vm.onLinkedAbaqueChange}
              disabled={vm.abaqueSaving}
            >
              <SelectTrigger id="project-abaque-select" className="max-w-lg">
                <SelectValue placeholder="Select an estimation abaque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">No linked abaque</SelectItem>
                {vm.abaques.map((abaque) => (
                  <SelectItem key={abaque.id} value={abaque.id}>
                    {abaque.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This matrix will be used as the default standard for ticket estimation in this
              project.
            </p>
          </div>

          {!vm.selectedAbaque ? (
            <p className="text-sm text-muted-foreground">No abaque selected for this project.</p>
          ) : (
            <div className="rounded-lg border border-border/70 bg-surface-2 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/55">
                  <TableRow>
                    <TableHead className="px-4">Task Nature</TableHead>
                    <TableHead className="px-4">Low</TableHead>
                    <TableHead className="px-4">Medium</TableHead>
                    <TableHead className="px-4">High</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vm.abaqueTaskNatures.map((taskNature) => {
                    const low = vm.selectedAbaque?.entries.find(
                      (entry) => entry.taskNature === taskNature && entry.complexity === 'LOW'
                    )?.standardHours;
                    const medium = vm.selectedAbaque?.entries.find(
                      (entry) =>
                        entry.taskNature === taskNature && entry.complexity === 'MEDIUM'
                    )?.standardHours;
                    const high = vm.selectedAbaque?.entries.find(
                      (entry) => entry.taskNature === taskNature && entry.complexity === 'HIGH'
                    )?.standardHours;
                    return (
                      <TableRow key={taskNature}>
                        <TableCell className="px-4 py-3">
                          <Badge variant="secondary">
                            {ABAQUE_TASK_NATURE_LABELS[taskNature]}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm font-semibold">
                          {low ?? '-'}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm font-semibold">
                          {medium ?? '-'}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm font-semibold">
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

        <div className="rounded-lg border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Smart Ticket Estimation</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Create project tickets with standardized effort using the linked abaque matrix.
          </p>
          <div className="rounded border border-border p-3 text-sm space-y-1">
            <div className="text-muted-foreground">Current Abaque</div>
            <div className="font-medium text-foreground">
              {vm.selectedAbaque?.name ?? 'No linked abaque'}
            </div>
          </div>
          <Button onClick={vm.onOpenCreateTicket} className="w-full">
            <Calculator className="h-4 w-4 mr-1" />
            Create Ticket
          </Button>
        </div>
      </section>
    </>
  );
};
