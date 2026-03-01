import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { ABAQUE_TASK_NATURE_LABELS, AbaqueTaskNature } from '@/app/types/entities';

interface CreateProjectTicketAbaqueReferenceProps {
  vm: any;
}

export const CreateProjectTicketAbaqueReference: React.FC<CreateProjectTicketAbaqueReferenceProps> = ({
  vm,
}) => {
  if (!vm.selectedAbaque) {
    return (
      <div className="rounded-lg border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
        Link an abaque to the project to see standard effort values.
      </div>
    );
  }

  return (
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
          {vm.abaqueTaskNatures.map((taskNature: any) => {
            const low = vm.selectedAbaque?.entries.find(
              (entry: any) => entry.taskNature === taskNature && entry.complexity === 'LOW'
            )?.standardHours;
            const medium = vm.selectedAbaque?.entries.find(
              (entry: any) => entry.taskNature === taskNature && entry.complexity === 'MEDIUM'
            )?.standardHours;
            const high = vm.selectedAbaque?.entries.find(
              (entry: any) => entry.taskNature === taskNature && entry.complexity === 'HIGH'
            )?.standardHours;
            const activeRow = taskNature === vm.formValues?.nature;
            return (
              <TableRow key={taskNature} className={activeRow ? 'bg-primary/10' : undefined}>
                <TableCell className="px-3 py-2 text-xs font-medium">
                  {ABAQUE_TASK_NATURE_LABELS[taskNature as AbaqueTaskNature]}
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
  );
};
