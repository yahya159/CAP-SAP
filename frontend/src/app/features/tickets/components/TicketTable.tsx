import React from 'react';
import { Ticket, TicketStatus } from '@/app/types/entities';
import { TicketCalendarView } from './panels/table/TicketCalendarView';
import { TicketKanbanView } from './panels/table/TicketKanbanView';
import { TicketListView } from './panels/table/TicketListView';
import { ViewMode } from './types';

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
  if (loading) return <p className="text-muted-foreground">Loading tickets...</p>;

  if (viewMode === 'list') {
    return (
      <TicketListView
        isViewOnly={isViewOnly}
        filteredTickets={filteredTickets}
        onOpenTicketDetails={onOpenTicketDetails}
        onCreateTicket={onCreateTicket}
        onChangeStatus={onChangeStatus}
        resolveProjectName={resolveProjectName}
        resolveUserName={resolveUserName}
      />
    );
  }

  if (viewMode === 'calendar') {
    return (
      <TicketCalendarView
        isViewOnly={isViewOnly}
        ticketsByDate={ticketsByDate}
        calendarDays={calendarDays}
        calendarMonth={calendarMonth}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onOpenTicketDetails={onOpenTicketDetails}
        onUpdateTicketDueDate={onUpdateTicketDueDate}
      />
    );
  }

  return (
    <TicketKanbanView
      isViewOnly={isViewOnly}
      filteredTickets={filteredTickets}
      onOpenTicketDetails={onOpenTicketDetails}
      onChangeStatus={onChangeStatus}
      resolveUserName={resolveUserName}
    />
  );
};
