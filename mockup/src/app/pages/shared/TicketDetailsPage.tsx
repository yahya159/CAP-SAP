import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/common/PageHeader';
import { TicketDocumentationSection } from '../../components/business/TicketDocumentationSection';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { ProjectsAPI, TicketsAPI, UsersAPI } from '../../services/odataClient';
import { getBaseRouteForRole } from '../../context/roleRouting';
import { useAuth } from '../../context/AuthContext';
import {
  ticketStatusColor as statusColor,
  ticketPriorityColor as priorityColor,
} from '../../utils/ticketColors';
import {
  Project,
  SAP_MODULE_LABELS,
  Ticket,
  TicketEvent,
  TICKET_COMPLEXITY_LABELS,
  TICKET_NATURE_LABELS,
  TICKET_STATUS_LABELS,
  User,
  USER_ROLE_LABELS,
} from '../../types/entities';

const canAccessTicket = (ticket: Ticket, userId: string, role: User['role']): boolean => {
  if (role === 'CONSULTANT_TECHNIQUE') {
    return ticket.createdBy === userId || ticket.assignedTo === userId;
  }
  if (role === 'CONSULTANT_FONCTIONNEL') {
    return ticket.createdBy === userId || ticket.assignedTo === userId;
  }
  return true;
};

const renderEventText = (event: TicketEvent, userName: (id?: string) => string): React.ReactNode => {
  if (event.action === 'CREATED') return 'created this ticket';
  if (event.action === 'STATUS_CHANGE') {
    return (
      <>
        changed status from{' '}
        <Badge variant="outline" className="text-[10px] mx-0.5">
          {event.fromValue ?? '-'}
        </Badge>{' '}
        to{' '}
        <Badge variant="outline" className="text-[10px] mx-0.5">
          {event.toValue ?? '-'}
        </Badge>
      </>
    );
  }
  if (event.action === 'ASSIGNED') return `assigned to ${userName(event.toValue)}`;
  if (event.action === 'EFFORT_CHANGE') {
    return `updated effort from ${event.fromValue ?? '-'}h to ${event.toValue ?? '-'}h`;
  }
  if (event.action === 'PRIORITY_CHANGE') {
    return `changed priority from ${event.fromValue ?? '-'} to ${event.toValue ?? '-'}`;
  }
  if (event.action === 'SENT_TO_TEST') return 'sent ticket to functional testing';
  if (event.action === 'COMMENT') return event.comment ? `commented: ${event.comment}` : 'added a comment';
  return event.action;
};

