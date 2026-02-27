import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { PageHeader } from '../../components/common/PageHeader';
import {
  AbaquesAPI,
  ProjectsAPI,
  TicketsAPI,
  TimeLogsAPI,
  UsersAPI,
  WricefObjectsAPI,
} from '../../services/odataClient';
import {
  Abaque,
  ABAQUE_TASK_NATURE_LABELS,
  AbaqueComplexity,
  AbaqueEntry,
  Project,
  Ticket,
  TicketEvent,
  TicketNature,
  TicketStatus,
  TicketComplexity,
  TICKET_COMPLEXITY_LABELS,
  TimeLog,
  User,
  TICKET_NATURE_LABELS,
  TICKET_STATUS_LABELS,
  USER_ROLE_LABELS,
  SAPModule,
  SAP_MODULE_LABELS,
  WricefObject,
} from '../../types/entities';
import { useAuth } from '../../context/AuthContext';
import { getBaseRouteForRole } from '../../context/roleRouting';
import {
  Calculator,
  CalendarDays,
  CheckCircle2,
  Clock,
  FlaskConical,
  KanbanSquare,
  List,
  Plus,
  Scale,
  Send,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { cn } from '../../components/ui/utils';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { TicketDocumentationSection } from '../../components/business/TicketDocumentationSection';
import { createTicketWithUnifiedFlow } from '../../services/ticketCreation';
import {
  ticketStatusColor as statusColor,
  ticketPriorityColor as priorityColor,
  ticketNatureColor as natureColor,
} from '../../utils/ticketColors';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type ViewMode = 'list' | 'calendar' | 'kanban';

interface TicketForm {
  projectId: string;
  assignedTo: string;
  priority: Ticket['priority'];
  nature: TicketNature;
  title: string;
  description: string;
  dueDate: string;
  wricefId: string;
  module: SAPModule;
  estimationHours: number;
  complexity: TicketComplexity;
}

const EMPTY_FORM: TicketForm = {
  projectId: '',
  assignedTo: '',
  priority: 'MEDIUM',
  nature: 'PROGRAMME',
  title: '',
  description: '',
  dueDate: '',
  wricefId: '',
  module: 'OTHER',
  estimationHours: 0,
  complexity: 'SIMPLE',
};

const STATUS_ORDER: TicketStatus[] = ['NEW', 'IN_PROGRESS', 'IN_TEST', 'BLOCKED', 'DONE', 'REJECTED'];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ConsultantTicketsPageProps {
  /** Page title */
  title: string;
  /** Page subtitle */
  subtitle: string;
  /** Home breadcrumb path */
  homePath: string;
  /** Filter tickets to only those belonging to the current user */
  filterFn: (tickets: Ticket[], userId: string) => Ticket[];
}

// ---------------------------------------------------------------------------
// Shared Component
// ---------------------------------------------------------------------------

export const ConsultantTicketsPage: React.FC<ConsultantTicketsPageProps> = ({
  title,
  subtitle,
  homePath,
  filterFn,
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [form, setForm] = useState<TicketForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Ticket['status'] | 'ALL'>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // StraTIME imputation modal state
  const [showImputation, setShowImputation] = useState(false);
  const [imputationTicket, setImputationTicket] = useState<Ticket | null>(null);
  const [imputationDesc, setImputationDesc] = useState('');
  const [imputationDuration, setImputationDuration] = useState('');
  const [imputationDate, setImputationDate] = useState('');
  const [isSendingStraTIME, setIsSendingStraTIME] = useState(false);
  const [ticketTimeLogs, setTicketTimeLogs] = useState<TimeLog[]>([]);

  // Effort editing state for detail dialog
  const [editingEffort, setEditingEffort] = useState(false);
  const [effortValue, setEffortValue] = useState('');
  const [effortComment, setEffortComment] = useState('');

  // Time logs for badges - keyed by ticketId
  const [timeLogsMap, setTimeLogsMap] = useState<Record<string, TimeLog[]>>({});

  // WRICEF / Abaque state
  const [isManualWricef, setIsManualWricef] = useState(true);
  const [linkedAbaque, setLinkedAbaque] = useState<Abaque | null>(null);
  const roleBasePath = currentUser ? getBaseRouteForRole(currentUser.role) : '';

  useEffect(() => {
    if (!currentUser) return;
    void loadData();
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projectData, userData, ticketData, timeLogData] = await Promise.all([
        ProjectsAPI.getAll(),
        UsersAPI.getAll(),
        TicketsAPI.getAll(),
        TimeLogsAPI.getAll(),
      ]);
      setProjects(projectData);
      setUsers(userData);
      const filtered = filterFn(ticketData, currentUser!.id);
      setTickets(filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

      // Build time-logs map per ticket
      const logsMap: Record<string, TimeLog[]> = {};
      timeLogData.forEach((tl) => {
        if (!logsMap[tl.ticketId]) logsMap[tl.ticketId] = [];
        logsMap[tl.ticketId].push(tl);
      });
      setTimeLogsMap(logsMap);
    } finally {
      setLoading(false);
    }
  };

  const userName = (id?: string) => users.find((u) => u.id === id)?.name ?? '-';
  const userRole = (id?: string) => {
    const u = users.find((u) => u.id === id);
    return u ? USER_ROLE_LABELS[u.role] : '-';
  };
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? id;

  // WRICEF & Abaque derived state
  const selectedProject = useMemo(() => projects.find((p) => p.id === form.projectId), [projects, form.projectId]);
  const [wricefObjects, setWricefObjects] = useState<WricefObject[]>([]);
  const hasWricefObjects = wricefObjects.length > 0;

  useEffect(() => {
    const loadWricefObjects = async () => {
      if (selectedProject?.id) {
        try {
          const objects = await WricefObjectsAPI.getByProject(selectedProject.id);
          setWricefObjects(objects);
        } catch (error) {
          console.error('Failed to load wricef objects', error);
          setWricefObjects([]);
        }
      } else {
        setWricefObjects([]);
      }
    };
    void loadWricefObjects();
  }, [selectedProject?.id]);

  useEffect(() => {
    setIsManualWricef(!hasWricefObjects);
  }, [hasWricefObjects, form.projectId]);

  useEffect(() => {
    const loadAbaque = async () => {
      if (selectedProject?.linkedAbaqueId) {
        const abq = await AbaquesAPI.getById(selectedProject.linkedAbaqueId);
        setLinkedAbaque(abq);
      } else {
        setLinkedAbaque(null);
      }
    };
    void loadAbaque();
  }, [selectedProject?.linkedAbaqueId]);

  const toAbaqueComplexity = (tc: TicketComplexity): AbaqueComplexity => {
    switch (tc) {
      case 'SIMPLE': return 'LOW';
      case 'MOYEN': return 'MEDIUM';
      case 'COMPLEXE': case 'TRES_COMPLEXE': return 'HIGH';
    }
  };

  const abaqueEntry = useMemo<AbaqueEntry | null>(() => {
    if (!linkedAbaque) return null;
    const abaqueComplexity = toAbaqueComplexity(form.complexity);
    return linkedAbaque.entries.find(
      (e) => e.taskNature === form.nature && e.complexity === abaqueComplexity
    ) ?? null;
  }, [linkedAbaque, form.nature, form.complexity]);

  const abaqueTaskNatures = useMemo(() => {
    if (!linkedAbaque) return [];
    return [...new Set(linkedAbaque.entries.map((entry) => entry.taskNature))];
  }, [linkedAbaque]);

  const getAbaqueEstimate = (
    abaque: Abaque,
    taskNature: TicketNature,
    complexity: AbaqueComplexity
  ): number | null => {
    const direct = abaque.entries.find(
      (entry) => entry.taskNature === taskNature && entry.complexity === complexity
    );
    if (direct) return direct.standardHours;
    const fallbackByNature: Record<TicketNature, 'FEATURE' | 'DOCUMENTATION' | 'SUPPORT'> = {
      PROGRAMME: 'FEATURE',
      MODULE: 'FEATURE',
      ENHANCEMENT: 'FEATURE',
      FORMULAIRE: 'DOCUMENTATION',
      REPORT: 'DOCUMENTATION',
      WORKFLOW: 'SUPPORT',
    };
    const fallback = fallbackByNature[taskNature];
    return (
      abaque.entries.find(
        (entry) => entry.taskNature === fallback && entry.complexity === complexity
      )?.standardHours ?? null
    );
  };

  const [isEstimatedByAbaque, setIsEstimatedByAbaque] = useState(false);

  const applyAbaqueEstimate = () => {
    if (!linkedAbaque) {
      toast.error('No abaque linked to this project');
      return;
    }
    const abaqueComplexity = toAbaqueComplexity(form.complexity);
    const estimate = getAbaqueEstimate(linkedAbaque, form.nature, abaqueComplexity);
    if (estimate === null) {
      toast.error('No matching abaque entry for selected nature and complexity');
      return;
    }
    setForm((prev) => ({ ...prev, estimationHours: estimate }));
    setIsEstimatedByAbaque(true);
    toast.success('Effort pre-filled from project abaque');
  };

  const handleDocumentationChanged = useCallback((ticketId: string, documentationIds: string[]) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              documentationObjectIds: documentationIds.length > 0 ? documentationIds : undefined,
            }
          : ticket
      )
    );
    setSelectedTicket((prev) =>
      prev?.id === ticketId
        ? {
            ...prev,
            documentationObjectIds: documentationIds.length > 0 ? documentationIds : undefined,
          }
        : prev
    );
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          projectName(t.projectId).toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tickets, statusFilter, searchQuery, projects]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!form.projectId || !form.title.trim()) {
      toast.error('Project and title are required');
      return;
    }
    try {
      setIsSubmitting(true);
      const project = projects.find((item) => item.id === form.projectId);
      if (!project) {
        toast.error('Selected project not found');
        return;
      }
      const assignedToRole = form.assignedTo
        ? users.find((user) => user.id === form.assignedTo)?.role
        : undefined;
      const { ticket: created, updatedProject } = await createTicketWithUnifiedFlow({
        project,
        existingProjectTickets: tickets.filter((ticket) => ticket.projectId === project.id),
        wricefObjects,
        createdBy: currentUser.id,
        assignedTo: form.assignedTo || undefined,
        assignedToRole,
        priority: form.priority,
        nature: form.nature,
        title: form.title.trim(),
        description: form.description.trim(),
        dueDate: form.dueDate || undefined,
        module: form.module,
        complexity: form.complexity,
        estimationHours: form.estimationHours,
        estimatedViaAbaque: !!(abaqueEntry && form.estimationHours === abaqueEntry.standardHours),
        selectedWricefObjectId: !isManualWricef ? form.wricefId.trim() || undefined : undefined,
        manualWricefId: isManualWricef ? form.wricefId.trim() || undefined : undefined,
        creationComment: 'Ticket created',
      });

      setTickets((prev) => [created, ...prev]);
      if (updatedProject) {
        setProjects((prev) =>
          prev.map((item) => (item.id === updatedProject.id ? updatedProject : item))
        );
      }
      setForm(EMPTY_FORM);
      setShowCreate(false);
      toast.success('Ticket created successfully');
    } catch {
      toast.error('Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeStatus = async (ticket: Ticket, newStatus: TicketStatus) => {
    if (!currentUser) return;
    const event: TicketEvent = {
      id: `te${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      action: 'STATUS_CHANGE',
      fromValue: ticket.status,
      toValue: newStatus,
    };

    try {
      const updated = await TicketsAPI.update(ticket.id, {
        status: newStatus,
        history: [...(ticket.history || []), event],
      });
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? updated : t)));
      if (selectedTicket?.id === ticket.id) setSelectedTicket(updated);
      toast.success(`Status changed to ${TICKET_STATUS_LABELS[newStatus]}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const openTicketDetails = useCallback(
    (ticketId: string) => navigate(`${roleBasePath}/tickets/${ticketId}`),
    [navigate, roleBasePath]
  );

  const sendToTest = async (ticket: Ticket) => {
    if (!currentUser) return;
    const event: TicketEvent = {
      id: `te${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      action: 'SENT_TO_TEST',
      fromValue: ticket.status,
      toValue: 'IN_TEST',
      comment: `Effort: ${ticket.effortHours ?? 0}h transferred to functional testing`,
    };
    try {
      const updated = await TicketsAPI.update(ticket.id, {
        status: 'IN_TEST',
        history: [...(ticket.history || []), event],
      });
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? updated : t)));
      if (selectedTicket?.id === ticket.id) setSelectedTicket(updated);
      toast.success('Ticket sent to functional testing');
    } catch {
      toast.error('Failed to send to test');
    }
  };

  const updateEffort = async (ticket: Ticket, hours: number, comment: string) => {
    if (!currentUser) return;
    const event: TicketEvent = {
      id: `te${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      action: 'EFFORT_CHANGE',
      fromValue: String(ticket.effortHours ?? 0),
      toValue: String(hours),
      comment: comment || undefined,
    };
    try {
      const updated = await TicketsAPI.update(ticket.id, {
        effortHours: hours,
        effortComment: comment || ticket.effortComment,
        history: [...(ticket.history || []), event],
      });
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? updated : t)));
      if (selectedTicket?.id === ticket.id) setSelectedTicket(updated);
      setEditingEffort(false);
      toast.success('Effort hours updated');
    } catch {
      toast.error('Failed to update effort');
    }
  };

  // ---------------------------------------------------------------------------
  // StraTIME Imputation
  // ---------------------------------------------------------------------------

  const openImputation = useCallback(async (ticket: Ticket) => {
    const mins = Math.max(1, Math.round((ticket.effortHours ?? 0) * 60));
    setImputationTicket(ticket);
    setImputationDuration(String(mins));
    setImputationDate(new Date().toISOString().slice(0, 10));
    setImputationDesc(`Travail sur: ${ticket.title}`);
    setShowImputation(true);

    // Load ticket-specific time logs for the modal
    try {
      const logs = await TimeLogsAPI.getByTicket(ticket.id);
      setTicketTimeLogs(logs);
    } catch {
      setTicketTimeLogs([]);
    }
  }, []);

  const submitImputation = async () => {
    if (!imputationTicket || !currentUser) return;
    const duration = parseInt(imputationDuration, 10);
    if (!duration || duration <= 0) {
      toast.error('Duration must be positive');
      return;
    }
    try {
      setIsSendingStraTIME(true);
      const newLog = await TimeLogsAPI.create({
        consultantId: currentUser.id,
        ticketId: imputationTicket.id,
        projectId: imputationTicket.projectId,
        date: imputationDate,
        durationMinutes: duration,
        description: imputationDesc.trim(),
        sentToStraTIME: false,
      });
      // Immediately send to StraTIME (simulated)
      const sent = await TimeLogsAPI.sendToStraTIME(newLog.id);
      // Update local maps
      setTimeLogsMap((prev) => ({
        ...prev,
        [imputationTicket.id]: [...(prev[imputationTicket.id] || []), sent],
      }));
      setTicketTimeLogs((prev) => [...prev, sent]);
      toast.success('Imputation sent to StraTIME');
      setShowImputation(false);
    } catch {
      toast.error('Failed to send to StraTIME');
    } finally {
      setIsSendingStraTIME(false);
    }
  };

  // Check if ticket has all time logs sent to StraTIME
  const isFullyImputed = (ticketId: string): boolean => {
    const logs = timeLogsMap[ticketId];
    return !!logs && logs.length > 0 && logs.every((l) => l.sentToStraTIME);
  };

  const formatDurationShort = (totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h${String(m).padStart(2, '0')}`;
    return `${m}min`;
  };

  // ---------------------------------------------------------------------------
  // Calendar helpers
  // ---------------------------------------------------------------------------

  const calendarDays = useMemo(() => {
    const [y, m] = calendarMonth.split('-').map(Number);
    const firstDay = new Date(y, m - 1, 1);
    const lastDay = new Date(y, m, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

    for (let i = -startOffset; i <= lastDay.getDate() + (6 - ((lastDay.getDay() + 6) % 7)); i++) {
      const d = new Date(y, m - 1, i + 1);
      days.push({
        date: d.toISOString().slice(0, 10),
        day: d.getDate(),
        isCurrentMonth: d.getMonth() === m - 1,
      });
    }
    return days;
  }, [calendarMonth]);

  const ticketsByDate = useMemo(() => {
    const map: Record<string, Ticket[]> = {};
    filteredTickets.forEach((t) => {
      const dateKey = t.dueDate || t.createdAt.slice(0, 10);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(t);
    });
    return map;
  }, [filteredTickets]);

  const prevMonth = () => {
    const [y, m] = calendarMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    setCalendarMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const nextMonth = () => {
    const [y, m] = calendarMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    setCalendarMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  // ---------------------------------------------------------------------------
  // Calendar drag/drop (native HTML5)
  // ---------------------------------------------------------------------------

  const onDragStart = (e: React.DragEvent, ticketId: string) => {
    e.dataTransfer.setData('text/plain', ticketId);
  };

  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  // ---------------------------------------------------------------------------
  // Kanban drag/drop (@hello-pangea/dnd)
  // ---------------------------------------------------------------------------

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination || viewMode !== 'kanban') return;
    const sourceId = result.source.droppableId;
    const destinationId = result.destination.droppableId;
    if (sourceId === destinationId) return;

    const ticketId = result.draggableId;
    const ticket = tickets.find((t) => t.id === ticketId);
    
    if (ticket) {
      const targetStatus = destinationId as TicketStatus;
      if (ticket.status !== targetStatus) {
        void changeStatus(ticket, targetStatus);
      }
    }
  }, [tickets, viewMode, changeStatus]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={[
          { label: 'Home', path: homePath },
          { label: 'Tickets' },
        ]}
      />

      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-60"
          />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>{TICKET_STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-1 rounded-lg border border-border p-0.5">
            {([['list', List], ['calendar', CalendarDays], ['kanban', KanbanSquare]] as const).map(
              ([mode, Icon]) => (
                <Button
                  key={mode}
                  size="sm"
                  variant={viewMode === mode ? 'default' : 'ghost'}
                  onClick={() => setViewMode(mode as ViewMode)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              )
            )}
          </div>

          <div className="flex-1" />
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-1 h-4 w-4" /> New Ticket
          </Button>
        </div>

        {/* Views */}
        {loading ? (
          <p className="text-muted-foreground">Loading tickets...</p>
        ) : viewMode === 'list' ? (
          <div className="rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="px-4">Title</TableHead>
                  <TableHead className="px-4">Project</TableHead>
                  <TableHead className="px-4">Nature</TableHead>
                  <TableHead className="px-4">Status</TableHead>
                  <TableHead className="px-4">Priority</TableHead>
                  <TableHead className="px-4">Effort</TableHead>
                  <TableHead className="px-4">Due</TableHead>
                  <TableHead className="px-4">Assigned</TableHead>
                  <TableHead className="px-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id} className="cursor-pointer hover:bg-accent/40" onClick={() => openTicketDetails(ticket.id)}>
                    <TableCell className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        {ticket.title}
                        {isFullyImputed(ticket.id) && (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-0.5" />Impute</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-muted-foreground">{projectName(ticket.projectId)}</TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={natureColor[ticket.nature]}>{TICKET_NATURE_LABELS[ticket.nature]}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={statusColor[ticket.status]}>{TICKET_STATUS_LABELS[ticket.status]}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={priorityColor[ticket.priority]}>{ticket.priority}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      {(ticket.effortHours ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {ticket.effortHours}h
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">{ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      <div>{userName(ticket.assignedTo)}</div>
                      {ticket.assignedToRole && (
                        <div className="text-[10px] text-muted-foreground">{USER_ROLE_LABELS[ticket.assignedToRole]}</div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        {ticket.status === 'IN_PROGRESS' && (
                          <Button size="sm" variant="outline" className="text-purple-600 border-purple-300" onClick={() => void sendToTest(ticket)}>
                            <FlaskConical className="h-3 w-3 mr-1" /> Test
                          </Button>
                        )}
                        {ticket.status !== 'DONE' && ticket.status !== 'REJECTED' && (
                          <Button size="sm" variant="outline" onClick={() => void changeStatus(ticket, 'DONE')}>Done</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTickets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">No tickets found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : viewMode === 'calendar' ? (
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-4">
              <Button size="sm" variant="outline" onClick={prevMonth}>Prev</Button>
              <h3 className="text-lg font-semibold">{calendarMonth}</h3>
              <Button size="sm" variant="outline" onClick={nextMonth}>Next</Button>
            </div>
            <div className="grid grid-cols-7 gap-px bg-border rounded overflow-hidden">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="bg-muted p-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
              ))}
              {calendarDays.map((cell) => {
                const dayTickets = ticketsByDate[cell.date] || [];
                return (
                  <div
                    key={cell.date}
                    onDragOver={onDragOver}
                    onDrop={(e) => {
                      e.preventDefault();
                      const ticketId = e.dataTransfer.getData('text/plain');
                      const ticket = tickets.find((t) => t.id === ticketId);
                      if (ticket) {
                        void TicketsAPI.update(ticket.id, { dueDate: cell.date }).then((upd) => {
                          setTickets((prev) => prev.map((t) => (t.id === upd.id ? upd : t)));
                          toast.success(`Due date set to ${cell.date}`);
                        });
                      }
                    }}
                    className={`min-h-[80px] bg-card p-1.5 ${!cell.isCurrentMonth ? 'opacity-40' : ''}`}
                  >
                    <div className="text-xs font-medium text-muted-foreground mb-1">{cell.day}</div>
                    {dayTickets.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, t.id)}
                        onClick={() => openTicketDetails(t.id)}
                        className="mb-0.5 cursor-grab truncate rounded px-1 py-0.5 text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20"
                      >
                        {t.title}
                      </div>
                    ))}
                    {dayTickets.length > 3 && (
                      <div className="text-[10px] text-muted-foreground">+{dayTickets.length - 3} more</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-3 overflow-x-auto pb-4">
              {STATUS_ORDER.map((status) => {
                const col = filteredTickets.filter((t) => t.status === status);
                return (
                  <Droppable key={status} droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "min-w-[240px] flex-1 rounded-lg border p-3 flex flex-col transition-colors",
                          snapshot.isDraggingOver ? "bg-muted/50 border-primary/30" : "bg-muted/30"
                        )}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <Badge className={statusColor[status]}>{TICKET_STATUS_LABELS[status]}</Badge>
                          <span className="text-xs text-muted-foreground">{col.length}</span>
                        </div>
                        <div className="space-y-2 min-h-[100px] flex-1">
                          {col.map((ticket, index) => (
                            <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => openTicketDetails(ticket.id)}
                                  className={cn(
                                    "rounded-lg border bg-card p-3 shadow-sm transition",
                                    snapshot.isDragging ? "shadow-md scale-[1.02] rotate-2 z-50 ring-1 ring-primary/20 brightness-110 cursor-grabbing" : "cursor-grab hover:shadow"
                                  )}
                                  style={provided.draggableProps.style}
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <p className="text-sm font-medium text-foreground">{ticket.title}</p>
                                    {isFullyImputed(ticket.id) && (
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                    )}
                                  </div>
                                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{ticket.description}</p>
                                  <div className="mt-2 flex items-center justify-between">
                                    <div className="flex gap-1">
                                      <Badge className={priorityColor[ticket.priority] + ' text-[10px]'}>{ticket.priority}</Badge>
                                      <Badge className={natureColor[ticket.nature] + ' text-[10px]'}>{TICKET_NATURE_LABELS[ticket.nature]}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {(ticket.effortHours ?? 0) > 0 && (
                                        <span className="text-[10px] font-mono flex items-center gap-0.5 text-muted-foreground">
                                          <Clock className="h-2.5 w-2.5" />
                                          {ticket.effortHours}h
                                        </span>
                                      )}
                                      <span className="text-[10px] text-muted-foreground">{userName(ticket.assignedTo)}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </DragDropContext>
        )}
      </div>

      {/* Create Ticket Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => {
        setShowCreate(open);
        if (!open) setIsEstimatedByAbaque(false);
      }}>
        <DialogContent className="max-w-5xl sm:max-w-5xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              New Ticket
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <form onSubmit={(e) => void submitTicket(e)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Project *</Label>
              <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assign To</Label>
              <Select value={form.assignedTo} onValueChange={(v) => setForm({ ...form, assignedTo: v })}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  {users.filter((u) => u.role !== 'ADMIN').map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name} ({USER_ROLE_LABELS[u.role]})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5 flex flex-col justify-end">
              <div className="flex items-center justify-between">
                <Label>{isManualWricef ? 'WRICEF ID' : 'Existing Object'}</Label>
                <button
                  type="button"
                  onClick={() => setIsManualWricef((prev) => !prev)}
                  className="text-[10px] text-primary hover:underline hover:text-primary/80"
                >
                  {isManualWricef ? 'Select Existing Object' : 'Manual Entry'}
                </button>
              </div>
              {!isManualWricef ? (
                <Select
                  value={form.wricefId}
                  onValueChange={(v) => {
                    const obj = wricefObjects.find((o) => o.id === v);
                    if (obj) {
                      setForm({
                        ...form,
                        wricefId: obj.id,
                        title: form.title || obj.title,
                        description: form.description || obj.description,
                        complexity: obj.complexity,
                      });
                    } else {
                      setForm({ ...form, wricefId: v });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select imported object" />
                  </SelectTrigger>
                  <SelectContent>
                    {wricefObjects.length > 0 ? (
                      wricefObjects.map((obj) => (
                        <SelectItem key={obj.id} value={obj.id}>
                          {obj.id} - {obj.title}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        No objects imported for this project.
                      </div>
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={form.wricefId} onChange={(e) => setForm({ ...form, wricefId: e.target.value })} placeholder="e.g. W-001, R-015" />
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Module *</Label>
              <Select value={form.module} onValueChange={(v) => setForm({ ...form, module: v as SAPModule })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(SAP_MODULE_LABELS) as SAPModule[]).map((m) => (
                    <SelectItem key={m} value={m}>{SAP_MODULE_LABELS[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nature *</Label>
              <Select value={form.nature} onValueChange={(v) => setForm({ ...form, nature: v as TicketNature })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(TICKET_NATURE_LABELS) as [TicketNature, string][]).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Complexity *</Label>
              <Select value={form.complexity} onValueChange={(v) => setForm({ ...form, complexity: v as TicketComplexity })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TICKET_COMPLEXITY_LABELS) as TicketComplexity[]).map((c) => (
                    <SelectItem key={c} value={c}>{TICKET_COMPLEXITY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Estimation (hours)</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={applyAbaqueEstimate}
                  disabled={!linkedAbaque}
                >
                  <Calculator className="h-3.5 w-3.5 mr-1" />
                  Use Abaque Estimate
                </Button>
              </div>
              <Input type="number" min={0} step={0.5} value={form.estimationHours} onChange={(e) => { setForm({ ...form, estimationHours: Number(e.target.value) }); setIsEstimatedByAbaque(false); }} />
              {isEstimatedByAbaque && (
                <Badge variant="secondary" className="inline-flex items-center gap-1">
                  <Scale className="h-3 w-3" />
                  Standard guideline match
                </Badge>
              )}
              {abaqueEntry && !isEstimatedByAbaque && (
                <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs">
                  <Calculator className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-muted-foreground">
                    Abaque suggests <span className="font-semibold text-foreground">{abaqueEntry.standardHours}h</span> for {TICKET_NATURE_LABELS[form.nature]} × {TICKET_COMPLEXITY_LABELS[form.complexity]}
                  </span>
                  {form.estimationHours !== abaqueEntry.standardHours && (
                    <button
                      type="button"
                      onClick={() => { setForm({ ...form, estimationHours: abaqueEntry.standardHours }); setIsEstimatedByAbaque(true); }}
                      className="ml-auto text-[10px] font-medium text-primary hover:underline whitespace-nowrap"
                    >
                      Apply
                    </button>
                  )}
                </div>
              )}
              {linkedAbaque && !abaqueEntry && !isEstimatedByAbaque && (
                <p className="text-[10px] text-muted-foreground">
                  No abaque entry for {TICKET_NATURE_LABELS[form.nature]} × {TICKET_COMPLEXITY_LABELS[form.complexity]} in "{linkedAbaque.name}"
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Ticket['priority'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => { setShowCreate(false); setIsEstimatedByAbaque(false); }}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create'}</Button>
            </div>
          </form>

          {/* Abaque reference side panel */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground">Abaque Reference</div>
            {selectedProject && (
              <div className="rounded border border-border/70 bg-muted/30 p-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Project:</span> {selectedProject.name}
                </p>
                <p>
                  <span className="text-muted-foreground">Abaque:</span>{' '}
                  {linkedAbaque?.name ?? 'No linked abaque'}
                </p>
              </div>
            )}
            {!linkedAbaque ? (
              <div className="rounded-lg border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                {form.projectId
                  ? 'Link an abaque to the project to see standard effort values.'
                  : 'Select a project to view abaque reference.'}
              </div>
            ) : (
              <div className="rounded-lg border border-border/70 bg-surface-2 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/55">
                    <TableRow>
                      <TableHead className="px-3">Nature</TableHead>
                      <TableHead className="px-3 text-center">L</TableHead>
                      <TableHead className="px-3 text-center">M</TableHead>
                      <TableHead className="px-3 text-center">H</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {abaqueTaskNatures.map((taskNature) => {
                      const low = linkedAbaque.entries.find(
                        (entry) => entry.taskNature === taskNature && entry.complexity === 'LOW'
                      )?.standardHours;
                      const medium = linkedAbaque.entries.find(
                        (entry) => entry.taskNature === taskNature && entry.complexity === 'MEDIUM'
                      )?.standardHours;
                      const high = linkedAbaque.entries.find(
                        (entry) => entry.taskNature === taskNature && entry.complexity === 'HIGH'
                      )?.standardHours;
                      const activeRow = taskNature === form.nature;
                      return (
                        <TableRow
                          key={taskNature}
                          className={activeRow ? 'bg-primary/10' : undefined}
                        >
                          <TableCell className="px-3 py-2 text-xs font-medium">
                            {ABAQUE_TASK_NATURE_LABELS[taskNature]}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-center text-xs">{low ?? '-'}</TableCell>
                          <TableCell className="px-3 py-2 text-center text-xs">{medium ?? '-'}</TableCell>
                          <TableCell className="px-3 py-2 text-center text-xs">{high ?? '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail / History Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => { setSelectedTicket(null); setEditingEffort(false); }}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          {selectedTicket && (() => {
            const canEdit = selectedTicket.status !== 'DONE' && selectedTicket.status !== 'REJECTED';
            return (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedTicket.title}
                  {isFullyImputed(selectedTicket.id) && (
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs"><CheckCircle2 className="h-3 w-3 mr-0.5" />Impute</Badge>
                  )}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className={statusColor[selectedTicket.status]}>{TICKET_STATUS_LABELS[selectedTicket.status]}</Badge>
                  <Badge className={priorityColor[selectedTicket.priority]}>{selectedTicket.priority}</Badge>
                  <Badge className={natureColor[selectedTicket.nature]}>{TICKET_NATURE_LABELS[selectedTicket.nature]}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">{selectedTicket.description}</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Ticket ID:</span> {selectedTicket.ticketCode}</div>
                  <div><span className="text-muted-foreground">WRICEF:</span> {selectedTicket.wricefId}</div>
                  <div><span className="text-muted-foreground">Module:</span> {selectedTicket.module ? SAP_MODULE_LABELS[selectedTicket.module as SAPModule] : '-'}</div>
                  <div><span className="text-muted-foreground">Complexity:</span> {selectedTicket.complexity ? TICKET_COMPLEXITY_LABELS[selectedTicket.complexity] : '-'}</div>
                  <div><span className="text-muted-foreground">Estimation:</span> {selectedTicket.estimationHours}h</div>
                  <div><span className="text-muted-foreground">Actual Effort:</span> {selectedTicket.effortHours}h</div>
                  <div><span className="text-muted-foreground">Project:</span> {projectName(selectedTicket.projectId)}</div>
                  <div><span className="text-muted-foreground">Created by:</span> {userName(selectedTicket.createdBy)}</div>
                  <div>
                    <span className="text-muted-foreground">Assigned to:</span> {userName(selectedTicket.assignedTo)}
                    {selectedTicket.assignedToRole && (
                      <span className="ml-1 text-xs text-muted-foreground">({USER_ROLE_LABELS[selectedTicket.assignedToRole]})</span>
                    )}
                  </div>
                  <div><span className="text-muted-foreground">Due:</span> {selectedTicket.dueDate ?? '-'}</div>
                  {selectedTicket.estimationHours > 0 && selectedTicket.effortHours > 0 && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Est. vs Actual:</span>{' '}
                      <span className={selectedTicket.effortHours > selectedTicket.estimationHours ? 'text-red-600 dark:text-red-400 font-medium' : 'text-emerald-600 dark:text-emerald-400 font-medium'}>
                        {((selectedTicket.effortHours / selectedTicket.estimationHours) * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>

                <TicketDocumentationSection
                  ticket={selectedTicket}
                  currentUserId={currentUser?.id}
                  canEdit={canEdit}
                  resolveUserName={userName}
                  onDocumentationChanged={handleDocumentationChanged}
                />

                {/* Effort Hours Section */}
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Effort Hours</span>
                    </div>
                    <span className="text-lg font-semibold text-foreground">
                      {selectedTicket.effortHours ?? 0}h
                    </span>
                  </div>
                  {selectedTicket.effortComment && (
                    <p className="text-xs text-muted-foreground mt-1">{selectedTicket.effortComment}</p>
                  )}
                  {canEdit && !editingEffort && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingEffort(true);
                          setEffortValue(String(selectedTicket.effortHours ?? 0));
                          setEffortComment(selectedTicket.effortComment ?? '');
                        }}
                      >
                        Update Effort
                      </Button>
                      {selectedTicket.status === 'IN_PROGRESS' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-purple-600 border-purple-300 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-700 dark:hover:bg-purple-950"
                          onClick={() => void sendToTest(selectedTicket)}
                        >
                          <FlaskConical className="h-3 w-3 mr-1" /> Send to Test
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-950"
                        onClick={() => void openImputation(selectedTicket)}
                      >
                        <Send className="h-3 w-3 mr-1" /> Imputer StraTIME
                      </Button>
                    </div>
                  )}
                  {editingEffort && (
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label className="text-xs">Hours</Label>
                          <Input
                            type="number"
                            min={0}
                            step={0.5}
                            value={effortValue}
                            onChange={(e) => setEffortValue(e.target.value)}
                            className="h-8"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Comment</Label>
                        <Input
                          value={effortComment}
                          onChange={(e) => setEffortComment(e.target.value)}
                          placeholder="Optional comment"
                          className="h-8"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => void updateEffort(selectedTicket, parseFloat(effortValue) || 0, effortComment)}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingEffort(false)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                  {!canEdit && (selectedTicket.effortHours ?? 0) > 0 && (
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-950"
                        onClick={() => void openImputation(selectedTicket)}
                      >
                        <Send className="h-3 w-3 mr-1" /> Imputer StraTIME
                      </Button>
                    </div>
                  )}
                </div>

                {canEdit && (
                  <div className="flex gap-2 flex-wrap">
                    {STATUS_ORDER.filter((s) => s !== selectedTicket.status).map((s) => (
                      <Button key={s} size="sm" variant="outline" onClick={() => void changeStatus(selectedTicket, s)}>
                        {TICKET_STATUS_LABELS[s]}
                      </Button>
                    ))}
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">History</h4>
                  <div className="space-y-2">
                    {(selectedTicket.history || []).map((evt) => (
                      <div key={evt.id} className="flex gap-3 text-xs border-l-2 border-primary/30 pl-3 py-1">
                        <span className="text-muted-foreground whitespace-nowrap">
                          {new Date(evt.timestamp).toLocaleString()}
                        </span>
                        <div>
                          <span className="font-medium">{userName(evt.userId)}</span>
                          {evt.action === 'CREATED' && ' created this ticket'}
                          {evt.action === 'STATUS_CHANGE' && (
                            <> changed status from <Badge variant="outline" className="text-[10px] mx-0.5">{evt.fromValue}</Badge> to <Badge variant="outline" className="text-[10px] mx-0.5">{evt.toValue}</Badge></>
                          )}
                          {evt.action === 'ASSIGNED' && ` assigned to ${userName(evt.toValue)}`}
                          {evt.action === 'EFFORT_CHANGE' && (
                            <> updated effort from {evt.fromValue}h to {evt.toValue}h</>
                          )}
                          {evt.action === 'SENT_TO_TEST' && ' sent ticket to functional testing'}
                          {evt.action === 'COMMENT' && `: ${evt.comment}`}
                          {evt.comment && evt.action !== 'COMMENT' && evt.action !== 'SENT_TO_TEST' && (
                            <span className="block text-muted-foreground mt-0.5">{evt.comment}</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {(!selectedTicket.history || selectedTicket.history.length === 0) && (
                      <p className="text-xs text-muted-foreground">No history available.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* StraTIME Imputation Modal */}
      <Dialog open={showImputation} onOpenChange={setShowImputation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-500" /> Imputation StraTIME
            </DialogTitle>
          </DialogHeader>
          {imputationTicket && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
                <div><span className="text-muted-foreground">Ticket:</span> {imputationTicket.title}</div>
                <div><span className="text-muted-foreground">Projet:</span> {projectName(imputationTicket.projectId)}</div>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={imputationDate} onChange={(e) => setImputationDate(e.target.value)} />
              </div>
              <div>
                <Label>Duree (minutes)</Label>
                <Input type="number" min={1} value={imputationDuration} onChange={(e) => setImputationDuration(e.target.value)} />
                {imputationDuration && (
                  <p className="text-xs text-muted-foreground mt-1">
                    = {formatDurationShort(parseInt(imputationDuration, 10) * 60)}
                  </p>
                )}
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={imputationDesc} onChange={(e) => setImputationDesc(e.target.value)} rows={2} />
              </div>

              {/* Previous logs for this ticket */}
              {ticketTimeLogs.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">Imputations precedentes</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {ticketTimeLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between text-xs border rounded px-2 py-1">
                        <span>{log.date} - {log.durationMinutes}min</span>
                        {log.sentToStraTIME ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[9px]">Sent</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px]">Draft</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowImputation(false)}>Cancel</Button>
                <Button
                  onClick={() => void submitImputation()}
                  disabled={isSendingStraTIME}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSendingStraTIME ? (
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3 animate-spin" /> Sending...</span>
                  ) : (
                    <span className="flex items-center gap-1"><Send className="h-3 w-3" /> Send to StraTIME</span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
