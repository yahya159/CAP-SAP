import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';import { NotificationsAPI } from '../../services/odata/notificationsApi';
import { ProjectsAPI } from '../../services/odata/projectsApi';
import { TicketsAPI } from '../../services/odata/ticketsApi';
import { UsersAPI } from '../../services/odata/usersApi';
import { Project, Ticket, TicketStatus, User } from '../../types/entities';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';

const TICKET_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  NEW: ['IN_PROGRESS', 'BLOCKED', 'REJECTED'],
  IN_PROGRESS: ['IN_TEST', 'BLOCKED', 'DONE', 'REJECTED'],
  IN_TEST: ['IN_PROGRESS', 'DONE', 'REJECTED'],
  BLOCKED: ['IN_PROGRESS', 'REJECTED'],
  DONE: [],
  REJECTED: ['NEW'],
};

const riskFromPriority = (priority: Ticket['priority']): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
  if (priority === 'CRITICAL') return 'CRITICAL';
  if (priority === 'HIGH') return 'HIGH';
  if (priority === 'MEDIUM') return 'MEDIUM';
  return 'LOW';
};

const priorityFromRisk = (risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): Ticket['priority'] => {
  if (risk === 'CRITICAL') return 'CRITICAL';
  if (risk === 'HIGH') return 'HIGH';
  if (risk === 'MEDIUM') return 'MEDIUM';
  return 'LOW';
};

const canTransitionStatus = (from: TicketStatus, to: TicketStatus): boolean =>
  from === to || TICKET_STATUS_TRANSITIONS[from].includes(to);

const getStatusOptions = (current: TicketStatus): TicketStatus[] => [
  current,
  ...TICKET_STATUS_TRANSITIONS[current],
];

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const maybeError = error as {
      message?: unknown;
      details?: Array<{ message?: unknown }>;
      status?: unknown;
    };
    if (typeof maybeError.message === 'string' && maybeError.message.trim()) {
      return maybeError.message;
    }
    if (Array.isArray(maybeError.details)) {
      const firstDetail = maybeError.details.find(
        (detail) => typeof detail?.message === 'string' && detail.message.trim()
      );
      if (firstDetail && typeof firstDetail.message === 'string') {
        return firstDetail.message;
      }
    }
    if (typeof maybeError.status === 'number') {
      return `Request failed (${maybeError.status})`;
    }
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Failed to update ticket';
};

