
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { BarChart3, Calculator, FileText, Package, Ticket as TicketIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../context/AuthContext';
import { getBaseRouteForRole } from '../../context/roleRouting';import { TicketsAPI } from '../../services/odata/ticketsApi';
import { WricefObjectsAPI } from '../../services/odata/wricefObjectsApi';
import { WricefsAPI } from '../../services/odata/wricefsApi';
import { createTicketWithUnifiedFlow } from '../../services/ticketCreation';
import {
  Abaque,
  AbaqueEstimateResult,
  Allocation,
  Deliverable,
  DocumentationAttachment,
  DocumentationObject,
  DocumentationObjectType,
  Project,
  ProjectAbaqueCriteria,
  SAPModule,
  Ticket,
  TicketComplexity,
  TicketEvent,
  TicketStatus,
  User,
  WricefObject,
  WricefType,
} from '../../types/entities';
import { isAbortError } from '../../utils/async';
import { parseWricefExcel } from '../../utils/wricefExcel';
import { DocumentationAPI, ProjectDetailsAPI, ProjectsAPI } from './api';
import type { CreateDocumentationDialogViewModel } from './components/dialogs/CreateDocumentationDialog';
// Imports removed
import {
  appendFilesAsDocumentationAttachments,
  buildAbaqueTaskNatures,
  buildDocumentationDraft,
  buildObjectTicketRows,
  buildWricefImportPlan,
  buildWricefObjectTicketStats,
  COMPLEXITY_BADGE_CLASS,
  computeEffortTotals,
  computeEstimateConsumption,
  computeProjectKpis,
  countDocumentationByType,
  EMPTY_PROJECT_DOCUMENTATION_FORM,
  EMPTY_PROJECT_TICKET_FORM,
  filterProjectObjects,
  filterProjectTickets,
  formatBytes,
  getAbaqueEstimateForNature,
  getUsageBarClass,
  paginateItems,
  PROJECT_TABS,
  ProjectDocumentationFormState,
  ProjectTabKey,
  ProjectTicketFormState,
  sortTicketHistoryByLatest,
  TICKET_COMPLEXITY_BY_ABAQUE,
  withProjectTabIcons,
  WRICEF_PRIORITY_COLOR,
  WRICEF_STATUS_COLOR,
  WRICEF_TYPE_BADGE_CLASS,
} from './model';

export interface ProjectDetailsBootstrapState {
  project: Project | null;
  abaques: Abaque[];
  allocations: Allocation[];
  users: User[];
  deliverables: Deliverable[];
  tickets: Ticket[];
  documentationObjects: DocumentationObject[];
  wricefObjects: WricefObject[];
}

const EMPTY_BOOTSTRAP_STATE: ProjectDetailsBootstrapState = {
  project: null,
  abaques: [],
  allocations: [],
  users: [],
  deliverables: [],
  tickets: [],
  documentationObjects: [],
  wricefObjects: [],
};

const asArray = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : []);

export const loadProjectDetailsBootstrap = async (
  projectId?: string,
  signal?: AbortSignal
): Promise<ProjectDetailsBootstrapState> => {
  if (!projectId) return { ...EMPTY_BOOTSTRAP_STATE };

  const data = await ProjectDetailsAPI.getBootstrapData(projectId, { signal });
  return {
    project: data.project ?? null,
    allocations: asArray(data.allocations),
    users: asArray(data.users),
    deliverables: asArray(data.deliverables),
    tickets: asArray(data.tickets),
    abaques: asArray(data.abaques),
    documentationObjects: asArray(data.documentationObjects),
    wricefObjects: asArray(data.wricefObjects),
  };
};

