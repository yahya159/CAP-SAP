import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Package, Ticket as TicketIcon } from 'lucide-react';

interface WricefStatsCardsProps {
  wricefObjectCount: number;
  wricefTotalTickets: number;
  wricefTotalDocuments: number;
}

export const WricefStatsCards: React.FC<WricefStatsCardsProps> = ({
  wricefObjectCount,
  wricefTotalTickets,
  wricefTotalDocuments,
}) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2.5">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('projects.details.wricef.stats.totalObjects')}</p>
          <p className="text-2xl font-bold text-foreground">{wricefObjectCount}</p>
        </div>
      </div>
      <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
        <div className="rounded-lg bg-blue-500/10 p-2.5">
          <TicketIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('projects.details.wricef.stats.totalTickets')}</p>
          <p className="text-2xl font-bold text-foreground">{wricefTotalTickets}</p>
        </div>
      </div>
      <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
        <div className="rounded-lg bg-emerald-500/10 p-2.5">
          <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('projects.details.wricef.stats.totalDocuments')}</p>
          <p className="text-2xl font-bold text-foreground">{wricefTotalDocuments}</p>
        </div>
      </div>
    </div>
  );
};
