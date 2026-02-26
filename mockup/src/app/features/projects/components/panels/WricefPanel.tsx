import React from 'react';
import { FileUp, Filter, Package, Plus, Search, Ticket as TicketIcon, FileText } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import {
  SAPModule,
  SAP_MODULE_LABELS,
  TicketComplexity,
  TICKET_COMPLEXITY_LABELS,
  WricefType,
  WRICEF_TYPE_LABELS,
} from '../../../../types/entities';
import { WricefTable, WricefTableViewModel } from '../tables/WricefTable';

export interface WricefPanelViewModel {
  objectsSearch: string;
  objectsTypeFilter: WricefType | '';
  objectsComplexityFilter: TicketComplexity | '';
  objectsModuleFilter: SAPModule | '';
  objectsPage: number;
  objectsPageSize: number;
  objectsTotalPages: number;
  filteredObjectsCount: number;
  wricefObjectCount: number;
  wricefTotalTickets: number;
  wricefTotalDocuments: number;
  wricefImporting: boolean;
  onObjectsSearchChange: (value: string) => void;
  onObjectsTypeFilterChange: (value: WricefType | '') => void;
  onObjectsComplexityFilterChange: (value: TicketComplexity | '') => void;
  onObjectsModuleFilterChange: (value: SAPModule | '') => void;
  onObjectsPageChange: (value: number) => void;
  onObjectsPageSizeChange: (value: number) => void;
  onClearFilters: () => void;
  onOpenCreateTicket: () => void;
  onImportWricefFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  table: WricefTableViewModel;
}

interface WricefPanelProps {
  active: boolean;
  vm: WricefPanelViewModel;
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Objects</p>
            <p className="text-2xl font-bold text-foreground">{vm.wricefObjectCount}</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
          <div className="rounded-lg bg-blue-500/10 p-2.5">
            <TicketIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Tickets</p>
            <p className="text-2xl font-bold text-foreground">{vm.wricefTotalTickets}</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/10 p-2.5">
            <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Documents</p>
            <p className="text-2xl font-bold text-foreground">{vm.wricefTotalDocuments}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search objects..."
                value={vm.objectsSearch}
                onChange={(event) => vm.onObjectsSearchChange(event.target.value)}
                className="pl-8 w-[220px] h-9"
              />
            </div>
            <Select
              value={vm.objectsTypeFilter || '_all'}
              onValueChange={(value) =>
                vm.onObjectsTypeFilterChange(value === '_all' ? '' : (value as WricefType))
              }
            >
              <SelectTrigger className="h-9 w-[150px]">
                <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Types</SelectItem>
                {(['W', 'R', 'I', 'C', 'E', 'F'] as WricefType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {WRICEF_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={vm.objectsComplexityFilter || '_all'}
              onValueChange={(value) =>
                vm.onObjectsComplexityFilterChange(
                  value === '_all' ? '' : (value as TicketComplexity)
                )
              }
            >
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Complexity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Complexity</SelectItem>
                {(['SIMPLE', 'MOYEN', 'COMPLEXE', 'TRES_COMPLEXE'] as TicketComplexity[]).map(
                  (complexity) => (
                    <SelectItem key={complexity} value={complexity}>
                      {TICKET_COMPLEXITY_LABELS[complexity]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            <Select
              value={vm.objectsModuleFilter || '_all'}
              onValueChange={(value) =>
                vm.onObjectsModuleFilterChange(value === '_all' ? '' : (value as SAPModule))
              }
            >
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Modules</SelectItem>
                {(Object.keys(SAP_MODULE_LABELS) as SAPModule[]).map((module) => (
                  <SelectItem key={module} value={module}>
                    {SAP_MODULE_LABELS[module]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(vm.objectsSearch ||
              vm.objectsTypeFilter ||
              vm.objectsComplexityFilter ||
              vm.objectsModuleFilter) && (
              <Button variant="ghost" size="sm" onClick={vm.onClearFilters}>
                Clear filters
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={vm.onOpenCreateTicket}>
              <Plus className="h-4 w-4 mr-1" />
              Add Object
            </Button>
            <Label
              htmlFor="wricef-upload-objects"
              className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent h-9"
            >
              <FileUp className="h-4 w-4" />
              {vm.wricefImporting ? 'Importing...' : 'Upload WRICEF'}
            </Label>
            <Input
              id="wricef-upload-objects"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={vm.onImportWricefFile}
              disabled={vm.wricefImporting}
            />
          </div>
        </div>
      </div>

      <WricefTable vm={vm.table} />

      {vm.filteredObjectsCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border rounded-lg bg-card px-4 py-3">
          <div className="text-sm text-muted-foreground">
            Showing {(vm.objectsPage - 1) * vm.objectsPageSize + 1}-
            {Math.min(vm.objectsPage * vm.objectsPageSize, vm.filteredObjectsCount)} of{' '}
            {vm.filteredObjectsCount} object{vm.filteredObjectsCount !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={String(vm.objectsPageSize)}
              onValueChange={(value) => vm.onObjectsPageSizeChange(Number(value))}
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
                disabled={vm.objectsPage <= 1}
                onClick={() => vm.onObjectsPageChange(vm.objectsPage - 1)}
              >
                Previous
              </Button>
              <span className="px-2 text-sm text-muted-foreground">
                {vm.objectsPage} / {vm.objectsTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={vm.objectsPage >= vm.objectsTotalPages}
                onClick={() => vm.onObjectsPageChange(vm.objectsPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
