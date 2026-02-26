import React from 'react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { TicketDocumentationSection } from '../../../components/business/TicketDocumentationSection';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import {
  SAP_MODULE_LABELS,
  Ticket,
  TicketStatus,
  TICKET_COMPLEXITY_LABELS,
  TICKET_NATURE_LABELS,
  TICKET_STATUS_LABELS,
  USER_ROLE_LABELS,
} from '../../../types/entities';
import { TicketActions } from './TicketActions';
import { priorityColor, statusColor } from './ticketView.constants';

interface TicketDrawerProps {
  currentUserId?: string;
  selectedTicket: Ticket | null;
  isViewOnly: boolean;
  onOpenChange: (open: boolean) => void;
  onChangeStatus: (ticket: Ticket, newStatus: TicketStatus) => void;
  resolveProjectName: (projectId: string) => string;
  resolveUserName: (userId?: string) => string;
  onDocumentationChanged: (ticketId: string, documentationIds: string[]) => void;
}

export const TicketDrawer: React.FC<TicketDrawerProps> = ({
  currentUserId,
  selectedTicket,
  isViewOnly,
  onOpenChange,
  onChangeStatus,
  resolveProjectName,
  resolveUserName,
  onDocumentationChanged,
}) => {
  return (
    <Dialog open={Boolean(selectedTicket)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        {selectedTicket && (
          <>
            <DialogHeader>
              <DialogTitle>
                {selectedTicket.ticketCode} - {selectedTicket.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={statusColor[selectedTicket.status]}>
                  {TICKET_STATUS_LABELS[selectedTicket.status]}
                </Badge>
                <Badge className={priorityColor[selectedTicket.priority]}>
                  {selectedTicket.priority}
                </Badge>
                <Badge variant="outline">{TICKET_NATURE_LABELS[selectedTicket.nature]}</Badge>
                <Badge variant="outline">{selectedTicket.module}</Badge>
                <Badge
                  variant="outline"
                  className={
                    selectedTicket.complexity === 'TRES_COMPLEXE'
                      ? 'border-red-300 text-red-700 dark:text-red-400'
                      : ''
                  }
                >
                  {TICKET_COMPLEXITY_LABELS[selectedTicket.complexity]}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">{selectedTicket.description}</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Ticket ID:</span>{' '}
                  {selectedTicket.ticketCode}
                </div>
                <div>
                  <span className="text-muted-foreground">WRICEF:</span>{' '}
                  {selectedTicket.wricefId}
                </div>
                <div>
                  <span className="text-muted-foreground">Module:</span>{' '}
                  {SAP_MODULE_LABELS[selectedTicket.module]}
                </div>
                <div>
                  <span className="text-muted-foreground">Complexity:</span>{' '}
                  {TICKET_COMPLEXITY_LABELS[selectedTicket.complexity]}
                </div>
                <div>
                  <span className="text-muted-foreground">Estimation:</span>{' '}
                  {selectedTicket.estimationHours}h
                </div>
                <div>
                  <span className="text-muted-foreground">Actual Effort:</span>{' '}
                  {selectedTicket.effortHours}h
                </div>
                <div>
                  <span className="text-muted-foreground">Project:</span>{' '}
                  {resolveProjectName(selectedTicket.projectId)}
                </div>
                <div>
                  <span className="text-muted-foreground">Created by:</span>{' '}
                  {resolveUserName(selectedTicket.createdBy)}
                </div>
                <div>
                  <span className="text-muted-foreground">Assigned to:</span>{' '}
                  {resolveUserName(selectedTicket.assignedTo)}
                </div>
                <div>
                  <span className="text-muted-foreground">Assigned by:</span>{' '}
                  {(() => {
                    if (!selectedTicket.history || selectedTicket.history.length === 0) return '-';
                    const assignEvents = selectedTicket.history.filter(e => e.action === 'ASSIGNED');
                    const assignEvent = assignEvents.length > 0 ? assignEvents[assignEvents.length - 1] : null;
                    return assignEvent ? resolveUserName(assignEvent.userId) : '-';
                  })()}
                </div>
                <div>
                  <span className="text-muted-foreground">Assigned Role:</span>{' '}
                  {selectedTicket.assignedToRole
                    ? USER_ROLE_LABELS[selectedTicket.assignedToRole]
                    : '-'}
                </div>
                <div>
                  <span className="text-muted-foreground">Due:</span>{' '}
                  {selectedTicket.dueDate ?? '-'}
                </div>
                {selectedTicket.effortComment && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Effort Note:</span>{' '}
                    {selectedTicket.effortComment}
                  </div>
                )}
                {selectedTicket.estimationHours > 0 && selectedTicket.effortHours > 0 && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Est. vs Actual:</span>{' '}
                    <span
                      className={
                        selectedTicket.effortHours > selectedTicket.estimationHours
                          ? 'text-red-600 dark:text-red-400 font-medium'
                          : 'text-emerald-600 dark:text-emerald-400 font-medium'
                      }
                    >
                      {(
                        (selectedTicket.effortHours / selectedTicket.estimationHours) *
                        100
                      ).toFixed(0)}
                      %
                    </span>
                  </div>
                )}
              </div>

              <TicketDocumentationSection
                ticket={selectedTicket}
                currentUserId={currentUserId}
                canEdit={!isViewOnly}
                resolveUserName={resolveUserName}
                onDocumentationChanged={onDocumentationChanged}
              />

              {!isViewOnly && (
                <TicketActions
                  mode="status-transitions"
                  ticket={selectedTicket}
                  isViewOnly={isViewOnly}
                  onChangeStatus={onChangeStatus}
                />
              )}

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">History</h4>
                <div className="space-y-2">
                  {(selectedTicket.history || []).map((event) => (
                    <div
                      key={event.id}
                      className="flex gap-3 text-xs border-l-2 border-primary/30 pl-3 py-1"
                    >
                      <span className="text-muted-foreground whitespace-nowrap">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                      <div>
                        <span className="font-medium">{resolveUserName(event.userId)}</span>
                        {event.action === 'CREATED' && ' created this ticket'}
                        {event.action === 'STATUS_CHANGE' && (
                          <>
                            {' '}
                            changed status from{' '}
                            <Badge variant="outline" className="text-[10px] mx-0.5">
                              {event.fromValue}
                            </Badge>{' '}
                            to{' '}
                            <Badge variant="outline" className="text-[10px] mx-0.5">
                              {event.toValue}
                            </Badge>
                          </>
                        )}
                        {event.action === 'ASSIGNED' && ` assigned to ${resolveUserName(event.toValue)}`}
                        {event.action === 'COMMENT' && `: ${event.comment}`}
                        {event.comment && event.action !== 'COMMENT' && (
                          <span className="block text-muted-foreground mt-0.5">
                            {event.comment}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!selectedTicket.history || selectedTicket.history.length === 0) && (
                    <p className="text-xs text-muted-foreground">No history available.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
