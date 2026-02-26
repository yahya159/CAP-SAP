import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { PageHeader } from '../../../components/common/PageHeader';
import { useAuth } from '../../../context/AuthContext';
import { getBaseRouteForRole } from '../../../context/roleRouting';
import { createTicketWithUnifiedFlow } from '../../../services/ticketCreation';
import {
  Abaque,
  AbaqueComplexity,
  AbaqueEntry,
  SAPModule,
  Ticket,
  TicketComplexity,
  TicketEvent,
  TicketNature,
  TicketStatus,
  WricefObject,
} from '../../../types/entities';
import { WricefObjectsAPI } from '../../../services/odataClient';
import { useManagerTicketsBootstrap, useManagerTicketsMutations } from '../hooks';
import { buildTicketsByDate, filterTickets } from '../model';
import { TicketCreateDialog } from './TicketCreateDialog';
import { TicketDrawer } from './TicketDrawer';
import { TicketFilters } from './TicketFilters';
import { TicketKPIs } from './TicketKPIs';
import { TicketTable } from './TicketTable';
import { EMPTY_FORM, TicketForm, ViewMode } from './types';

export const ManagerTicketsView: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { projects, setProjects, users, tickets, setTickets, loading } = useManagerTicketsBootstrap();
  const { updateTicket, getAbaqueById } = useManagerTicketsMutations();

  const isViewOnly = false;
  const [form, setForm] = useState<TicketForm>(EMPTY_FORM);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Ticket['status'] | 'ALL'>('ALL');
  const [moduleFilter, setModuleFilter] = useState<SAPModule | 'ALL'>('ALL');
  const [complexityFilter, setComplexityFilter] = useState<TicketComplexity | 'ALL'>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [wricefFilter, setWricefFilter] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isManualWricef, setIsManualWricef] = useState(true);
  const [wricefObjects, setWricefObjects] = useState<WricefObject[]>([]);
  const [linkedAbaque, setLinkedAbaque] = useState<Abaque | null>(null);
  const [isEstimatedByAbaque, setIsEstimatedByAbaque] = useState(false);

  const roleBasePath = currentUser ? getBaseRouteForRole(currentUser.role) : '/manager';

  const resolveUserName = useCallback(
    (id?: string) => users.find((user) => user.id === id)?.name ?? '-',
    [users]
  );
  const resolveProjectName = useCallback(
    (id: string) => projects.find((project) => project.id === id)?.name ?? id,
    [projects]
  );

  const handleDocumentationChanged = useCallback((ticketId: string, documentationIds: string[]) => {
    setTickets((previous) =>
      previous.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              documentationObjectIds: documentationIds.length > 0 ? documentationIds : undefined,
            }
          : ticket
      )
    );
    setSelectedTicket((previous) =>
      previous?.id === ticketId
        ? {
            ...previous,
            documentationObjectIds: documentationIds.length > 0 ? documentationIds : undefined,
          }
        : previous
    );
  }, [setTickets]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === form.projectId),
    [projects, form.projectId]
  );

  useEffect(() => {
    if (form.projectId) void WricefObjectsAPI.getByProject(form.projectId).then(setWricefObjects);
    else setWricefObjects([]);
  }, [form.projectId]);

  const hasWricefObjects = wricefObjects.length > 0;

  useEffect(() => {
    setIsManualWricef(!hasWricefObjects);
  }, [hasWricefObjects, form.projectId]);

  useEffect(() => {
    const loadAbaque = async () => {
      if (selectedProject?.linkedAbaqueId) {
        const abaque = await getAbaqueById(selectedProject.linkedAbaqueId);
        setLinkedAbaque(abaque);
      } else {
        setLinkedAbaque(null);
      }
    };

    void loadAbaque();
  }, [getAbaqueById, selectedProject?.linkedAbaqueId]);

  const toAbaqueComplexity = (complexity: TicketComplexity): AbaqueComplexity => {
    switch (complexity) {
      case 'SIMPLE':
        return 'LOW';
      case 'MOYEN':
        return 'MEDIUM';
      case 'COMPLEXE':
      case 'TRES_COMPLEXE':
        return 'HIGH';
    }
  };

  const abaqueEntry = useMemo<AbaqueEntry | null>(() => {
    if (!linkedAbaque) return null;
    const abaqueComplexity = toAbaqueComplexity(form.complexity);
    return (
      linkedAbaque.entries.find(
        (entry) => entry.taskNature === form.nature && entry.complexity === abaqueComplexity
      ) ?? null
    );
  }, [linkedAbaque, form.complexity, form.nature]);

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

    return (
      abaque.entries.find(
        (entry) =>
          entry.taskNature === fallbackByNature[taskNature] && entry.complexity === complexity
      )?.standardHours ?? null
    );
  };

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

    setForm((previous) => ({ ...previous, estimationHours: estimate }));
    setIsEstimatedByAbaque(true);
    toast.success('Effort pre-filled from project abaque');
  };

  const filteredTickets = useMemo(
    () =>
      filterTickets(
        tickets,
        {
          searchQuery,
          statusFilter,
          moduleFilter,
          complexityFilter,
          projectFilter,
          assigneeFilter,
          dateFrom,
          dateTo,
          wricefFilter,
        },
        resolveProjectName
      ),
    [
      assigneeFilter,
      complexityFilter,
      dateFrom,
      dateTo,
      moduleFilter,
      projectFilter,
      resolveProjectName,
      searchQuery,
      statusFilter,
      tickets,
      wricefFilter,
    ]
  );

  const submitTicket = async (event: React.FormEvent) => {
    event.preventDefault();
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

      const assignedUser = form.assignedTo
        ? users.find((user) => user.id === form.assignedTo)
        : undefined;

      const { ticket: created, updatedProject } = await createTicketWithUnifiedFlow({
        project,
        wricefObjects,
        existingProjectTickets: tickets.filter((ticket) => ticket.projectId === project.id),
        createdBy: currentUser.id,
        assignedTo: form.assignedTo || undefined,
        assignedToRole: assignedUser?.role,
        priority: form.priority,
        nature: form.nature,
        title: form.title.trim(),
        description: form.description.trim(),
        dueDate: form.dueDate || undefined,
        module: form.module,
        complexity: form.complexity,
        estimationHours: form.estimationHours,
        estimatedViaAbaque: Boolean(abaqueEntry && form.estimationHours === abaqueEntry.standardHours),
        selectedWricefObjectId: !isManualWricef ? form.wricefId.trim() || undefined : undefined,
        manualWricefId: isManualWricef ? form.wricefId.trim() || undefined : undefined,
        creationComment: 'Ticket created',
      });

      setTickets((previous) => [created, ...previous]);
      if (updatedProject) {
        setProjects((previous) =>
          previous.map((item) => (item.id === updatedProject.id ? updatedProject : item))
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
      const updated = await updateTicket(ticket.id, {
        status: newStatus,
        history: [...(ticket.history || []), event],
      });
      setTickets((previous) => previous.map((item) => (item.id === ticket.id ? updated : item)));
      if (selectedTicket?.id === ticket.id) {
        setSelectedTicket(updated);
      }
      toast.success(`Status -> ${newStatus.replace('_', ' ')}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const updateTicketDueDate = async (ticketId: string, dueDate: string) => {
    const ticket = tickets.find((item) => item.id === ticketId);
    if (!ticket) return;

    try {
      const updated = await updateTicket(ticket.id, { dueDate });
      setTickets((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
      toast.success(`Due date -> ${dueDate}`);
    } catch {
      toast.error('Failed to update due date');
    }
  };

  const openTicketDetails = useCallback(
    (ticketId: string) => navigate(`${roleBasePath}/tickets/${ticketId}`),
    [navigate, roleBasePath]
  );

  const calendarDays = useMemo(() => {
    const [year, month] = calendarMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

    for (let index = -startOffset; index <= lastDay.getDate() + (6 - ((lastDay.getDay() + 6) % 7)); index += 1) {
      const date = new Date(year, month - 1, index + 1);
      days.push({
        date: date.toISOString().slice(0, 10),
        day: date.getDate(),
        isCurrentMonth: date.getMonth() === month - 1,
      });
    }

    return days;
  }, [calendarMonth]);

  const ticketsByDate = useMemo(() => buildTicketsByDate(filteredTickets), [filteredTickets]);

  const prevMonth = () => {
    const [year, month] = calendarMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    setCalendarMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const nextMonth = () => {
    const [year, month] = calendarMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    setCalendarMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const clearAllFilters = () => {
    setProjectFilter('ALL');
    setAssigneeFilter('ALL');
    setWricefFilter('');
    setDateFrom('');
    setDateTo('');
    setModuleFilter('ALL');
    setComplexityFilter('ALL');
    setStatusFilter('ALL');
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Tickets Management"
        subtitle="View, create, and manage all tickets across projects"
        breadcrumbs={[
          { label: 'Home', path: `${roleBasePath}/dashboard` },
          { label: 'Tickets' },
        ]}
      />

      <div className="p-6 space-y-4">
        <TicketKPIs tickets={filteredTickets} />

        <TicketFilters
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          moduleFilter={moduleFilter}
          complexityFilter={complexityFilter}
          projectFilter={projectFilter}
          assigneeFilter={assigneeFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
          wricefFilter={wricefFilter}
          viewMode={viewMode}
          showAdvancedFilters={showAdvancedFilters}
          isViewOnly={isViewOnly}
          users={users}
          projects={projects}
          onSearchQueryChange={setSearchQuery}
          onStatusFilterChange={setStatusFilter}
          onModuleFilterChange={setModuleFilter}
          onComplexityFilterChange={setComplexityFilter}
          onProjectFilterChange={setProjectFilter}
          onAssigneeFilterChange={setAssigneeFilter}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onWricefFilterChange={setWricefFilter}
          onViewModeChange={setViewMode}
          onToggleAdvancedFilters={() => setShowAdvancedFilters((previous) => !previous)}
          onClearAll={clearAllFilters}
          onCreateTicket={() => setShowCreate(true)}
        />

        <TicketTable
          loading={loading}
          viewMode={viewMode}
          isViewOnly={isViewOnly}
          tickets={tickets}
          filteredTickets={filteredTickets}
          ticketsByDate={ticketsByDate}
          calendarDays={calendarDays}
          calendarMonth={calendarMonth}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onOpenTicketDetails={openTicketDetails}
          onCreateTicket={() => setShowCreate(true)}
          onChangeStatus={(ticket, status) => {
            void changeStatus(ticket, status);
          }}
          onUpdateTicketDueDate={(ticketId, dueDate) => {
            void updateTicketDueDate(ticketId, dueDate);
          }}
          resolveProjectName={resolveProjectName}
          resolveUserName={resolveUserName}
        />
      </div>

      <TicketCreateDialog
        open={showCreate}
        vm={{
          projects,
          users,
          selectedProject,
          wricefObjects,
          linkedAbaque,
          abaqueTaskNatures,
          abaqueEntry,
          form,
          isManualWricef,
          isEstimatedByAbaque,
          isSubmitting,
          onOpenChange: (open) => {
            setShowCreate(open);
            if (!open) {
              setIsEstimatedByAbaque(false);
            }
          },
          onSubmit: (event) => {
            void submitTicket(event);
          },
          onFormChange: setForm,
          onManualWricefChange: setIsManualWricef,
          onEstimatedByAbaqueChange: setIsEstimatedByAbaque,
          onApplyAbaqueEstimate: applyAbaqueEstimate,
          onCancel: () => {
            setShowCreate(false);
            setIsEstimatedByAbaque(false);
          },
        }}
      />

      <TicketDrawer
        currentUserId={currentUser?.id}
        selectedTicket={selectedTicket}
        isViewOnly={isViewOnly}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTicket(null);
          }
        }}
        onChangeStatus={(ticket, status) => {
          void changeStatus(ticket, status);
        }}
        resolveProjectName={resolveProjectName}
        resolveUserName={resolveUserName}
        onDocumentationChanged={handleDocumentationChanged}
      />
    </div>
  );
};