export const useProjectDetailsBootstrap = (projectId?: string) => {
  const [project, setProject] = useState<Project | null>(null);
  const [abaques, setAbaques] = useState<Abaque[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [documentationObjects, setDocumentationObjects] = useState<DocumentationObject[]>([]);
  const [wricefObjects, setWricefObjects] = useState<WricefObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError(null);

    try {
      const data = await loadProjectDetailsBootstrap(projectId, controller.signal);
      if (controller.signal.aborted) return;

      setProject(data.project);
      setAllocations(data.allocations);
      setUsers(data.users);
      setDeliverables(data.deliverables);
      setTickets(data.tickets);
      setAbaques(data.abaques);
      setDocumentationObjects(data.documentationObjects);
      setWricefObjects(data.wricefObjects);
    } catch (err) {
      if (!isAbortError(err)) {
        console.error('[useProjectDetailsBootstrap] Failed to load bootstrap data', err);
        setError(err instanceof Error ? err.message : 'Failed to load project data');
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  }, [projectId]);

  useEffect(() => {
    void reload();

    return () => {
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, [reload]);

  return {
    project,
    setProject,
    abaques,
    setAbaques,
    allocations,
    setAllocations,
    users,
    setUsers,
    deliverables,
    setDeliverables,
    tickets,
    setTickets,
    documentationObjects,
    setDocumentationObjects,
    wricefObjects,
    setWricefObjects,
    loading,
    error,
    reload,
  };
};

interface ViewDocumentationDialogViewModel {
  open: boolean;
  document: DocumentationObject | null;
  onOpenChange: (open: boolean) => void;
  resolveUserName: (userId: string) => string;
  formatBytes: (bytes: number) => string;
}

export interface ProjectDetailsViewModel {
  loading: boolean;
  error: string | null;
  project: Project | null;
  roleBasePath: string;
  tabs: any[];
  activeTab: ProjectTabKey;
  setActiveTab: React.Dispatch<React.SetStateAction<ProjectTabKey>>;
  handleTabKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>, tabKey: ProjectTabKey) => void;
  overviewVm: any;
  abaquesVm: {
    project: Project;
    hasAbaqueEstimate: boolean;
    forceEstimatorVisible: boolean;
    projectEstimateSaving: boolean;
    estimatedDays: number;
    totalActualDays: number;
    totalActualHours: number;
    estimateConsumptionPercent: number;
    estimateDeltaDays: number;
    usageBarClass: string;
    onApplyEstimate: (
      criteria: ProjectAbaqueCriteria,
      result: AbaqueEstimateResult
    ) => Promise<void>;
    onRerunEstimate: () => void;
  } | null;
  ticketsVm: any;
  teamVm: {
    allocations: Allocation[];
    users: User[];
  };
  wricefVm: any;
  kpisVm: {
    active: boolean;
    kpis: ReturnType<typeof computeProjectKpis>;
    totalActualHours: number;
    totalEstimatedHours: number;
  };
  documentationVm: any;
  createTicketDialogVm: {
    open: boolean;
    vm: any;
  };
  createDocumentationDialogVm: {
    open: boolean;
    vm: CreateDocumentationDialogViewModel;
  };
  viewDocumentationDialogVm: ViewDocumentationDialogViewModel;
}

export const useProjectDetailsViewModel = (): ProjectDetailsViewModel => {
  const { currentUser } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    project,
    setProject,
    abaques,
    allocations,
    users,
    deliverables,
    tickets,
    setTickets,
    documentationObjects,
    setDocumentationObjects,
    wricefObjects,
    setWricefObjects,
    loading,
    error,
  } = useProjectDetailsBootstrap(id);

  const [activeTab, setActiveTab] = useState<ProjectTabKey>('overview');
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [docText, setDocText] = useState('');
  const [docSaving, setDocSaving] = useState(false);
  const [abaqueSaving, setAbaqueSaving] = useState(false);
  const [projectEstimateSaving, setProjectEstimateSaving] = useState(false);
  const [forceEstimatorVisible, setForceEstimatorVisible] = useState(false);
  const [wricefImporting, setWricefImporting] = useState(false);
  const [objectsSearch, setObjectsSearch] = useState('');
  const [objectsTypeFilter, setObjectsTypeFilter] = useState<WricefType | ''>('');
  const [objectsComplexityFilter, setObjectsComplexityFilter] = useState<TicketComplexity | ''>('');
  const [objectsModuleFilter, setObjectsModuleFilter] = useState<SAPModule | ''>('');
  const [objectsPage, setObjectsPage] = useState(1);
  const [objectsPageSize, setObjectsPageSize] = useState(10);
  const [expandedObjectIds, setExpandedObjectIds] = useState<Set<string>>(new Set());
  const [ticketsSearch, setTicketsSearch] = useState('');
  const [ticketsStatusFilter, setTicketsStatusFilter] = useState<TicketStatus | ''>('');
  const [ticketsPage, setTicketsPage] = useState(1);
  const [ticketsPageSize, setTicketsPageSize] = useState(10);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState<ProjectTicketFormState>(EMPTY_PROJECT_TICKET_FORM);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [isEstimatedByAbaque, setIsEstimatedByAbaque] = useState(false);
  const [showCreateDoc, setShowCreateDoc] = useState(false);
  const [docForObjectId, setDocForObjectId] = useState<string | null>(null);
  const [docForm, setDocForm] = useState<ProjectDocumentationFormState>(
    EMPTY_PROJECT_DOCUMENTATION_FORM
  );
  const [docFiles, setDocFiles] = useState<DocumentationAttachment[]>([]);
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [viewDocId, setViewDocId] = useState<string | null>(null);

  const roleBasePath = currentUser ? getBaseRouteForRole(currentUser.role) : '/manager';
  const manager = useMemo(
    () => (project ? users.find((user) => user.id === project.managerId) ?? null : null),
    [project, users]
  );
  const resolveUserName = useCallback(
    (uid?: string) => users.find((user) => user.id === uid)?.name ?? '-',
    [users]
  );
  const selectedAbaque = useMemo(
    () => abaques.find((item) => item.id === project?.linkedAbaqueId) ?? null,
    [abaques, project?.linkedAbaqueId]
  );
  const abaqueTaskNatures = useMemo(
    () => buildAbaqueTaskNatures(selectedAbaque),
    [selectedAbaque]
  );
  const kpis = useMemo(() => computeProjectKpis(tickets), [tickets]);
  const { totalActualHours, totalEstimatedHours, totalActualDays } = useMemo(
    () => computeEffortTotals(tickets),
    [tickets]
  );
  const hasAbaqueEstimate = Boolean(project?.abaqueEstimate);
  const estimatedDays = project?.abaqueEstimate?.result.estimatedConsultingDays ?? 0;
  const { estimateConsumptionPercent, estimateDeltaDays } = useMemo(
    () => computeEstimateConsumption(estimatedDays, totalActualDays),
    [estimatedDays, totalActualDays]
  );
  const usageBarClass = getUsageBarClass(estimateConsumptionPercent);
  const wricefTotalTickets = useMemo(
    () => tickets.filter((ticket) => wricefObjects.some((object) => object.id === ticket.wricefId)).length,
    [wricefObjects, tickets]
  );
  const wricefTotalDocuments = useMemo(
    () => wricefObjects.reduce((sum, object) => sum + (object.documentationObjectIds?.length ?? 0), 0),
    [wricefObjects]
  );
  const wricefObjectTicketStats = useMemo(
    () => buildWricefObjectTicketStats(wricefObjects, tickets),
    [wricefObjects, tickets]
  );
  const filteredObjects = useMemo(
    () =>
      filterProjectObjects(
        wricefObjects,
        objectsSearch,
        objectsTypeFilter,
        objectsComplexityFilter,
        objectsModuleFilter
      ),
    [wricefObjects, objectsSearch, objectsTypeFilter, objectsComplexityFilter, objectsModuleFilter]
  );
  const objectsTotalPages = Math.max(1, Math.ceil(filteredObjects.length / objectsPageSize));
  const paginatedObjects = useMemo(
    () => paginateItems(filteredObjects, objectsPage, objectsPageSize),
    [filteredObjects, objectsPage, objectsPageSize]
  );
  const filteredTickets = useMemo(
    () => filterProjectTickets(tickets, ticketsSearch, ticketsStatusFilter),
    [tickets, ticketsSearch, ticketsStatusFilter]
  );
  const ticketsTotalPages = Math.max(1, Math.ceil(filteredTickets.length / ticketsPageSize));
  const paginatedTickets = useMemo(
    () => paginateItems(filteredTickets, ticketsPage, ticketsPageSize),
    [filteredTickets, ticketsPage, ticketsPageSize]
  );
  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId]
  );
  const selectedTicketHistory = useMemo(
    () => sortTicketHistoryByLatest(selectedTicket?.history),
    [selectedTicket]
  );
  const docsById = useMemo(
    () => new Map(documentationObjects.map((doc) => [doc.id, doc])),
    [documentationObjects]
  );
  const viewedDocument = useMemo(
    () => (viewDocId ? docsById.get(viewDocId) ?? null : null),
    [viewDocId, docsById]
  );

  const tabs = useMemo(
    () =>
      withProjectTabIcons({
        overview: undefined,
        objects: React.createElement(Package, { className: 'h-4 w-4' }),
        tickets: React.createElement(TicketIcon, { className: 'h-4 w-4' }),
        kpi: React.createElement(BarChart3, { className: 'h-4 w-4' }),
        docs: React.createElement(FileText, { className: 'h-4 w-4' }),
        abaques: React.createElement(Calculator, { className: 'h-4 w-4' }),
      }),
    []
  );

  useEffect(() => {
    if (!filteredTickets.length) {
      setSelectedTicketId('');
      return;
    }
    setSelectedTicketId((current) =>
      current && filteredTickets.some((ticket) => ticket.id === current)
        ? current
        : filteredTickets[0].id
    );
  }, [filteredTickets]);

  const formatTicketEventTime = useCallback((value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  }, []);

  const renderTicketEvent = useCallback(
    (event: TicketEvent): React.ReactNode => {
      if (event.action === 'CREATED') return 'created this ticket';
      if (event.action === 'STATUS_CHANGE') {
        return React.createElement(
          React.Fragment,
          null,
          'changed status from ',
          React.createElement(
            Badge,
            { variant: 'outline', className: 'text-[10px] mx-0.5' },
            event.fromValue ?? '-'
          ),
          ' to ',
          React.createElement(
            Badge,
            { variant: 'outline', className: 'text-[10px] mx-0.5' },
            event.toValue ?? '-'
          )
        );
      }
      if (event.action === 'ASSIGNED') return `assigned to ${resolveUserName(event.toValue)}`;
      if (event.action === 'PRIORITY_CHANGE') {
        return `changed priority from ${event.fromValue ?? '-'} to ${event.toValue ?? '-'}`;
      }
      if (event.action === 'EFFORT_CHANGE') {
        return `updated effort from ${event.fromValue ?? '-'}h to ${event.toValue ?? '-'}h`;
      }
      if (event.action === 'SENT_TO_TEST') return 'sent ticket to functional testing';
      if (event.action === 'COMMENT') {
        return event.comment ? `commented: ${event.comment}` : 'added a comment';
      }
      return event.action;
    },
    [resolveUserName]
  );

  const getObjectTicketRows = useCallback(
    (object: WricefObject) => buildObjectTicketRows(object, tickets),
    [tickets]
  );
  const getObjectDocs = useCallback(
    (object: WricefObject): DocumentationObject[] =>
      (object.documentationObjectIds ?? [])
        .map((docId) => docsById.get(docId))
        .filter((doc): doc is DocumentationObject => Boolean(doc)),
    [docsById]
  );
  const openTicketDetails = useCallback(
    (ticketId: string) => navigate(`${roleBasePath}/tickets/${ticketId}`),
    [navigate, roleBasePath]
  );
  const toggleExpandObject = useCallback((objectId: string) => {
    setExpandedObjectIds((previous) => {
      const next = new Set(previous);
      if (next.has(objectId)) next.delete(objectId);
      else next.add(objectId);
      return next;
    });
  }, []);

  const applyProjectEstimate = async (criteria: ProjectAbaqueCriteria, result: AbaqueEstimateResult) => {
    if (!project || !currentUser) return;
    try {
      setProjectEstimateSaving(true);
      const updated = await ProjectsAPI.update(project.id, {
        complexity: result.complexity,
        abaqueEstimate: {
          criteria,
          result,
          estimatedAt: new Date().toISOString(),
          estimatedBy: currentUser.id,
        },
      });
      setProject(updated);
      setForceEstimatorVisible(false);
      toast.success('Abaque estimate applied to project');
    } catch {
      toast.error('Failed to apply project estimate');
    } finally {
      setProjectEstimateSaving(false);
    }
  };

  const updateProjectAbaque = async (linkedAbaqueId: string) => {
    if (!project) return;
    try {
      setAbaqueSaving(true);
      const updated = await ProjectsAPI.update(project.id, {
        linkedAbaqueId: linkedAbaqueId === '__none' ? undefined : linkedAbaqueId,
      });
      setProject(updated);
      toast.success('Project abaque configuration updated');
    } catch {
      toast.error('Failed to update project configuration');
    } finally {
      setAbaqueSaving(false);
    }
  };

  const importWricefFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!project) return;
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setWricefImporting(true);
      const imported = await parseWricefExcel(file);
      const plan = buildWricefImportPlan(imported, wricefObjects, tickets);

      if (plan.uniqueObjects.length === 0 && plan.uniqueTickets.length === 0) {
        toast.info(
          `Nothing to import - all ${imported.objects.length} object(s) and ${imported.tickets.length} ticket(s) already exist in this project.`
        );
        return;
      }

      const createdWricef = await WricefsAPI.create({
        projectId: project.id,
        sourceFileName: imported.sourceFileName,
        importedAt: imported.importedAt,
      });

      const newObjects = await Promise.all(
        plan.uniqueObjects.map((object) =>
          WricefObjectsAPI.create({
            ...object,
            projectId: project.id,
            wricefId: createdWricef.id,
          })
        )
      );
      setWricefObjects((previous) => [...previous, ...newObjects]);

      if (plan.uniqueTickets.length > 0) {
        const newTickets = await Promise.all(
          plan.uniqueTickets.map((ticket) =>
            TicketsAPI.create({
              ...ticket,
              projectId: project.id,
              createdBy: currentUser?.id || 'u2',
              nature: 'ENHANCEMENT',
              wricefId: ticket.wricefId,
            } as any)
          )
        );
        setTickets((previous) => [...previous, ...newTickets]);
      }

      const sync = await DocumentationAPI.syncProjectWricef(
        project.id,
        createdWricef,
        [...wricefObjects, ...newObjects],
        currentUser?.id ?? project.managerId
      );

      const parts: string[] = [
        `WRICEF imported: ${plan.uniqueObjects.length} object(s) / ${plan.uniqueTickets.length} ticket(s).`,
      ];
      if (plan.skippedObjects > 0 || plan.skippedTickets > 0) {
        parts.push(`Skipped duplicates: ${plan.skippedObjects} object(s), ${plan.skippedTickets} ticket(s).`);
      }
      parts.push(`Synced docs: +${sync.created}, ~${sync.updated}, -${sync.deleted}`);
      toast.success(parts.join(' '));
    } catch (loadError) {
      toast.error(loadError instanceof Error ? loadError.message : 'Unable to import WRICEF file');
    } finally {
      setWricefImporting(false);
      event.target.value = '';
    }
  };

  const applyAbaqueEstimate = () => {
    if (!selectedAbaque) {
      toast.error('No abaque linked to this project');
      return;
    }
    const estimate = getAbaqueEstimateForNature(selectedAbaque, ticketForm.nature, ticketForm.complexity);
    if (estimate === null) {
      toast.error('No matching abaque entry for selected nature and complexity');
      return;
    }
    setTicketForm((previous) => ({ ...previous, effortHours: estimate }));
    setIsEstimatedByAbaque(true);
    toast.success('Effort pre-filled from project abaque');
  };

  const openCreateTicketDialog = (wricefObjectId?: string) => {
    setTicketForm({ ...EMPTY_PROJECT_TICKET_FORM, wricefObjectId: wricefObjectId ?? '' });
    setIsEstimatedByAbaque(false);
    setShowCreateTicket(true);
  };

  const handleCreateTicketOpenChange = (open: boolean) => {
    setShowCreateTicket(open);
    if (!open) {
      setTicketForm(EMPTY_PROJECT_TICKET_FORM);
      setIsEstimatedByAbaque(false);
    }
  };

  const createProjectTicket = async () => {
    if (!project || !currentUser) return;
    if (!ticketForm.title.trim()) {
      toast.error('Ticket title is required');
      return;
    }
    if (ticketForm.effortHours <= 0) {
      toast.error('Effort hours must be greater than 0');
      return;
    }
    try {
      setIsCreatingTicket(true);
      const { ticket: created, updatedProject } = await createTicketWithUnifiedFlow({
        project,
        wricefObjects,
        existingProjectTickets: tickets,
        createdBy: currentUser.id,
        priority: ticketForm.priority,
        nature: ticketForm.nature,
        title: ticketForm.title.trim(),
        description: ticketForm.description.trim(),
        dueDate: ticketForm.dueDate || undefined,
        module: 'OTHER',
        complexity: TICKET_COMPLEXITY_BY_ABAQUE[ticketForm.complexity],
        estimationHours: ticketForm.effortHours,
        estimatedViaAbaque: isEstimatedByAbaque,
        selectedWricefObjectId: ticketForm.wricefObjectId || undefined,
        creationComment: isEstimatedByAbaque
          ? 'Ticket created with abaque-based estimation'
          : 'Ticket created with manual estimation',
      });
      setTickets((previous) => [created, ...previous]);
      if (updatedProject) setProject(updatedProject);
      setTicketForm(EMPTY_PROJECT_TICKET_FORM);
      setIsEstimatedByAbaque(false);
      setShowCreateTicket(false);
      setActiveTab('objects');
      toast.success('Ticket created');
    } catch {
      toast.error('Failed to create ticket');
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const openCreateDocDialog = useCallback(
    (objectId?: string) => {
      const object = objectId ? wricefObjects.find((item) => item.id === objectId) : undefined;
      setDocForObjectId(objectId ?? null);
      setDocForm(buildDocumentationDraft(object));
      setDocFiles([]);
      setShowCreateDoc(true);
    },
    [wricefObjects]
  );

  const handleCreateDocOpenChange = (open: boolean) => {
    setShowCreateDoc(open);
    if (!open) {
      setDocForObjectId(null);
      setDocForm(EMPTY_PROJECT_DOCUMENTATION_FORM);
      setDocFiles([]);
    }
  };

  const createDocument = async () => {
    if (!project || !currentUser) return;
    if (!docForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!docForm.content.trim()) {
      toast.error('Content is required');
      return;
    }
    try {
      setIsCreatingDoc(true);
      const created = await DocumentationAPI.create({
        title: docForm.title.trim(),
        description: docForm.description.trim(),
        type: docForm.type,
        content: docForm.content.trim(),
        attachedFiles: docFiles,
        relatedTicketIds: [],
        projectId: project.id,
        authorId: currentUser.id,
      });
      setDocumentationObjects((previous) => [created, ...previous]);
      if (docForObjectId) {
        const targetObject = wricefObjects.find((object) => object.id === docForObjectId);
        const nextDocumentationIds = [...new Set([...(targetObject?.documentationObjectIds ?? []), created.id])];
        try {
          const updatedObject = await WricefObjectsAPI.update(docForObjectId, {
            documentationObjectIds: nextDocumentationIds,
          });
          setWricefObjects((previous) =>
            previous.map((object) => (object.id === docForObjectId ? updatedObject : object))
          );
        } catch {
          setWricefObjects((previous) =>
            previous.map((object) =>
              object.id !== docForObjectId
                ? object
                : { ...object, documentationObjectIds: nextDocumentationIds }
            )
          );
          toast.warning('Documentation created, but object linkage could not be persisted.');
        }
      }
      setShowCreateDoc(false);
      toast.success('Documentation created');
    } catch {
      toast.error('Failed to create documentation');
    } finally {
      setIsCreatingDoc(false);
    }
  };

  const saveProjectDocumentation = async () => {
    if (!project) return;
    try {
      setDocSaving(true);
      await ProjectsAPI.update(project.id, { documentation: docText });
      setProject((previous) => (previous ? { ...previous, documentation: docText } : previous));
      toast.success('Documentation saved');
    } catch {
      toast.error('Failed to save documentation');
    } finally {
      setDocSaving(false);
    }
  };

  const addDocFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    setDocFiles((previous) => appendFilesAsDocumentationAttachments(files, previous));
    event.target.value = '';
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, tabKey: ProjectTabKey) => {
    const index = PROJECT_TABS.findIndex((tab) => tab.key === tabKey);
    if (index === -1) return;

    const move = (nextIndex: number) => {
      const tab = PROJECT_TABS[nextIndex];
      setActiveTab(tab.key);
      queueMicrotask(() => document.getElementById(`project-tab-${tab.key}`)?.focus());
    };

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      move((index + 1) % PROJECT_TABS.length);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      move((index - 1 + PROJECT_TABS.length) % PROJECT_TABS.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      move(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      move(PROJECT_TABS.length - 1);
    }
  };

  const overviewVm: any = project
    ? {
        project,
        managerName: manager?.name ?? 'Unknown',
        ticketsCount: tickets.length,
        deliverablesCount: deliverables.length,
        openTicketsCount: tickets.filter((ticket) => ticket.status !== 'DONE' && ticket.status !== 'REJECTED').length,
        wricefObjectCount: wricefObjects.length,
        blockedTicketsCount: kpis.blocked,
        criticalTicketsCount: kpis.critical,
        abaques,
        selectedAbaque,
        abaqueTaskNatures,
        abaqueSaving,
        onLinkedAbaqueChange: (value: any) => {
          void updateProjectAbaque(value);
        },
        onOpenCreateTicket: () => openCreateTicketDialog(),
      }
    : null;

  const abaquesVm = project
    ? {
        project,
        hasAbaqueEstimate,
        forceEstimatorVisible,
        projectEstimateSaving,
        estimatedDays,
        totalActualDays,
        totalActualHours,
        estimateConsumptionPercent,
        estimateDeltaDays,
        usageBarClass,
        onApplyEstimate: applyProjectEstimate,
        onRerunEstimate: () => setForceEstimatorVisible(true),
      }
    : null;

  const ticketsVm: any = {
    tickets,
    paginatedTickets,
    filteredTickets,
    ticketsSearch,
    ticketsStatusFilter,
    ticketsPage,
    ticketsPageSize,
    ticketsTotalPages,
    selectedTicketId,
    selectedTicket,
    selectedTicketHistory,
    wricefStatusColor: WRICEF_STATUS_COLOR,
    wricefPriorityColor: WRICEF_PRIORITY_COLOR,
    onTicketsSearchChange: (value: any) => {
      setTicketsSearch(value);
      setTicketsPage(1);
    },
    onTicketsStatusFilterChange: (value: any) => {
      setTicketsStatusFilter(value);
      setTicketsPage(1);
    },
    onTicketsPageChange: setTicketsPage,
    onTicketsPageSizeChange: (value: any) => {
      setTicketsPageSize(value);
      setTicketsPage(1);
    },
    onSelectTicket: setSelectedTicketId,
    onOpenTicketDetails: openTicketDetails,
    onOpenCreateTicket: () => openCreateTicketDialog(),
    formatTicketEventTime,
    renderTicketEvent,
    resolveUserName,
  };

  const wricefVm: any = {
    objectsSearch,
    objectsTypeFilter,
    objectsComplexityFilter,
    objectsModuleFilter,
    objectsPage,
    objectsPageSize,
    objectsTotalPages,
    filteredObjectsCount: filteredObjects.length,
    wricefObjectCount: wricefObjects.length,
    wricefTotalTickets,
    wricefTotalDocuments,
    wricefImporting,
    onObjectsSearchChange: (value: any) => {
      setObjectsSearch(value);
      setObjectsPage(1);
    },
    onObjectsTypeFilterChange: (value: any) => {
      setObjectsTypeFilter(value);
      setObjectsPage(1);
    },
    onObjectsComplexityFilterChange: (value: any) => {
      setObjectsComplexityFilter(value);
      setObjectsPage(1);
    },
    onObjectsModuleFilterChange: (value: any) => {
      setObjectsModuleFilter(value);
      setObjectsPage(1);
    },
    onObjectsPageChange: setObjectsPage,
    onObjectsPageSizeChange: (value: any) => {
      setObjectsPageSize(value);
      setObjectsPage(1);
    },
    onClearFilters: () => {
      setObjectsSearch('');
      setObjectsTypeFilter('');
      setObjectsComplexityFilter('');
      setObjectsModuleFilter('');
      setObjectsPage(1);
    },
    onOpenCreateTicket: () => openCreateTicketDialog(),
    onImportWricefFile: (event: any) => {
      void importWricefFile(event);
    },
    table: {
      objects: paginatedObjects,
      expandedObjectIds,
      wricefObjectTicketStats,
      wricefTypeBadgeClass: WRICEF_TYPE_BADGE_CLASS,
      complexityBadgeClass: COMPLEXITY_BADGE_CLASS,
      wricefStatusColor: WRICEF_STATUS_COLOR,
      wricefPriorityColor: WRICEF_PRIORITY_COLOR,
      getObjectTicketRows,
      getObjectDocs,
      resolveUserName,
      onToggleExpandObject: toggleExpandObject,
      onOpenCreateTicket: openCreateTicketDialog,
      onOpenCreateDocument: (objectId: any) => openCreateDocDialog(objectId),
      onOpenTicketDetails: openTicketDetails,
      onViewDocument: setViewDocId,
      emptyMessage:
        wricefObjects.length === 0
          ? 'No WRICEF objects imported yet. Upload a WRICEF Excel file to get started.'
          : 'No objects match the current filters.',
    },
  };

  const documentationVm: any = project
    ? {
        projectKeywords: project.techKeywords ?? [],
        documentationObjects,
        docText,
        docSaving,
        onDocTextChange: setDocText,
        onSaveDocText: () => {
          void saveProjectDocumentation();
        },
        onCreateDocument: () => openCreateDocDialog(),
        onViewDocument: setViewDocId,
        resolveUserName: (userId: string) => resolveUserName(userId),
        getCountByType: (type: DocumentationObjectType) => countDocumentationByType(documentationObjects, type),
      }
    : null;

  const createTicketDialogVm: any = {
    projectName: project?.name ?? '',
    wricefObjects,
    selectedAbaque,
    abaqueTaskNatures,
    form: ticketForm,
    isEstimatedByAbaque,
    isCreatingTicket,
    onOpenChange: handleCreateTicketOpenChange,
    onFormChange: setTicketForm,
    onEstimatedByAbaqueChange: setIsEstimatedByAbaque,
    onApplyAbaqueEstimate: applyAbaqueEstimate,
    onSubmit: () => {
      void createProjectTicket();
    },
    onCancel: () => handleCreateTicketOpenChange(false),
  };

  const createDocumentationDialogVm: CreateDocumentationDialogViewModel = {
    docForObjectId,
    form: docForm,
    files: docFiles,
    isCreatingDoc,
    onOpenChange: handleCreateDocOpenChange,
    onFormChange: setDocForm,
    onAddFiles: addDocFiles,
    onRemoveFile: (index) =>
      setDocFiles((previous) => previous.filter((_, itemIndex) => itemIndex !== index)),
    onSubmit: () => {
      void createDocument();
    },
    onCancel: () => handleCreateDocOpenChange(false),
    formatBytes,
  };

  return {
    loading,
    error,
    project,
    roleBasePath,
    tabs,
    activeTab,
    setActiveTab,
    handleTabKeyDown,
    overviewVm,
    abaquesVm,
    ticketsVm,
    teamVm: {
      allocations,
      users,
    },
    wricefVm,
    kpisVm: {
      active: activeTab === 'kpi',
      kpis,
      totalActualHours,
      totalEstimatedHours,
    },
    documentationVm,
    createTicketDialogVm: {
      open: showCreateTicket,
      vm: createTicketDialogVm,
    },
    createDocumentationDialogVm: {
      open: showCreateDoc,
      vm: createDocumentationDialogVm,
    },
    viewDocumentationDialogVm: {
      open: Boolean(viewDocId),
      document: viewedDocument,
      onOpenChange: (open) => {
        if (!open) setViewDocId(null);
      },
      resolveUserName: (userId: string) => resolveUserName(userId),
      formatBytes,
    },
  };
};
