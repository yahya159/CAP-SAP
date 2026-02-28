import React from 'react';
import { CalendarDays, Filter, KanbanSquare, List, Plus } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Project,
  SAPModule,
  SAP_MODULE_LABELS,
  Ticket,
  TicketComplexity,
  TICKET_COMPLEXITY_LABELS,
  TICKET_STATUS_LABELS,
  User,
} from '@/app/types/entities';
import { STATUS_ORDER } from '../ticketView.constants';
import { ViewMode } from '../types';

interface TicketFiltersMainBarProps {
  searchQuery: string;
  statusFilter: Ticket['status'] | 'ALL';
  moduleFilter: SAPModule | 'ALL';
  complexityFilter: TicketComplexity | 'ALL';
  assigneeFilter: string;
  viewMode: ViewMode;
  showAdvancedFilters: boolean;
  isViewOnly: boolean;
  users: User[];
  onSearchQueryChange: (value: string) => void;
  onStatusFilterChange: (value: Ticket['status'] | 'ALL') => void;
  onModuleFilterChange: (value: SAPModule | 'ALL') => void;
  onComplexityFilterChange: (value: TicketComplexity | 'ALL') => void;
  onAssigneeFilterChange: (value: string) => void;
  onViewModeChange: (value: ViewMode) => void;
  onToggleAdvancedFilters: () => void;
  onCreateTicket: () => void;
}

export const TicketFiltersMainBar: React.FC<TicketFiltersMainBarProps> = ({
  searchQuery,
  statusFilter,
  moduleFilter,
  complexityFilter,
  assigneeFilter,
  viewMode,
  showAdvancedFilters,
  isViewOnly,
  users,
  onSearchQueryChange,
  onStatusFilterChange,
  onModuleFilterChange,
  onComplexityFilterChange,
  onAssigneeFilterChange,
  onViewModeChange,
  onToggleAdvancedFilters,
  onCreateTicket,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Search tickets, WRICEF, code..."
        value={searchQuery}
        onChange={(event) => onSearchQueryChange(event.target.value)}
        className="w-60"
      />
      <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as Ticket['status'] | 'ALL')}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Statuses</SelectItem>
          {STATUS_ORDER.map((status) => (
            <SelectItem key={status} value={status}>
              {TICKET_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={moduleFilter} onValueChange={(value) => onModuleFilterChange(value as SAPModule | 'ALL')}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Module" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Modules</SelectItem>
          {(Object.keys(SAP_MODULE_LABELS) as SAPModule[]).map((module) => (
            <SelectItem key={module} value={module}>
              {SAP_MODULE_LABELS[module]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={complexityFilter} onValueChange={(value) => onComplexityFilterChange(value as TicketComplexity | 'ALL')}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Complexity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Complexity</SelectItem>
          {(Object.keys(TICKET_COMPLEXITY_LABELS) as TicketComplexity[]).map((complexity) => (
            <SelectItem key={complexity} value={complexity}>
              {TICKET_COMPLEXITY_LABELS[complexity]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={assigneeFilter} onValueChange={onAssigneeFilterChange}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Assigned" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Assigned</SelectItem>
          {users
            .filter((user) => user.role !== 'ADMIN')
            .map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" onClick={onToggleAdvancedFilters}>
        <Filter className="h-4 w-4 mr-1" /> {showAdvancedFilters ? 'Hide' : 'More'}
      </Button>
      <div className="flex gap-1 rounded-lg border border-border p-0.5">
        {([['list', List], ['calendar', CalendarDays], ['kanban', KanbanSquare]] as const).map(
          ([mode, Icon]) => (
            <Button key={mode} size="sm" variant={viewMode === mode ? 'default' : 'ghost'} onClick={() => onViewModeChange(mode)}>
              <Icon className="h-4 w-4" />
            </Button>
          )
        )}
      </div>
      <div className="flex-1" />
      {!isViewOnly && (
        <Button onClick={onCreateTicket}>
          <Plus className="mr-1 h-4 w-4" /> New Ticket
        </Button>
      )}
    </div>
  );
};
