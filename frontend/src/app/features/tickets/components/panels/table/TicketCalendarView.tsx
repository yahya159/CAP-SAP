import React from 'react';
import { Button } from '@/app/components/ui/button';
import { Ticket } from '@/app/types/entities';

interface CalendarDayCell {
  date: string;
  day: number;
  isCurrentMonth: boolean;
}

interface TicketCalendarViewProps {
  isViewOnly: boolean;
  ticketsByDate: Record<string, Ticket[]>;
  calendarDays: CalendarDayCell[];
  calendarMonth: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenTicketDetails: (ticketId: string) => void;
  onUpdateTicketDueDate: (ticketId: string, dueDate: string) => void;
}

export const TicketCalendarView: React.FC<TicketCalendarViewProps> = ({
  isViewOnly,
  ticketsByDate,
  calendarDays,
  calendarMonth,
  onPrevMonth,
  onNextMonth,
  onOpenTicketDetails,
  onUpdateTicketDueDate,
}) => {
  const onDragStart = (event: React.DragEvent, ticketId: string) => {
    event.dataTransfer.setData('text/plain', ticketId);
  };

  const onDragOver = (event: React.DragEvent) => event.preventDefault();

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
          <div key={day} className="bg-muted p-2 text-center text-xs font-semibold text-muted-foreground">
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
                  className={`mb-0.5 truncate rounded px-1 py-0.5 text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20 ${isViewOnly ? 'cursor-pointer' : 'cursor-grab'}`}
                >
                  {ticket.title}
                </div>
              ))}
              {dayTickets.length > 3 && (
                <div className="text-[10px] text-muted-foreground">+{dayTickets.length - 3} more</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
