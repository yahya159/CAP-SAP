import React from 'react';
import { Plus, Ticket as TicketIcon } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { EmptyState } from '../../../components/common/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import {
  SAP_MODULE_LABELS,
  Ticket,
  TicketStatus,
  TICKET_COMPLEXITY_LABELS,
  TICKET_NATURE_LABELS,
  TICKET_STATUS_LABELS,
  USER_ROLE_LABELS,
} from '../../../types/entities';
import { ViewMode } from './types';
import { TicketActions } from './TicketActions';
import { priorityColor, STATUS_ORDER, statusColor } from './ticketView.constants';

interface CalendarDayCell {
  date: string;
  day: number;
  isCurrentMonth: boolean;
}

interface TicketTableProps {
  loading: boolean;
  viewMode: ViewMode;
  isViewOnly: boolean;
  tickets: Ticket[];
  filteredTickets: Ticket[];
  ticketsByDate: Record<string, Ticket[]>;
  calendarDays: CalendarDayCell[];
  calendarMonth: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenTicketDetails: (ticketId: string) => void;
  onCreateTicket: () => void;
  onChangeStatus: (ticket: Ticket, newStatus: TicketStatus) => void;
  onUpdateTicketDueDate: (ticketId: string, dueDate: string) => void;
  resolveProjectName: (projectId: string) => string;
  resolveUserName: (userId?: string) => string;
}

