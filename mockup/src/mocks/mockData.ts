// Mock seed data for all OData entity sets.
// Used by mockPlugin.ts during local dev when the real CAP backend is unavailable.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _seq = 1;
export const newId = (prefix = 'mock') => `${prefix}-${String(_seq++).padStart(4, '0')}`;

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export const users = [
  {
    id: 'u-admin',
    name: 'Alice Admin',
    email: 'alice.admin@inetum.com',
    role: 'ADMIN',
    active: true,
    skills: ['Administration', 'SAP BASIS'],
    certifications: [],
    availabilityPercent: 100,
    teamId: 'team-1',
  },
  {
    id: 'u-manager',
    name: 'Marc Manager',
    email: 'marc.manager@inetum.com',
    role: 'MANAGER',
    active: true,
    skills: ['Management', 'SAP SD', 'SAP MM'],
    certifications: [],
    availabilityPercent: 80,
    teamId: 'team-1',
  },
  {
    id: 'u-tech',
    name: 'Théo Technique',
    email: 'theo.tech@inetum.com',
    role: 'CONSULTANT_TECHNIQUE',
    active: true,
    skills: ['ABAP', 'SAP FI', 'Fiori'],
    certifications: [],
    availabilityPercent: 90,
    teamId: 'team-1',
  },
  {
    id: 'u-fonc',
    name: 'Fatima Fonctionnel',
    email: 'fatima.fonc@inetum.com',
    role: 'CONSULTANT_FONCTIONNEL',
    active: true,
    skills: ['SAP FI', 'SAP CO', 'Project Management'],
    certifications: [],
    availabilityPercent: 75,
    teamId: 'team-1',
  },
  {
    id: 'u-pm',
    name: 'Pierre Projet',
    email: 'pierre.pm@inetum.com',
    role: 'PROJECT_MANAGER',
    active: true,
    skills: ['Project Management', 'SAP PS'],
    certifications: [],
    availabilityPercent: 60,
    teamId: 'team-1',
  },
  {
    id: 'u-devco',
    name: 'Diana DevCo',
    email: 'diana.devco@inetum.com',
    role: 'DEV_COORDINATOR',
    active: true,
    skills: ['ABAP', 'Fiori', 'SAP BW'],
    certifications: [],
    availabilityPercent: 85,
    teamId: 'team-1',
  },
];

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export const projects = [
  {
    id: 'proj-1',
    name: 'SAP S/4HANA Migration – Acme Corp',
    projectType: 'BUILD',
    managerId: 'u-manager',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'ACTIVE',
    priority: 'HIGH',
    description: 'Full S/4HANA migration covering FI, CO, SD, MM modules.',
    progress: 35,
    complexity: 'HIGH',
    techKeywords: ['SAP S/4HANA', 'FI', 'CO', 'SD', 'MM'],
    documentation: 'Migration playbook v2.3',
  },
  {
    id: 'proj-2',
    name: 'Fiori Launchpad – Groupe Lebon',
    projectType: 'TMA',
    managerId: 'u-manager',
    startDate: '2026-02-01',
    endDate: '2026-08-31',
    status: 'ACTIVE',
    priority: 'MEDIUM',
    description: 'Custom Fiori dashboard with KPI tiles.',
    progress: 55,
    complexity: 'MEDIUM',
    techKeywords: ['Fiori', 'UI5', 'ABAP'],
    documentation: '',
  },
  {
    id: 'proj-3',
    name: 'BI/BW Reporting Overhaul',
    projectType: 'BUILD',
    managerId: 'u-manager',
    startDate: '2025-11-01',
    endDate: '2026-06-30',
    status: 'ON_HOLD',
    priority: 'LOW',
    description: 'Upgrade BW reports to embedded analytics.',
    progress: 10,
    complexity: 'MEDIUM',
    techKeywords: ['BW', 'Analytics'],
    documentation: '',
  },
];

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------
export const tasks = [
  {
    id: 'task-1',
    projectId: 'proj-1',
    title: 'Design FI data migration mapping',
    description: 'Map legacy FI account structures to S/4HANA chart of accounts.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assigneeId: 'u-tech',
    assignerId: 'u-manager',
    plannedStart: '2026-01-10',
    plannedEnd: '2026-02-10',
    realStart: '2026-01-12',
    progressPercent: 60,
    estimatedHours: 80,
    actualHours: 48,
    effortHours: 50,
    isCritical: true,
    riskLevel: 'MEDIUM',
  },
  {
    id: 'task-2',
    projectId: 'proj-1',
    title: 'SD module configuration',
    description: 'Configure Sales & Distribution pricing conditions.',
    status: 'TO_DO',
    priority: 'MEDIUM',
    assigneeId: 'u-fonc',
    assignerId: 'u-manager',
    plannedStart: '2026-02-15',
    plannedEnd: '2026-03-15',
    progressPercent: 0,
    estimatedHours: 60,
    actualHours: 0,
    effortHours: 0,
    isCritical: false,
    riskLevel: 'LOW',
  },
  {
    id: 'task-3',
    projectId: 'proj-2',
    title: 'Build KPI tile components',
    description: 'Create SAPUI5 KPI tiles using OVP card framework.',
    status: 'DONE',
    priority: 'HIGH',
    assigneeId: 'u-tech',
    assignerId: 'u-pm',
    plannedStart: '2026-02-01',
    plannedEnd: '2026-02-20',
    realStart: '2026-02-01',
    realEnd: '2026-02-18',
    progressPercent: 100,
    estimatedHours: 40,
    actualHours: 38,
    effortHours: 38,
    isCritical: false,
    riskLevel: 'NONE',
  },
  {
    id: 'task-4',
    projectId: 'proj-2',
    title: 'Integration with backend OData services',
    description: 'Expose BW queries via CAP OData v4.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assigneeId: 'u-devco',
    assignerId: 'u-manager',
    plannedStart: '2026-02-18',
    plannedEnd: '2026-03-10',
    realStart: '2026-02-19',
    progressPercent: 40,
    estimatedHours: 50,
    actualHours: 20,
    effortHours: 22,
    isCritical: true,
    riskLevel: 'HIGH',
  },
  {
    id: 'task-5',
    projectId: 'proj-3',
    title: 'Audit existing BW reports',
    description: 'List all active BW InfoProvider reports for migration.',
    status: 'BLOCKED',
    priority: 'LOW',
    assigneeId: 'u-fonc',
    assignerId: 'u-manager',
    plannedStart: '2025-11-15',
    plannedEnd: '2025-12-15',
    progressPercent: 20,
    estimatedHours: 30,
    actualHours: 6,
    effortHours: 6,
    isCritical: false,
    riskLevel: 'HIGH',
  },
  {
    id: 'task-6',
    projectId: 'proj-1',
    title: 'User acceptance testing – FI module',
    description: 'Execute UAT test scripts with key users.',
    status: 'TO_DO',
    priority: 'CRITICAL',
    assigneeId: 'u-pm',
    assignerId: 'u-manager',
    plannedStart: '2026-04-01',
    plannedEnd: '2026-04-30',
    progressPercent: 0,
    estimatedHours: 100,
    actualHours: 0,
    effortHours: 0,
    isCritical: true,
    riskLevel: 'MEDIUM',
  },
];

