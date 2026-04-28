import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/app/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { Ticket, TICKET_STATUS_LABELS } from '@/app/types/entities';

interface WricefObjectTicketsTableProps {
  ticketRows: Ticket[];
  wricefStatusColor: Record<Ticket['status'], string>;
  wricefPriorityColor: Record<string, string>;
  onOpenTicketDetails: (ticketId: string) => void;
}

export const WricefObjectTicketsTable: React.FC<WricefObjectTicketsTableProps> = ({
  ticketRows,
  wricefStatusColor,
  wricefPriorityColor,
  onOpenTicketDetails,
}) => {
  const { t } = useTranslation();
  if (ticketRows.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">{t('pm.dashboard.recentTickets.noTickets')}</p>;
  }

  return (
    <div className="rounded-md border border-border/70 overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="px-3 text-xs">{t('projects.details.tables.wricefTickets.ticketId')}</TableHead>
            <TableHead className="px-3 text-xs">{t('common.name')}</TableHead>
            <TableHead className="px-3 text-xs">{t('common.status')}</TableHead>
            <TableHead className="px-3 text-xs">{t('projects.table.priority')}</TableHead>
            <TableHead className="px-3 text-xs">{t('projects.details.tables.wricefTickets.liveTicket')}</TableHead>
            <TableHead className="px-3 text-xs">{t('tickets.details.estimation')}</TableHead>
            <TableHead className="px-3 text-xs">{t('tickets.details.effort')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ticketRows.map((ticket) => (
            <TableRow key={ticket.id} className="hover:bg-muted/30">
              <TableCell className="px-3 py-2 text-xs font-mono">{ticket.ticketCode}</TableCell>
              <TableCell className="px-3 py-2 text-sm">{ticket.title}</TableCell>
              <TableCell className="px-3 py-2">
                {ticket.status ? (
                  <Badge className={`text-[10px] ${wricefStatusColor[ticket.status]}`}>
                    {TICKET_STATUS_LABELS[ticket.status]}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">N/A</span>
                )}
              </TableCell>
              <TableCell className="px-3 py-2">
                {ticket.priority ? (
                  <Badge className={`text-[10px] ${wricefPriorityColor[ticket.priority]}`}>{ticket.priority}</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">N/A</span>
                )}
              </TableCell>
              <TableCell className="px-3 py-2 text-sm">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenTicketDetails(ticket.id);
                  }}
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {ticket.ticketCode || 'View'}
                </button>
              </TableCell>
              <TableCell className="px-3 py-2 text-sm text-muted-foreground">{ticket.estimationHours}h</TableCell>
              <TableCell className="px-3 py-2 text-sm">
                <span className={ticket.effortHours > ticket.estimationHours ? 'font-medium text-red-600 dark:text-red-400' : undefined}>
                  {ticket.effortHours}h
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
