# CAP-SAP Project: Comprehensive Exploration Summary

**Date**: April 27, 2026  
**Project Type**: SAP CAP Backend + React Frontend Monorepo  
**Node Version**: 20 (pinned in `cap-backend/.node-version`)

---

## 1. Overall Project Purpose and Scope

**Project Name**: CAP-SAP Performance Dashboard

**Purpose**: A comprehensive performance management platform for SAP implementations, designed to manage:
- **Projects**: Project lifecycle, budgeting, allocation tracking
- **Tickets**: Issue/task management with approval workflows
- **Time Tracking**: Imputations, timesheets, time logs (exportable to StraTIME)
- **Evaluations**: Employee performance reviews with qualitative grids
- **Deliverables**: Project output tracking with validation workflows
- **WRICEF Objects**: Workflow, Reports, Interfaces, Conversions, Enhancements, Forms documentation
- **User Management**: Skills, certifications, allocations, leave requests
- **Documentation**: Technical documentation with attachments and ticket linking

**Technology Stack**:
- **Backend**: SAP CAP (Cloud Application Programming) v8 with OData v4
- **Frontend**: React 18 + TypeScript with Vite
- **Database**: SQLite (local development)
- **UI Framework**: Radix UI primitives with custom Tailwind CSS components
- **State Management**: React Context + TanStack React Query
- **Routing**: React Router v7

---

## 2. Backend Architecture Overview

### 2.1 Backend Directory Structure

```
cap-backend/
├── package.json                 # Backend dependencies and scripts
├── server.js                    # CAP server entry point
├── db/
│   ├── schema.cds              # Complete CDS domain model
│   └── data/                   # CSV seed data for all entities
├── srv/                        # Service layer
│   ├── base-service.js         # Global middleware, pagination, domain registration
│   ├── core-service.cds        # Core read-only service
│   ├── ticket-service.cds      # Ticket domain service
│   ├── user-service.cds        # User domain service
│   ├── time-service.cds        # Time/imputation service
│   ├── allocation/             # Allocation domain
│   ├── auth/                   # Authentication domain
│   ├── comment/                # Ticket comments domain
│   ├── deliverable/            # Deliverables domain
│   ├── documentation/          # Documentation objects domain
│   ├── evaluation/             # Evaluations domain
│   ├── imputation/             # Time imputations domain
│   ├── imputation-period/      # Imputation period grouping domain
│   ├── leave-request/          # Leave request domain
│   ├── notification/           # Notifications domain
│   ├── project/                # Projects domain
│   ├── project-feedback/       # Project feedback domain
│   ├── reference-data/         # Reference lookup data
│   ├── shared/                 # Shared utilities (audit, validation, etc.)
│   ├── ticket/                 # Tickets domain (primary)
│   ├── time-log/               # Granular time entries
│   ├── timesheet/              # Legacy daily timesheets
│   ├── user/                   # Users domain
│   └── wricef/                 # WRICEF objects domain
└── test/
    └── integration.test.js     # Jest-based integration tests
```

### 2.2 Service Definitions and OData Endpoints

| Service | Path | Entities Exposed |
|---------|------|-----------------|
| **CoreService** | `/odata/v4/core` | Users, Tickets (read-only projections) |
| **TicketService** | `/odata/v4/ticket` | Uses from ticket domain handlers |
| **UserService** | `/odata/v4/user` | Uses from user/allocation/leave-request handlers |
| **TimeService** | `/odata/v4/time` | Uses from time-log/imputation/evaluation handlers |

### 2.3 Domain-Driven Architecture Pattern

Each domain (e.g., `ticket/`, `user/`) follows a layered pattern:

```
domain/
├── {domain}.service.cds       # CDS service definition (entity projections, custom actions)
├── {domain}.impl.js           # Request hooks (before/after CREATE, READ, UPDATE, DELETE)
├── {domain}.domain.service.js # Business logic (no HTTP/CDS layer knowledge)
└── {domain}.repo.js           # Data access layer (repository pattern)
```

**Example: Ticket Domain**
- `ticket.service.cds`: Defines TicketComments, custom actions (approveTicket, rejectTicket)
- `ticket.impl.js`: Registers before/after hooks, delegates to domain service
- `ticket.domain.service.js`: Core business logic (validations, state transitions)
- `ticket.repo.js`: Query/mutation helpers

