import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileUp, Filter, Plus, Search } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  SAPModule,
  SAP_MODULE_LABELS,
  TicketComplexity,
  TICKET_COMPLEXITY_LABELS,
  WricefType,
  WRICEF_TYPE_LABELS,
} from '@/app/types/entities';

interface WricefFiltersToolbarProps {
  objectsSearch: string;
  objectsTypeFilter: WricefType | '';
  objectsComplexityFilter: TicketComplexity | '';
  objectsModuleFilter: SAPModule | '';
  wricefImporting: boolean;
  onObjectsSearchChange: (value: string) => void;
  onObjectsTypeFilterChange: (value: WricefType | '') => void;
  onObjectsComplexityFilterChange: (value: TicketComplexity | '') => void;
  onObjectsModuleFilterChange: (value: SAPModule | '') => void;
  onClearFilters: () => void;
  onOpenCreateTicket: () => void;
  onImportWricefFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const WricefFiltersToolbar: React.FC<WricefFiltersToolbarProps> = ({
  objectsSearch,
  objectsTypeFilter,
  objectsComplexityFilter,
  objectsModuleFilter,
  wricefImporting,
  onObjectsSearchChange,
  onObjectsTypeFilterChange,
  onObjectsComplexityFilterChange,
  onObjectsModuleFilterChange,
  onClearFilters,
  onOpenCreateTicket,
  onImportWricefFile,
}) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('projects.details.wricef.filters.search')}
              value={objectsSearch}
              onChange={(event) => onObjectsSearchChange(event.target.value)}
              className="pl-8 w-[220px] h-9"
            />
          </div>
          <Select
            value={objectsTypeFilter || '_all'}
            onValueChange={(value) =>
              onObjectsTypeFilterChange(value === '_all' ? '' : (value as WricefType))
            }
          >
            <SelectTrigger className="h-9 w-[150px]">
              <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder={t('projects.details.wricef.filters.type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">{t('projects.details.wricef.filters.allTypes')}</SelectItem>
              {(['W', 'R', 'I', 'C', 'E', 'F'] as WricefType[]).map((type) => (
                <SelectItem key={type} value={type}>
                  {WRICEF_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={objectsComplexityFilter || '_all'}
            onValueChange={(value) =>
              onObjectsComplexityFilterChange(value === '_all' ? '' : (value as TicketComplexity))
            }
          >
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue placeholder={t('projects.details.wricef.filters.complexity')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">{t('projects.details.wricef.filters.allComplexity')}</SelectItem>
              {(['SIMPLE', 'MOYEN', 'COMPLEXE', 'TRES_COMPLEXE'] as TicketComplexity[]).map((complexity) => (
                <SelectItem key={complexity} value={complexity}>
                  {TICKET_COMPLEXITY_LABELS[complexity]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={objectsModuleFilter || '_all'}
            onValueChange={(value) =>
              onObjectsModuleFilterChange(value === '_all' ? '' : (value as SAPModule))
            }
          >
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder={t('projects.details.wricef.filters.module')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">{t('projects.details.wricef.filters.allModules')}</SelectItem>
              {(Object.keys(SAP_MODULE_LABELS) as SAPModule[]).map((module) => (
                <SelectItem key={module} value={module}>
                  {SAP_MODULE_LABELS[module]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(objectsSearch || objectsTypeFilter || objectsComplexityFilter || objectsModuleFilter) && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              {t('projects.details.wricef.filters.clear')}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onOpenCreateTicket}>
            <Plus className="h-4 w-4 mr-1" />
            {t('projects.details.wricef.filters.createTicket')}
          </Button>
          <Label
            htmlFor="wricef-upload-objects"
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent h-9"
          >
            <FileUp className="h-4 w-4" />
            {wricefImporting ? t('projects.dialog.parsing') : t('projects.details.wricef.filters.import')}
          </Label>
          <Input
            id="wricef-upload-objects"
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={onImportWricefFile}
            disabled={wricefImporting}
          />
        </div>
      </div>
    </div>
  );
};
