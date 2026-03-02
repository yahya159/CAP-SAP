import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  FileText,
  Layers,
  Tag,
  UserCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { AssignmentToggle } from '../../features/tickets/components/AssignmentToggle';
import { TicketsAPI } from '../../services/odata/ticketsApi';
import { UsersAPI } from '../../services/odata/usersApi';
import { ProjectsAPI } from '../../services/odata/projectsApi';
import { AllocationsAPI } from '../../services/odata/allocationsApi';
import {
  Allocation,
  Project,
  Ticket,
  User,
  SAP_MODULE_LABELS,
  TICKET_COMPLEXITY_LABELS,
  TICKET_NATURE_LABELS,
  TICKET_STATUS_LABELS,
} from '../../types/entities';
import {
  ticketStatusColor,
  ticketPriorityColor,
  ticketNatureColor,
} from '../../utils/ticketColors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtDate = (d?: string | null) => {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(d));
  } catch {
    return d;
  }
};

const fmtHours = (h?: number | null) => (h != null ? `${h}h` : '—');

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const PendingApprovals: React.FC = () => {
  // ---- Data state --------------------------------------------------------
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);

  // ---- Selection / interaction state -------------------------------------
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTech, setSelectedTech] = useState('');
  const [allocatedHours, setAllocatedHours] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reject modal
  const [rejectTarget, setRejectTarget] = useState<Ticket | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // ---- Data loading ------------------------------------------------------

  const loadData = useCallback(async () => {
    try {
      const [t, u, p, a] = await Promise.all([
        TicketsAPI.getAll(),
        UsersAPI.getAll(),
        ProjectsAPI.getAll(),
        AllocationsAPI.getAll(),
      ]);
      setTickets(t);
      setUsers(u);
      setProjects(p);
      setAllocations(a);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // ---- Derived data ------------------------------------------------------

  const pendingTickets = useMemo(
    () => tickets.filter((t) => t.status === 'PENDING_APPROVAL'),
    [tickets],
  );

  const selectedTicket = useMemo(
    () => pendingTickets.find((t) => t.id === selectedId) ?? null,
    [pendingTickets, selectedId],
  );

  // Auto-select first ticket when list changes
  useEffect(() => {
    if (!selectedTicket && pendingTickets.length > 0) {
      setSelectedId(pendingTickets[0].id);
    }
  }, [pendingTickets, selectedTicket]);

  // Pre-fill allocated hours when selecting a ticket
  useEffect(() => {
    if (selectedTicket) {
      setAllocatedHours(String(selectedTicket.estimationHours ?? 0));
      setSelectedTech('');
    }
  }, [selectedTicket]);

  // ---- Resolvers ---------------------------------------------------------

  const userName = useCallback(
    (id?: string | null) => {
      if (!id) return '—';
      return users.find((u) => u.id === id)?.name ?? id;
    },
    [users],
  );

  const projectName = useCallback(
    (id?: string | null) => {
      if (!id) return '—';
      return projects.find((p) => p.id === id)?.name ?? id;
    },
    [projects],
  );

  // consultant workload (allocation percentage used today)
  const consultantWorkload = useCallback(
    (userId: string) => {
      const today = new Date().toISOString().slice(0, 10);
      const active = allocations.filter(
        (a) => a.userId === userId && a.startDate <= today && a.endDate >= today,
      );
      return Math.min(active.reduce((s, a) => s + a.allocationPercent, 0), 100);
    },
    [allocations],
  );

  // ---- Actions -----------------------------------------------------------

  const handleApprove = async () => {
    if (!selectedTicket) return;
    if (!selectedTech) {
      toast.error('Please select a technical consultant before approving');
      return;
    }
    const hours = Number(allocatedHours);
    if (!hours || hours <= 0) {
      toast.error('Allocated hours must be greater than 0');
      return;
    }
    setSubmitting(true);
    try {
      await TicketsAPI.approveTicket(selectedTicket.id, selectedTech, hours);
      toast.success('Ticket approved & assigned', {
        description: `"${selectedTicket.title}" → ${userName(selectedTech)} (${hours}h)`,
      });
      // Refresh inline — the approved ticket will disappear from the pending list
      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id
            ? { ...t, status: 'APPROVED' as const, assignedTo: selectedTech, allocatedHours: hours }
            : t,
        ),
      );
      setSelectedId(null);
    } catch {
      toast.error('Failed to approve ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setSubmitting(true);
    try {
      await TicketsAPI.rejectTicket(rejectTarget.id, rejectionReason.trim());
      toast.success('Ticket rejected');
      setTickets((prev) =>
        prev.map((t) =>
          t.id === rejectTarget.id ? { ...t, status: 'REJECTED' as const } : t,
        ),
      );
      setRejectTarget(null);
      setRejectionReason('');
      if (selectedId === rejectTarget.id) setSelectedId(null);
    } catch {
      toast.error('Failed to reject ticket');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Render helpers ----------------------------------------------------

  const DetailRow: React.FC<{
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
  }> = ({ icon, label, children }) => (
    <div className="flex items-start gap-3 text-sm">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="font-medium text-foreground">{children}</div>
      </div>
    </div>
  );

  // ---- Render ------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title="Pending Approvals"
        subtitle={`${pendingTickets.length} ticket(s) awaiting your review & assignment`}
        breadcrumbs={[
          { label: 'Home', path: '/manager/dashboard' },
          { label: 'Pending Approvals' },
        ]}
      />

      {pendingTickets.length === 0 ? (
        <div className="p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle2 className="mb-3 h-10 w-10 text-primary/40" />
              <p className="text-sm font-medium text-foreground">All caught up!</p>
              <p className="mt-1 text-xs text-muted-foreground">
                No tickets pending approval right now.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid h-[calc(100vh-10rem)] grid-cols-1 gap-0 lg:grid-cols-[340px_1fr]">
          {/* ====== LEFT: Ticket list ====================================== */}
          <aside className="overflow-y-auto border-r border-border bg-muted/20 lg:block">
            <div className="p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tickets ({pendingTickets.length})
              </p>
              <div className="space-y-1.5">
                {pendingTickets.map((ticket) => {
                  const active = ticket.id === selectedId;
                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => setSelectedId(ticket.id)}
                      className={`group flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${
                        active
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-transparent hover:border-border hover:bg-muted/60'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {ticket.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                          <Badge className={`${ticketPriorityColor[ticket.priority]} border-0 text-[10px] px-1.5 py-0`}>
                            {ticket.priority}
                          </Badge>
                          <Badge className={`${ticketNatureColor[ticket.nature]} border-0 text-[10px] px-1.5 py-0`}>
                            {TICKET_NATURE_LABELS[ticket.nature]}
                          </Badge>
                          <span className="text-muted-foreground">
                            {fmtDate(ticket.createdAt)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          active ? 'text-primary' : 'text-muted-foreground/40 group-hover:text-muted-foreground'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ====== RIGHT: Detail + Assignment ============================== */}
          <main className="overflow-y-auto">
            {!selectedTicket ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Select a ticket from the list to review
              </div>
            ) : (
              <div className="p-5 lg:p-6 space-y-6">
                {/* --- Header with status badges --- */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge className={`${ticketStatusColor[selectedTicket.status]} border-0`}>
                      {TICKET_STATUS_LABELS[selectedTicket.status]}
                    </Badge>
                    <Badge className={`${ticketPriorityColor[selectedTicket.priority]} border-0`}>
                      {selectedTicket.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedTicket.ticketCode}
                    </Badge>
                    {!selectedTicket.assignedTo && (
                      <Badge variant="destructive" className="text-[10px] gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Unassigned
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {selectedTicket.title}
                  </h2>
                  {selectedTicket.description && (
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                      {selectedTicket.description}
                    </p>
                  )}
                </div>

                <Separator />

                {/* --- Metadata grid --- */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailRow icon={<Layers className="h-4 w-4" />} label="Project">
                    {projectName(selectedTicket.projectId)}
                  </DetailRow>
                  <DetailRow icon={<Cpu className="h-4 w-4" />} label="Module">
                    {selectedTicket.module ? SAP_MODULE_LABELS[selectedTicket.module] : '—'}
                  </DetailRow>
                  <DetailRow icon={<Tag className="h-4 w-4" />} label="Nature">
                    <Badge className={`${ticketNatureColor[selectedTicket.nature]} border-0 text-xs`}>
                      {TICKET_NATURE_LABELS[selectedTicket.nature]}
                    </Badge>
                  </DetailRow>
                  <DetailRow icon={<FileText className="h-4 w-4" />} label="Complexity">
                    {TICKET_COMPLEXITY_LABELS[selectedTicket.complexity]}
                  </DetailRow>
                  <DetailRow icon={<Clock className="h-4 w-4" />} label="Estimation">
                    {fmtHours(selectedTicket.estimationHours)}
                    {selectedTicket.estimatedViaAbaque && (
                      <span className="ml-1 text-[10px] text-primary">(abaque)</span>
                    )}
                  </DetailRow>
                  <DetailRow icon={<Calendar className="h-4 w-4" />} label="Due Date">
                    {fmtDate(selectedTicket.dueDate)}
                  </DetailRow>
                  <DetailRow icon={<UserCircle className="h-4 w-4" />} label="Created By">
                    {userName(selectedTicket.createdBy)}
                  </DetailRow>
                  <DetailRow icon={<Calendar className="h-4 w-4" />} label="Created At">
                    {fmtDate(selectedTicket.createdAt)}
                  </DetailRow>
                  {selectedTicket.wricefId && (
                    <DetailRow icon={<FileText className="h-4 w-4" />} label="WRICEF ID">
                      {selectedTicket.wricefId}
                    </DetailRow>
                  )}
                </div>

                {/* --- Tags if any --- */}
                {selectedTicket.tags && selectedTicket.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTicket.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <Separator />

                {/* ==========================================================
                    ASSIGNMENT SECTION
                    ========================================================== */}
                <Card className="border-primary/30 bg-primary/[0.02]">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-primary">
                      <UserCircle className="h-5 w-5" />
                      Assign Technical Consultant
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Choose a consultant manually or let the AI dispatcher recommend the best fit
                      based on skills, availability, and current workload.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* AssignmentToggle (Manual / AI) */}
                    <AssignmentToggle
                      ticket={selectedTicket}
                      users={users}
                      allTickets={tickets}
                      value={selectedTech}
                      onChange={setSelectedTech}
                    />

                    {/* Selected consultant quick-info */}
                    {selectedTech && (
                      <SelectedConsultantCard
                        user={users.find((u) => u.id === selectedTech)}
                        workload={consultantWorkload(selectedTech)}
                        activeTickets={
                          tickets.filter(
                            (t) =>
                              t.assignedTo === selectedTech &&
                              !['DONE', 'REJECTED'].includes(t.status),
                          ).length
                        }
                      />
                    )}

                    {/* Allocated hours */}
                    <div className="space-y-1.5">
                      <Label htmlFor="allocated-hours" className="text-sm font-medium">
                        Allocated Hours Budget
                      </Label>
                      <div className="flex items-center gap-3">
                        <Input
                          id="allocated-hours"
                          type="number"
                          min={0.5}
                          step={0.5}
                          value={allocatedHours}
                          onChange={(e) => setAllocatedHours(e.target.value)}
                          placeholder="e.g. 8"
                          className="max-w-[140px]"
                        />
                        {selectedTicket.estimationHours > 0 && (
                          <span className="text-xs text-muted-foreground">
                            Estimated: {selectedTicket.estimationHours}h
                          </span>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Action buttons */}
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => void handleApprove()}
                        disabled={submitting || !selectedTech}
                        className="gap-1.5"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {submitting ? 'Approving...' : 'Approve & Assign'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setRejectTarget(selectedTicket);
                          setRejectionReason('');
                        }}
                        disabled={submitting}
                        className="gap-1.5"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      )}

      {/* ---- Reject Dialog ---- */}
      <Dialog
        open={rejectTarget !== null}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Ticket</DialogTitle>
            <DialogDescription>
              {rejectTarget && (
                <>Provide a reason for rejecting &quot;{rejectTarget.title}&quot;.</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Label htmlFor="rejection-reason">Reason</Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this ticket is being rejected..."
              rows={4}
              className="mt-1.5"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectTarget(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleReject()}
              disabled={submitting}
            >
              {submitting ? 'Rejecting...' : 'Reject Ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Selected Consultant Info Card
// ---------------------------------------------------------------------------

const SelectedConsultantCard: React.FC<{
  user?: User;
  workload: number;
  activeTickets: number;
}> = ({ user, workload, activeTickets }) => {
  if (!user) return null;

  const barColor =
    workload >= 90
      ? 'bg-red-500'
      : workload >= 70
        ? 'bg-amber-500'
        : 'bg-emerald-500';

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {user.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-[10px] text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {activeTickets} active ticket{activeTickets !== 1 ? 's' : ''}
        </Badge>
      </div>
      <div className="space-y-0.5">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Current workload</span>
          <span className="font-semibold">{workload}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(workload, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