### 2.4 Backend Features and Capabilities

**Authentication**:
- Mocked auth (development mode) via `base-service.js`
- Auth domain service validates claims per request
- Role-based enforcement on CRUD operations

**Middleware & Infrastructure**:
- **Pagination**: Enforces `$top` ≤ 500, defaults to 100 if omitted
- **Audit Trail**: Automatic logging of CREATE/UPDATE/DELETE via `shared/services/audit`
- **Domain Registration**: Automatic discovery and registration of `{domain}.impl.js` files
- **Validation**: Shared validation utilities in `shared/services/validation`

**Advanced Features**:
- Ticket approval/rejection workflows
- Time imputation validation cascade
- Leave request approval tracking
- WRICEF document versioning
- Deliverable validation states
- Project feedback collection

---

## 3. Frontend Architecture Overview

### 3.1 Frontend Directory Structure

```
frontend/
├── package.json                          # Frontend dependencies
├── vite.config.ts                        # Vite + Tailwind + React + API proxy config
├── tsconfig.json                         # TypeScript strict mode
├── index.html                            # SPA entry point
├── src/
│   ├── main.tsx                         # React DOM render
│   ├── app/
│   │   ├── App.tsx                      # Root component with providers
│   │   ├── routes.tsx                   # React Router configuration
│   │   ├── pages/                       # Role-based page layouts
│   │   │   ├── Login.page.tsx
│   │   │   ├── admin/
│   │   │   ├── consultant-func/
│   │   │   ├── consultant-tech/
│   │   │   ├── dev-coordinator/
│   │   │   ├── manager/
│   │   │   ├── project-manager/
│   │   │   └── shared/
│   │   ├── features/                    # Feature-first module organization
│   │   │   ├── projects/                # Project management
│   │   │   │   ├── api.ts
│   │   │   │   ├── model.ts
│   │   │   │   ├── queries.ts
│   │   │   │   ├── pages/
│   │   │   │   └── components/
│   │   │   ├── tickets/                 # Ticket management
│   │   │   │   ├── api.ts
│   │   │   │   ├── model.ts
│   │   │   │   ├── pages/
│   │   │   │   └── components/
│   │   │   ├── comments/                # Ticket discussion thread
│   │   │   │   └── ...
│   │   │   ├── imputations/             # Time validation workflow
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── model.ts
│   │   │   │   ├── queries.ts
│   │   │   │   ├── schema.ts
│   │   │   │   └── ...
│   │   │   └── ...
│   │   ├── components/                  # Shared UI components
│   │   │   ├── business/                # Domain-specific components (forms, panels)
│   │   │   ├── charts/                  # Chart visualizations
│   │   │   ├── common/                  # Utilities (error boundary, loaders)
│   │   │   ├── layout/                  # Layout wrapper (MainLayout)
│   │   │   └── ui/                      # Radix UI-based design system
│   │   ├── context/                     # Global context providers
│   │   │   ├── AuthContext.tsx          # Authentication & session
│   │   │   ├── DensityContext.tsx       # UI density setting
│   │   │   ├── ThemeContext.tsx         # Dark/light theme
│   │   │   └── roleRouting.ts           # Role-based routing logic
│   │   ├── services/                    # API layer
│   │   │   ├── odata/                   # OData client
│   │   │   │   ├── odataClient.ts       # HTTP client with auth
│   │   │   │   ├── core.ts              # Token management
│   │   │   │   └── ...API.ts            # Entity-specific APIs
│   │   │   ├── aiRecommender.ts
│   │   │   ├── ticketCreation.ts
│   │   │   └── ...
│   │   ├── routing/                     # Routing utilities
│   │   │   └── routeRegistry.ts         # Route definitions by role
│   │   ├── types/                       # TypeScript definitions
│   │   │   └── entities.ts              # Entity types mirroring backend CDS
│   │   └── utils/                       # Utility functions
│   │       ├── async.ts
│   │       ├── date.ts
│   │       ├── projectAbaque.ts
│   │       ├── ticketColors.ts
│   │       ├── teamsChat.ts
│   │       └── wricefExcel.ts
│   ├── styles/                          # Global styles
│   └── assets/                          # Static assets
└── public/                              # Public assets (favicon, etc.)
```

