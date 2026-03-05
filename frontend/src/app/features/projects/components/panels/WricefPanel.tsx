import React from 'react';
import { WricefTable } from '../tables/WricefTable';
import { WricefFiltersToolbar } from './wricef/WricefFiltersToolbar';
import { WricefPagination } from './wricef/WricefPagination';
import { WricefStatsCards } from './wricef/WricefStatsCards';

interface WricefPanelProps {
  active: boolean;
  vm: any;
}

export const WricefPanel: React.FC<WricefPanelProps> = ({ active, vm }) => {
  if (!active) return null;

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
        onOpenCreateTicket={vm.onOpenCreateTicket}
        onImportWricefFile={vm.onImportWricefFile}
      />
      <WricefTable vm={vm.table} />
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
