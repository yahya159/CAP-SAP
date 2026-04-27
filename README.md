# CAP-SAP Performance Dashboard

Monorepo for a SAP CAP backend and a React frontend used to manage projects, tickets, WRICEF objects, time tracking, evaluations, and related dashboard data.

## Structure

- `frontend/`: Vite + React + TypeScript UI
- `cap-backend/`: SAP CAP OData v4 backend with SQLite

## Quick Start

Run each module from its own folder:

```powershell
cd cap-backend
fnm exec --using=.node-version npm install
fnm exec --using=.node-version npm run watch
```

```powershell
cd frontend
npm install
npm run dev
```

## Notes

- The backend is pinned to Node 20 in `cap-backend/.node-version`.
- OData services are exposed under `/odata/v4`.
- For production checks, run `npm run check` in `frontend/` and `npm test` in `cap-backend/`.
