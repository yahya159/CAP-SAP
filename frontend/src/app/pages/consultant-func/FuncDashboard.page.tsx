import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle2, ClipboardList, FileText, TicketCheck, Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { PageHeader } from '../../components/common/PageHeader';
import { KPICard } from '../../components/common/KPICard';
import { useAuth } from '../../context/AuthContext';import { DeliverablesAPI } from '../../services/odata/deliverablesApi';
import { TicketsAPI } from '../../services/odata/ticketsApi';
import { Deliverable, Ticket } from '../../types/entities';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export const FuncDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const loadData = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const [deliverableData, ticketData] = await Promise.all([
          DeliverablesAPI.getAll(),
          TicketsAPI.getAll(),
        ]);

        setDeliverables(deliverableData);
        setTickets(ticketData.filter((ticket) => ticket.createdBy === currentUser.id || ticket.assignedTo === currentUser.id));
      } catch (error) {
        setDeliverables([]);
        setTickets([]);
        const message = error instanceof Error ? error.message : t('func.deliverables.toasts.loadFailed');
        setLoadError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [currentUser, t]);

  const pendingDeliverables = deliverables.filter(
    (deliverable) => deliverable.validationStatus === 'PENDING'
  ).length;
  const approvedDeliverables = deliverables.filter(
    (deliverable) => deliverable.validationStatus === 'APPROVED'
  ).length;
  const openTickets = tickets.filter(
    (ticket) => ticket.status === 'NEW' || ticket.status === 'IN_PROGRESS'
  ).length;
  const resolvedTickets = tickets.filter((ticket) => ticket.status === 'DONE').length;

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title={t('func.dashboard.welcome', { name: currentUser?.name.split(' ')[0] ?? 'Consultant' })}
        subtitle={t('func.dashboard.subtitle')}
        breadcrumbs={[{ label: t('func.dashboard.breadcrumb') }]}
      />

      <div className="space-y-6 p-6 lg:p-8">
        {loadError && (
          <Card className="border-destructive/50">
            <CardContent className="pt-4 text-sm text-destructive">{loadError}</CardContent>
          </Card>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KPICard title={t('func.dashboard.kpi.pendingDeliverables')} value={pendingDeliverables} icon="document" color="yellow" />
          <KPICard title={t('func.dashboard.kpi.approvedDeliverables')} value={approvedDeliverables} icon="accept" color="green" />
          <KPICard title={t('func.dashboard.kpi.openTickets')} value={openTickets} icon="incident" color="blue" />
          <KPICard title={t('func.dashboard.kpi.resolvedTickets')} value={resolvedTickets} icon="history" color="purple" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="bg-card/92">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="inline-flex items-center gap-2 text-lg">
                <FileText className="h-4 w-4 text-primary" />
                {t('func.dashboard.deliverables.title')}
              </CardTitle>
              <Button variant="secondary" size="sm" onClick={() => navigate('/consultant-func/deliverables')}>
                {t('common.viewAll')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground">{t('func.dashboard.deliverables.loading')}</p>
              ) : (
                deliverables
                  .filter((deliverable) => deliverable.validationStatus === 'PENDING')
                  .slice(0, 6)
                  .map((deliverable) => (
                    <button
                      key={deliverable.id}
                      type="button"
                      onClick={() => navigate('/consultant-func/deliverables')}
                      className="w-full rounded-xl border border-border/70 bg-surface-1 p-4 text-left transition hover-lift"
                    >
                      <p className="font-semibold text-foreground">{deliverable.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{deliverable.type}</p>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1 text-primary">
                          <Timer className="h-3.5 w-3.5" /> {t('func.dashboard.deliverables.pendingReview')}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(deliverable.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/92">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="inline-flex items-center gap-2 text-lg">
                <ClipboardList className="h-4 w-4 text-primary" />
                {t('func.dashboard.tickets.title')}
              </CardTitle>
              <Button variant="secondary" size="sm" onClick={() => navigate('/consultant-func/tickets')}>
                {t('func.dashboard.tickets.manage')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {tickets.slice(0, 6).map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-border/70 bg-surface-1 p-4 cursor-pointer hover:bg-accent/40 transition-colors" onClick={() => navigate(`/consultant-func/tickets/${ticket.id}`)}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground">{ticket.title}</p>
                    <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{ticket.description}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      {ticket.status === 'DONE' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <TicketCheck className="h-3.5 w-3.5 text-primary" />
                      )}
                      {t(`entities.ticketStatus.${ticket.status}`)}
                    </span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {tickets.length === 0 && (
                <p className="text-sm text-muted-foreground">{t('func.dashboard.tickets.empty')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