export const TicketDetailsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const roleBasePath = currentUser ? getBaseRouteForRole(currentUser.role) : '';
  const ticketsPath = `${roleBasePath}/tickets`;

  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const userName = useCallback(
    (id?: string) => users.find((user) => user.id === id)?.name ?? '-',
    [users]
  );

  const sortedHistory = useMemo(
    () =>
      [...(ticket?.history ?? [])].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [ticket]
  );

  const handleDocumentationChanged = useCallback((targetTicketId: string, documentationIds: string[]) => {
    setTicket((prev) => {
      if (!prev || prev.id !== targetTicketId) return prev;
      return {
        ...prev,
        documentationObjectIds: documentationIds.length > 0 ? documentationIds : undefined,
      };
    });
  }, []);

  useEffect(() => {
    if (!ticketId || !currentUser) return;

    const load = async () => {
      setLoading(true);
      try {
        const [allTickets, allProjects, allUsers] = await Promise.all([
          TicketsAPI.getAll(),
          ProjectsAPI.getAll(),
          UsersAPI.getAll(),
        ]);
        const found = allTickets.find((item) => item.id === ticketId);
        if (!found) {
          toast.error('Ticket not found');
          navigate(ticketsPath, { replace: true });
          return;
        }
        if (!canAccessTicket(found, currentUser.id, currentUser.role)) {
          toast.error('You do not have access to this ticket');
          navigate(ticketsPath, { replace: true });
          return;
        }

        setTicket(found);
        setProject(allProjects.find((item) => item.id === found.projectId) ?? null);
        setUsers(allUsers);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [currentUser, navigate, ticketId, ticketsPath]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-8 text-muted-foreground">Loading ticket details...</div>
      </div>
    );
  }

  if (!ticket || !currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader
          title="Ticket Details"
          subtitle="Unable to load ticket"
          breadcrumbs={[
            { label: 'Home', path: `${roleBasePath}/dashboard` },
            { label: 'Tickets', path: ticketsPath },
          ]}
        />
        <div className="p-6">
          <div className="rounded-lg border bg-card p-5">
            <p className="text-sm text-muted-foreground">This ticket could not be loaded.</p>
            <Button className="mt-3" variant="outline" onClick={() => navigate(ticketsPath)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Tickets
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const canEditDocumentation = ticket.status !== 'DONE' && ticket.status !== 'REJECTED';

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={`${ticket.ticketCode} - ${ticket.title}`}
        subtitle="Detailed ticket view"
        breadcrumbs={[
          { label: 'Home', path: `${roleBasePath}/dashboard` },
          { label: 'Tickets', path: ticketsPath },
          { label: ticket.ticketCode },
        ]}
      />

      <div className="p-6 space-y-4">
        <div>
          <Button variant="outline" size="sm" onClick={() => navigate(ticketsPath)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Tickets
          </Button>
        </div>

        <section className="rounded-lg border bg-card p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge className={statusColor[ticket.status]}>{TICKET_STATUS_LABELS[ticket.status]}</Badge>
            <Badge className={priorityColor[ticket.priority]}>{ticket.priority}</Badge>
            <Badge variant="outline">{TICKET_NATURE_LABELS[ticket.nature]}</Badge>
            <Badge variant="outline">{ticket.module ? SAP_MODULE_LABELS[ticket.module] : '-'}</Badge>
            <Badge variant="outline">{TICKET_COMPLEXITY_LABELS[ticket.complexity]}</Badge>
          </div>

          <div className="text-sm text-muted-foreground">{ticket.description || '-'}</div>

          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div><span className="text-muted-foreground">Project:</span> {project?.name ?? ticket.projectId}</div>
            <div><span className="text-muted-foreground">WRICEF:</span> {ticket.wricefId ?? '-'}</div>
            <div><span className="text-muted-foreground">Ticket ID:</span> {ticket.ticketCode}</div>
            <div><span className="text-muted-foreground">Created by:</span> {userName(ticket.createdBy)}</div>
            <div><span className="text-muted-foreground">Assigned to:</span> {userName(ticket.assignedTo)}</div>
            <div>
              <span className="text-muted-foreground">Assigned role:</span>{' '}
              {ticket.assignedToRole ? USER_ROLE_LABELS[ticket.assignedToRole] : '-'}
            </div>
            <div><span className="text-muted-foreground">Estimation:</span> {ticket.estimationHours}h</div>
            <div><span className="text-muted-foreground">Effort:</span> {ticket.effortHours}h</div>
            <div><span className="text-muted-foreground">Due date:</span> {ticket.dueDate ?? '-'}</div>
            <div><span className="text-muted-foreground">Created at:</span> {new Date(ticket.createdAt).toLocaleString()}</div>
            <div><span className="text-muted-foreground">Updated at:</span> {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : '-'}</div>
            <div>
              <span className="text-muted-foreground">Estimated via abaque:</span>{' '}
              {ticket.estimatedViaAbaque ? 'Yes' : 'No'}
            </div>
          </div>

          {ticket.effortComment && (
            <div className="text-sm">
              <span className="text-muted-foreground">Effort note:</span> {ticket.effortComment}
            </div>
          )}

          <TicketDocumentationSection
            ticket={ticket}
            currentUserId={currentUser.id}
            canEdit={canEditDocumentation}
            resolveUserName={userName}
            onDocumentationChanged={handleDocumentationChanged}
          />
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">History</h3>
          <div className="space-y-2">
            {sortedHistory.map((event) => (
              <div
                key={event.id}
                className="rounded-md border-l-2 border-primary/30 bg-muted/20 px-3 py-2 text-xs"
              >
                <div className="text-[11px] text-muted-foreground">
                  {new Date(event.timestamp).toLocaleString()}
                </div>
                <div className="mt-1">
                  <span className="font-medium">{userName(event.userId)}</span>{' '}
                  {renderEventText(event, userName)}
                </div>
                {event.comment && event.action !== 'COMMENT' && event.action !== 'SENT_TO_TEST' && (
                  <div className="mt-1 text-[11px] text-muted-foreground">{event.comment}</div>
                )}
              </div>
            ))}
            {sortedHistory.length === 0 && (
              <p className="text-xs text-muted-foreground">No history available.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
