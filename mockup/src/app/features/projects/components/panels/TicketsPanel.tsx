import React from 'react';
import { Plus, Search } from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../components/ui/table';
import { Ticket, TicketStatus, TICKET_NATURE_LABELS, TICKET_STATUS_LABELS } from '../../../../types/entities';

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
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={vm.ticketsSearch}
                onChange={(event) => vm.onTicketsSearchChange(event.target.value)}
                className="pl-8 w-[220px] h-9"
              />
            </div>
            <Select
              value={vm.ticketsStatusFilter || '_all'}
              onValueChange={(value) =>
                vm.onTicketsStatusFilterChange(value === '_all' ? '' : (value as TicketStatus))
              }
            >
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Statuses</SelectItem>
                {(Object.entries(TICKET_STATUS_LABELS) as [TicketStatus, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            {(vm.ticketsSearch || vm.ticketsStatusFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  vm.onTicketsSearchChange('');
                  vm.onTicketsStatusFilterChange('');
                  vm.onTicketsPageChange(1);
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
          <Button size="sm" onClick={vm.onOpenCreateTicket}>
            <Plus className="h-4 w-4 mr-1" />
            Create Ticket
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="px-4">Code</TableHead>
              <TableHead className="px-4">Title</TableHead>
              <TableHead className="px-4">Nature</TableHead>
              <TableHead className="px-4">Status</TableHead>
              <TableHead className="px-4">Priority</TableHead>
              <TableHead className="px-4">WRICEF</TableHead>
              <TableHead className="px-4">Estimation</TableHead>
              <TableHead className="px-4">Effort</TableHead>
              <TableHead className="px-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vm.paginatedTickets.map((ticket) => (
              <TableRow
                key={ticket.id}
                className={`cursor-pointer hover:bg-muted/40 ${
                  vm.selectedTicketId === ticket.id ? 'bg-primary/5' : ''
                }`}
                onClick={() => vm.onSelectTicket(ticket.id)}
              >
                <TableCell className="px-4 py-3 font-mono text-sm">{ticket.ticketCode}</TableCell>
                <TableCell className="px-4 py-3">
                  <div className="font-medium text-sm">{ticket.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {ticket.description}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Badge variant="secondary" className="text-xs">
                    {TICKET_NATURE_LABELS[ticket.nature]}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Badge className={`text-xs ${vm.wricefStatusColor[ticket.status]}`}>
                    {TICKET_STATUS_LABELS[ticket.status]}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Badge className={`text-xs ${vm.wricefPriorityColor[ticket.priority]}`}>
                    {ticket.priority}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-xs font-mono text-muted-foreground">
                  {ticket.wricefId || '-'}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                  {ticket.estimationHours}h
                </TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  <span
                    className={
                      ticket.effortHours > ticket.estimationHours
                        ? 'font-medium text-red-600 dark:text-red-400'
                        : undefined
                    }
                  >
                    {ticket.effortHours}h
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                  <Button size="sm" variant="outline" onClick={() => vm.onOpenTicketDetails(ticket.id)}>
                    Open
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {vm.paginatedTickets.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  {vm.tickets.length === 0
                    ? 'No tickets for this project.'
                    : 'No tickets match the current filters.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {vm.filteredTickets.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
            <div className="text-sm text-muted-foreground">
              Showing {(vm.ticketsPage - 1) * vm.ticketsPageSize + 1}-
              {Math.min(vm.ticketsPage * vm.ticketsPageSize, vm.filteredTickets.length)} of{' '}
              {vm.filteredTickets.length} ticket{vm.filteredTickets.length !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={String(vm.ticketsPageSize)}
                onValueChange={(value) => vm.onTicketsPageSizeChange(Number(value))}
              >
                <SelectTrigger className="h-8 w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={vm.ticketsPage <= 1}
                  onClick={() => vm.onTicketsPageChange(vm.ticketsPage - 1)}
                >
                  Previous
                </Button>
                <span className="px-2 text-sm text-muted-foreground">
                  {vm.ticketsPage} / {vm.ticketsTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={vm.ticketsPage >= vm.ticketsTotalPages}
                  onClick={() => vm.onTicketsPageChange(vm.ticketsPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-foreground">Fil d'actualite</h4>
          {vm.selectedTicket ? (
            <p className="text-xs text-muted-foreground mt-1">
              {vm.selectedTicket.ticketCode} - {vm.selectedTicket.title}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Select a ticket to view activity.
            </p>
          )}
        </div>
        {vm.selectedTicket && vm.selectedTicketHistory.length > 0 && (
          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
            {vm.selectedTicketHistory.map((event) => (
              <div
                key={event.id}
                className="rounded-md border-l-2 border-primary/30 bg-muted/20 px-3 py-2 text-xs"
              >
                <div className="text-[11px] text-muted-foreground">
                  {vm.formatTicketEventTime(event.timestamp)}
                </div>
                <div className="mt-1">
                  <span className="font-medium">{vm.resolveUserName(event.userId)}</span>{' '}
                  {vm.renderTicketEvent(event)}
                </div>
                {event.comment &&
                  event.action !== 'COMMENT' &&
                  event.action !== 'SENT_TO_TEST' && (
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {event.comment}
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
        {vm.selectedTicket && vm.selectedTicketHistory.length === 0 && (
          <p className="text-xs text-muted-foreground">No activity found for this ticket.</p>
        )}
      </div>
    </section>
  );
};
