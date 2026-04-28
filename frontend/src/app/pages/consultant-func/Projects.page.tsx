import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/common/PageHeader';import { DeliverablesAPI } from '../../services/odata/deliverablesApi';
import { NotificationsAPI } from '../../services/odata/notificationsApi';
import { ProjectFeedbackAPI } from '../../services/odata/projectFeedbackApi';
import { ProjectsAPI } from '../../services/odata/projectsApi';
import { TicketsAPI } from '../../services/odata/ticketsApi';
import { UsersAPI } from '../../services/odata/usersApi';
import { Deliverable, Project, ProjectFeedback, Ticket, User } from '../../types/entities';
import { ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';
import { openTeamsChat } from '../../utils/teamsChat';

export const FuncProjects: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});
  const [feedbackHistory, setFeedbackHistory] = useState<Record<string, ProjectFeedback[]>>({});

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [projectData, deliverableData, ticketData, userData] = await Promise.all([
        ProjectsAPI.getAll(),
        DeliverablesAPI.getAll(),
        TicketsAPI.getAll(),
        UsersAPI.getAll(),
      ]);
      setProjects(projectData);
      setDeliverables(deliverableData);
      setTickets(ticketData);
      setUsers(userData);

      // Load feedback history for all projects
      const feedbackResults = await Promise.all(
        projectData.map((p) => ProjectFeedbackAPI.getByProject(p.id))
      );
      const historyMap: Record<string, ProjectFeedback[]> = {};
      projectData.forEach((p, i) => {
        if (feedbackResults[i].length > 0) {
          historyMap[p.id] = feedbackResults[i];
        }
      });
      setFeedbackHistory(historyMap);
    } catch (error) {
      setProjects([]);
      setDeliverables([]);
      setTickets([]);
      setUsers([]);
      const message = error instanceof Error ? error.message : t('func.deliverables.toasts.loadFailed');
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const rows = useMemo(() => {
    return projects.map((project) => {
      const projectDeliverables = deliverables.filter((deliverable) => deliverable.projectId === project.id);
      const pending = projectDeliverables.filter((deliverable) => deliverable.validationStatus === 'PENDING').length;
      const changes = projectDeliverables.filter(
        (deliverable) => deliverable.validationStatus === 'CHANGES_REQUESTED'
      ).length;
      const projectTickets = tickets.filter((ticket) => ticket.projectId === project.id);
      const blocked = projectTickets.filter((ticket) => ticket.status === 'BLOCKED').length;
      const manager = users.find((user) => user.id === project.managerId);
      const technicalConsultant = users.find(
        (user) =>
          user.role === 'CONSULTANT_TECHNIQUE' &&
          projectTickets.some((ticket) => ticket.assignedTo === user.id)
      );
      return { project, pending, changes, blocked, manager, technicalConsultant };
    });
  }, [deliverables, projects, tickets, users]);

  const openTeamsDiscussion = (tech?: User) => {
    if (!currentUser || !tech) return;
    openTeamsChat(
      [currentUser.email, tech.email],
      'Need clarification on business requirements for current project.'
    );
  };

  const submitFeedback = async (project: Project, manager?: User) => {
    if (!currentUser) return;
    const content = (feedbackDrafts[project.id] ?? '').trim();

    if (content.length < 10) {
      toast.error(t('func.projects.feedback.errorShort'));
      return;
    }

    try {
      const created = await ProjectFeedbackAPI.create({
        projectId: project.id,
        authorId: currentUser.id,
        content,
      });

      setFeedbackHistory((prev) => ({
        ...prev,
        [project.id]: [created, ...(prev[project.id] ?? [])],
      }));
      setFeedbackDrafts((prev) => ({ ...prev, [project.id]: '' }));

      if (manager) {
        try {
          await NotificationsAPI.create({
            userId: manager.id,
            type: 'PROJECT_FEEDBACK',
            title: 'New Functional Project Feedback',
            message: `${currentUser.name} submitted a project feedback for ${project.name}: "${content.slice(0, 200)}"`,
            read: false,
          });
        } catch {
          // Silent fallback for notification.
        }
      }

      toast.success(t('func.projects.feedback.success'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('func.projects.feedback.saveFailed');
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={t('func.projects.title')}
        subtitle={t('func.projects.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/consultant-func/dashboard' },
          { label: t('func.projects.title') },
        ]}
      />

      <div className="p-6">
        {loadError && (
          <Card className="mb-6 border-destructive/50">
            <CardContent className="pt-4 text-sm text-destructive">{loadError}</CardContent>
          </Card>
        )}
        {loading ? (
          <div className="text-muted-foreground">{t('func.projects.loading')}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {rows.map(({ project, pending, changes, blocked, manager, technicalConsultant }) => (
              <Card key={project.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded border border-border">
                    <div className="text-xs text-muted-foreground">{t('func.projects.manager')}</div>
                    <div className="font-medium text-foreground">{manager?.name ?? 'Unknown'}</div>
                  </div>
                  <div className="p-3 rounded border border-border">
                    <div className="text-xs text-muted-foreground">{t('func.projects.techContact')}</div>
                    <div className="font-medium text-foreground">
                      {technicalConsultant?.name ?? t('func.projects.notAssigned')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded border border-border p-2 text-center">
                    <div className="text-xl font-semibold text-primary">{pending}</div>
                    <div className="text-xs text-muted-foreground">{t('func.projects.pending')}</div>
                  </div>
                  <div className="rounded border border-border p-2 text-center">
                    <div className="text-xl font-semibold text-destructive">{changes}</div>
                    <div className="text-xs text-muted-foreground">{t('func.projects.changesReq')}</div>
                  </div>
                  <div className="rounded border border-border p-2 text-center">
                    <div className="text-xl font-semibold text-accent-foreground">{blocked}</div>
                    <div className="text-xs text-muted-foreground">{t('func.projects.blockedTickets')}</div>
                  </div>
                </div>

                <Button
                  type="button"
                  className="w-full"
                  disabled={!technicalConsultant}
                  onClick={() => openTeamsDiscussion(technicalConsultant)}
                >
                  <ExternalLink className="w-4 h-4" />
                  {t('func.projects.openTeams')}
                </Button>

                <div className="space-y-2 rounded border border-border p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {t('func.projects.feedback.title')}
                  </p>
                  <Textarea
                    value={feedbackDrafts[project.id] ?? ''}
                    onChange={(event) =>
                      setFeedbackDrafts((prev) => ({ ...prev, [project.id]: event.target.value }))
                    }
                    rows={3}
                    placeholder={t('func.projects.feedback.placeholder')}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void submitFeedback(project, manager)}
                  >
                    {t('func.projects.feedback.submit')}
                  </Button>

                  {(feedbackHistory[project.id] ?? []).slice(0, 2).map((feedback, index) => (
                    <div key={`${project.id}-feedback-${index}`} className="rounded bg-surface-2 p-2 text-xs">
                      <p className="font-medium text-foreground">
                        {users.find((u) => u.id === feedback.authorId)?.name ?? 'Unknown'}
                      </p>
                      <p className="mt-1 text-muted-foreground">{feedback.content}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {new Date(feedback.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
