import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Project } from '@/app/types/entities';

interface TicketFiltersAdvancedProps {
  showAdvancedFilters: boolean;
  projectFilter: string;
  wricefFilter: string;
  dateFrom: string;
  dateTo: string;
  projects: Project[];
  onProjectFilterChange: (value: string) => void;
  onWricefFilterChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClearAll: () => void;
}

export const TicketFiltersAdvanced: React.FC<TicketFiltersAdvancedProps> = ({
  showAdvancedFilters,
  projectFilter,
  wricefFilter,
  dateFrom,
  dateTo,
  projects,
  onProjectFilterChange,
  onWricefFilterChange,
  onDateFromChange,
  onDateToChange,
  onClearAll,
}) => {
  const { t } = useTranslation();
  if (!showAdvancedFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3">
      <Select value={projectFilter} onValueChange={onProjectFilterChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder={t('filters.projectPlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t('common.all')}</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        placeholder={t('filters.wricefPlaceholder')}
        value={wricefFilter}
        onChange={(event) => onWricefFilterChange(event.target.value)}
        className="w-36"
      />
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">From</span>
        <Input type="date" value={dateFrom} onChange={(event) => onDateFromChange(event.target.value)} className="w-36" />
        <span className="text-xs text-muted-foreground">To</span>
        <Input type="date" value={dateTo} onChange={(event) => onDateToChange(event.target.value)} className="w-36" />
      </div>
      <Button variant="ghost" size="sm" onClick={onClearAll}>
        Clear All
      </Button>
    </div>
  );
};
