import React from 'react';
import {
  SAP_MODULE_LABELS,
  Ticket,
  TICKET_COMPLEXITY_LABELS,
  USER_ROLE_LABELS,
} from '@/app/types/entities';

interface TicketDrawerDetailsGridProps {
  selectedTicket: Ticket;
  resolveProjectName: (projectId: string) => string;
  resolveUserName: (userId?: string) => string;
}

const getAssignedBy = (ticket: Ticket, resolveUserName: (userId?: string) => string): string => {
  if (!ticket.history || ticket.history.length === 0) return '-';
  const assignEvents = ticket.history.filter((event) => event.action === 'ASSIGNED');
  const assignEvent = assignEvents.length > 0 ? assignEvents[assignEvents.length - 1] : null;
  return assignEvent ? resolveUserName(assignEvent.userId) : '-';
};

export const TicketDrawerDetailsGrid: React.FC<TicketDrawerDetailsGridProps> = ({
  selectedTicket,
  resolveProjectName,
  resolveUserName,
}) => {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div><span className="text-muted-foreground">Ticket ID:</span> {selectedTicket.ticketCode}</div>
      <div><span className="text-muted-foreground">WRICEF:</span> {selectedTicket.wricefId ?? '-'}</div>
      <div><span className="text-muted-foreground">Module:</span> {selectedTicket.module ? SAP_MODULE_LABELS[selectedTicket.module] : '-'}</div>
      <div><span className="text-muted-foreground">Complexity:</span> {TICKET_COMPLEXITY_LABELS[selectedTicket.complexity]}</div>
      <div><span className="text-muted-foreground">Estimation:</span> {selectedTicket.estimationHours}h</div>
      <div><span className="text-muted-foreground">Actual Effort:</span> {selectedTicket.effortHours}h</div>
      <div><span className="text-muted-foreground">Project:</span> {resolveProjectName(selectedTicket.projectId)}</div>
      <div><span className="text-muted-foreground">Created by:</span> {resolveUserName(selectedTicket.createdBy)}</div>
      <div><span className="text-muted-foreground">Assigned to:</span> {resolveUserName(selectedTicket.assignedTo)}</div>
      <div><span className="text-muted-foreground">Assigned by:</span> {getAssignedBy(selectedTicket, resolveUserName)}</div>
      <div><span className="text-muted-foreground">Assigned Role:</span> {selectedTicket.assignedToRole ? USER_ROLE_LABELS[selectedTicket.assignedToRole] : '-'}</div>
      <div><span className="text-muted-foreground">Due:</span> {selectedTicket.dueDate ?? '-'}</div>
      {selectedTicket.effortComment && (
        <div className="col-span-2">
          <span className="text-muted-foreground">Effort Note:</span> {selectedTicket.effortComment}
        </div>
      )}
      {selectedTicket.estimationHours > 0 && selectedTicket.effortHours > 0 && (
        <div className="col-span-2">
          <span className="text-muted-foreground">Est. vs Actual:</span>{' '}
          <span className={selectedTicket.effortHours > selectedTicket.estimationHours ? 'text-red-600 dark:text-red-400 font-medium' : 'text-emerald-600 dark:text-emerald-400 font-medium'}>
            {((selectedTicket.effortHours / selectedTicket.estimationHours) * 100).toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
};
