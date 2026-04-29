import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Database, ServerCog, Users } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { KPICard } from '../../components/common/KPICard';import { NotificationsAPI } from '../../services/odata/notificationsApi';
import { ProjectsAPI } from '../../services/odata/projectsApi';
import { TicketsAPI } from '../../services/odata/ticketsApi';
import { UsersAPI } from '../../services/odata/usersApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Notification } from '../../types/entities';

export const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const odataEndpoint = '/odata/v4/* (4 Microservices)';
  const [userCount, setUserCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [auditEvents, setAuditEvents] = useState<
    Array<Notification & { userName: string }>
  >([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const kpiReferences = [
    {
      name: t('admin.dashboard.kpiReferences.totalUsers.name'),
      formula: t('admin.dashboard.kpiReferences.totalUsers.formula'),
      source: t('admin.dashboard.kpiReferences.totalUsers.source'),
      refresh: t('admin.dashboard.kpiReferences.totalUsers.refresh'),
    },
    {
      name: t('admin.dashboard.kpiReferences.activeUsers.name'),
      formula: t('admin.dashboard.kpiReferences.activeUsers.formula'),
      source: t('admin.dashboard.kpiReferences.activeUsers.source'),
      refresh: t('admin.dashboard.kpiReferences.activeUsers.refresh'),
    },
    {
      name: t('admin.dashboard.kpiReferences.projects.name'),
      formula: t('admin.dashboard.kpiReferences.projects.formula'),
      source: t('admin.dashboard.kpiReferences.projects.source'),
      refresh: t('admin.dashboard.kpiReferences.projects.refresh'),
    },
    {
      name: t('admin.dashboard.kpiReferences.tickets.name'),
      formula: t('admin.dashboard.kpiReferences.tickets.formula'),
      source: t('admin.dashboard.kpiReferences.tickets.source'),
      refresh: t('admin.dashboard.kpiReferences.tickets.refresh'),
    },
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoadError(null);
      try {
        const [users, projects, tickets] = await Promise.all([
          UsersAPI.getAll(),
          ProjectsAPI.getAll(),
          TicketsAPI.getAll(),
        ]);

        const allNotifications = (
          await Promise.all(users.map((user) => NotificationsAPI.getByUser(user.id)))
        ).flat();
        const userNameById = new Map(users.map((user) => [user.id, user.name] as const));

        setUserCount(users.length);
        setProjectCount(projects.length);
        setTicketCount(tickets.length);
        setActiveUsers(users.filter((user) => user.active).length);
        setAuditEvents(
          [...allNotifications]
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map((event) => ({
              ...event,
              userName: userNameById.get(event.userId) ?? event.userId,
            }))
        );
      } catch {
        setLoadError(t('admin.dashboard.errors.loadFailed'));
      }
    };

    void loadData();
  }, [t]);

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title={t('admin.dashboard.title')}
        subtitle={t('admin.dashboard.subtitle')}
        breadcrumbs={[{ label: t('admin.dashboard.breadcrumb') }]}
      />

      <div className="space-y-6 p-6 lg:p-8">
        {loadError && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-4">
              <p className="text-sm text-destructive">{loadError}</p>
            </CardContent>
          </Card>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KPICard title={t('admin.dashboard.kpi.totalUsers')} value={userCount} icon="group" color="blue" />
          <KPICard title={t('admin.dashboard.kpi.activeUsers')} value={activeUsers} icon="group" color="green" />
          <KPICard
            title={t('admin.dashboard.kpi.projects')}
            value={projectCount}
            icon="project-definition-triangle-2"
            color="yellow"
          />
          <KPICard title={t('admin.dashboard.kpi.tickets')} value={ticketCount} icon="ticket" color="purple" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
          <Card className="bg-card/92">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-4 w-4 text-primary" />
                {t('admin.dashboard.kpi.definitions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-border/70">
                <table className="w-full min-w-[580px]">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                        {t('admin.dashboard.table.kpi')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                        {t('admin.dashboard.table.formula')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                        {t('admin.dashboard.table.source')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                        {t('admin.dashboard.table.refresh')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpiReferences.map((kpi) => (
                      <tr key={kpi.name} className="border-t border-border/60">
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{kpi.name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{kpi.formula}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{kpi.source}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{kpi.refresh}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/92">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ServerCog className="h-4 w-4 text-primary" />
                {t('admin.dashboard.systemStatus.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border/70 bg-surface-2 p-4">
                <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
                  {t('admin.dashboard.systemStatus.backendMode')}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge>{t('admin.dashboard.systemStatus.liveApi')}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {t('admin.dashboard.systemStatus.connected')}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-surface-2 p-4">
                <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
                  {t('admin.dashboard.systemStatus.odataEndpoint')}
                </p>
                <p className="mt-2 break-all text-sm font-medium text-foreground">{odataEndpoint}</p>
              </div>

              <div className="rounded-xl border border-border/70 bg-surface-2 p-4">
                <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
                  {t('admin.dashboard.systemStatus.activitySnapshot')}
                </p>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t('admin.dashboard.systemStatus.userRecords')}
                    </span>
                    <span className="font-semibold text-foreground">{userCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      {t('admin.dashboard.systemStatus.projectEntities')}
                    </span>
                    <span className="font-semibold text-foreground">{projectCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      {t('admin.dashboard.systemStatus.auditEvents')}
                    </span>
                    <span className="font-semibold text-foreground">{auditEvents.length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/92">
          <CardHeader>
            <CardTitle className="text-lg">{t('admin.dashboard.auditLog')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-border/70">
              <table className="w-full min-w-[760px]">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                      {t('admin.dashboard.auditTable.timestamp')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                      {t('admin.dashboard.auditTable.user')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                      {t('admin.dashboard.auditTable.event')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                      {t('admin.dashboard.auditTable.message')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                      {t('admin.dashboard.auditTable.status')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {auditEvents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        {t('admin.dashboard.auditTable.empty')}
                      </td>
                    </tr>
                  ) : (
                    auditEvents.slice(0, 12).map((event) => (
                      <tr key={event.id}>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(event.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{event.userName}</td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{event.title}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{event.message}</td>
                        <td className="px-4 py-3">
                          <Badge variant={event.read ? 'secondary' : 'default'}>
                            {event.read ? t('admin.dashboard.auditStatus.read') : t('admin.dashboard.auditStatus.unread')}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