export const TicketTable: React.FC<TicketTableProps> = ({
  loading,
  viewMode,
  isViewOnly,
  tickets,
  filteredTickets,
  ticketsByDate,
  calendarDays,
  calendarMonth,
  onPrevMonth,
  onNextMonth,
  onOpenTicketDetails,
  onCreateTicket,
  onChangeStatus,
  onUpdateTicketDueDate,
  resolveProjectName,
  resolveUserName,
}) => {
  const onDragStart = (event: React.DragEvent, ticketId: string) => {
    event.dataTransfer.setData('text/plain', ticketId);
  };

  const onDropToStatus = (event: React.DragEvent, targetStatus: TicketStatus) => {
    event.preventDefault();
    const ticketId = event.dataTransfer.getData('text/plain');
    const ticket = tickets.find((item) => item.id === ticketId);
    if (ticket && ticket.status !== targetStatus) {
      onChangeStatus(ticket, targetStatus);
    }
  };

  const onDragOver = (event: React.DragEvent) => event.preventDefault();

  if (loading) {
    return <p className="text-muted-foreground">Loading tickets...</p>;
  }

  if (viewMode === 'list') {
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
              <TableHead className="px-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.map((ticket) => (
              <TableRow
                key={ticket.id}
                className="cursor-pointer hover:bg-accent/40"
                onClick={() => onOpenTicketDetails(ticket.id)}
              >
                <TableCell className="px-4 py-3 text-xs font-mono text-muted-foreground">
                  {ticket.ticketCode}
                </TableCell>
                <TableCell className="px-4 py-3 font-medium max-w-[200px] truncate">
                  {ticket.title}
                </TableCell>
                <TableCell className="px-4 py-3 text-xs font-mono">{ticket.wricefId}</TableCell>
                <TableCell className="px-4 py-3">
                  <Badge variant="outline" className="text-[10px]">
                    {ticket.module}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      ticket.complexity === 'TRES_COMPLEXE'
                        ? 'border-red-300 text-red-700 dark:text-red-400'
                        : ticket.complexity === 'COMPLEXE'
                          ? 'border-orange-300 text-orange-700 dark:text-orange-400'
                          : ''
                    }`}
                  >
                    {TICKET_COMPLEXITY_LABELS[ticket.complexity]}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Badge variant="outline">{TICKET_NATURE_LABELS[ticket.nature]}</Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                  {resolveProjectName(ticket.projectId)}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Badge className={statusColor[ticket.status]}>
                    {TICKET_STATUS_LABELS[ticket.status]}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Badge className={priorityColor[ticket.priority]}>{ticket.priority}</Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-sm">{ticket.estimationHours}h</TableCell>
                <TableCell className="px-4 py-3 text-sm">{ticket.effortHours}h</TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  {ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  <div>{resolveUserName(ticket.assignedTo)}</div>
                  {ticket.assignedToRole && (
                    <span className="block text-xs text-muted-foreground">
                      {USER_ROLE_LABELS[ticket.assignedToRole]}
                    </span>
                  )}
                  {(() => {
                    if (!ticket.history || ticket.history.length === 0) return null;
                    const assignEvents = ticket.history.filter(e => e.action === 'ASSIGNED');
                    const assignEvent = assignEvents.length > 0 ? assignEvents[assignEvents.length - 1] : null;
                    if (!assignEvent) return null;
                    return (
                      <span className="block text-[10px] text-muted-foreground border-t border-border/50 pt-0.5 mt-0.5">
                        by: {resolveUserName(assignEvent.userId)}
                      </span>
                    );
                  })()}
                </TableCell>
                <TableCell className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                  <TicketActions
                    mode="quick-complete"
                    ticket={ticket}
                    isViewOnly={isViewOnly}
                    onChangeStatus={onChangeStatus}
                  />
                </TableCell>
              </TableRow>
            ))}
            {filteredTickets.length === 0 && (
              <TableRow>
                <TableCell colSpan={14} className="h-64 text-center">
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
  }

  if (viewMode === 'calendar') {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <Button size="sm" variant="outline" onClick={onPrevMonth}>
            Prev
          </Button>
          <h3 className="text-lg font-semibold">{calendarMonth}</h3>
          <Button size="sm" variant="outline" onClick={onNextMonth}>
            Next
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-px bg-border rounded overflow-hidden">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div
              key={day}
              className="bg-muted p-2 text-center text-xs font-semibold text-muted-foreground"
            >
              {day}
            </div>
          ))}
          {calendarDays.map((cell) => {
            const dayTickets = ticketsByDate[cell.date] || [];
            return (
              <div
                key={cell.date}
                onDragOver={onDragOver}
                onDrop={(event) => {
                  event.preventDefault();
                  const ticketId = event.dataTransfer.getData('text/plain');
                  onUpdateTicketDueDate(ticketId, cell.date);
                }}
                className={`min-h-[80px] bg-card p-1.5 ${!cell.isCurrentMonth ? 'opacity-40' : ''}`}
              >
                <div className="text-xs font-medium text-muted-foreground mb-1">{cell.day}</div>
                {dayTickets.slice(0, 3).map((ticket) => (
                  <div
                    key={ticket.id}
                    draggable={!isViewOnly}
                    onDragStart={(event) => !isViewOnly && onDragStart(event, ticket.id)}
                    onClick={() => onOpenTicketDetails(ticket.id)}
                    className={`mb-0.5 truncate rounded px-1 py-0.5 text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20 ${
                      isViewOnly ? 'cursor-pointer' : 'cursor-grab'
                    }`}
                  >
                    {ticket.title}
                  </div>
                ))}
                {dayTickets.length > 3 && (
                  <div className="text-[10px] text-muted-foreground">
                    +{dayTickets.length - 3} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {STATUS_ORDER.map((status) => {
        const columnTickets = filteredTickets.filter((ticket) => ticket.status === status);
        return (
          <div
            key={status}
            className="min-w-[240px] flex-1 rounded-lg border bg-muted/30 p-3"
            onDragOver={isViewOnly ? undefined : onDragOver}
            onDrop={isViewOnly ? undefined : (event) => onDropToStatus(event, status)}
          >
            <div className="mb-3 flex items-center justify-between">
              <Badge className={statusColor[status]}>{status.replace('_', ' ')}</Badge>
              <span className="text-xs text-muted-foreground">{columnTickets.length}</span>
            </div>
            <div className="space-y-2">
              {columnTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  draggable={!isViewOnly}
                  onDragStart={(event) => !isViewOnly && onDragStart(event, ticket.id)}
                  onClick={() => onOpenTicketDetails(ticket.id)}
                  className={`rounded-lg border bg-card p-3 shadow-sm hover:shadow transition ${
                    isViewOnly ? 'cursor-pointer' : 'cursor-grab'
                  }`}
                >
                  <p className="text-sm font-medium text-foreground">{ticket.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {ticket.description}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge className={`${priorityColor[ticket.priority]} text-[10px]`}>
                      {ticket.priority}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {resolveUserName(ticket.assignedTo)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
