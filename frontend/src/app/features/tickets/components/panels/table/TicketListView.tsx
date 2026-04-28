import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertOctagon, MessageSquare, Plus, Ticket as TicketIcon } from 'lucide-react';
import { EmptyState } from '@/app/components/common/EmptyState';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import {
  Ticket,
  TicketStatus,
} from '@/app/types/entities';
import { TicketActions } from '../../TicketActions';
import { priorityColor, statusColor } from '../../ticketView.constants';

interface TicketListViewProps {
  isViewOnly: boolean;
  filteredTickets: Ticket[];
  onOpenTicketDetails: (ticketId: string) => void;
  onCreateTicket: () => void;
  onChangeStatus: (ticket: Ticket, newStatus: TicketStatus) => void;
  resolveProjectName: (projectId: string) => string;
  resolveUserName: (userId?: string) => string;
}

const getAssignedBy = (ticket: Ticket, resolveUserName: (userId?: string) => string): string | null => {
  if (!ticket.history || ticket.history.length === 0) return null;
  const assignEvents = ticket.history.filter((event) => event.action === 'ASSIGNED');
  const assignEvent = assignEvents.length > 0 ? assignEvents[assignEvents.length - 1] : null;
  return assignEvent ? resolveUserName(assignEvent.userId) : null;
};

export const TicketListView: React.FC<TicketListViewProps> = ({
  isViewOnly,
  filteredTickets,
  onOpenTicketDetails,
  onCreateTicket,
  onChangeStatus,
  resolveProjectName,
  resolveUserName,
}) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border bg-card overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="px-4">{t('tickets.list.table.code')}</TableHead>
            <TableHead className="px-4">{t('tickets.list.table.title')}</TableHead>
            <TableHead className="px-4">{t('tickets.list.table.wricef')}</TableHead>
            <TableHead className="px-4">{t('tickets.list.table.module')}</TableHead>
            <TableHead className="px-4">{t('tickets.list.table.complexity')}</TableHead>
            <TableHead className="px-4">{t('tickets.list.table.nature')}</TableHead>
            <TableHead className="px-4">{t('tickets.list.table.project')}</TableHead>
            <TableHead className="px-4">{t('tickets.list.table.status')}</TableHead>
            <TableHead className="px-4">{t('tickets.list.table.priority')}</TableHead>
            <TableHead className="px-4">{t('tickets.list.table.estimation')}</TableHead>
            <TableHead className="px-4">{t('tickets.list.table.actual')}</TableHead>
            <TableHead className="px-4">{t('tickets.list.table.due')}</TableHead>
            <TableHead className="px-4">{t('tickets.list.table.assigned')}</TableHead>
            <TableHead className="px-4">{t('tickets.list.table.indicators')}</TableHead>
            <TableHead className="px-4">{t('tickets.list.table.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTickets.map((ticket) => {
            const assignedBy = getAssignedBy(ticket, resolveUserName);
            return (
              <TableRow key={ticket.id} className="cursor-pointer hover:bg-accent/40" onClick={() => onOpenTicketDetails(ticket.id)}>
                <TableCell className="px-4 py-3 text-xs font-mono text-muted-foreground">{ticket.ticketCode}</TableCell>
                <TableCell className="px-4 py-3 font-medium max-w-[200px] truncate">{ticket.title}</TableCell>
                <TableCell className="px-4 py-3 text-xs font-mono">{ticket.wricefId ?? '-'}</TableCell>
                <TableCell className="px-4 py-3">
                  <Badge variant="outline" className="text-[10px]">{ticket.module ? t(`entities.sapModule.${ticket.module}`) : '-'}</Badge>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Badge variant="outline" className={`text-[10px] ${ticket.complexity === 'TRES_COMPLEXE' ? 'border-red-300 text-red-700 dark:text-red-400' : ticket.complexity === 'COMPLEXE' ? 'border-orange-300 text-orange-700 dark:text-orange-400' : ''}`}>
                    {t(`entities.ticketComplexity.${ticket.complexity}`)}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3"><Badge variant="outline">{t(`entities.ticketNature.${ticket.nature}`)}</Badge></TableCell>
                <TableCell className="px-4 py-3 text-sm text-muted-foreground">{resolveProjectName(ticket.projectId)}</TableCell>
                <TableCell className="px-4 py-3"><Badge className={statusColor[ticket.status]}>{t(`entities.ticketStatus.${ticket.status}`)}</Badge></TableCell>
                <TableCell className="px-4 py-3"><Badge className={priorityColor[ticket.priority]}>{t(`tickets.priority.${ticket.priority}`)}</Badge></TableCell>
                <TableCell className="px-4 py-3 text-sm">{ticket.estimationHours}h</TableCell>
                <TableCell className="px-4 py-3 text-sm">{ticket.effortHours}h</TableCell>
                <TableCell className="px-4 py-3 text-sm">{ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : '-'}</TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  <div>{resolveUserName(ticket.assignedTo)}</div>
                  {ticket.assignedToRole && <span className="block text-xs text-muted-foreground">{t(`roles.${ticket.assignedToRole}`)}</span>}
                  {assignedBy && <span className="block text-[10px] text-muted-foreground border-t border-border/50 pt-0.5 mt-0.5">{t('tickets.details.assignedBy')}: {assignedBy}</span>}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {(ticket.commentCount ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground" title={`${ticket.commentCount} comment(s)`}>
                        <MessageSquare className="h-3.5 w-3.5" />
                        {ticket.commentCount}
                      </span>
                    )}
                    {ticket.hasUnresolvedBlockers && (
                      <span className="inline-flex items-center text-destructive" title="Has unresolved blockers">
                        <AlertOctagon className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                  <TicketActions mode="quick-complete" ticket={ticket} isViewOnly={isViewOnly} onChangeStatus={onChangeStatus} />
                </TableCell>
              </TableRow>
            );
          })}
          {filteredTickets.length === 0 && (
            <TableRow>
              <TableCell colSpan={15} className="h-64 text-center">
                <EmptyState
                  icon={TicketIcon}
                  title={t('tickets.list.empty.title')}
                  description={t('tickets.list.empty.description')}
                  action={
                    <Button onClick={onCreateTicket} variant="outline" className="mt-2">
                      <Plus className="mr-2 h-4 w-4" />
                      {t('tickets.list.empty.createTicket')}
                    </Button>
                  }
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
