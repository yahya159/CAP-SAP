import React from 'react';
import { Button } from '@/app/components/ui/button';
import { Ticket, TicketStatus, TICKET_STATUS_LABELS } from '@/app/types/entities';
import { STATUS_ORDER } from './ticketView.constants';

type TicketActionsMode = 'quick-complete' | 'status-transitions';

interface TicketActionsProps {
  mode: TicketActionsMode;
  ticket: Ticket;
  isViewOnly: boolean;
  onChangeStatus: (ticket: Ticket, newStatus: TicketStatus) => void;
}

export const TicketActions: React.FC<TicketActionsProps> = ({
  mode,
  ticket,
  isViewOnly,
  onChangeStatus,
}) => {
  if (isViewOnly || ticket.status === 'DONE' || ticket.status === 'REJECTED') {
    return null;
  }

  if (mode === 'quick-complete') {
    return (
      <Button size="sm" variant="outline" onClick={() => onChangeStatus(ticket, 'DONE')}>
        Done
      </Button>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {STATUS_ORDER.filter((status) => status !== ticket.status).map((status) => (
        <Button
          key={status}
          size="sm"
          variant="outline"
          onClick={() => onChangeStatus(ticket, status)}
        >
          {TICKET_STATUS_LABELS[status]}
        </Button>
      ))}
    </div>
  );
};
