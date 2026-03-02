import React from 'react';
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
  TICKET_COMPLEXITY_LABELS,
  TICKET_NATURE_LABELS,
  TICKET_STATUS_LABELS,
  USER_ROLE_LABELS,
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
  return (
    <div className="rounded-lg border bg-card overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="px-4">Code</TableHead>
            <TableHead className="px-4">Title</TableHead>
            <TableHead className="px-4">WRICEF</TableHead>
            <TableHead className="px-4">Module</TableHead>
            <TableHead className="px-4">Complexity</TableHead>
            <TableHead className="px-4">Nature</TableHead>
            <TableHead className="px-4">Project</TableHead>
            <TableHead className="px-4">Status</TableHead>
            <TableHead className="px-4">Priority</TableHead>
            <TableHead className="px-4">Est.</TableHead>
            <TableHead className="px-4">Actual</TableHead>
            <TableHead className="px-4">Due</TableHead>
            <TableHead className="px-4">Assigned</TableHead>
            <TableHead className="px-4">Indicators</TableHead>
            <TableHead className="px-4">Actions</TableHead>
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
                  <Badge variant="outline" className="text-[10px]">{ticket.module ?? '-'}</Badge>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Badge variant="outline" className={`text-[10px] ${ticket.complexity === 'TRES_COMPLEXE' ? 'border-red-300 text-red-700 dark:text-red-400' : ticket.complexity === 'COMPLEXE' ? 'border-orange-300 text-orange-700 dark:text-orange-400' : ''}`}>
                    {TICKET_COMPLEXITY_LABELS[ticket.complexity]}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3"><Badge variant="outline">{TICKET_NATURE_LABELS[ticket.nature]}</Badge></TableCell>
                <TableCell className="px-4 py-3 text-sm text-muted-foreground">{resolveProjectName(ticket.projectId)}</TableCell>
                <TableCell className="px-4 py-3"><Badge className={statusColor[ticket.status]}>{TICKET_STATUS_LABELS[ticket.status]}</Badge></TableCell>
                <TableCell className="px-4 py-3"><Badge className={priorityColor[ticket.priority]}>{ticket.priority}</Badge></TableCell>
                <TableCell className="px-4 py-3 text-sm">{ticket.estimationHours}h</TableCell>
                <TableCell className="px-4 py-3 text-sm">{ticket.effortHours}h</TableCell>
                <TableCell className="px-4 py-3 text-sm">{ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : '-'}</TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  <div>{resolveUserName(ticket.assignedTo)}</div>
                  {ticket.assignedToRole && <span className="block text-xs text-muted-foreground">{USER_ROLE_LABELS[ticket.assignedToRole]}</span>}
                  {assignedBy && <span className="block text-[10px] text-muted-foreground border-t border-border/50 pt-0.5 mt-0.5">by: {assignedBy}</span>}
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
                  title="No tickets found"
                  description="There are no tickets matching your current filters. Try adjusting your search or create a new ticket."
                  action={
                    <Button onClick={onCreateTicket} variant="outline" className="mt-2">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Ticket
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
