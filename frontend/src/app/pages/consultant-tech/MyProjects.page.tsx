import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/common/PageHeader';import { ProjectsAPI } from '../../services/odata/projectsApi';
import { TicketsAPI } from '../../services/odata/ticketsApi';
import { UsersAPI } from '../../services/odata/usersApi';
import { Project, Ticket, User } from '../../types/entities';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../../components/common/EmptyState';
import { FolderKanban } from 'lucide-react';

export const MyProjects: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    void loadData(currentUser.id);
  }, [currentUser]);

  const loadData = async (userId: string) => {
    setLoading(true);
    try {
      const [userTickets, allProjects, allUsers] = await Promise.all([
        TicketsAPI.getByUser(userId),
        ProjectsAPI.getAll(),
        UsersAPI.getAll(),
      ]);

      const projectIds = new Set(userTickets.map((ticket) => ticket.projectId));
      setProjects(allProjects.filter((project) => projectIds.has(project.id)));
      setTickets(userTickets);
      setUsers(allUsers);
    } finally {
      setLoading(false);
    }
  };

  const projectsWithStats = useMemo(() => {
    const progressByStatus: Record<Ticket['status'], number> = {
      PENDING_APPROVAL: 5,
      APPROVED: 10,
      NEW: 0,
      IN_PROGRESS: 50,
      IN_TEST: 80,
      BLOCKED: 40,
      DONE: 100,
      REJECTED: 100,
    };

    return projects.map((project) => {
      const projectTickets = tickets.filter((ticket) => ticket.projectId === project.id);
      const done = projectTickets.filter((ticket) => ticket.status === 'DONE').length;
      const blocked = projectTickets.filter((ticket) => ticket.status === 'BLOCKED').length;
      const progress = projectTickets.length
        ? projectTickets.reduce((sum, ticket) => sum + progressByStatus[ticket.status], 0) /
          projectTickets.length
        : project.progress ?? 0;
      const manager = users.find((user) => user.id === project.managerId);
      return { project, manager, done, blocked, progress, projectTickets };
    });
  }, [projects, tickets, users]);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={t('consultant.myProjects.title')}
        subtitle={t('consultant.myProjects.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/consultant-tech/dashboard' },
          { label: t('consultant.myProjects.title') },
        ]}
      />

      <div className="p-6">
        {loading ? (
          <div className="text-muted-foreground">{t('consultant.myProjects.loading')}</div>
        ) : projectsWithStats.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title={t('consultant.myProjects.emptyTitle')}
            description={t('consultant.myProjects.emptyDesc')}
            className="mt-8"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projectsWithStats.map(({ project, manager, done, blocked, progress, projectTickets }) => (
              <div key={project.id} className="bg-card border border-border rounded-lg p-5 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded border border-border">
                    <p className="text-muted-foreground text-xs">{t('consultant.myProjects.manager')}</p>
                    <p className="font-medium text-foreground">{manager?.name ?? 'Unknown'}</p>
                  </div>
                  <div className="p-3 rounded border border-border">
                    <p className="text-muted-foreground text-xs">{t('consultant.myProjects.period')}</p>
                    <p className="font-medium text-foreground">
                      {new Date(project.startDate).toLocaleDateString()} -{' '}
                      {new Date(project.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{t('consultant.myProjects.myProgress')}</span>
                    <span className="font-medium text-foreground">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded border border-border p-2 text-center">
                    <div className="text-xl font-semibold text-foreground">{projectTickets.length}</div>
                    <div className="text-xs text-muted-foreground">{t('consultant.myProjects.assigned')}</div>
                  </div>
                  <div className="rounded border border-border p-2 text-center">
                    <div className="text-xl font-semibold text-primary">{done}</div>
                    <div className="text-xs text-muted-foreground">{t('consultant.myProjects.done')}</div>
                  </div>
                  <div className="rounded border border-border p-2 text-center">
                    <div className="text-xl font-semibold text-destructive">{blocked}</div>
                    <div className="text-xs text-muted-foreground">{t('consultant.myProjects.blocked')}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
