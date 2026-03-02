import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { KPICard } from '../../components/common/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';import { AllocationsAPI } from '../../services/odata/allocationsApi';
import { TicketsAPI } from '../../services/odata/ticketsApi';
import { UsersAPI } from '../../services/odata/usersApi';
import { Allocation, Ticket, TicketStatus, User } from '../../types/entities';

export const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoadError(null);
      const [fetchedTickets, fetchedUsers, fetchedAllocations] = await Promise.all([
        TicketsAPI.getAll(),
        UsersAPI.getAll(),
        AllocationsAPI.getAll(),
      ]);
      setTickets(fetchedTickets);
      setUsers(fetchedUsers);
      setAllocations(fetchedAllocations);
    } catch {
      setLoadError('Unable to load dashboard data. Some metrics may be outdated.');
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const tace = useMemo(() => {
    const techConsultants = users.filter((u) => u.role === 'CONSULTANT_TECHNIQUE' && u.active);
    if (techConsultants.length === 0) return 0;

    const today = new Date().toISOString().slice(0, 10);
    const rates = techConsultants.map((consultant) => {
      const currentAllocations = allocations.filter(
        (a) => a.userId === consultant.id && a.startDate <= today && a.endDate >= today
      );
      return Math.min(currentAllocations.reduce((sum, a) => sum + a.allocationPercent, 0), 100);
    });

    return Math.round(rates.reduce((sum, r) => sum + r, 0) / techConsultants.length);
  }, [users, allocations]);

  const productivityMetrics = useMemo(() => {
    const completed = tickets.filter((ticket) => ticket.status === 'DONE');
    const throughput = tickets.length ? (completed.length / tickets.length) * 100 : 0;
    const criticalIssues = tickets.filter(
      (ticket) => ticket.priority === 'CRITICAL' || ticket.status === 'BLOCKED'
    ).length;

    const onTime = completed.filter((ticket) => {
      if (!ticket.updatedAt || !ticket.dueDate) return false;
      return ticket.updatedAt <= ticket.dueDate;
    }).length;
    const slaRate = completed.length ? (onTime / completed.length) * 100 : 100;

    return {
      throughputRate: throughput,
      criticalIssues,
      slaRate,
      slaOnTime: onTime,
      slaTotal: completed.length,
    };
  }, [tickets]);

  const ticketBreakdown = useMemo(() => {
    const labels: Record<TicketStatus, string> = {
      PENDING_APPROVAL: 'Pending Approval',
      APPROVED: 'Approved',
      NEW: 'New',
      IN_PROGRESS: 'In Progress',
      IN_TEST: 'In Test',
      BLOCKED: 'Blocked',
      DONE: 'Done',
      REJECTED: 'Rejected',
    };

    const counts = tickets.reduce<Record<TicketStatus, number>>(
      (acc, ticket) => {
        acc[ticket.status] += 1;
        return acc;
      },
      {
        PENDING_APPROVAL: 0,
        APPROVED: 0,
        NEW: 0,
        IN_PROGRESS: 0,
        IN_TEST: 0,
        BLOCKED: 0,
        DONE: 0,
        REJECTED: 0,
      }
    );

    return (Object.entries(counts) as Array<[TicketStatus, number]>)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => ({ label: labels[status], count }));
  }, [tickets]);

  const criticalAlerts = useMemo(() => {
    const today = new Date();
    const blocked = tickets
      .filter((ticket) => ticket.status === 'BLOCKED')
      .slice(0, 3)
      .map((ticket) => ({
        type: 'blocked' as const,
        label: 'Ticket Blocked',
        message: ticket.title,
      }));

    const overdue = tickets
      .filter(
        (ticket) =>
          ticket.status !== 'DONE' &&
          ticket.status !== 'REJECTED' &&
          Boolean(ticket.dueDate) &&
          new Date(ticket.dueDate as string) < today
      )
      .slice(0, 3)
      .map((ticket) => ({
        type: 'deadline' as const,
        label: 'Deadline Risk',
        message: `${ticket.title} - overdue since ${new Date(ticket.dueDate as string).toLocaleDateString()}`,
      }));

    return [...blocked, ...overdue].slice(0, 4);
  }, [tickets]);

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title="Manager Dashboard"
        subtitle="Delivery progress, workload, and allocation in one view"
        breadcrumbs={[
          { label: 'Home', path: '/manager/dashboard' },
          { label: 'Manager Dashboard' },
        ]}
      />

      <div className="space-y-4 p-4 sm:space-y-6 sm:p-6 lg:p-8">
        {loadError && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
              <p className="text-sm text-destructive">{loadError}</p>
              <Button type="button" variant="outline" onClick={() => void loadData()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KPICard
            title="TACE"
            value={tace}
            unit="%"
            subtitle="Taux d'Activite (Conges Exclus)"
            icon="performance"
            state={tace >= 80 ? 'Positive' : tace >= 50 ? 'Warning' : 'Error'}
            progress={tace}
          />
          <KPICard
            title="SLA Respect"
            value={Math.round(productivityMetrics.slaRate)}
            unit="%"
            subtitle={`${productivityMetrics.slaOnTime}/${productivityMetrics.slaTotal} delivered on time`}
            icon="accept"
            state={productivityMetrics.slaRate >= 90 ? 'Positive' : productivityMetrics.slaRate >= 70 ? 'Warning' : 'Error'}
            progress={productivityMetrics.slaRate}
          />
          <KPICard
            title="Throughput"
            value={Math.round(productivityMetrics.throughputRate)}
            unit="%"
            subtitle="Completed tickets ratio"
            icon="trend-up"
            state={productivityMetrics.throughputRate >= 70 ? 'Positive' : 'Warning'}
            progress={productivityMetrics.throughputRate}
          />
          <KPICard
            title="Risk Hotspots"
            value={productivityMetrics.criticalIssues}
            subtitle="Critical or blocked tickets"
            icon="warning"
            state={productivityMetrics.criticalIssues > 0 ? 'Error' : 'Positive'}
          />
        </section>

        <div className="grid items-start gap-4 sm:gap-6 xl:grid-cols-2">
          <Card className="border-border/80 bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Delivery Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticketBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No ticket data available.</p>
              ) : (
                ticketBreakdown.map((entry) => (
                  <div key={entry.label} className="flex items-center justify-between rounded-md border border-border/70 p-3">
                    <span className="text-sm text-foreground">{entry.label}</span>
                    <span className="text-sm font-semibold text-foreground">{entry.count}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <aside className="space-y-4 sm:space-y-6">
            <Card className="border-border/80 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Critical Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {criticalAlerts.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    No critical alerts at this time.
                  </div>
                ) : (
                  criticalAlerts.map((alert, index) => (
                    <div
                      key={index}
                      className={
                        alert.type === 'blocked'
                          ? 'rounded-lg border border-destructive/30 bg-destructive/5 p-3'
                          : 'rounded-lg border border-accent bg-accent/40 p-3'
                      }
                    >
                      <p
                        className={`font-semibold text-xs uppercase tracking-wide ${
                          alert.type === 'blocked' ? 'text-destructive' : 'text-accent-foreground'
                        }`}
                      >
                        {alert.label}
                      </p>
                      <p className="mt-1 text-sm text-foreground">{alert.message}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-primary">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="default"
                  onClick={() => navigate('/manager/pending-approvals')}
                >
                  Pending Approvals ({tickets.filter((t) => t.status === 'PENDING_APPROVAL').length})
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="secondary"
                  onClick={() => navigate('/manager/allocations')}
                >
                  View Allocations
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="secondary"
                  onClick={() => navigate('/manager/risks')}
                >
                  Open Risks & Critical Tickets
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
};
