import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { BarChart3, Calculator, FileText, Package, Ticket as TicketIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../../../components/ui/badge';
import { useAuth } from '../../../context/AuthContext';
import { getBaseRouteForRole } from '../../../context/roleRouting';
import { createTicketWithUnifiedFlow } from '../../../services/ticketCreation';
import {
  Abaque,
  AbaqueComplexity,
  AbaqueEstimateResult,
  DocumentationAttachment,
  DocumentationObject,
  DocumentationObjectType,
  ProjectAbaqueCriteria,
  SAPModule,
  Ticket,
  TicketComplexity,
  TicketEvent,
  TicketNature,
  TicketStatus,
  WricefObject,
  WricefType,
} from '../../../types/entities';
import { parseWricefExcel } from '../../../utils/wricefExcel';
import { DocumentationAPI, ProjectsAPI } from '../api';
import { TicketsAPI, WricefObjectsAPI, WricefsAPI } from '../../../services/odataClient';
import { useProjectDetailsBootstrap } from '../hooks';
import {
  buildObjectTicketRows,
  buildWricefObjectTicketStats,
  buildWricefTicketMap,
  computeEffortTotals,
  computeEstimateConsumption,
  computeProjectKpis,
  countDocumentationByType,
  filterProjectObjects,
  filterProjectTickets,
  paginateItems,
} from '../model';
import { CreateDocumentationDialog, type ProjectDocumentationForm } from './dialogs/CreateDocumentationDialog';
import { CreateProjectTicketDialog, type ProjectTicketForm } from './dialogs/CreateProjectTicketDialog';
import { ViewDocumentationDialog } from './dialogs/ViewDocumentationDialog';
import { ProjectHeader } from './ProjectHeader';
import { ProjectKpis } from './ProjectKpis';
import { ProjectTabDefinition, ProjectTabs } from './ProjectTabs';
import { AbaquesPanel } from './panels/AbaquesPanel';
import { DocumentationPanel } from './panels/DocumentationPanel';
import { OverviewPanel } from './panels/OverviewPanel';
import { TeamPanel } from './panels/TeamPanel';
import { TicketsPanel } from './panels/TicketsPanel';
import { WricefPanel } from './panels/WricefPanel';

type TabKey = 'overview' | 'objects' | 'tickets' | 'team' | 'kpi' | 'docs' | 'abaques';

const EMPTY_TICKET_FORM: ProjectTicketForm = {
  title: '',
  description: '',
  nature: 'PROGRAMME',
  priority: 'MEDIUM',
  complexity: 'MEDIUM',
  effortHours: 0,
  dueDate: '',
  wricefObjectId: '',
};
const EMPTY_DOC_FORM: ProjectDocumentationForm = {
  title: '',
  description: '',
  type: 'SFD',
  content: '',
};
const TICKET_COMPLEXITY_BY_ABAQUE: Record<AbaqueComplexity, Ticket['complexity']> = {
  LOW: 'SIMPLE',
  MEDIUM: 'MOYEN',
  HIGH: 'COMPLEXE',
};
const PROJECT_TABS: ProjectTabDefinition<TabKey>[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'objects', label: 'Objects', icon: <Package className="h-4 w-4" /> },
  { key: 'tickets', label: 'Tickets', icon: <TicketIcon className="h-4 w-4" /> },
  { key: 'team', label: 'Team & Allocation' },
  { key: 'kpi', label: 'KPI Report', icon: <BarChart3 className="h-4 w-4" /> },
  { key: 'docs', label: 'Documentation', icon: <FileText className="h-4 w-4" /> },
  { key: 'abaques', label: 'Abaques', icon: <Calculator className="h-4 w-4" /> },
];
const WRICEF_TYPE_BADGE_CLASS: Record<WricefType, string> = {
  W: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  R: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  I: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  C: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  E: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  F: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
};
const COMPLEXITY_BADGE_CLASS: Record<TicketComplexity, string> = {
  SIMPLE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  MOYEN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  COMPLEXE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  TRES_COMPLEXE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};
