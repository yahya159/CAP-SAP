import React from 'react';
import { Badge } from '@/app/components/ui/badge';
import { Ticket } from '@/app/types/entities';

interface TicketDrawerHistoryProps {
  ticket: Ticket;
  resolveUserName: (userId?: string) => string;
}

export const TicketDrawerHistory: React.FC<TicketDrawerHistoryProps> = ({
  ticket,
  resolveUserName,
}) => {
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-2">History</h4>
      <div className="space-y-2">
        {(ticket.history || []).map((event) => (
          <div key={event.id} className="flex gap-3 text-xs border-l-2 border-primary/30 pl-3 py-1">
            <span className="text-muted-foreground whitespace-nowrap">
              {new Date(event.timestamp).toLocaleString()}
            </span>
            <div>
              <span className="font-medium">{resolveUserName(event.userId)}</span>
              {event.action === 'CREATED' && ' created this ticket'}
              {event.action === 'STATUS_CHANGE' && (
                <>
                  {' '}changed status from{' '}
                  <Badge variant="outline" className="text-[10px] mx-0.5">{event.fromValue}</Badge>{' '}
                  to <Badge variant="outline" className="text-[10px] mx-0.5">{event.toValue}</Badge>
                </>
              )}
              {event.action === 'ASSIGNED' && ` assigned to ${resolveUserName(event.toValue)}`}
              {event.action === 'COMMENT' && `: ${event.comment}`}
              {event.comment && event.action !== 'COMMENT' && (
                <span className="block text-muted-foreground mt-0.5">{event.comment}</span>
              )}
            </div>
          </div>
        ))}
        {(!ticket.history || ticket.history.length === 0) && (
          <p className="text-xs text-muted-foreground">No history available.</p>
        )}
      </div>
    </div>
  );
};
