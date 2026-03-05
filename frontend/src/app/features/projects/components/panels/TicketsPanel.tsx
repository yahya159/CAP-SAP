import React from 'react';
import { TicketsPanelActivity } from './tickets/TicketsPanelActivity';
import { TicketsPanelTable } from './tickets/TicketsPanelTable';
import { TicketsPanelToolbar } from './tickets/TicketsPanelToolbar';

interface TicketsPanelProps {
  active: boolean;
  vm: any;
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
        onTicketsSearchChange={vm.setTicketsSearch}
        onTicketsStatusFilterChange={vm.setTicketsStatusFilter}
        onTicketsPageChange={vm.setTicketsPage}
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
        onSelectTicket={vm.setSelectedTicketId}
        onOpenTicketDetails={vm.onOpenTicketDetails}
        onTicketsPageChange={vm.setTicketsPage}
        onTicketsPageSizeChange={vm.setTicketsPageSize}
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
