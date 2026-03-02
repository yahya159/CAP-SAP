import React from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { TicketStatus, TICKET_STATUS_LABELS } from '@/app/types/entities';

interface TicketsPanelToolbarProps {
  ticketsSearch: string;
  ticketsStatusFilter: TicketStatus | '';
  onTicketsSearchChange: (value: string) => void;
  onTicketsStatusFilterChange: (value: TicketStatus | '') => void;
  onTicketsPageChange: (value: number) => void;
  onOpenCreateTicket: () => void;
}

export const TicketsPanelToolbar: React.FC<TicketsPanelToolbarProps> = ({
  ticketsSearch,
  ticketsStatusFilter,
  onTicketsSearchChange,
  onTicketsStatusFilterChange,
  onTicketsPageChange,
  onOpenCreateTicket,
}) => {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={ticketsSearch}
              onChange={(event) => onTicketsSearchChange(event.target.value)}
              className="pl-8 w-[220px] h-9"
            />
          </div>
          <Select
            value={ticketsStatusFilter || '_all'}
            onValueChange={(value) =>
              onTicketsStatusFilterChange(value === '_all' ? '' : (value as TicketStatus))
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
          {(ticketsSearch || ticketsStatusFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onTicketsSearchChange('');
                onTicketsStatusFilterChange('');
                onTicketsPageChange(1);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
        <Button size="sm" onClick={onOpenCreateTicket}>
          <Plus className="h-4 w-4 mr-1" />
          Create Ticket
        </Button>
      </div>
    </div>
  );
};
