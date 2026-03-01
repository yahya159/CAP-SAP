import React from 'react';
import { X, CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { IMPUTATION_VALIDATION_LABELS, ImputationPeriod, User } from '@/app/types/entities';
import { validationColor, formatPeriodLabel } from '../model';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';

interface ManagerValidationTableProps {
  reviewPeriods: ImputationPeriod[];
  users: User[];
  canSendToStraTIME: boolean;
  rejectPeriod: (period: ImputationPeriod) => void;
  validatePeriod: (period: ImputationPeriod) => void;
  sendPeriodToStraTIME: (period: ImputationPeriod) => void;
}

export const ManagerValidationTable: React.FC<ManagerValidationTableProps> = ({
  reviewPeriods,
  users,
  canSendToStraTIME,
  rejectPeriod,
  validatePeriod,
  sendPeriodToStraTIME,
}) => {
  const consultantName = (id: string) => users.find((u) => u.id === id)?.name ?? id;

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">Validation and Stratime Dispatch</h3>
          <p className="text-xs text-muted-foreground">
            Validate submitted periods, then send validated periods to the Stratime platform.
          </p>
        </div>
      </div>

      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="px-4">Consultant</TableHead>
            <TableHead className="px-4">Period</TableHead>
            <TableHead className="px-4">Hours</TableHead>
            <TableHead className="px-4">Validation</TableHead>
            <TableHead className="px-4">Stratime</TableHead>
            <TableHead className="px-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviewPeriods.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                No imputation periods found for this month.
              </TableCell>
            </TableRow>
          ) : (
            reviewPeriods.map((period) => (
              <TableRow key={period.id}>
                <TableCell className="px-4 py-3 text-sm">{consultantName(period.consultantId)}</TableCell>
                <TableCell className="px-4 py-3 text-sm">{formatPeriodLabel(period.periodKey)}</TableCell>
                <TableCell className="px-4 py-3 text-sm font-semibold">{period.totalHours}h</TableCell>
                <TableCell className="px-4 py-3">
                  <Badge className={validationColor[period.status] + ' text-[10px]'}>
                    {IMPUTATION_VALIDATION_LABELS[period.status as keyof typeof IMPUTATION_VALIDATION_LABELS]}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3">
                  {period.sentToStraTIME ? (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-[10px]">
                      Sent
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">Pending</Badge>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    {period.status === 'SUBMITTED' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => rejectPeriod(period)}>
                          <X className="mr-1 h-3.5 w-3.5" />
                          Reject
                        </Button>
                        <Button size="sm" onClick={() => validatePeriod(period)}>
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          Validate
                        </Button>
                      </>
                    )}
                    {canSendToStraTIME && period.status === 'VALIDATED' && !period.sentToStraTIME && (
                      <Button size="sm" variant="secondary" onClick={() => sendPeriodToStraTIME(period)}>
                        <Send className="mr-1 h-3.5 w-3.5" />
                        Send to Stratime
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};