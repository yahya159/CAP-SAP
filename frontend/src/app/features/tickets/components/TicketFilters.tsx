import React from 'react';
import {
  SAPModule,
  Ticket,
  TicketComplexity,
  User,
  Project,
} from '@/app/types/entities';
import { ViewMode } from './types';
import { TicketFiltersAdvanced } from './panels/TicketFiltersAdvanced';
import { TicketFiltersMainBar } from './panels/TicketFiltersMainBar';

interface TicketFiltersProps {
  searchQuery: string;
  statusFilter: Ticket['status'] | 'ALL';
  moduleFilter: SAPModule | 'ALL';
  complexityFilter: TicketComplexity | 'ALL';
  projectFilter: string;
  assigneeFilter: string;
  dateFrom: string;
  dateTo: string;
  wricefFilter: string;
  viewMode: ViewMode;
  showAdvancedFilters: boolean;
  isViewOnly: boolean;
  users: User[];
  projects: Project[];
  onSearchQueryChange: (value: string) => void;
  onStatusFilterChange: (value: Ticket['status'] | 'ALL') => void;
  onModuleFilterChange: (value: SAPModule | 'ALL') => void;
  onComplexityFilterChange: (value: TicketComplexity | 'ALL') => void;
  onProjectFilterChange: (value: string) => void;
  onAssigneeFilterChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onWricefFilterChange: (value: string) => void;
  onViewModeChange: (value: ViewMode) => void;
  onToggleAdvancedFilters: () => void;
  onClearAll: () => void;
  onCreateTicket: () => void;
}

export const TicketFilters: React.FC<TicketFiltersProps> = ({
  searchQuery,
  statusFilter,
  moduleFilter,
  complexityFilter,
  projectFilter,
  assigneeFilter,
  dateFrom,
  dateTo,
  wricefFilter,
  viewMode,
  showAdvancedFilters,
  isViewOnly,
  users,
  projects,
  onSearchQueryChange,
  onStatusFilterChange,
  onModuleFilterChange,
  onComplexityFilterChange,
  onProjectFilterChange,
  onAssigneeFilterChange,
  onDateFromChange,
  onDateToChange,
  onWricefFilterChange,
  onViewModeChange,
  onToggleAdvancedFilters,
  onClearAll,
  onCreateTicket,
}) => {
  return (
    <>
      <TicketFiltersMainBar
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        moduleFilter={moduleFilter}
        complexityFilter={complexityFilter}
        assigneeFilter={assigneeFilter}
        viewMode={viewMode}
        showAdvancedFilters={showAdvancedFilters}
        isViewOnly={isViewOnly}
        users={users}
        onSearchQueryChange={onSearchQueryChange}
        onStatusFilterChange={onStatusFilterChange}
        onModuleFilterChange={onModuleFilterChange}
        onComplexityFilterChange={onComplexityFilterChange}
        onAssigneeFilterChange={onAssigneeFilterChange}
        onViewModeChange={onViewModeChange}
        onToggleAdvancedFilters={onToggleAdvancedFilters}
        onCreateTicket={onCreateTicket}
      />
      <TicketFiltersAdvanced
        showAdvancedFilters={showAdvancedFilters}
        projectFilter={projectFilter}
        wricefFilter={wricefFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        projects={projects}
        onProjectFilterChange={onProjectFilterChange}
        onWricefFilterChange={onWricefFilterChange}
        onDateFromChange={onDateFromChange}
        onDateToChange={onDateToChange}
        onClearAll={onClearAll}
      />
    </>
  );
};
