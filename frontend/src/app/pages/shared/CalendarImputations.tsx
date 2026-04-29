import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/common/PageHeader';
import { useCalendarImputations } from '../../features/imputations/hooks/useCalendarImputations';
import { ImputationStatsCards } from '../../features/imputations/components/ImputationStatsCards';
import { SubmissionToolbar } from '../../features/imputations/components/SubmissionToolbar';
import { ManagerValidationTable } from '../../features/imputations/components/ManagerValidationTable';
import { CalendarGrid } from '../../features/imputations/components/CalendarGrid';
import { PeriodDetailTables } from '../../features/imputations/components/PeriodDetailTables';
import { AddImputationDialog } from '../../features/imputations/components/AddImputationDialog';

interface CalendarImputationsProps {
  title: string;
  subtitle: string;
  homePath: string;
  canEdit: boolean;
  canImpute: boolean;
  canValidate?: boolean;
  canSendToStraTIME?: boolean;
}

export const CalendarImputations: React.FC<CalendarImputationsProps> = ({
  title,
  subtitle,
  homePath,
  canEdit,
  canImpute,
  canValidate = false,
  canSendToStraTIME = false,
}) => {
  const { t } = useTranslation();
  const vm = useCalendarImputations(canImpute, canValidate);

  if (vm.loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader
          title={title}
          subtitle={subtitle}
          breadcrumbs={[{ label: t('common.home'), path: homePath }, { label: title }]}
        />
        <div className="p-6 text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={[{ label: t('common.home'), path: homePath }, { label: title }]}
      />

      <div className="p-6 space-y-6">
        <ImputationStatsCards
          totalHoursThisMonth={vm.totalHoursThisMonth}
          validatedHoursThisMonth={vm.validatedHoursThisMonth}
          stratimeHoursThisMonth={vm.stratimeHoursThisMonth}
          currentPeriods={vm.currentPeriods}
          periodData={vm.periodData}
          canValidate={canValidate}
          periods={vm.reviewPeriods}
        />

        {canEdit && (
          <SubmissionToolbar
            currentPeriods={vm.currentPeriods}
            periodData={vm.periodData}
            submitPeriod={vm.submitPeriod}
          />
        )}

        {canValidate && (
          <ManagerValidationTable
            reviewPeriods={vm.reviewPeriods}
            users={vm.users}
            canSendToStraTIME={canSendToStraTIME}
            rejectPeriod={vm.rejectPeriod}
            validatePeriod={vm.validatePeriod}
            sendPeriodToStraTIME={vm.sendPeriodToStraTIME}
          />
        )}

        <CalendarGrid
          calendarMonth={vm.calendarMonth}
          calendarDays={vm.calendarDays}
          imputationsByDate={vm.imputationsByDate}
          hoursByDate={vm.hoursByDate}
          tickets={vm.tickets}
          canEdit={canEdit}
          prevMonth={vm.prevMonth}
          nextMonth={vm.nextMonth}
          openAddDialog={vm.openAddDialog}
        />

        <PeriodDetailTables
          entries={canValidate ? vm.reviewPeriods : vm.currentPeriods}
          canValidate={canValidate}
          periodData={vm.periodData}
          periodImputations={vm.periodImputations}
          tickets={vm.tickets}
          users={vm.users}
        />
      </div>

      <AddImputationDialog
        open={vm.showAddDialog}
        onOpenChange={vm.setShowAddDialog}
        selectedDate={vm.selectedDate}
        imputationsByDate={vm.imputationsByDate}
        hoursByDate={vm.hoursByDate}
        myTickets={vm.myTickets}
        tickets={vm.tickets}
        onAdd={vm.addImputation}
      />
    </div>
  );
};

export default CalendarImputations;
