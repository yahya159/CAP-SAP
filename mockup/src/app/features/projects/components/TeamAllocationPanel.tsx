import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Allocation, User } from '../../../types/entities';

interface TeamAllocationPanelProps {
  active: boolean;
  allocations: Allocation[];
  users: User[];
}

/**
 * @deprecated Use `features/projects/components/panels/TeamPanel` + `tables/TeamAllocationTable` instead.
 */
export const TeamAllocationPanel: React.FC<TeamAllocationPanelProps> = ({
  active,
  allocations,
  users,
}) => {
  if (!active) return null;

  return (
    <section
      id="project-panel-team"
      role="tabpanel"
      tabIndex={0}
      aria-labelledby="project-tab-team"
      className="rounded-lg border bg-card"
    >
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="px-4">Consultant</TableHead>
            <TableHead className="px-4">Role</TableHead>
            <TableHead className="px-4">Allocation</TableHead>
            <TableHead className="px-4">Availability</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allocations.map((allocation) => {
            const user = users.find((item) => item.id === allocation.userId);
            return (
              <TableRow key={allocation.id}>
                <TableCell className="px-4 py-3 text-sm">{user?.name ?? '-'}</TableCell>
                <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                  {user?.role ?? '-'}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  {allocation.allocationPercent}%
                </TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  {user?.availabilityPercent ?? '-'}%
                </TableCell>
              </TableRow>
            );
          })}
          {allocations.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                No allocations found for this project.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </section>
  );
};