### 3.2 Frontend State Management & Context

**Authentication Context** (`AuthContext.tsx`):
- Manages `currentUser`, `isAuthenticated`, login/logout/switchUser
- Persists session in localStorage (key: `auth.session.v1`)
- Supports legacy user ID migration
- Provides direct login for development (VITE_ALLOW_DIRECT_LOGIN)

**Theme Context** (`ThemeContext.tsx`):
- Manages dark/light theme
- Persists preference to localStorage

**Density Context** (`DensityContext.tsx`):
- UI density setting (compact/comfortable/spacious)

**Query Management** (`App.tsx`):
- TanStack React Query client for server state
- Handles caching, invalidation, background sync

### 3.3 Frontend Routing Architecture

**Role-Based Routing** (`routing/routeRegistry.ts`):
- 6 user roles: ADMIN, MANAGER, CONSULTANT_TECHNIQUE, CONSULTANT_FONCTIONNEL, PROJECT_MANAGER, DEV_COORDINATOR
- Each role has dedicated page hierarchy
- Default landing page determined by role
- Route guards verify authentication and role membership

**Route Structure**:
```
/login                           (public)
/{role}/                        (protected, role-specific)
  ├── dashboard
  ├── projects
  ├── tickets
  ├── time-tracking
  ├── evaluations
  └── ...
```

### 3.4 Frontend Component Organization

**UI Component Library** (`components/ui/`):
- Radix UI-based design system primitives
- Tailwind CSS utility styling
- Custom components: Button, Input, Card, Modal, Dropdown, Toast, etc.

**Business Components** (`components/business/`):
- Domain-specific forms, panels, tables
- Reusable across multiple pages

**Charts** (`components/charts/`):
- Recharts-based visualizations
- Project timeline, allocation, time tracking charts

### 3.5 API Integration Layer

**OData Client** (`services/odata/odataClient.ts`):
- Wraps axios with authentication headers
- Base URL: `/odata/v4`
- Proxies to backend during dev (Vite config), separate services in production

**Entity-Specific APIs**:
- `usersApi.ts`: Users, skills, certifications
- `ticketsApi.ts`: Tickets, comments, tags
- `projectsApi.ts`: Projects, allocations, feedback
- `timesApi.ts`: Imputations, timesheets, time logs
- `evaluationsApi.ts`: Employee evaluations
- Similar for other domains

**Token Management**:
- Token stored in memory during session
- Exported via `getODataAuthToken()`, `setODataAuthToken()`
- Auto-refresh on 401 via `onAuthExpired()` callback

---

## 4. Complete Database Schema (CDS)

### 4.1 Enum Types

```cds
type TicketStatus     : String(20) enum { PENDING_APPROVAL, APPROVED, NEW, IN_PROGRESS, IN_TEST, BLOCKED, DONE, REJECTED };
type CommentType      : String(20) enum { GENERAL, BLOCKER, QUESTION, UPDATE, FEEDBACK };
type WricefStatus     : String(30) enum { DRAFT, PENDING_VALIDATION, VALIDATED, REJECTED };
type ProjectStatus    : String(20) enum { PLANNED, ACTIVE, ON_HOLD, COMPLETED, CANCELLED };
type Priority         : String(20) enum { LOW, MEDIUM, HIGH, CRITICAL };
type RiskLevel        : String(20) enum { NONE, LOW, MEDIUM, HIGH, CRITICAL };
type TicketComplexity : String(20) enum { SIMPLE, MOYEN, COMPLEXE, TRES_COMPLEXE };
type TicketNature     : String(30) enum { WORKFLOW, FORMULAIRE, PROGRAMME, ENHANCEMENT, MODULE, REPORT };
type SAPModule        : String(20) enum { FI, CO, MM, SD, PP, PM, QM, HR, PS, WM, BASIS, ABAP, FIORI, BW, OTHER };
type ValidationStatus : String(20) enum { PENDING, APPROVED, CHANGES_REQUESTED };
type ImputationStatus : String(20) enum { DRAFT, SUBMITTED, VALIDATED, REJECTED };
type LeaveStatus      : String(20) enum { PENDING, APPROVED, REJECTED };
type DeliverableValidation : String(30) enum { PENDING, APPROVED, CHANGES_REQUESTED };
type UserRole         : String(40) enum { ADMIN, MANAGER, CONSULTANT_TECHNIQUE, CONSULTANT_FONCTIONNEL, PROJECT_MANAGER, DEV_COORDINATOR };
type ProjectType      : String(20) enum { TMA, BUILD };
type DocObjectType    : String(30) enum { SFD, GUIDE, ARCHITECTURE_DOC, GENERAL };
type WricefType       : String(10) enum { W, R, I, C, E, F };
type Complexity       : String(20) enum { LOW, MEDIUM, HIGH, CRITICAL };
```

