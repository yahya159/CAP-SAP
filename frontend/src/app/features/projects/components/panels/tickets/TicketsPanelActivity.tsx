import React from 'react';
import { Ticket } from '@/app/types/entities';

interface TicketsPanelActivityProps {
  selectedTicket: Ticket | null;
  selectedTicketHistory: Ticket['history'];
  formatTicketEventTime: (value: string) => string;
  renderTicketEvent: (event: Ticket['history'][number]) => React.ReactNode;
  resolveUserName: (userId?: string) => string;
}

export const TicketsPanelActivity: React.FC<TicketsPanelActivityProps> = ({
  selectedTicket,
  selectedTicketHistory,
  formatTicketEventTime,
  renderTicketEvent,
  resolveUserName,
}) => {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-foreground">Fil d'actualite</h4>
        {selectedTicket ? (
          <p className="text-xs text-muted-foreground mt-1">
            {selectedTicket.ticketCode} - {selectedTicket.title}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">Select a ticket to view activity.</p>
        )}
      </div>
      {selectedTicket && selectedTicketHistory.length > 0 && (
        <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
          {selectedTicketHistory.map((event) => (
            <div key={event.id} className="rounded-md border-l-2 border-primary/30 bg-muted/20 px-3 py-2 text-xs">
              <div className="text-[11px] text-muted-foreground">{formatTicketEventTime(event.timestamp)}</div>
              <div className="mt-1">
                <span className="font-medium">{resolveUserName(event.userId)}</span> {renderTicketEvent(event)}
              </div>
              {event.comment && event.action !== 'COMMENT' && event.action !== 'SENT_TO_TEST' && (
                <div className="mt-1 text-[11px] text-muted-foreground">{event.comment}</div>
              )}
            </div>
          ))}
        </div>
      )}
      {selectedTicket && selectedTicketHistory.length === 0 && (
        <p className="text-xs text-muted-foreground">No activity found for this ticket.</p>
      )}
    </div>
  );
};
