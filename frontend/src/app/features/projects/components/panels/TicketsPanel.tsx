import React from 'react';
import { TicketsPanelActivity } from './tickets/TicketsPanelActivity';
import { TicketsPanelTable } from './tickets/TicketsPanelTable';
import { TicketsPanelToolbar } from './tickets/TicketsPanelToolbar';
import { useTicketsPanel } from '../../hooks/useTicketsPanel';

interface TicketsPanelProps {
  projectId: string;
  active: boolean;
  onOpenCreateTicket: () => void;
  onOpenTicketDetails: (ticketId: string) => void;
}

export const TicketsPanel: React.FC<TicketsPanelProps> = ({ 
  projectId,
  active, 
  onOpenCreateTicket,
  onOpenTicketDetails 
}) => {
  const vm = useTicketsPanel(projectId);

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
        onOpenCreateTicket={onOpenCreateTicket}
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
        onOpenTicketDetails={onOpenTicketDetails}
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
