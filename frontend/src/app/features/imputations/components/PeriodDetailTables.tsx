import React from 'react';
import { useNavigate } from 'react-router';
import { Badge } from '@/app/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { IMPUTATION_VALIDATION_LABELS, Imputation, ImputationPeriod, Ticket, User } from '@/app/types/entities';
import { validationColor, formatPeriodLabel } from '../model';
import { useAuth } from '@/app/context/AuthContext';
import { getBaseRouteForRole } from '@/app/context/roleRouting';
import { PeriodData } from '../hooks/useCalendarImputations';

interface PeriodDetailTablesProps {
  entries: Array<ImputationPeriod | { key: string; label: string }>;
  canValidate: boolean;
  periodData: (key: string) => PeriodData;
  periodImputations: (period: ImputationPeriod) => Imputation[];
  tickets: Ticket[];
  users: User[];
}

export const PeriodDetailTables: React.FC<PeriodDetailTablesProps> = ({
  entries,
  canValidate,
  periodData,
  periodImputations,
  tickets,
  users,
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const roleBasePath = currentUser ? getBaseRouteForRole(currentUser.role) : '';

  const ticketLabel = (id: string) => {
    const t = tickets.find((tk) => tk.id === id);
    return t ? `${t.ticketCode} - ${t.title}` : id;
  };

  const consultantName = (id: string) => users.find((u) => u.id === id)?.name ?? id;

  return (
    <>
      {entries.map((entry) => {
        const period = canValidate ? (entry as ImputationPeriod) : periodData((entry as { key: string }).key).period;
        const label = canValidate
          ? `${consultantName((entry as ImputationPeriod).consultantId)} - ${formatPeriodLabel(
              (entry as ImputationPeriod).periodKey
            )}`
          : (entry as { label: string }).label || formatPeriodLabel((entry as { key: string }).key);
        const periodRows = canValidate
          ? periodImputations(entry as ImputationPeriod)
          : periodData((entry as { key: string }).key).imputations;
        const totalHours = periodRows.reduce((sum: number, imp) => sum + imp.hours, 0);

        if (periodRows.length === 0) return null;

        return (
          <div
            key={canValidate ? (entry as ImputationPeriod).id : (entry as { key: string }).key}
            className="rounded-lg border bg-card"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{label}</h3>
                <Badge className={validationColor[period?.status || 'DRAFT'] + ' text-[10px]'}>
                  {IMPUTATION_VALIDATION_LABELS[(period?.status || 'DRAFT') as keyof typeof IMPUTATION_VALIDATION_LABELS]}
                </Badge>
                <span className="text-xs text-muted-foreground">({totalHours}h total)</span>
              </div>
            </div>
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="px-4">Date</TableHead>
                  <TableHead className="px-4">Ticket</TableHead>
                  <TableHead className="px-4">Module</TableHead>
                  <TableHead className="px-4">Hours</TableHead>
                  <TableHead className="px-4">Description</TableHead>
                  <TableHead className="px-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodRows
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((imp) => (
                    <TableRow key={imp.id}>
                      <TableCell className="px-4 py-2 text-sm font-mono">{imp.date}</TableCell>
                      <TableCell className="px-4 py-2 text-sm">
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => navigate(`${roleBasePath}/tickets/${imp.ticketId}`)}
                        >
                          {ticketLabel(imp.ticketId)}
                        </button>
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Badge variant="outline" className="text-[10px]">{imp.module}</Badge>
                      </TableCell>
                      <TableCell className="px-4 py-2 text-sm font-bold">{imp.hours}h</TableCell>
                      <TableCell className="px-4 py-2 text-sm text-muted-foreground max-w-[200px] truncate">{imp.description || '-'}</TableCell>
                      <TableCell className="px-4 py-2">
                        <Badge className={validationColor[imp.validationStatus] + ' text-[10px]'}>
                          {IMPUTATION_VALIDATION_LABELS[imp.validationStatus as keyof typeof IMPUTATION_VALIDATION_LABELS]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        );
      })}
    </>
  );
};
