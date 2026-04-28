import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Ticket,
} from '@/app/types/entities';

interface TicketDrawerDetailsGridProps {
  selectedTicket: Ticket;
  resolveProjectName: (projectId: string) => string;
  resolveUserName: (userId?: string) => string;
}

const getAssignedBy = (ticket: Ticket, resolveUserName: (userId?: string) => string): string => {
  if (!ticket.history || ticket.history.length === 0) return '-';
  const assignEvents = ticket.history.filter((event) => event.action === 'ASSIGNED');
  const assignEvent = assignEvents.length > 0 ? assignEvents[assignEvents.length - 1] : null;
  return assignEvent ? resolveUserName(assignEvent.userId) : '-';
};

export const TicketDrawerDetailsGrid: React.FC<TicketDrawerDetailsGridProps> = ({
  selectedTicket,
  resolveProjectName,
  resolveUserName,
}) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div><span className="text-muted-foreground">{t('tickets.details.ticketId')}:</span> {selectedTicket.ticketCode}</div>
      <div><span className="text-muted-foreground">{t('tickets.details.wricef')}:</span> {selectedTicket.wricefId ?? '-'}</div>
      <div>
        <span className="text-muted-foreground">{t('common.module')}:</span>{' '}
        {selectedTicket.module ? t(`entities.sapModule.${selectedTicket.module}`) : '-'}
      </div>
      <div>
        <span className="text-muted-foreground">{t('common.complexity')}:</span>{' '}
        {t(`entities.ticketComplexity.${selectedTicket.complexity}`)}
      </div>
      <div><span className="text-muted-foreground">{t('tickets.details.estimation')}:</span> {selectedTicket.estimationHours}h</div>
      <div><span className="text-muted-foreground">{t('tickets.details.effort')}:</span> {selectedTicket.effortHours}h</div>
      <div><span className="text-muted-foreground">{t('tickets.details.project')}:</span> {resolveProjectName(selectedTicket.projectId)}</div>
      <div><span className="text-muted-foreground">{t('tickets.details.createdBy')}:</span> {resolveUserName(selectedTicket.createdBy)}</div>
      <div><span className="text-muted-foreground">{t('tickets.details.assignedTo')}:</span> {resolveUserName(selectedTicket.assignedTo)}</div>
      <div><span className="text-muted-foreground">{t('tickets.details.assignedBy')}:</span> {getAssignedBy(selectedTicket, resolveUserName)}</div>
      <div>
        <span className="text-muted-foreground">{t('tickets.details.assignedRole')}:</span>{' '}
        {selectedTicket.assignedToRole ? t(`roles.${selectedTicket.assignedToRole}`) : '-'}
      </div>
      <div><span className="text-muted-foreground">{t('tickets.details.dueDate')}:</span> {selectedTicket.dueDate ?? '-'}</div>
      {selectedTicket.effortComment && (
        <div className="col-span-2">
          <span className="text-muted-foreground">{t('tickets.details.effortNote')}:</span> {selectedTicket.effortComment}
        </div>
      )}
      {selectedTicket.estimationHours > 0 && selectedTicket.effortHours > 0 && (
        <div className="col-span-2">
          <span className="text-muted-foreground">{t('tickets.details.estVsActual')}:</span>{' '}
          <span className={selectedTicket.effortHours > selectedTicket.estimationHours ? 'text-red-600 dark:text-red-400 font-medium' : 'text-emerald-600 dark:text-emerald-400 font-medium'}>
            {((selectedTicket.effortHours / selectedTicket.estimationHours) * 100).toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
};
