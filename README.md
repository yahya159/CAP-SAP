# CAP-SAP Performance Dashboard

Monorepo for a SAP CAP backend and a React frontend used to manage projects, tickets, WRICEF objects, time tracking, evaluations, and related dashboard data.

## Project Structure

```text
CAP-SAP/
  frontend/      # Vite + React + TypeScript UI
  cap-backend/   # SAP CAP OData v4 services (Node.js + SQLite)
```

## Tech Stack

- Frontend: `Vite`, `React`, `TypeScript`, `Vitest`
- Backend: `SAP CAP (cds)`, `Node.js`, `SQLite`, `Jest`

## Prerequisites

- Node.js 18+ (recommended current LTS)
- npm 9+

## Quick Start

1. Install frontend dependencies:

```bash
cd frontend
npm install
```

2. Install backend dependencies:

```bash
cd ../cap-backend
npm install
```

3. Start backend (CAP server at `http://localhost:4004`):

```bash
fnm exec --using=.node-version npm run watch
```

4. In a second terminal, start frontend:

```bash
cd ../frontend
npm run dev
```

5. Open the frontend URL shown by Vite (typically `http://localhost:5173`).

## Frontend Commands (`frontend/`)

- `npm run dev`: start Vite dev server
- `npm run typecheck`: run strict TypeScript checks
- `npm run build`: create production build
- `npm run check`: run typecheck + build

## Backend Commands (`cap-backend/`)

- `npm run watch`: start CAP with live reload
- `npm start`: run `cds-serve`
- `npm run build`: create CAP build artifacts
- `npm test`: run backend integration tests (Jest)

Node version note: `cap-backend/.node-version` pins backend runtime to Node `20`.
Do not use global `cds watch` directly on Node 24 shells; use `fnm exec --using=.node-version ...`.

### Backend Deployment Commands

From `cap-backend/`:

- `fnm exec --using=.node-version npx cds deploy --to sqlite:db/performance.db`: deploy CDS model to local SQLite DB
- `fnm exec --using=.node-version npx cds deploy`: deploy using default `cds.requires.db` config from `package.json`
- `fnm exec --using=.node-version npm run build`: generate production CAP artifacts
- `fnm exec --using=.node-version npm start`: run backend in production mode

Typical local deploy + run flow:

```bash
cd cap-backend
fnm exec --using=.node-version npm install
fnm exec --using=.node-version npx cds deploy --to sqlite:db/performance.db
fnm exec --using=.node-version npm run build
fnm exec --using=.node-version npm start
```

## Data Model and Services

- Core domain model: `cap-backend/db/schema.cds`
- Seed data: `cap-backend/db/data/*.csv`
- Service definitions and handlers: `cap-backend/srv/`

OData services are exposed under `/odata/v4`.

## Frontend API Configuration

During development, Vite proxies `/odata/v4` to `http://localhost:4004`.

For production or split-service deployment, configure:

- `VITE_ODATA_CORE_URL`
- `VITE_ODATA_USER_URL`
- `VITE_ODATA_TICKET_URL`
- `VITE_ODATA_TIME_URL`

Legacy fallback still supported:

- `VITE_ODATA_BASE_URL`

## Testing

- Frontend tests use Vitest (colocated `*.test.ts` / `*.test.tsx`)
- Backend tests use Jest (`cap-backend/test/integration.test.js`)

Recommended pre-PR validation:

1. `cd frontend && npm run check`
2. `cd cap-backend && npm test`

## Notes

- Local SQLite DB path: `cap-backend/db/performance.db`
- Do not commit local DB files or secrets
- Main repository guidance is documented in `AGENTS.md`

## Windows Troubleshooting

### `npm install` Fails in `cap-backend` (`better-sqlite3` / `node-gyp`)

If you see errors like `No prebuilt binaries found (target=24.x)` and `Could not find any Visual Studio installation to use`, the backend is being installed with a Node version that has no prebuilt native binary.

Recommended fix (fastest): use Node 20 LTS for `cap-backend`.

```powershell
# Install Node 20
winget install OpenJS.NodeJS.20

# Open a new terminal, then verify Node 20 is active
node -v

cd cap-backend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm cache verify
npm install
```

If system-wide install requires admin approval, use user-level `fnm`:

```powershell
winget install Schniz.fnm
# open a new terminal after install
fnm install 20
fnm use 20
node -v

cd cap-backend
npm install
```

When using `fnm`, run backend commands with the pinned version file:

```powershell
cd cap-backend
fnm exec --using=.node-version npx cds deploy --to sqlite:db/performance.db
fnm exec --using=.node-version npm run watch
```

If PowerShell says `fnm` is not recognized, use the executable directly in the current session:

```powershell
& "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Schniz.fnm_Microsoft.Winget.Source_8wekyb3d8bbwe\fnm.exe" exec --using=.node-version npm.cmd run watch
```

Then open a new terminal (or sign out/in) so updated PATH entries are loaded.

Alternative: stay on Node 24 and install Visual Studio 2022 Build Tools with `Desktop development with C++`, then retry `npm install`.
