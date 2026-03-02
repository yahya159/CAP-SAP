import React from 'react';
import { WricefTable } from '../tables/WricefTable';
import { WricefFiltersToolbar } from './wricef/WricefFiltersToolbar';
import { WricefPagination } from './wricef/WricefPagination';
import { WricefStatsCards } from './wricef/WricefStatsCards';
import { useWricefPanel } from '../../hooks/useWricefPanel';

interface WricefPanelProps {
  projectId: string;
  active: boolean;
  onOpenCreateTicket: (objectId?: string) => void;
  onOpenCreateDocument: (objectId?: string) => void;
  onOpenTicketDetails: (ticketId: string) => void;
  onViewDocument: (docId: string) => void;
}

export const WricefPanel: React.FC<WricefPanelProps> = ({ 
  projectId,
  active,
  onOpenCreateTicket,
  onOpenCreateDocument,
  onOpenTicketDetails,
  onViewDocument
}) => {
  const vm = useWricefPanel(projectId);

  if (!active) return null;

  const tableVm = {
    ...vm.table,
    onOpenCreateTicket,
    onOpenCreateDocument,
    onOpenTicketDetails,
    onViewDocument,
  };

  return (
    <section
      id="project-panel-objects"
      role="tabpanel"
      tabIndex={0}
      aria-labelledby="project-tab-objects"
      className="space-y-4"
    >
      <WricefStatsCards
        wricefObjectCount={vm.wricefObjectCount}
        wricefTotalTickets={vm.wricefTotalTickets}
        wricefTotalDocuments={vm.wricefTotalDocuments}
      />
      <WricefFiltersToolbar
        objectsSearch={vm.objectsSearch}
        objectsTypeFilter={vm.objectsTypeFilter}
        objectsComplexityFilter={vm.objectsComplexityFilter}
        objectsModuleFilter={vm.objectsModuleFilter}
        wricefImporting={vm.wricefImporting}
        onObjectsSearchChange={vm.onObjectsSearchChange}
        onObjectsTypeFilterChange={vm.onObjectsTypeFilterChange}
        onObjectsComplexityFilterChange={vm.onObjectsComplexityFilterChange}
        onObjectsModuleFilterChange={vm.onObjectsModuleFilterChange}
        onClearFilters={vm.onClearFilters}
        onOpenCreateTicket={onOpenCreateTicket}
        onImportWricefFile={() => {}}
      />
      <WricefTable vm={tableVm as any} />
      <WricefPagination
        filteredObjectsCount={vm.filteredObjectsCount}
        objectsPage={vm.objectsPage}
        objectsPageSize={vm.objectsPageSize}
        objectsTotalPages={vm.objectsTotalPages}
        onObjectsPageChange={vm.onObjectsPageChange}
        onObjectsPageSizeChange={vm.onObjectsPageSizeChange}
      />
    </section>
  );
};