export const RisksAndCriticalTasks: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyCritical, setShowOnlyCritical] = useState(true);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ticketData, projectData, userData] = await Promise.all([
        TicketsAPI.getAll(),
        ProjectsAPI.getAll(),
        UsersAPI.getAll(),
      ]);
      setTickets(ticketData);
      setProjects(projectData);
      setUsers(userData);
    } finally {
      setLoading(false);
    }
  };

  const rows = useMemo(() => {
    const filtered = tickets.filter((ticket) => {
      const risk = riskFromPriority(ticket.priority);
      const riskCondition = risk === 'HIGH' || risk === 'CRITICAL' || ticket.status === 'BLOCKED';
      if (showOnlyCritical) {
        return ticket.priority === 'CRITICAL' || riskCondition;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      const score = (ticket: Ticket) => {
        let risk = 0;
        if (ticket.priority === 'CRITICAL') risk += 40;
        if (ticket.priority === 'HIGH') risk += 30;
        if (ticket.status === 'BLOCKED') risk += 20;
        return risk;
      };
      return score(b) - score(a);
    });
  }, [showOnlyCritical, tickets]);

  const counts = useMemo(
    () => ({
      blocked: tickets.filter((ticket) => ticket.status === 'BLOCKED').length,
      highRisk: tickets.filter((ticket) => ticket.priority === 'HIGH').length,
      criticalRisk: tickets.filter((ticket) => ticket.priority === 'CRITICAL').length,
      criticalTickets: tickets.filter((ticket) => ticket.priority === 'CRITICAL').length,
    }),
    [tickets]
  );

  const consultantAssignees = useMemo(
    () =>
      users.filter(
        (user) =>
          user.role === 'CONSULTANT_TECHNIQUE' || user.role === 'CONSULTANT_FONCTIONNEL'
      ),
    [users]
  );

  const notifyAssignee = async (userId: string | undefined, title: string, message: string) => {
    if (!userId) return;
    try {
      await NotificationsAPI.create({
        userId,
        type: 'TICKET_UPDATED',
        title,
        message,
        read: false,
      });
    } catch {
      // no-op
    }
  };

  const updateTicket = async (ticketId: string, patch: Partial<Ticket>): Promise<Ticket | null> => {
    try {
      const updated = await TicketsAPI.update(ticketId, patch);
      setTickets((prev) => prev.map((ticket) => (ticket.id === ticketId ? updated : ticket)));
      return updated;
    } catch (error) {
      toast.error(getErrorMessage(error));
      const status = typeof error === 'object' && error !== null
        ? (error as { status?: unknown }).status
        : undefined;
      if (status === 409) {
        await loadData();
      }
      return null;
    }
  };

  const setMitigation = async (ticket: Ticket, mitigation: string) => {
    const nextComment = mitigation.trim();
    if ((ticket.effortComment ?? '') === nextComment) return;

    const updated = await updateTicket(ticket.id, { effortComment: nextComment });
    if (updated) {
      await notifyAssignee(
        updated.assignedTo,
        'Mitigation Updated',
        `${updated.title}: mitigation notes were updated by manager.`
      );
    }
  };

  const setStatus = async (ticket: Ticket, status: TicketStatus) => {
    if (status === ticket.status) return;

    const latestTicket = await TicketsAPI.getById(ticket.id);
    if (!latestTicket) {
      toast.error('Ticket no longer exists');
      await loadData();
      return;
    }

    if (latestTicket.status !== ticket.status) {
      setTickets((prev) => prev.map((item) => (item.id === latestTicket.id ? latestTicket : item)));
    }

    if (!canTransitionStatus(latestTicket.status, status)) {
      toast.error(`Invalid status transition: ${latestTicket.status} -> ${status}`);
      return;
    }

    const updated = await updateTicket(ticket.id, { status });
    if (updated) {
      await notifyAssignee(
        updated.assignedTo,
        'Ticket Status Updated',
        `${updated.title}: status changed to ${status}.`
      );
    }
  };

  const setRisk = async (ticket: Ticket, riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => {
    const updated = await updateTicket(ticket.id, { priority: priorityFromRisk(riskLevel) });
    if (updated) {
      await notifyAssignee(
        updated.assignedTo,
        'Risk Level Updated',
        `${updated.title}: risk level changed to ${riskLevel}.`
      );
    }
  };

  const setAssignee = async (ticket: Ticket, assigneeId: string) => {
    const nextAssigneeId = assigneeId || undefined;
    const updated = await updateTicket(ticket.id, { assignedTo: nextAssigneeId });
    if (updated && nextAssigneeId) {
      await notifyAssignee(
        nextAssigneeId,
        'Ticket Reassigned',
        `${updated.title}: you have been assigned as mitigation owner.`
      );
    }
  };

  const setDeadline = async (ticket: Ticket, dueDate: string) => {
    if (!dueDate || ticket.dueDate === dueDate) return;
    const updated = await updateTicket(ticket.id, { dueDate });
    if (updated) {
      await notifyAssignee(
        updated.assignedTo,
        'Deadline Updated',
        `${updated.title}: deadline changed to ${new Date(dueDate).toLocaleDateString()}.`
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Risks & Critical Tickets"
        subtitle="Track blocked work, risk level and mitigation actions"
        breadcrumbs={[
          { label: 'Home', path: '/manager/dashboard' },
          { label: 'Risks & Critical Tickets' },
        ]}
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Blocked Tickets</p>
            <p className="text-2xl font-semibold text-destructive">{counts.blocked}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">High Risk</p>
            <p className="text-2xl font-semibold text-primary">{counts.highRisk}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Critical Risk</p>
            <p className="text-2xl font-semibold text-destructive">{counts.criticalRisk}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Critical Tickets</p>
            <p className="text-2xl font-semibold text-foreground">{counts.criticalTickets}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-3">
            <Label htmlFor="show-critical-risks" className="text-sm text-foreground">
              Show only critical or risky tickets
            </Label>
            <Switch
              id="show-critical-risks"
              checked={showOnlyCritical}
              onCheckedChange={(checked) => setShowOnlyCritical(Boolean(checked))}
            />
          </div>
          <div className="text-sm text-muted-foreground">{rows.length} tickets displayed</div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full min-w-[1120px]">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">Ticket</th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">Project</th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">Assignee</th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">Risk</th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">Deadline</th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">Mitigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Loading risk register...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No matching tickets.
                  </td>
                </tr>
              ) : (
                rows.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-accent/40 align-top">
                    <td className="px-4 py-3 text-sm text-foreground">
                      <div className="font-medium flex items-center gap-2">
                        {ticket.title}
                        {ticket.priority === 'CRITICAL' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-destructive/12 text-destructive">
                            <AlertTriangle className="w-3 h-3" />
                            Critical
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Due: {ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {projects.find((project) => project.id === ticket.projectId)?.name ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <Select
                        value={ticket.assignedTo ?? 'UNASSIGNED'}
                        onValueChange={(value) =>
                          void setAssignee(ticket, value === 'UNASSIGNED' ? '' : value)
                        }
                      >
                        <SelectTrigger aria-label={`Assignee for ${ticket.title}`} className="min-w-[190px]">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                          {consultantAssignees.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={ticket.status}
                        onValueChange={(value) => void setStatus(ticket, value as TicketStatus)}
                      >
                        <SelectTrigger aria-label={`Status for ${ticket.title}`} className="min-w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getStatusOptions(ticket.status).map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={riskFromPriority(ticket.priority)}
                        onValueChange={(value) => void setRisk(ticket, value as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')}
                      >
                        <SelectTrigger aria-label={`Risk level for ${ticket.title}`} className="min-w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">LOW</SelectItem>
                          <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                          <SelectItem value="HIGH">HIGH</SelectItem>
                          <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="date"
                        aria-label={`Deadline for ${ticket.title}`}
                        defaultValue={ticket.dueDate ?? ''}
                        className="min-w-[170px]"
                        onBlur={(event) => void setDeadline(ticket, event.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Textarea
                        aria-label={`Mitigation notes for ${ticket.title}`}
                        defaultValue={ticket.effortComment ?? ''}
                        onBlur={(event) => void setMitigation(ticket, event.target.value)}
                        placeholder="Mitigation action / blocker details"
                        rows={2}
                        className="w-full min-w-[240px]"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
