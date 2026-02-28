import React from 'react';
import { Allocation, User } from '@/app/types/entities';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';

interface TeamAllocationTableProps {
  allocations: Allocation[];
  users: User[];
}

export const TeamAllocationTable: React.FC<TeamAllocationTableProps> = ({
  allocations,
  users,
}) => {
  return (
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
  );
};
