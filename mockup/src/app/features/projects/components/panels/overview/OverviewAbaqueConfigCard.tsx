import React from 'react';
import { Scale } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { ABAQUE_TASK_NATURE_LABELS } from '@/app/types/entities';
import type { OverviewPanelViewModel } from '../OverviewPanel';

interface OverviewAbaqueConfigCardProps {
  vm: OverviewPanelViewModel;
}

export const OverviewAbaqueConfigCard: React.FC<OverviewAbaqueConfigCardProps> = ({ vm }) => {
  return (
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
                <TableHead className="px-4">Ticket Nature</TableHead>
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
                  (entry) => entry.taskNature === taskNature && entry.complexity === 'MEDIUM'
                )?.standardHours;
                const high = vm.selectedAbaque?.entries.find(
                  (entry) => entry.taskNature === taskNature && entry.complexity === 'HIGH'
                )?.standardHours;
                return (
                  <TableRow key={taskNature}>
                    <TableCell className="px-4 py-3">
                      <Badge variant="secondary">{ABAQUE_TASK_NATURE_LABELS[taskNature]}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-semibold">{low ?? '-'}</TableCell>
                    <TableCell className="px-4 py-3 text-sm font-semibold">{medium ?? '-'}</TableCell>
                    <TableCell className="px-4 py-3 text-sm font-semibold">{high ?? '-'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