### 4.2 Core Entities

#### Users
- `ID` (UUID, primary key)
- `name`, `email`, `role`, `active`
- `skills` (composition): UserSkills
- `certifications` (composition): UserCertifications
- `availabilityPercent`, `teamId`, `avatarUrl`

#### UserSkills
- `user` (association to Users)
- `skill` (string)

#### UserCertifications
- `user` (association to Users)
- `name`, `date`

#### Projects (Primary Domain)
- `ID` (UUID)
- `name`, `projectType` (TMA/BUILD), `manager` (association)
- `status`, `priority`, `complexity`
- `startDate`, `endDate`, `progress`
- `description` (LargeString), `documentation` (LargeString)
- `techKeywords` (composition)
- `abaqueEstimate` (composition)

#### ProjectTechKeywords
- `project` (association)
- `keyword` (string)

#### ProjectAbaqueEstimates
- `project` (association)
- `details` (LargeString)

#### Tickets (PRIMARY DOMAIN)
- `ID` (UUID)
- `ticketCode`, `projectId`, `createdBy`, `assignedTo`
- `status`, `priority`, `nature`, `complexity`
- `title`, `description`, `dueDate`
- `effortHours`, `estimationHours`, `estimatedViaAbaque`
- `module` (SAP module), `wricefId`
- `functionalTesterId`
- `allocatedHours`, `updatedAt`
- Compositions:
  - `tags`: TicketTags
  - `documentationObjectIds`: TicketDocumentationObjects
  - `history`: TicketHistory
  - `comments`: TicketComments

#### TicketTags
- `ticket` (association)
- `tag` (string)

#### TicketDocumentationObjects
- `ticket` (association)
- `docObjectId` (string reference)

#### TicketHistory
- `ticket` (association)
- `event`, `details`

#### TicketComments
- `ticket` (association), `ticketId`
- `author` (association to Users), `authorId`
- `message` (LargeString, required)
- `isInternal`, `commentType`, `resolved`
- `parentComment` (self-referential, for threaded replies)

#### Wricefs
- `ID` (UUID)
- `projectId`, `sourceFileName`, `importedAt`
- `status` (DRAFT/PENDING_VALIDATION/VALIDATED/REJECTED)
- `autoCreated`, `rejectionReason`, `submittedBy`, `submittedAt`

#### WricefObjects
- `ID` (UUID)
- `wricefId`, `projectId`
- `type` (W/R/I/C/E/F)
- `title`, `description`, `complexity`, `module`
- `status`, `rejectionReason`
- `documentationObjectIds` (composition)

#### WricefDocumentationObjects
- `wricefObject` (association)
- `docObjectId` (string reference)

#### Timesheets (Legacy)
- `ID` (UUID)
- `userId`, `projectId`, `ticketId`, `date`
- `hours` (Decimal), `comment`

#### Evaluations
- `ID` (UUID)
- `userId`, `evaluatorId`, `projectId`
- `period`, `score`
- `qualitativeGrid` (composition): EvaluationQualitativeGrids
- `feedback` (LargeString)

#### EvaluationQualitativeGrids
- `evaluation` (association)
- `criteria`, `rating`

#### Deliverables
- `ID` (UUID)
- `projectId`, `ticketId`
- `type`, `name`, `url`, `fileRef`
- `validationStatus` (PENDING/APPROVED/CHANGES_REQUESTED)
- `functionalComment` (LargeString)

#### Allocations
- `ID` (UUID)
- `userId`, `projectId`
- `allocationPercent`, `startDate`, `endDate`

#### LeaveRequests
- `ID` (UUID)
- `consultantId`, `managerId`
- `startDate`, `endDate`, `reason`
- `status` (PENDING/APPROVED/REJECTED)
- `reviewedAt`