// ---------------------------------------------------------------------------
// Wricefs & WricefObjects
// ---------------------------------------------------------------------------
export const wricefs = [
  {
    id: 'w-001',
    projectId: 'proj-1',
    sourceFileName: 'Blueprint_Delta.xlsx',
    importedAt: '2026-01-10T10:00:00Z',
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'w-002',
    projectId: 'proj-2',
    sourceFileName: 'S4_Objects_List.xlsx',
    importedAt: '2026-01-20T10:00:00Z',
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z',
  }
];

export const wricefObjects = [
  {
    id: 'WRICEF-FI-001',
    wricefId: 'w-001',
    projectId: 'proj-1',
    type: 'I',
    title: 'Bank Statement Import',
    description: 'Interface for daily bank statements.',
    complexity: 'MOYEN',
    module: 'FI',
    createdAt: '2026-01-10T10:01:00Z',
  },
  {
    id: 'WRICEF-MM-001',
    wricefId: 'w-001',
    projectId: 'proj-1',
    type: 'W',
    title: 'PO Approval',
    description: 'Purchase Order workflow.',
    complexity: 'COMPLEXE',
    module: 'MM',
    createdAt: '2026-01-10T10:01:00Z',
  },
  {
    id: 'WRICEF-HR-001',
    wricefId: 'w-002',
    projectId: 'proj-2',
    type: 'F',
    title: 'Leave Request Form',
    description: 'Fiori form for absences.',
    complexity: 'SIMPLE',
    module: 'HR',
    createdAt: '2026-01-20T10:01:00Z',
  },
  {
    id: 'WRICEF-FI-002',
    wricefId: 'w-001',
    projectId: 'proj-1',
    type: 'R',
    title: 'Aged AR Report',
    description: 'Accounts receivable aging.',
    complexity: 'SIMPLE',
    module: 'FI',
    createdAt: '2026-01-10T10:01:00Z',
  },
  {
    id: 'WRICEF-MM-002',
    wricefId: 'w-002',
    projectId: 'proj-2',
    type: 'E',
    title: 'Real-time WM sync',
    description: 'Enhancement for warehouse movement.',
    complexity: 'TRES_COMPLEXE',
    module: 'WM',
    createdAt: '2026-01-20T10:01:00Z',
  },
];

