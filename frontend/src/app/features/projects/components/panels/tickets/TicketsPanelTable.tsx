import React from 'react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { Ticket, TicketStatus, TICKET_NATURE_LABELS, TICKET_STATUS_LABELS } from '@/app/types/entities';

interface TicketsPanelTableProps {
  tickets: Ticket[];
  paginatedTickets: Ticket[];
  filteredTickets: Ticket[];
  selectedTicketId: string;
  ticketsPage: number;
  ticketsPageSize: number;
  ticketsTotalPages: number;
  wricefStatusColor: Record<TicketStatus, string>;
  wricefPriorityColor: Record<string, string>;
  onSelectTicket: (ticketId: string) => void;
  onOpenTicketDetails: (ticketId: string) => void;
  onTicketsPageChange: (value: number) => void;
  onTicketsPageSizeChange: (value: number) => void;
}

export const TicketsPanelTable: React.FC<TicketsPanelTableProps> = ({
  tickets,
  paginatedTickets,
  filteredTickets,
  selectedTicketId,
  ticketsPage,
  ticketsPageSize,
  ticketsTotalPages,
  wricefStatusColor,
  wricefPriorityColor,
  onSelectTicket,
  onOpenTicketDetails,
  onTicketsPageChange,
  onTicketsPageSizeChange,
}) => {
  return (
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
          {paginatedTickets.map((ticket) => (
            <TableRow
              key={ticket.id}
              className={`cursor-pointer hover:bg-muted/40 ${selectedTicketId === ticket.id ? 'bg-primary/5' : ''}`}
              onClick={() => onSelectTicket(ticket.id)}
            >
              <TableCell className="px-4 py-3 font-mono text-sm">{ticket.ticketCode}</TableCell>
              <TableCell className="px-4 py-3">
                <div className="font-medium text-sm">{ticket.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">{ticket.description}</div>
              </TableCell>
              <TableCell className="px-4 py-3">
                <Badge variant="secondary" className="text-xs">
                  {TICKET_NATURE_LABELS[ticket.nature]}
                </Badge>
              </TableCell>
              <TableCell className="px-4 py-3">
                <Badge className={`text-xs ${wricefStatusColor[ticket.status]}`}>{TICKET_STATUS_LABELS[ticket.status]}</Badge>
              </TableCell>
              <TableCell className="px-4 py-3">
                <Badge className={`text-xs ${wricefPriorityColor[ticket.priority]}`}>{ticket.priority}</Badge>
              </TableCell>
              <TableCell className="px-4 py-3 text-xs font-mono text-muted-foreground">{ticket.wricefId || '-'}</TableCell>
              <TableCell className="px-4 py-3 text-sm text-muted-foreground">{ticket.estimationHours}h</TableCell>
              <TableCell className="px-4 py-3 text-sm">
                <span className={ticket.effortHours > ticket.estimationHours ? 'font-medium text-red-600 dark:text-red-400' : undefined}>
                  {ticket.effortHours}h
                </span>
              </TableCell>
              <TableCell className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                <Button size="sm" variant="outline" onClick={() => onOpenTicketDetails(ticket.id)}>
                  Open
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {paginatedTickets.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                {tickets.length === 0 ? 'No tickets for this project.' : 'No tickets match the current filters.'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {filteredTickets.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
          <div className="text-sm text-muted-foreground">
            Showing {(ticketsPage - 1) * ticketsPageSize + 1}-{Math.min(ticketsPage * ticketsPageSize, filteredTickets.length)} of {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(ticketsPageSize)} onValueChange={(value) => onTicketsPageSizeChange(Number(value))}>
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
              <Button variant="outline" size="sm" disabled={ticketsPage <= 1} onClick={() => onTicketsPageChange(ticketsPage - 1)}>
                Previous
              </Button>
              <span className="px-2 text-sm text-muted-foreground">
                {ticketsPage} / {ticketsTotalPages}
              </span>
              <Button variant="outline" size="sm" disabled={ticketsPage >= ticketsTotalPages} onClick={() => onTicketsPageChange(ticketsPage + 1)}>
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