#### TimeLogs (Granular)
- `ID` (UUID)
- `consultantId`, `ticketId`, `projectId`
- `date`, `durationMinutes` (exportable to StraTIME)
- `description`, `sentToStraTIME`, `sentAt`

#### Imputations (Formal Time Declarations)
- `ID` (UUID)
- `consultantId`, `ticketId`, `projectId`
- `date`, `hours` (Decimal), `module`
- `description`, `validationStatus`
- `periodKey`, `validatedBy`, `validatedAt`

#### ImputationPeriods
- `ID` (UUID)
- `periodKey`, `consultantId`
- `startDate`, `endDate`, `totalHours`
- `status` (DRAFT/SUBMITTED/VALIDATED)
- `submittedAt`, `validatedBy`, `validatedAt`
- `sentToStraTIME`, `sentBy`, `sentAt`

#### DocumentationObjects
- `ID` (UUID)
- `title`, `description`, `type` (SFD/GUIDE/ARCHITECTURE_DOC/GENERAL)
- `content` (LargeString)
- `projectId`, `authorId`
- `attachedFiles` (composition): DocAttachedFiles
- `relatedTicketIds` (composition): DocRelatedTickets
- `sourceSystem`, `sourceRefId`, `updatedAt`

#### DocAttachedFiles
- `docObject` (association)
- `fileName`, `fileUrl`

#### DocRelatedTickets
- `docObject` (association)
- `ticketId` (string reference)

#### Notifications
- `ID` (UUID)
- `userId`, `type`, `title`, `message`
- `read` (boolean, default false)

#### ProjectFeedback
- `ID` (UUID)
- `projectId`, `authorId`, `content` (LargeString)

#### ReferenceData (Lookups)
- `ID` (UUID)
- `type`, `code`, `label`, `active`, `order`

---

## 5. All Dependencies

### 5.1 Backend Dependencies (`cap-backend/package.json`)

**Production**:
| Package | Version | Purpose |
|---------|---------|---------|
| `@sap/cds` | ^8 | SAP Cloud Application Programming Model |
| `@cap-js/sqlite` | ^1 | SQLite database adapter for CAP |
| `@cap-js/mcp-server` | ^0.0.5 | Model Context Protocol server support |

**Development**:
| Package | Version | Purpose |
|---------|---------|---------|
| `@sap/cds-dk` | ^8 | CAP development kit (tooling) |
| `@types/jest` | ^30.0.0 | TypeScript types for Jest |
| `axios` | ^1.13.5 | HTTP client (for testing, integrations) |
| `chai` | ^4.5.0 | Assertion library for tests |
| `chai-as-promised` | ^7.1.2 | Promise assertions for Chai |
| `chai-subset` | ^1.6.0 | Deep equality testing for subsets |
| `eslint` | ^9.39.3 | Code linting |
| `jest` | ^29.7.0 | Testing framework |

**Configuration** (cds section):
```json
{
  "requires": {
    "auth": "mocked",
    "db": {
      "kind": "sqlite",
      "credentials": {
        "database": "db/performance.db"
      }
    }
  }
}
```

### 5.2 Frontend Dependencies (`frontend/package.json`)

**Production**:

| Category | Packages |
|----------|----------|
| **React Core** | react (18.3.1), react-dom (18.3.1), react-router (7.13.0) |
| **UI Components** | @radix-ui/* (25+ packages), lucide-react (0.487.0) |
| **Forms** | react-hook-form (7.55.0), @hookform/resolvers (5.2.2) |
| **Data Fetching** | @tanstack/react-query (5.90.21) |
| **Styling** | tailwindcss (4.1.12), tailwind-merge (3.2.0), class-variance-authority (0.7.1) |
| **Animation** | motion (12.23.24), embla-carousel-react (8.6.0) |
| **Charts** | recharts (2.15.2) |
| **Tables** | @hello-pangea/dnd (18.0.1), react-responsive-masonry (2.7.1) |
| **Date/Time** | date-fns (3.6.0), react-day-picker (8.10.1) |
| **Utilities** | clsx (2.1.1), vaul (1.1.2), cmdk (1.1.1), input-otp (1.4.2) |
| **Notifications** | sonner (2.0.3) |
| **Theme** | next-themes (0.4.6) |
| **Excel Export** | xlsx (0.18.5) |
| **Other** | react-slick (0.31.0), react-popper (2.3.0), react-resizable-panels (2.1.7), @popperjs/core (2.11.8) |

**Development**:

| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | 6.3.5 | Build tool & dev server |
| `@vitejs/plugin-react` | 4.7.0 | Vite React support |
| `@tailwindcss/vite` | 4.1.12 | Tailwind CSS Vite plugin |
| `typescript` | ^5.9.3 | TypeScript compiler |
| `@types/react` | ^18.3.12 | React type definitions |
| `@types/react-dom` | ^18.3.1 | React-DOM type definitions |
| `@types/node` | ^25.3.0 | Node.js type definitions |
| `eslint` | ^9.39.3 | Code linting |
| `@eslint/js` | ^9.39.3 | ESLint JavaScript rules |
| `typescript-eslint` | ^8.56.1 | TypeScript ESLint integration |
| `eslint-plugin-react-hooks` | ^7.0.1 | React hooks linting |
| `vitest` | ^3.2.4 | Unit testing framework |

**PNPM Overrides**:
```json
{
  "pnpm": {
    "overrides": {
      "vite": "6.3.5"
    }
  }
}
```

---

## 6. Key Configurations

### 6.1 Vite Configuration (`frontend/vite.config.ts`)

```typescript
{
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': 'src/  // Path alias for imports
    },
  },
  server: {
    proxy: {
      '/odata/v4': 'http://localhost:4004'  // Proxy to backend
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],  // Asset file types
}
```

**Key Features**:
- React Fast Refresh via Vite plugin
- Tailwind CSS integrated as plugin
- Path alias `@/` for cleaner imports
- Development server proxies OData calls to backend
- Raw asset imports (SVG, CSV) supported

### 6.2 TypeScript Configuration (`frontend/tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,                    // Full strict mode
    "noUnusedLocals": true,           // Catch unused variables
    "noUnusedParameters": true,       // Catch unused parameters
    "noFallthroughCasesInSwitch": true, // Switch case validation
    "paths": {
      "@/*": ["./src/*"]              // Path alias
    }
  },
  "include": ["src"]
}
```

**Strict Mode Enforced**:
- All variables/parameters must be used
- No fallthrough cases in switch statements
- Full type safety

### 6.3 Tailwind CSS Configuration (`frontend/tailwind.config.mjs` - inferred)

- Integrated via `@tailwindcss/vite` plugin
- Custom design system tokens
- Dark mode support via next-themes
- Variable-based color system

### 6.4 CAP Configuration (`cap-backend/package.json`)

```json
{
  "cds": {
    "requires": {
      "auth": "mocked",              // Mock auth for development
      "db": {
        "kind": "sqlite",            // SQLite for local dev
        "credentials": {
          "database": "db/performance.db"  // Local database file
        }
      }
    }
  }
}
```

---

## 7. Build, Test, and Development Commands

### Backend (`cap-backend/`)
```bash
npm install              # Install dependencies
npm start               # Start cds-serve (production)
npm run watch           # Watch mode with auto-reload
npm run build           # Build CAP artifacts
npm test                # Run Jest integration tests
```

### Frontend (`frontend/`)
```bash
npm install             # Install dependencies
npm run dev            # Start Vite dev server (port 5173)
npm run build          # Production build
npm run typecheck      # TypeScript strict check
npm run check          # typecheck + build + vitest (pre-PR gate)
```

---

## 8. Service Structure and Relationships

### 8.1 Service Dependency Graph

```
CoreService
├── Uses: Projects, Users (read-only)

TicketService
├── ticket-service.cds (orchestrator)
├── ticket/ (domain)
│   ├── ticket.service.cds
│   ├── ticket.impl.js (hooks)
│   ├── ticket.domain.service.js (business logic)
│   └── ticket.repo.js (queries)
└── comment/ (sub-domain)
    └── comment.impl.js

UserService
├── user-service.cds (orchestrator)
├── user/ (domain)
│   ├── user.service.cds
│   ├── user.impl.js
│   ├── user.domain.service.js
│   └── user.repo.js
├── allocation/ → allocates users to projects
├── leave-request/ → manages leave
└── notification/ → user notifications

TimeService
├── time-service.cds (orchestrator)
├── timesheet/ → legacy daily hours
├── time-log/ → granular entries (→ StraTIME)
├── imputation/ → formal time declarations
├── imputation-period/ → grouped imputations
└── evaluation/ → performance scores

Project Service (embedded in core)
├── project/ (domain)
├── project-feedback/ (sub-domain)
└── deliverable/ (sub-domain)

Additional Domains:
├── wricef/ → WRICEF objects & documentation
├── documentation/ → tech docs with attachments
├── reference-data/ → lookup tables
└── shared/ → audit, validation, auth
```

### 8.2 Entity Relationships Overview

```
Users (1) ──→ (many) Projects (manages)
Users (1) ──→ (many) Tickets (creates, assigns, tests)
Users (1) ──→ (many) Evaluations (evaluated by)
Users (1) ──→ (many) Allocations (allocated to projects)

Projects (1) ──→ (many) Tickets
Projects (1) ──→ (many) Allocations
Projects (1) ──→ (many) Deliverables
Projects (1) ──→ (many) Wricefs
Projects (1) ──→ (many) Documentation
Projects (1) ──→ (many) ProjectFeedback

Tickets (1) ──→ (many) TicketComments (discussion thread)
Tickets (1) ──→ (many) TicketTags
Tickets (1) ──→ (many) TicketHistory
Tickets (1) ──→ (many) TimeLogs
Tickets (1) ──→ (many) Imputations
Tickets (1) ──→ (many) Deliverables

Wricefs (1) ──→ (many) WricefObjects
WricefObjects (many-to-many) ↔ DocumentationObjects (via DocRelatedTickets)

Imputations → ImputationPeriods (grouped by periodKey)
ImputationPeriods → StraTIME export

TimeLogs (granular) → StraTIME export
```

---

## 9. Key Features & Business Logic

### 9.1 Ticket Management
- **Creation**: Capture title, description, effort, SAP module
- **Assignment**: Assign to consultants, functional testers
- **Workflow States**: NEW → APPROVED → IN_PROGRESS → IN_TEST → DONE
- **Approval Actions**: approveTicket, rejectTicket (custom actions)
- **Tagging**: Multi-tag support for categorization
- **Documentation Linking**: Associate tickets with WRICEF objects and docs
- **History Tracking**: Audit trail via TicketHistory

### 9.2 Time Tracking
- **Granular Time Logs**: Per-ticket entries (exportable to StraTIME)
- **Imputations**: Formal time declarations with approval workflow
  - DRAFT → SUBMITTED → VALIDATED
- **Timesheets**: Legacy daily hours per project/ticket
- **Periods**: Group imputations by pay period, export to StraTIME
- **Authorization**: Only managers can validate imputations

### 9.3 WRICEF Management
- **Type Classification**: W (Workflow), R (Report), I (Interface), C (Conversion), E (Enhancement), F (Form)
- **Versioning**: DRAFT → PENDING_VALIDATION → VALIDATED
- **Rejection Workflow**: With reason tracking
- **Auto-Creation**: Can be auto-created from documents
- **Documentation Linking**: Related to DocumentationObjects

### 9.4 Projects & Allocations
- **Project Types**: TMA (Time & Materials), BUILD (Fixed-scope)
- **Status Tracking**: PLANNED → ACTIVE → ON_HOLD → COMPLETED
- **Allocations**: User availability per project (percentage-based)
- **Estimates**: Abaque-based estimation records
- **Tech Keywords**: Skills required for project
- **Feedback Collection**: Open feedback channel for project learnings

### 9.5 User & Leave Management
- **Skills Tracking**: User skills with implicit expertise levels
- **Certifications**: Date-tracked with expiry logic (on frontend)
- **Leave Requests**: PENDING → APPROVED/REJECTED workflow
- **Manager Approval**: Leave requests reviewed by team manager
- **Roles**: 6-level role hierarchy (ADMIN → PROJECT_MANAGER → ...)

### 9.6 Documentation & Knowledge
- **Documentation Objects**: SFD, guides, architecture docs, general
- **Attachments**: Files with URLs
- **Ticket Linking**: Document-to-ticket relationships
- **Author Tracking**: Creation and update metadata
- **Source System**: Can reference external systems (SAP, Confluence, etc.)

### 9.7 Evaluations & Performance
- **Evaluator Model**: Manager → Consultant evaluation
- **Qualitative Grid**: Multi-criteria assessment
- **Scores & Feedback**: Numeric + text feedback
- **Period Tracking**: Linked to evaluation periods

---

## 10. Data Seeding

CSV files in `cap-backend/db/data/` provide initial data:
- Users and UserSkills
- Projects, ProjectTechKeywords, ProjectAbaqueEstimates
- Tickets, TicketTags, TicketComments, TicketHistory
- Allocations, Evaluations, EvaluationQualitativeGrids
- TimeLogs, Imputations, ImputationPeriods, Timesheets
- Wricefs, WricefObjects, WricefDocumentationObjects
- DocumentationObjects, DocAttachedFiles, DocRelatedTickets
- Deliverables, LeaveRequests, Notifications, ProjectFeedback
- ReferenceData

---

## 11. Development Workflow

### Setup
```bash
# Backend
cd cap-backend
fnm exec --using=.node-version npm install
fnm exec --using=.node-version npm run watch  # starts on :4004

# Frontend (in separate terminal)
cd frontend
npm install
npm run dev  # starts on :5173, proxies /odata/v4 → :4004
```

### Testing
```bash
# Frontend
npm run check  # Full check: typecheck + build + vitest

# Backend
npm test       # Jest integration tests
```

### Pre-PR Checklist
1. **Frontend**: `npm run check` passes (no type errors, builds, tests pass)
2. **Backend**: `npm test` passes (integration tests)
3. **CAP Verification**: Manual testing via Postman/REST client
4. **Screenshots/Videos**: For UI changes
5. **Commit Message**: Conventional Commit format (feat:, fix:, refactor:)

---

## 12. Production Deployment Notes

### Environment Variables

**Frontend** (`VITE_*` prefix):
- `VITE_ODATA_CORE_URL`: Core service endpoint
- `VITE_ODATA_USER_URL`: User service endpoint
- `VITE_ODATA_TICKET_URL`: Ticket service endpoint
- `VITE_ODATA_TIME_URL`: Time service endpoint
- `VITE_ODATA_BASE_URL`: Legacy fallback (if specific URLs not set)
- `VITE_ALLOW_DIRECT_LOGIN`: Enable dev-mode role switching (should be false in prod)

**Backend**:
- CAP requires database credentials (production: SAP HANA, managed via cds requires)
- Auth integration required (production: real OAuth/SAML, mocked in dev)

### Database
- Development: SQLite (`db/performance.db`)
- Production: SAP HANA (via CAP database adapter)
- **Do not commit**: Local DB files, secrets, credentials

---

## 13. Summary Statistics

| Aspect | Count |
|--------|-------|
| **Backend Domains** | 18 (ticket, user, project, time-log, imputation, etc.) |
| **Frontend Features** | 4 main (projects, tickets, comments, imputations) |
| **Frontend Pages by Role** | 6 role-based hierarchies (admin, manager, consultant-func, consultant-tech, dev-coordinator, project-manager) |
| **Database Entities** | 23+ (Users, Projects, Tickets, Wricefs, Timesheets, etc.) |
| **OData Services** | 4 (CoreService, TicketService, UserService, TimeService) |
| **User Roles** | 6 (ADMIN, MANAGER, CONSULTANT_TECHNIQUE, CONSULTANT_FONCTIONNEL, PROJECT_MANAGER, DEV_COORDINATOR) |
| **Backend Dependencies** | 3 prod, 8 dev |
| **Frontend Dependencies** | 40+ prod, 11 dev |
| **TypeScript Strict Mode** | Enforced (all variables/params used, no-fallthrough) |

---

## Conclusion

The CAP-SAP project is a comprehensive, role-based performance management platform with:
- **Modular Backend**: Domain-driven architecture with clean separation of concerns
- **Modern Frontend**: React + TypeScript with strict typing, role-based routing, and responsive UI
- **Rich Data Model**: 23+ entities with complex relationships and enums
- **Enterprise Features**: Approval workflows, audit trails, time tracking, evaluations, WRICEF documentation
- **Developer Experience**: Hot reload (Vite), strict TypeScript, automated testing, mocked auth for development

The project is production-ready with clear separation of concerns, comprehensive type safety, and scalable architecture patterns.