// ---------------------------------------------------------------------------
// Tickets
// ---------------------------------------------------------------------------
export const tickets = [
  {
    id: 'tk-001',
    ticketCode: 'TK-2026-0001',
    projectId: 'proj-1',
    createdBy: 'u-manager',
    assignedTo: 'u-tech',
    assignedToRole: 'CONSULTANT_TECHNIQUE',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    nature: 'PROGRAMME',
    title: 'Fix FI posting period validation error',
    description: 'Users get BKPF 001 error when posting to prior period.',
    dueDate: '2026-03-01',
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-02-10T14:00:00Z',
    history: [],
    effortHours: 8,
    wricefId: 'WRICEF-FI-001',
    module: 'FI',
    estimationHours: 12,
    complexity: 'MOYEN',
    tags: ['FI', 'Posting', 'Bug'],
  },
  {
    id: 'tk-002',
    ticketCode: 'TK-2026-0002',
    projectId: 'proj-1',
    createdBy: 'u-manager',
    assignedTo: 'u-fonc',
    assignedToRole: 'CONSULTANT_FONCTIONNEL',
    status: 'NEW',
    priority: 'MEDIUM',
    nature: 'WORKFLOW',
    title: 'Purchase order approval workflow',
    description: 'Implement multi-level PO approval in SAP MM.',
    dueDate: '2026-04-15',
    createdAt: '2026-01-20T10:00:00Z',
    history: [],
    effortHours: 0,
    wricefId: 'WRICEF-MM-001',
    module: 'MM',
    estimationHours: 24,
    complexity: 'COMPLEXE',
    tags: ['MM', 'Workflow'],
  },
  {
    id: 'tk-003',
    ticketCode: 'TK-2026-0003',
    projectId: 'proj-2',
    createdBy: 'u-devco',
    assignedTo: 'u-tech',
    assignedToRole: 'CONSULTANT_TECHNIQUE',
    status: 'IN_TEST',
    priority: 'HIGH',
    nature: 'FORMULAIRE',
    title: 'Fiori leave request form',
    description: 'New Fiori app for employee leave requests.',
    dueDate: '2026-03-10',
    createdAt: '2026-02-01T08:00:00Z',
    history: [],
    effortHours: 20,
    wricefId: 'WRICEF-HR-001',
    module: 'HR',
    estimationHours: 20,
    complexity: 'SIMPLE',
    tags: ['Fiori', 'HR', 'Form'],
  },
  {
    id: 'tk-004',
    ticketCode: 'TK-2026-0004',
    projectId: 'proj-1',
    createdBy: 'u-manager',
    status: 'DONE',
    priority: 'LOW',
    nature: 'REPORT',
    title: 'Aged AR balance report',
    description: 'Custom report showing aged AR buckets.',
    createdAt: '2026-01-05T09:00:00Z',
    history: [],
    effortHours: 16,
    wricefId: 'WRICEF-FI-002',
    module: 'FI',
    estimationHours: 16,
    complexity: 'SIMPLE',
  },
  {
    id: 'tk-005',
    ticketCode: 'TK-2026-0005',
    projectId: 'proj-2',
    createdBy: 'u-manager',
    assignedTo: 'u-devco',
    assignedToRole: 'DEV_COORDINATOR',
    status: 'BLOCKED',
    priority: 'CRITICAL',
    nature: 'ENHANCEMENT',
    title: 'Real-time inventory sync – MM/WM',
    description: 'Push inventory changes in real-time to Fiori dashboard.',
    dueDate: '2026-03-20',
    createdAt: '2026-02-05T11:00:00Z',
    history: [],
    effortHours: 6,
    wricefId: 'WRICEF-MM-002',
    module: 'WM',
    estimationHours: 40,
    complexity: 'TRES_COMPLEXE',
    tags: ['WM', 'MM', 'Real-time'],
  },
];

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export const notifications = [
  {
    id: 'notif-1',
    userId: 'u-manager',
    type: 'TICKET_ASSIGNED',
    title: 'New ticket assigned',
    message: 'Ticket TK-2026-0001 has been assigned to Théo Technique.',
    read: false,
    createdAt: '2026-02-10T14:00:00Z',
  },
  {
    id: 'notif-2',
    userId: 'u-tech',
    type: 'TICKET_STATUS',
    title: 'Ticket in test',
    message: 'TK-2026-0003 has moved to IN_TEST status.',
    read: true,
    createdAt: '2026-02-12T09:00:00Z',
  },
  {
    id: 'notif-3',
    userId: 'u-admin',
    type: 'SYSTEM',
    title: 'System updated',
    message: 'Performance Hub updated to version 2.1.0.',
    read: false,
    createdAt: '2026-02-20T08:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Timesheets
// ---------------------------------------------------------------------------
export const timesheets = [
  {
    id: 'ts-1',
    userId: 'u-tech',
    date: '2026-02-10',
    hours: 8,
    projectId: 'proj-1',
    taskId: 'task-1',
    comment: 'FI mapping work',
  },
  {
    id: 'ts-2',
    userId: 'u-fonc',
    date: '2026-02-11',
    hours: 7,
    projectId: 'proj-1',
    comment: 'SD config review',
  },
];

// ---------------------------------------------------------------------------
// Evaluations
// ---------------------------------------------------------------------------
export const evaluations = [
  {
    id: 'eval-1',
    userId: 'u-tech',
    evaluatorId: 'u-manager',
    projectId: 'proj-1',
    period: '2026-Q1',
    score: 4.2,
    qualitativeGrid: { productivity: 4, quality: 5, autonomy: 4, collaboration: 4, innovation: 4 },
    feedback: 'Excellent technical work on FI module migration.',
    createdAt: '2026-02-01T09:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Deliverables
// ---------------------------------------------------------------------------
export const deliverables = [
  {
    id: 'del-1',
    projectId: 'proj-1',
    taskId: 'task-1',
    type: 'Document',
    name: 'FI Data Migration Mapping v1.0',
    validationStatus: 'APPROVED',
    createdAt: '2026-01-30T10:00:00Z',
  },
  {
    id: 'del-2',
    projectId: 'proj-2',
    type: 'Code',
    name: 'Fiori KPI Tile Component',
    validationStatus: 'PENDING',
    createdAt: '2026-02-18T14:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Abaques (estimation matrices)
// ---------------------------------------------------------------------------
export const abaques = [
  {
    id: 'abq-1',
    name: 'Standard SAP Estimation Matrix 2026',
    entries: [
      { taskNature: 'PROGRAMME', complexity: 'LOW', standardHours: 8 },
      { taskNature: 'PROGRAMME', complexity: 'MEDIUM', standardHours: 20 },
      { taskNature: 'PROGRAMME', complexity: 'HIGH', standardHours: 40 },
      { taskNature: 'WORKFLOW', complexity: 'LOW', standardHours: 6 },
      { taskNature: 'WORKFLOW', complexity: 'MEDIUM', standardHours: 16 },
      { taskNature: 'WORKFLOW', complexity: 'HIGH', standardHours: 32 },
      { taskNature: 'FORMULAIRE', complexity: 'LOW', standardHours: 4 },
      { taskNature: 'FORMULAIRE', complexity: 'MEDIUM', standardHours: 12 },
      { taskNature: 'FORMULAIRE', complexity: 'HIGH', standardHours: 24 },
      { taskNature: 'REPORT', complexity: 'LOW', standardHours: 8 },
      { taskNature: 'REPORT', complexity: 'MEDIUM', standardHours: 20 },
      { taskNature: 'REPORT', complexity: 'HIGH', standardHours: 40 },
      { taskNature: 'ENHANCEMENT', complexity: 'LOW', standardHours: 10 },
      { taskNature: 'ENHANCEMENT', complexity: 'MEDIUM', standardHours: 24 },
      { taskNature: 'ENHANCEMENT', complexity: 'HIGH', standardHours: 48 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Allocations
// ---------------------------------------------------------------------------
export const allocations = [
  { id: 'alloc-1', userId: 'u-tech', projectId: 'proj-1', allocationPercent: 60, startDate: '2026-01-01', endDate: '2026-12-31' },
  { id: 'alloc-2', userId: 'u-fonc', projectId: 'proj-1', allocationPercent: 50, startDate: '2026-01-01', endDate: '2026-12-31' },
  { id: 'alloc-3', userId: 'u-devco', projectId: 'proj-2', allocationPercent: 80, startDate: '2026-02-01', endDate: '2026-08-31' },
  { id: 'alloc-4', userId: 'u-tech', projectId: 'proj-2', allocationPercent: 30, startDate: '2026-02-01', endDate: '2026-08-31' },
  { id: 'alloc-5', userId: 'u-pm', projectId: 'proj-1', allocationPercent: 40, startDate: '2026-01-01', endDate: '2026-12-31' },
];

// ---------------------------------------------------------------------------
// Leave Requests
// ---------------------------------------------------------------------------
export const leaveRequests = [
  {
    id: 'leave-1',
    consultantId: 'u-tech',
    startDate: '2026-03-10',
    endDate: '2026-03-14',
    reason: 'Annual holidays',
    status: 'APPROVED',
    managerId: 'u-manager',
    createdAt: '2026-02-20T09:00:00Z',
  },
  {
    id: 'leave-2',
    consultantId: 'u-fonc',
    startDate: '2026-04-01',
    endDate: '2026-04-04',
    reason: 'Personal',
    status: 'PENDING',
    managerId: 'u-manager',
    createdAt: '2026-02-25T10:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Time Logs
// ---------------------------------------------------------------------------
export const timeLogs = [
  {
    id: 'tl-1',
    consultantId: 'u-tech',
    ticketId: 'tk-001',
    projectId: 'proj-1',
    date: '2026-02-10',
    durationMinutes: 240,
    description: 'Investigation and fix of posting period validation',
    sentToStraTIME: false,
  },
  {
    id: 'tl-2',
    consultantId: 'u-tech',
    ticketId: 'tk-003',
    projectId: 'proj-2',
    date: '2026-02-12',
    durationMinutes: 480,
    description: 'Fiori form development',
    sentToStraTIME: true,
    sentAt: '2026-02-13T09:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Imputations
// ---------------------------------------------------------------------------
export const imputations = [
  {
    id: 'imp-1',
    consultantId: 'u-tech',
    ticketId: 'tk-001',
    projectId: 'proj-1',
    module: 'FI',
    date: '2026-02-10',
    hours: 4,
    description: 'Debug posting period issue',
    validationStatus: 'VALIDATED',
    periodKey: '2026-02-H1',
    validatedBy: 'u-pm',
    validatedAt: '2026-02-16T09:00:00Z',
    createdAt: '2026-02-10T18:00:00Z',
  },
  {
    id: 'imp-2',
    consultantId: 'u-tech',
    ticketId: 'tk-003',
    projectId: 'proj-2',
    module: 'HR',
    date: '2026-02-12',
    hours: 8,
    description: 'Fiori form development',
    validationStatus: 'SUBMITTED',
    periodKey: '2026-02-H1',
    createdAt: '2026-02-12T18:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Imputation Periods
// ---------------------------------------------------------------------------
export const imputationPeriods = [
  {
    id: 'period-1',
    periodKey: '2026-02-H1',
    consultantId: 'u-tech',
    startDate: '2026-02-01',
    endDate: '2026-02-15',
    status: 'SUBMITTED',
    totalHours: 40,
    submittedAt: '2026-02-15T17:00:00Z',
  },
  {
    id: 'period-2',
    periodKey: '2026-01-H2',
    consultantId: 'u-tech',
    startDate: '2026-01-16',
    endDate: '2026-01-31',
    status: 'VALIDATED',
    totalHours: 36,
    submittedAt: '2026-01-31T17:00:00Z',
    validatedBy: 'u-pm',
    validatedAt: '2026-02-03T10:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Reference Data
// ---------------------------------------------------------------------------
export const referenceData = [
  { id: 'ref-1', type: 'PRIORITY', code: 'LOW', label: 'Low', active: true, order: 1 },
  { id: 'ref-2', type: 'PRIORITY', code: 'MEDIUM', label: 'Medium', active: true, order: 2 },
  { id: 'ref-3', type: 'PRIORITY', code: 'HIGH', label: 'High', active: true, order: 3 },
  { id: 'ref-4', type: 'PRIORITY', code: 'CRITICAL', label: 'Critical', active: true, order: 4 },
  { id: 'ref-5', type: 'TASK_STATUS', code: 'TO_DO', label: 'To Do', active: true, order: 1 },
  { id: 'ref-6', type: 'TASK_STATUS', code: 'IN_PROGRESS', label: 'In Progress', active: true, order: 2 },
  { id: 'ref-7', type: 'TASK_STATUS', code: 'DONE', label: 'Done', active: true, order: 3 },
  { id: 'ref-8', type: 'SKILL', code: 'ABAP', label: 'ABAP Development', active: true },
  { id: 'ref-9', type: 'SKILL', code: 'FIORI', label: 'SAP Fiori / UI5', active: true },
  { id: 'ref-10', type: 'SKILL', code: 'FI', label: 'SAP FI – Finance', active: true },
];

// ---------------------------------------------------------------------------
// Documentation Objects
// ---------------------------------------------------------------------------
export const documentationObjects = [
  {
    id: 'doc-1',
    title: 'FI Migration Architecture',
    description: 'Architecture overview for the FI data migration approach.',
    type: 'ARCHITECTURE_DOC',
    content: '# FI Migration Architecture\n\nThis document describes...',
    attachedFiles: [],
    relatedTicketIds: ['tk-001'],
    projectId: 'proj-1',
    createdAt: '2026-01-20T09:00:00Z',
    authorId: 'u-tech',
    sourceSystem: 'MANUAL',
  },
  {
    id: 'doc-2',
    title: 'SD Module Configuration Guide',
    description: 'Detailed SD pricing condition setup guide.',
    type: 'GUIDE',
    content: '# SD Configuration Guide\n\n## Pricing Conditions\n...',
    attachedFiles: [],
    relatedTicketIds: [],
    projectId: 'proj-1',
    createdAt: '2026-01-25T09:00:00Z',
    authorId: 'u-fonc',
    sourceSystem: 'MANUAL',
  },
];

// ---------------------------------------------------------------------------
// In-memory store (mutable) – keyed by entity set name
// ---------------------------------------------------------------------------

type Entity = Record<string, unknown>;

export const store: Record<string, Entity[]> = {
  Users: users as Entity[],
  Projects: projects as Entity[],
  Wricefs: wricefs as Entity[],
  WricefObjects: wricefObjects as Entity[],
  Tasks: tasks as Entity[],
  Tickets: tickets as Entity[],
  Notifications: notifications as Entity[],
  Timesheets: timesheets as Entity[],
  Evaluations: evaluations as Entity[],
  Deliverables: deliverables as Entity[],
  Abaques: abaques as Entity[],
  Allocations: allocations as Entity[],
  LeaveRequests: leaveRequests as Entity[],
  TimeLogs: timeLogs as Entity[],
  Imputations: imputations as Entity[],
  ImputationPeriods: imputationPeriods as Entity[],
  ReferenceData: referenceData as Entity[],
  DocumentationObjects: documentationObjects as Entity[],
};