const WRICEF_STATUS_COLOR: Record<TicketStatus, string> = {
  NEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  IN_TEST: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  BLOCKED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  DONE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  REJECTED: 'bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-gray-300',
};
const WRICEF_PRIORITY_COLOR: Record<string, string> = {
  LOW: 'bg-muted text-muted-foreground',
  MEDIUM: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export const ProjectDetailsView: React.FC = () => {
  const { currentUser } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    project, setProject, abaques, allocations, users, deliverables,
    tickets, setTickets, documentationObjects, setDocumentationObjects, wricefObjects, setWricefObjects, loading,
  } = useProjectDetailsBootstrap(id);

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
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
  const [ticketForm, setTicketForm] = useState<ProjectTicketForm>(EMPTY_TICKET_FORM);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [isEstimatedByAbaque, setIsEstimatedByAbaque] = useState(false);
  const [showCreateDoc, setShowCreateDoc] = useState(false);
  const [docForObjectId, setDocForObjectId] = useState<string | null>(null);
  const [docForm, setDocForm] = useState<ProjectDocumentationForm>(EMPTY_DOC_FORM);
  const [docFiles, setDocFiles] = useState<DocumentationAttachment[]>([]);
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [viewDocId, setViewDocId] = useState<string | null>(null);

  const roleBasePath = currentUser ? getBaseRouteForRole(currentUser.role) : '/manager';
  const manager = useMemo(() => (project ? users.find((u) => u.id === project.managerId) ?? null : null), [project, users]);
  const userName = useCallback((uid?: string) => users.find((u) => u.id === uid)?.name ?? '-', [users]);
  const selectedAbaque = useMemo(() => abaques.find((a) => a.id === project?.linkedAbaqueId) ?? null, [abaques, project?.linkedAbaqueId]);
  const abaqueTaskNatures = useMemo(() => (selectedAbaque ? [...new Set(selectedAbaque.entries.map((e) => e.taskNature))] : []), [selectedAbaque]);
  const kpis = useMemo(() => computeProjectKpis(tickets), [tickets]);
  const { totalActualHours, totalEstimatedHours, totalActualDays } = useMemo(() => computeEffortTotals(tickets), [tickets]);
  const hasAbaqueEstimate = Boolean(project?.abaqueEstimate);
  const estimatedDays = project?.abaqueEstimate?.result.estimatedConsultingDays ?? 0;
  const { estimateConsumptionPercent, estimateDeltaDays } = useMemo(() => computeEstimateConsumption(estimatedDays, totalActualDays), [estimatedDays, totalActualDays]);
  const usageBarClass = estimateConsumptionPercent > 100 ? 'bg-destructive' : estimateConsumptionPercent > 80 ? 'bg-amber-500' : 'bg-emerald-600';
  const wricefTotalTickets = useMemo(() => tickets.filter((t) => wricefObjects.some(o => o.id === t.wricefId)).length, [wricefObjects, tickets]);
  const wricefTotalDocuments = useMemo(() => wricefObjects.reduce((s, o) => s + (o.documentationObjectIds?.length ?? 0), 0), [wricefObjects]);
  const wricefObjectTicketStats = useMemo(() => buildWricefObjectTicketStats(wricefObjects, tickets), [wricefObjects, tickets]);
  const filteredObjects = useMemo(() => filterProjectObjects(wricefObjects, objectsSearch, objectsTypeFilter, objectsComplexityFilter, objectsModuleFilter), [wricefObjects, objectsSearch, objectsTypeFilter, objectsComplexityFilter, objectsModuleFilter]);
  const objectsTotalPages = Math.max(1, Math.ceil(filteredObjects.length / objectsPageSize));
  const paginatedObjects = useMemo(() => paginateItems(filteredObjects, objectsPage, objectsPageSize), [filteredObjects, objectsPage, objectsPageSize]);
  const filteredTickets = useMemo(() => filterProjectTickets(tickets, ticketsSearch, ticketsStatusFilter), [tickets, ticketsSearch, ticketsStatusFilter]);
  const ticketsTotalPages = Math.max(1, Math.ceil(filteredTickets.length / ticketsPageSize));
  const paginatedTickets = useMemo(() => paginateItems(filteredTickets, ticketsPage, ticketsPageSize), [filteredTickets, ticketsPage, ticketsPageSize]);
  const selectedTicket = useMemo(() => tickets.find((t) => t.id === selectedTicketId) ?? null, [tickets, selectedTicketId]);
  const selectedTicketHistory = useMemo(() => [...(selectedTicket?.history ?? [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [selectedTicket]);
  const docsById = useMemo(() => new Map(documentationObjects.map((d) => [d.id, d])), [documentationObjects]);
  const viewedDocument = useMemo(() => (viewDocId ? docsById.get(viewDocId) ?? null : null), [viewDocId, docsById]);

  useEffect(() => {
    if (!filteredTickets.length) return void setSelectedTicketId('');
    setSelectedTicketId((current) => current && filteredTickets.some((ticket) => ticket.id === current) ? current : filteredTickets[0].id);
  }, [filteredTickets]);

  const formatTicketEventTime = useCallback((value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  }, []);
  const renderTicketEvent = useCallback((event: TicketEvent): React.ReactNode => {
    if (event.action === 'CREATED') return 'created this ticket';
    if (event.action === 'STATUS_CHANGE') return <>changed status from <Badge variant="outline" className="text-[10px] mx-0.5">{event.fromValue ?? '-'}</Badge> to <Badge variant="outline" className="text-[10px] mx-0.5">{event.toValue ?? '-'}</Badge></>;
    if (event.action === 'ASSIGNED') return `assigned to ${userName(event.toValue)}`;
    if (event.action === 'PRIORITY_CHANGE') return `changed priority from ${event.fromValue ?? '-'} to ${event.toValue ?? '-'}`;
    if (event.action === 'EFFORT_CHANGE') return `updated effort from ${event.fromValue ?? '-'}h to ${event.toValue ?? '-'}h`;
    if (event.action === 'SENT_TO_TEST') return 'sent ticket to functional testing';
    if (event.action === 'COMMENT') return event.comment ? `commented: ${event.comment}` : 'added a comment';
    return event.action;
  }, [userName]);
  const getObjectTicketRows = useCallback((obj: WricefObject) => buildObjectTicketRows(obj, tickets), [tickets]);
  const getObjectDocs = useCallback((obj: WricefObject): DocumentationObject[] => (obj.documentationObjectIds ?? []).map((id) => docsById.get(id)).filter((d): d is DocumentationObject => Boolean(d)), [docsById]);
  const openTicketDetails = useCallback((ticketId: string) => navigate(`${roleBasePath}/tickets/${ticketId}`), [navigate, roleBasePath]);
  const toggleExpandObject = useCallback((objectId: string) => setExpandedObjectIds((prev) => { const next = new Set(prev); next.has(objectId) ? next.delete(objectId) : next.add(objectId); return next; }), []);

  const applyProjectEstimate = async (criteria: ProjectAbaqueCriteria, result: AbaqueEstimateResult) => {
    if (!project || !currentUser) return;
    try {
      setProjectEstimateSaving(true);
      const updated = await ProjectsAPI.update(project.id, { complexity: result.complexity, abaqueEstimate: { criteria, result, estimatedAt: new Date().toISOString(), estimatedBy: currentUser.id } });
      setProject(updated);
      setForceEstimatorVisible(false);
      toast.success('Abaque estimate applied to project');
    } catch { toast.error('Failed to apply project estimate'); }
    finally { setProjectEstimateSaving(false); }
  };
  const updateProjectAbaque = async (linkedAbaqueId: string) => {
    if (!project) return;
    try {
      setAbaqueSaving(true);
      const updated = await ProjectsAPI.update(project.id, { linkedAbaqueId: linkedAbaqueId === '__none' ? undefined : linkedAbaqueId });
      setProject(updated);
      toast.success('Project abaque configuration updated');
    } catch { toast.error('Failed to update project configuration'); }
    finally { setAbaqueSaving(false); }
  };
  const importWricefFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!project) return;
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setWricefImporting(true);
      const imported = await parseWricefExcel(file);

      // --- Deduplication: filter out objects that already exist in the project ---
      const knownObjectIds = new Set(wricefObjects.map((o) => o.id.trim().toLowerCase()));
      const knownObjectKeys = new Set(
        wricefObjects.map((o) => `${o.type}::${o.title.trim().toLowerCase()}`)
      );
      const uniqueObjects = imported.objects.filter((obj) => {
        const byIdKey = obj.id.trim().toLowerCase();
        const byTitleKey = `${obj.type}::${obj.title.trim().toLowerCase()}`;
        if (knownObjectIds.has(byIdKey) || knownObjectKeys.has(byTitleKey)) return false;
        knownObjectIds.add(byIdKey);
        knownObjectKeys.add(byTitleKey);
        return true;
      });

      // --- Deduplication: filter out tickets that already exist or point to unknown objects ---
      const existingTicketKeys = new Set(
        tickets
          .map((t) => `${(t.wricefId ?? '').trim().toLowerCase()}::${t.title.trim().toLowerCase()}`)
      );
      const importedTicketKeys = new Set<string>();
      const uniqueTickets = imported.tickets.filter((t) => {
        if (!knownObjectIds.has(t.wricefId.trim().toLowerCase())) return false;
        const ticketKey = `${t.wricefId.trim().toLowerCase()}::${t.title.trim().toLowerCase()}`;
        if (existingTicketKeys.has(ticketKey) || importedTicketKeys.has(ticketKey)) return false;
        importedTicketKeys.add(ticketKey);
        return true;
      });

      const skippedObjects = imported.objects.length - uniqueObjects.length;
      const skippedTickets = imported.tickets.length - uniqueTickets.length;

      if (uniqueObjects.length === 0 && uniqueTickets.length === 0) {
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
        uniqueObjects.map((obj) =>
          WricefObjectsAPI.create({
            ...obj,
            projectId: project.id,
            wricefId: createdWricef.id,
          })
        )
      );
      setWricefObjects((prev) => [...prev, ...newObjects]);

      if (uniqueTickets.length > 0) {
        const newTickets = await Promise.all(
          uniqueTickets.map((t) =>
            TicketsAPI.create({
              ...t,
              projectId: project.id,
              createdBy: currentUser?.id || 'u2',
              nature: 'ENHANCEMENT',
              wricefId: t.wricefId,
            } as any)
          )
        );
        setTickets((prev) => [...prev, ...newTickets]);
      }

      const sync = await DocumentationAPI.syncProjectWricef(
        project.id,
        createdWricef,
        [...wricefObjects, ...newObjects],
        currentUser?.id ?? project.managerId
      );

      const parts: string[] = [`WRICEF imported: ${uniqueObjects.length} object(s) / ${uniqueTickets.length} ticket(s).`];
      if (skippedObjects > 0 || skippedTickets > 0) {
        parts.push(`Skipped duplicates: ${skippedObjects} object(s), ${skippedTickets} ticket(s).`);
      }
      parts.push(`Synced docs: +${sync.created}, ~${sync.updated}, -${sync.deleted}`);
      toast.success(parts.join(' '));
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to import WRICEF file'); }
    finally { setWricefImporting(false); event.target.value = ''; }
  };

  const getAbaqueEstimate = (abaque: Abaque, taskNature: TicketNature, complexity: AbaqueComplexity): number | null => {
    const direct = abaque.entries.find((entry) => entry.taskNature === taskNature && entry.complexity === complexity);
    if (direct) return direct.standardHours;
    const fallbackByNature: Record<TicketNature, 'FEATURE' | 'DOCUMENTATION' | 'SUPPORT'> = { PROGRAMME: 'FEATURE', MODULE: 'FEATURE', ENHANCEMENT: 'FEATURE', FORMULAIRE: 'DOCUMENTATION', REPORT: 'DOCUMENTATION', WORKFLOW: 'SUPPORT' };
    return abaque.entries.find((entry) => entry.taskNature === fallbackByNature[taskNature] && entry.complexity === complexity)?.standardHours ?? null;
  };
  const applyAbaqueEstimate = () => {
    if (!selectedAbaque) return void toast.error('No abaque linked to this project');
    const estimate = getAbaqueEstimate(selectedAbaque, ticketForm.nature, ticketForm.complexity);
    if (estimate === null) return void toast.error('No matching abaque entry for selected nature and complexity');
    setTicketForm((prev) => ({ ...prev, effortHours: estimate }));
    setIsEstimatedByAbaque(true);
    toast.success('Effort pre-filled from project abaque');
  };

  const openCreateTicketDialog = (wricefObjectId?: string) => { setTicketForm({ ...EMPTY_TICKET_FORM, wricefObjectId: wricefObjectId ?? '' }); setIsEstimatedByAbaque(false); setShowCreateTicket(true); };
  const handleCreateTicketOpenChange = (open: boolean) => { setShowCreateTicket(open); if (!open) { setTicketForm(EMPTY_TICKET_FORM); setIsEstimatedByAbaque(false); } };
  const createProjectTicket = async () => {
    if (!project || !currentUser) return;
    if (!ticketForm.title.trim()) return void toast.error('Ticket title is required');
    if (ticketForm.effortHours <= 0) return void toast.error('Effort hours must be greater than 0');
    try {
      setIsCreatingTicket(true);
      const { ticket: created, updatedProject } = await createTicketWithUnifiedFlow({
        project, wricefObjects, existingProjectTickets: tickets, createdBy: currentUser.id, priority: ticketForm.priority, nature: ticketForm.nature, title: ticketForm.title.trim(), description: ticketForm.description.trim(), dueDate: ticketForm.dueDate || undefined, module: 'OTHER', complexity: TICKET_COMPLEXITY_BY_ABAQUE[ticketForm.complexity], estimationHours: ticketForm.effortHours, estimatedViaAbaque: isEstimatedByAbaque, selectedWricefObjectId: ticketForm.wricefObjectId || undefined, creationComment: isEstimatedByAbaque ? 'Ticket created with abaque-based estimation' : 'Ticket created with manual estimation',
      });
      setTickets((prev) => [created, ...prev]);
      if (updatedProject) setProject(updatedProject);
      setTicketForm(EMPTY_TICKET_FORM);
      setIsEstimatedByAbaque(false);
      setShowCreateTicket(false);
      setActiveTab('objects');
      toast.success('Ticket created');
    } catch { toast.error('Failed to create ticket'); }
    finally { setIsCreatingTicket(false); }
  };

  const openCreateDocDialog = useCallback((objectId?: string) => {
    const object = objectId ? wricefObjects.find((item) => item.id === objectId) : undefined;
    setDocForObjectId(objectId ?? null);
    setDocForm({ title: object ? `SFD - ${object.title}` : '', description: object ? `Documentation for WRICEF object ${object.id}` : '', type: 'SFD', content: object ? `# ${object.title}\n\n## Context\n${object.description}\n\n## Functional Details\n- \n\n## Technical Notes\n- \n` : '# Documentation\n\n## Context\n\n## Details\n- \n' });
    setDocFiles([]);
    setShowCreateDoc(true);
  }, [wricefObjects]);
  const handleCreateDocOpenChange = (open: boolean) => { setShowCreateDoc(open); if (!open) { setDocForObjectId(null); setDocForm(EMPTY_DOC_FORM); setDocFiles([]); } };
  const createDocument = async () => {
    if (!project || !currentUser) return;
    if (!docForm.title.trim()) return void toast.error('Title is required');
    if (!docForm.content.trim()) return void toast.error('Content is required');
    try {
      setIsCreatingDoc(true);
      const created = await DocumentationAPI.create({ title: docForm.title.trim(), description: docForm.description.trim(), type: docForm.type, content: docForm.content.trim(), attachedFiles: docFiles, relatedTicketIds: [], projectId: project.id, authorId: currentUser.id });
      setDocumentationObjects((prev) => [created, ...prev]);
      if (docForObjectId) {
        const targetObject = wricefObjects.find((obj) => obj.id === docForObjectId);
        const nextDocumentationIds = [...new Set([...(targetObject?.documentationObjectIds ?? []), created.id])];
        try {
          const updatedObject = await WricefObjectsAPI.update(docForObjectId, {
            documentationObjectIds: nextDocumentationIds,
          });
          setWricefObjects((prev) =>
            prev.map((obj) => (obj.id === docForObjectId ? updatedObject : obj))
          );
        } catch {
          setWricefObjects((prev) =>
            prev.map((obj) =>
              obj.id !== docForObjectId
                ? obj
                : { ...obj, documentationObjectIds: nextDocumentationIds }
            )
          );
          toast.warning('Documentation created, but object linkage could not be persisted.');
        }
      }
      setShowCreateDoc(false);
      toast.success('Documentation created');
    } catch { toast.error('Failed to create documentation'); }
    finally { setIsCreatingDoc(false); }
  };
  const saveProjectDocumentation = async () => {
    if (!project) return;
    try { setDocSaving(true); await ProjectsAPI.update(project.id, { documentation: docText }); setProject((prev) => prev ? { ...prev, documentation: docText } : prev); toast.success('Documentation saved'); }
    catch { toast.error('Failed to save documentation'); }
    finally { setDocSaving(false); }
  };
  const addDocFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    setDocFiles((prev) => [...prev, ...Array.from(files).map((file) => ({ filename: file.name, size: file.size, url: URL.createObjectURL(file) }))]);
    event.target.value = '';
  };
  const formatBytes = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, tabKey: TabKey) => {
    const idx = PROJECT_TABS.findIndex((tab) => tab.key === tabKey); if (idx === -1) return;
    const move = (next: number) => { const tab = PROJECT_TABS[next]; setActiveTab(tab.key); queueMicrotask(() => document.getElementById(`project-tab-${tab.key}`)?.focus()); };
    if (event.key === 'ArrowRight') { event.preventDefault(); move((idx + 1) % PROJECT_TABS.length); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); move((idx - 1 + PROJECT_TABS.length) % PROJECT_TABS.length); }
    else if (event.key === 'Home') { event.preventDefault(); move(0); }
    else if (event.key === 'End') { event.preventDefault(); move(PROJECT_TABS.length - 1); }
  };

  if (loading) return <div className="min-h-screen bg-background"><div className="p-8 text-muted-foreground">Loading project details...</div></div>;
  if (!project) return null;

  return (
    <div className="min-h-screen bg-background">
      <ProjectHeader projectName={project.name} roleBasePath={roleBasePath} />
      <div className="p-6 space-y-6">
        <ProjectTabs tabs={PROJECT_TABS} activeTab={activeTab} onTabChange={setActiveTab} onTabKeyDown={handleTabKeyDown} />
        <OverviewPanel active={activeTab === 'overview'} vm={{ project, managerName: manager?.name ?? 'Unknown', ticketsCount: tickets.length, deliverablesCount: deliverables.length, openTicketsCount: tickets.filter((t) => t.status !== 'DONE' && t.status !== 'REJECTED').length, wricefObjectCount: wricefObjects.length, blockedTicketsCount: kpis.blocked, criticalTicketsCount: kpis.critical, abaques, selectedAbaque, abaqueTaskNatures, abaqueSaving, onLinkedAbaqueChange: (value) => { void updateProjectAbaque(value); }, onOpenCreateTicket: () => openCreateTicketDialog() }} />
        <AbaquesPanel active={activeTab === 'abaques'} vm={{ project, hasAbaqueEstimate, forceEstimatorVisible, projectEstimateSaving, estimatedDays, totalActualDays, totalActualHours, estimateConsumptionPercent, estimateDeltaDays, usageBarClass, onApplyEstimate: applyProjectEstimate, onRerunEstimate: () => setForceEstimatorVisible(true) }} />
        <TicketsPanel active={activeTab === 'tickets'} vm={{ tickets, paginatedTickets, filteredTickets, ticketsSearch, ticketsStatusFilter, ticketsPage, ticketsPageSize, ticketsTotalPages, selectedTicketId, selectedTicket, selectedTicketHistory, wricefStatusColor: WRICEF_STATUS_COLOR, wricefPriorityColor: WRICEF_PRIORITY_COLOR, onTicketsSearchChange: (value) => { setTicketsSearch(value); setTicketsPage(1); }, onTicketsStatusFilterChange: (value) => { setTicketsStatusFilter(value); setTicketsPage(1); }, onTicketsPageChange: setTicketsPage, onTicketsPageSizeChange: (value) => { setTicketsPageSize(value); setTicketsPage(1); }, onSelectTicket: setSelectedTicketId, onOpenTicketDetails: openTicketDetails, onOpenCreateTicket: () => openCreateTicketDialog(), formatTicketEventTime, renderTicketEvent, resolveUserName: userName }} />
        <TeamPanel active={activeTab === 'team'} allocations={allocations} users={users} />
        <WricefPanel active={activeTab === 'objects'} vm={{ objectsSearch, objectsTypeFilter, objectsComplexityFilter, objectsModuleFilter, objectsPage, objectsPageSize, objectsTotalPages, filteredObjectsCount: filteredObjects.length, wricefObjectCount: wricefObjects.length, wricefTotalTickets, wricefTotalDocuments, wricefImporting, onObjectsSearchChange: (value) => { setObjectsSearch(value); setObjectsPage(1); }, onObjectsTypeFilterChange: (value) => { setObjectsTypeFilter(value); setObjectsPage(1); }, onObjectsComplexityFilterChange: (value) => { setObjectsComplexityFilter(value); setObjectsPage(1); }, onObjectsModuleFilterChange: (value) => { setObjectsModuleFilter(value); setObjectsPage(1); }, onObjectsPageChange: setObjectsPage, onObjectsPageSizeChange: (value) => { setObjectsPageSize(value); setObjectsPage(1); }, onClearFilters: () => { setObjectsSearch(''); setObjectsTypeFilter(''); setObjectsComplexityFilter(''); setObjectsModuleFilter(''); setObjectsPage(1); }, onOpenCreateTicket: () => openCreateTicketDialog(), onImportWricefFile: (event) => { void importWricefFile(event); }, table: { objects: paginatedObjects, expandedObjectIds, wricefObjectTicketStats, wricefTypeBadgeClass: WRICEF_TYPE_BADGE_CLASS, complexityBadgeClass: COMPLEXITY_BADGE_CLASS, wricefStatusColor: WRICEF_STATUS_COLOR, wricefPriorityColor: WRICEF_PRIORITY_COLOR, getObjectTicketRows, getObjectDocs, resolveUserName: userName, onToggleExpandObject: toggleExpandObject, onOpenCreateTicket: openCreateTicketDialog, onOpenCreateDocument: (objectId) => openCreateDocDialog(objectId), onOpenTicketDetails: openTicketDetails, onViewDocument: setViewDocId, emptyMessage: wricefObjects.length === 0 ? 'No WRICEF objects imported yet. Upload a WRICEF Excel file to get started.' : 'No objects match the current filters.' } }} />
        <ProjectKpis active={activeTab === 'kpi'} kpis={kpis} totalActualHours={totalActualHours} totalEstimatedHours={totalEstimatedHours} />
        <DocumentationPanel active={activeTab === 'docs'} vm={{ projectKeywords: project.techKeywords ?? [], documentationObjects, docText, docSaving, onDocTextChange: setDocText, onSaveDocText: () => { void saveProjectDocumentation(); }, onCreateDocument: () => openCreateDocDialog(), onViewDocument: setViewDocId, resolveUserName: userName, getCountByType: (type: DocumentationObjectType) => countDocumentationByType(documentationObjects, type) }} />
        <CreateProjectTicketDialog open={showCreateTicket} vm={{ projectName: project.name, wricefObjects, selectedAbaque, abaqueTaskNatures, form: ticketForm, isEstimatedByAbaque, isCreatingTicket, onOpenChange: handleCreateTicketOpenChange, onFormChange: setTicketForm, onEstimatedByAbaqueChange: setIsEstimatedByAbaque, onApplyAbaqueEstimate: applyAbaqueEstimate, onSubmit: () => { void createProjectTicket(); }, onCancel: () => handleCreateTicketOpenChange(false) }} />
        <CreateDocumentationDialog open={showCreateDoc} vm={{ docForObjectId, form: docForm, files: docFiles, isCreatingDoc, onOpenChange: handleCreateDocOpenChange, onFormChange: setDocForm, onAddFiles: addDocFiles, onRemoveFile: (idx) => setDocFiles((prev) => prev.filter((_, i) => i !== idx)), onSubmit: () => { void createDocument(); }, onCancel: () => handleCreateDocOpenChange(false), formatBytes }} />
        <ViewDocumentationDialog open={Boolean(viewDocId)} document={viewedDocument} onOpenChange={(open) => { if (!open) setViewDocId(null); }} resolveUserName={userName} formatBytes={formatBytes} />
      </div>
    </div>
  );
};
