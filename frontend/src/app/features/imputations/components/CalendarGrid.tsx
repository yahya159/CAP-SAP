import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Ticket, Imputation } from '@/app/types/entities';
import { CalendarDay } from '../model';
import { useAuth } from '@/app/context/AuthContext';
import { getBaseRouteForRole } from '@/app/context/roleRouting';
import { formatMonthYear } from '@/app/utils/date';

interface CalendarGridProps {
  calendarMonth: string;
  calendarDays: CalendarDay[];
  imputationsByDate: Record<string, Imputation[]>;
  hoursByDate: Record<string, number>;
  tickets: Ticket[];
  canEdit: boolean;
  prevMonth: () => void;
  nextMonth: () => void;
  openAddDialog: (date: string) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  calendarMonth,
  calendarDays,
  imputationsByDate,
  hoursByDate,
  tickets,
  canEdit,
  prevMonth,
  nextMonth,
  openAddDialog,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const roleBasePath = currentUser ? getBaseRouteForRole(currentUser.role) : '';
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between p-4 border-b">
        <Button size="sm" variant="outline" onClick={prevMonth}>{t('calendar.prev')}</Button>
        <h3 className="text-lg font-semibold">
          {formatMonthYear(calendarMonth, i18n.language)}
        </h3>
        <Button size="sm" variant="outline" onClick={nextMonth}>{t('calendar.next')}</Button>
      </div>
      <div className="p-2">
        <div className="grid grid-cols-7 gap-px bg-border rounded overflow-hidden">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="bg-muted p-2 text-center text-xs font-semibold text-muted-foreground">{t(`calendar.dayNames.${d}`)}</div>
          ))}
          {calendarDays.map((cell) => {
            const dayImps = imputationsByDate[cell.date] || [];
            const dayHours = hoursByDate[cell.date] || 0;
            const isToday = cell.date === today;

            return (
              <div
                key={cell.date}
                className={`min-h-[90px] bg-card p-1.5 border-b border-r transition-colors ${
                  !cell.isCurrentMonth ? 'opacity-30' : ''
                } ${cell.isWeekend ? 'bg-muted/20' : ''} ${
                  isToday ? 'ring-2 ring-primary/40 ring-inset' : ''
                } ${canEdit && cell.isCurrentMonth ? 'cursor-pointer hover:bg-accent/30' : ''}`}
                onClick={() => {
                  if (canEdit && cell.isCurrentMonth) {
                    openAddDialog(cell.date);
                  }
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                    {cell.day}
                  </span>
                  {dayHours > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      dayHours >= 8 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      dayHours >= 4 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {dayHours}h
                    </span>
                  )}
                </div>
                {dayImps.slice(0, 2).map((imp) => {
                  const ticket = tickets.find((t) => t.id === imp.ticketId);
                  return (
                    <div
                      key={imp.id}
                      className="mb-0.5 truncate rounded px-1 py-0.5 text-[9px] font-medium bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                      title={`${ticket?.ticketCode || ''} - ${imp.hours}h - ${imp.description || ''}`}
                      onClick={(e) => { e.stopPropagation(); navigate(`${roleBasePath}/tickets/${imp.ticketId}`); }}
                    >
                      {imp.hours}h {ticket?.ticketCode || imp.ticketId.slice(0, 6)}
                    </div>
                  );
                })}
                {dayImps.length > 2 && (
                  <div className="text-[9px] text-muted-foreground">+{dayImps.length - 2} more</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};