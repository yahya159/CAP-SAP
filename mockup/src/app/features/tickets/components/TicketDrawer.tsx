import React from 'react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { TicketDocumentationSection } from '@/app/components/business/TicketDocumentationSection';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  Ticket,
  TicketStatus,
  TICKET_COMPLEXITY_LABELS,
  TICKET_NATURE_LABELS,
  TICKET_STATUS_LABELS,
} from '@/app/types/entities';
import { TicketActions } from './TicketActions';
import { TicketDrawerDetailsGrid } from './dialogs/TicketDrawerDetailsGrid';
import { TicketDrawerHistory } from './dialogs/TicketDrawerHistory';
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
                <Badge className={statusColor[selectedTicket.status]}>{TICKET_STATUS_LABELS[selectedTicket.status]}</Badge>
                <Badge className={priorityColor[selectedTicket.priority]}>{selectedTicket.priority}</Badge>
                <Badge variant="outline">{TICKET_NATURE_LABELS[selectedTicket.nature]}</Badge>
                <Badge variant="outline">{selectedTicket.module ?? '-'}</Badge>
                <Badge variant="outline" className={selectedTicket.complexity === 'TRES_COMPLEXE' ? 'border-red-300 text-red-700 dark:text-red-400' : ''}>
                  {TICKET_COMPLEXITY_LABELS[selectedTicket.complexity]}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">{selectedTicket.description}</div>
              <TicketDrawerDetailsGrid
                selectedTicket={selectedTicket}
                resolveProjectName={resolveProjectName}
                resolveUserName={resolveUserName}
              />
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
              <TicketDrawerHistory ticket={selectedTicket} resolveUserName={resolveUserName} />
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
