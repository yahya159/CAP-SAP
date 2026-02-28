import React from 'react';
import { Ticket, TicketStatus } from '@/app/types/entities';
import { TicketsPanelActivity } from './tickets/TicketsPanelActivity';
import { TicketsPanelTable } from './tickets/TicketsPanelTable';
import { TicketsPanelToolbar } from './tickets/TicketsPanelToolbar';

export interface TicketsPanelViewModel {
  tickets: Ticket[];
  paginatedTickets: Ticket[];
  filteredTickets: Ticket[];
  ticketsSearch: string;
  ticketsStatusFilter: TicketStatus | '';
  ticketsPage: number;
  ticketsPageSize: number;
  ticketsTotalPages: number;
  selectedTicketId: string;
  selectedTicket: Ticket | null;
  selectedTicketHistory: Ticket['history'];
  wricefStatusColor: Record<TicketStatus, string>;
  wricefPriorityColor: Record<string, string>;
  onTicketsSearchChange: (value: string) => void;
  onTicketsStatusFilterChange: (value: TicketStatus | '') => void;
  onTicketsPageChange: (value: number) => void;
  onTicketsPageSizeChange: (value: number) => void;
  onSelectTicket: (ticketId: string) => void;
  onOpenTicketDetails: (ticketId: string) => void;
  onOpenCreateTicket: () => void;
  formatTicketEventTime: (value: string) => string;
  renderTicketEvent: (event: Ticket['history'][number]) => React.ReactNode;
  resolveUserName: (userId?: string) => string;
}

interface TicketsPanelProps {
  active: boolean;
  vm: TicketsPanelViewModel;
}

export const TicketsPanel: React.FC<TicketsPanelProps> = ({ active, vm }) => {
  if (!active) return null;

  return (
    <section
      id="project-panel-tickets"
      role="tabpanel"
      tabIndex={0}
      aria-labelledby="project-tab-tickets"
      className="space-y-4"
    >
      <TicketsPanelToolbar
        ticketsSearch={vm.ticketsSearch}
        ticketsStatusFilter={vm.ticketsStatusFilter}
        onTicketsSearchChange={vm.onTicketsSearchChange}
        onTicketsStatusFilterChange={vm.onTicketsStatusFilterChange}
        onTicketsPageChange={vm.onTicketsPageChange}
        onOpenCreateTicket={vm.onOpenCreateTicket}
      />
      <TicketsPanelTable
        tickets={vm.tickets}
        paginatedTickets={vm.paginatedTickets}
        filteredTickets={vm.filteredTickets}
        selectedTicketId={vm.selectedTicketId}
        ticketsPage={vm.ticketsPage}
        ticketsPageSize={vm.ticketsPageSize}
        ticketsTotalPages={vm.ticketsTotalPages}
        wricefStatusColor={vm.wricefStatusColor}
        wricefPriorityColor={vm.wricefPriorityColor}
        onSelectTicket={vm.onSelectTicket}
        onOpenTicketDetails={vm.onOpenTicketDetails}
        onTicketsPageChange={vm.onTicketsPageChange}
        onTicketsPageSizeChange={vm.onTicketsPageSizeChange}
      />
      <TicketsPanelActivity
        selectedTicket={vm.selectedTicket}
        selectedTicketHistory={vm.selectedTicketHistory}
        formatTicketEventTime={vm.formatTicketEventTime}
        renderTicketEvent={vm.renderTicketEvent}
        resolveUserName={vm.resolveUserName}
      />
    </section>
  );
};
