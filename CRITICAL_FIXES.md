# CAP-SAP: Critical Issues - Code Fixes

This document provides ready-to-implement fixes for the 8 critical issues identified in the deep review.

---

## Critical Issue #1: N+1 Query Pattern in WRICEF

**File**: `cap-backend/srv/wricef/wricef.domain.service.js`  
**Problem**: Each WRICEF submission triggers 1 notification query per manager (100 queries for 100 managers)  
**Impact**: Response time: 10ms × 100 = 1 second at scale  
**Fix Time**: 4 hours

### Before (BAD) ❌
```javascript
// wricef.domain.service.js
async createWricef(payload) {
  const wricef = await this.repo.create(payload);
  
  // BAD: Separate query for each manager
  const managers = await this.db.read('Users').where({ role: 'MANAGER' });
  for (const manager of managers) {
    await this.db.create('Notifications').entries({
      userId: manager.id,
      type: 'WRICEF_SUBMITTED',
      wricefId: wricef.id
    });
  }
  
  return wricef;
}
```

### After (GOOD) ✅
```javascript
// wricef.domain.service.js
async createWricef(payload) {
  const wricef = await this.repo.create(payload);
  
  // GOOD: Single batch insert
  const managers = await this.db.read('Users').where({ role: 'MANAGER' });
  const notifications = managers.map(m => ({
    userId: m.id,
    type: 'WRICEF_SUBMITTED',
    wricefId: wricef.id,
    createdAt: new Date()
  }));
  
  if (notifications.length > 0) {
    await this.db.create('Notifications').entries(notifications);
  }
  
  return wricef;
}
```

### Testing
```javascript
// cap-backend/test/wricef.batch.test.js
describe('WRICEF Batch Notifications', () => {
  test('should create notifications in single batch', async () => {
    const payload = { title: 'Test', type: 'W' };
    const spy = jest.spyOn(db, 'create');
    
    await wricefService.createWricef(payload);
    
    // Should be called exactly 2 times: 1 for WRICEF, 1 for Notifications
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
```

---

## Critical Issue #2: Missing Transaction Isolation

**File**: `cap-backend/srv/ticket/ticket.domain.service.js`  
**Problem**: Multi-step operations can fail mid-way, leaving inconsistent state  
**Impact**: Orphaned tickets without assignments or notifications  
**Fix Time**: 12 hours

### Before (BAD) ❌
```javascript
async createTicketWithAssignment(payload, assigneeId) {
  // If assignNotification() fails, ticket exists but not assigned
  const ticket = await this.repo.create(payload);
  const assignment = await this.assignTicket(ticket.id, assigneeId);
  const notification = await this.notifyAssignee(assigneeId, ticket.id);
  
  return ticket;
}
```

### After (GOOD) ✅
```javascript
async createTicketWithAssignment(payload, assigneeId) {
  // Wrap in transaction - all succeed or all fail
  return await this.db.transaction(async (trx) => {
    const ticket = await trx.create('Tickets').entries(payload);
    const assignment = await this.assignTicketTx(trx, ticket.id, assigneeId);
    const notification = await this.notifyAssigneeTx(trx, assigneeId, ticket.id);
    
    if (!assignment || !notification) {
      throw new Error('Failed to assign or notify');
    }
    
    return ticket;
  }).catch(err => {
    // Transaction rolled back automatically
    console.error('Ticket creation failed, changes reverted:', err);
    throw err;
  });
}

// Helper methods that accept transaction context
async assignTicketTx(trx, ticketId, assigneeId) {
  return await trx.create('Assignments').entries({
    ticketId,
    userId: assigneeId,
    status: 'ASSIGNED'
  });
}

async notifyAssigneeTx(trx, userId, ticketId) {
  return await trx.create('Notifications').entries({
    userId,
    type: 'TICKET_ASSIGNED',
    ticketId
  });
}
```

### Testing
```javascript
describe('Ticket Transaction Safety', () => {
  test('should rollback on assignment failure', async () => {
    const createSpy = jest.spyOn(db, 'create');
    
    // Force assignment to fail
    jest.spyOn(ticketService, 'assignTicketTx').mockRejectedValue(
      new Error('Assignment failed')
    );
    
    await expect(
      ticketService.createTicketWithAssignment(
        { title: 'Test' },
        'user-123'
      )
    ).rejects.toThrow();
    
    // Verify ticket was not created (no final commit)
    const tickets = await db.read('Tickets').where({ title: 'Test' });
    expect(tickets).toHaveLength(0);
  });
});
```

---

## Critical Issue #3: Silent Audit Log Failures

**File**: `cap-backend/srv/shared/services/audit.js`  
**Problem**: Failed audit writes silently logged; compliance trail broken  
**Impact**: Security audits reveal missing logs; non-compliance  
**Fix Time**: 8 hours

### Before (BAD) ❌
```javascript
// audit.js
async logAction(userId, action, resource) {
  try {
    await this.db.create('AuditLogs').entries({
      userId,
      action,
      resource,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Audit failed:', err); // ❌ Fails silently!
    // No retry, no alert, no persistence of failed logs
  }
}
```

### After (GOOD) ✅
```javascript
// audit.js
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async logAction(userId, action, resource) {
  let lastError;
  
  // Retry with exponential backoff
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await this.db.create('AuditLogs').entries({
        userId,
        action,
        resource,
        timestamp: new Date()
      });
      return; // Success
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES - 1) {
        // Wait before retry: 1s, 2s, 4s
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * Math.pow(2, attempt)));
      }
    }
  }
  
  // All retries failed - alert and persist to fallback storage
  console.error('CRITICAL: Audit log failed after retries:', lastError);
  
  // Write to file system as fallback
  await this.writeAuditFallback({ userId, action, resource });
  
  // Send alert email/Slack
  await this.alertSecurityTeam({
    message: 'Audit logging failed',
    userId,
    action,
    error: lastError.message
  });
  
  // Still throw - caller should know about failure
  throw new Error(`Audit failed after ${MAX_RETRIES} retries: ${lastError.message}`);
}

async writeAuditFallback(log) {
  const fs = require('fs').promises;
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp}|${log.userId}|${log.action}|${log.resource}\n`;
  
  try {
    await fs.appendFile('logs/audit-fallback.log', logEntry);
  } catch (err) {
    console.error('FATAL: Cannot write audit fallback:', err);
    process.exit(1); // Force restart to alert ops
  }
}

async alertSecurityTeam(alert) {
  // Send to monitoring system
  if (process.env.SLACK_WEBHOOK) {
    try {
      await fetch(process.env.SLACK_WEBHOOK, {
        method: 'POST',
        body: JSON.stringify({
          text: `🚨 ${alert.message}\nUser: ${alert.userId}\nAction: ${alert.action}`
        })
      });
    } catch (err) {
      console.error('Failed to send Slack alert:', err);
    }
  }
}
```

### Configuration (.env)
```env
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
AUDIT_RETRY_ATTEMPTS=3
AUDIT_RETRY_DELAY_MS=1000
```

### Testing
```javascript
describe('Audit Log Resilience', () => {
  test('should retry on temporary failure', async () => {
    let callCount = 0;
    
    jest.spyOn(db, 'create').mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        throw new Error('Temporary failure');
      }
      return Promise.resolve();
    });
    
    await auditService.logAction('user-1', 'DELETE_USER', 'User:123');
    
    expect(callCount).toBe(3); // Retried twice
  });
  
  test('should write fallback on persistent failure', async () => {
    jest.spyOn(db, 'create').mockRejectedValue(new Error('DB down'));
    const fallbackSpy = jest.spyOn(auditService, 'writeAuditFallback');
    
    await expect(
      auditService.logAction('user-1', 'DELETE_USER', 'User:123')
    ).rejects.toThrow();
    
    expect(fallbackSpy).toHaveBeenCalled();
  });
});
```

---

## Critical Issue #4: Missing 404 Error Responses

**File**: `cap-backend/srv/base-service.js`  
**Problem**: Reading non-existent resources returns 200 with empty body instead of 404  
**Impact**: Frontend can't distinguish "not found" from "loading"; UX broken  
**Fix Time**: 6 hours

### Before (BAD) ❌
```javascript
// base-service.js (CAP mixin)
const cds = require('@sap/cds');

module.exports = cds.service.impl(async (srv) => {
  // Default READ handler
  srv.on('READ', '*', async (req) => {
    const result = await req.query;
    return result; // ❌ Returns undefined for non-existent, not 404
  });
});
```

### After (GOOD) ✅
```javascript
// base-service.js
const cds = require('@sap/cds');

module.exports = cds.service.impl(async (srv) => {
  // Override READ handler for single entity
  srv.on('READ', '*', async (req) => {
    const result = await req.query;
    
    // For single entity (e.g., Users(123)), check if found
    if (req.query.one && !result) {
      const entity = req.target.name;
      const key = Object.values(req.params)[0];
      
      return req.error({
        code: 404,
        message: `${entity} with ID ${key} not found`,
        status: 404
      });
    }
    
    return result;
  });
});
```

Or more explicitly in each service:

```javascript
// user-service.js
const cds = require('@sap/cds');

module.exports = cds.service.impl(async (srv) => {
  srv.on('READ', 'Users', async (req) => {
    // For individual user reads
    if (req.params.length > 0) {
      const userId = req.params[0];
      const user = await SELECT.one.from('Users').where({ ID: userId });
      
      if (!user) {
        return req.error(404, `User ${userId} not found`);
      }
      
      return user;
    }
    
    // For list reads
    return await SELECT.from('Users');
  });
});
```

### Frontend Error Handling
```typescript
// src/app/api/odataClient.ts
async function fetchUser(userId: string) {
  const response = await fetch(`/odata/v4/Users('${userId}')`);
  
  if (response.status === 404) {
    throw new Error(`User not found`);
  }
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.statusText}`);
  }
  
  return await response.json();
}
```

### Testing
```javascript
describe('404 Error Responses', () => {
  test('should return 404 for non-existent user', async () => {
    const response = await fetch(`${API_URL}/Users('non-existent')`);
    
    expect(response.status).toBe(404);
    const error = await response.json();
    expect(error.message).toContain('not found');
  });
  
  test('should return list for multiple read', async () => {
    const response = await fetch(`${API_URL}/Users`);
    
    expect(response.status).toBe(200);
    const users = await response.json();
    expect(Array.isArray(users.value)).toBe(true);
  });
});
```

---

## Critical Issue #5: Unvalidated Input Length (Storage Attack)

**File**: `cap-backend/db/schema.cds`  
**Problem**: `rejectionReason` text field unbounded; could fill database  
**Impact**: Database bloat, DoS attack vector  
**Fix Time**: 2 hours

### Before (BAD) ❌
```cds
// schema.cds
entity Tickets {
  key ID: UUID;
  title: String;
  rejectionReason: String; // ❌ Unbounded - attacker could send 100MB
}
```

### After (GOOD) ✅
```cds
// schema.cds
entity Tickets {
  key ID: UUID;
  title: String(256); // Max 256 chars
  rejectionReason: String(5000); // Max 5000 chars
  description: String(10000); // Longer for full text
}

entity Comments {
  key ID: UUID;
  text: String(2000); // Reasonable limit
  createdBy: String(100); // Username max
}

entity Wricefs {
  key ID: UUID;
  title: String(256);
  description: String(10000);
  technicalDetails: String(20000);
}
```

### Backend Validation Layer
```javascript
// srv/shared/validators.js
const LIMITS = {
  rejectionReason: 5000,
  commentText: 2000,
  wricefTitle: 256,
  wricefDescription: 10000,
  ticketTitle: 256,
  ticketDescription: 10000
};

function validateInputLength(field, value, maxLength) {
  if (!value) return; // Allow null
  if (typeof value !== 'string') {
    throw new Error(`${field} must be a string`);
  }
  if (value.length > maxLength) {
    throw new Error(
      `${field} exceeds maximum length of ${maxLength} characters ` +
      `(provided: ${value.length})`
    );
  }
}

module.exports = {
  validateTicketInput(ticket) {
    validateInputLength('title', ticket.title, LIMITS.ticketTitle);
    validateInputLength('description', ticket.description, LIMITS.ticketDescription);
    validateInputLength('rejectionReason', ticket.rejectionReason, LIMITS.rejectionReason);
  },
  
  validateComment(comment) {
    validateInputLength('text', comment.text, LIMITS.commentText);
  },
  
  validateWricef(wricef) {
    validateInputLength('title', wricef.title, LIMITS.wricefTitle);
    validateInputLength('description', wricef.description, LIMITS.wricefDescription);
    validateInputLength('technicalDetails', wricef.technicalDetails, LIMITS.wricefDescription);
  }
};
```

### Usage in Service
```javascript
// ticket.domain.service.js
const validators = require('../shared/validators');

async rejectTicket(ticketId, reason) {
  // Validate input
  validators.validateTicketInput({ rejectionReason: reason });
  
  return await this.db.update('Tickets', ticketId).set({
    status: 'REJECTED',
    rejectionReason: reason.trim() // Also trim whitespace
  });
}
```

---

## Critical Issue #6: Unsafe `any` Types in Frontend

**Files**: Multiple `.tsx` files  
**Problem**: 20+ instances of `any` bypass TypeScript safety  
**Impact**: Runtime errors in production  
**Fix Time**: 16 hours

### Example 1: AddImputationDialog.tsx ❌
```typescript
// BEFORE (BAD)
interface Props {
  onSubmit: (data: any) => void; // ❌ any!
}

export function AddImputationDialog(props: Props) {
  const [imputation, setImputation] = useState<any>({}); // ❌ any!
  
  const handleSubmit = (e: any) => { // ❌ any!
    props.onSubmit(imputation); // Could be missing required fields
  };
}
```

### Example 1: AddImputationDialog.tsx ✅
```typescript
// AFTER (GOOD)
interface ImputationInput {
  projectId: string;
  hours: number;
  date: Date;
  description: string;
}

interface AddImputationDialogProps {
  onSubmit: (data: ImputationInput) => Promise<void>;
}

export function AddImputationDialog({ onSubmit }: AddImputationDialogProps) {
  const [imputation, setImputation] = useState<ImputationInput>({
    projectId: '',
    hours: 0,
    date: new Date(),
    description: ''
  });
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Type-safe: compiler ensures all fields present
    if (!imputation.projectId || imputation.hours <= 0) {
      throw new Error('Invalid imputation');
    }
    
    await onSubmit(imputation);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form JSX */}
    </form>
  );
}
```

### Example 2: WricefPanel.tsx ❌
```typescript
// BEFORE (BAD)
interface WricefPanelProps {
  wricef: any; // ❌ Unknown structure
}

function WricefPanel({ wricef }: WricefPanelProps) {
  return (
    <div>
      <h2>{wricef.title}</h2> {/* Could be undefined */}
      <p>{wricef.description}</p> {/* Type unknown */}
      <select value={wricef.type}> {/* wricef.type might not exist */}
        <option>W</option>
        <option>R</option>
      </select>
    </div>
  );
}
```

### Example 2: WricefPanel.tsx ✅
```typescript
// AFTER (GOOD)
interface Wricef {
  id: string;
  title: string;
  type: 'W' | 'R' | 'I' | 'C' | 'E' | 'F';
  description: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  technicalDetails: string;
  createdBy: string;
  createdAt: Date;
}

interface WricefPanelProps {
  wricef: Wricef;
}

function WricefPanel({ wricef }: WricefPanelProps) {
  const WRICEF_LABELS: Record<Wricef['type'], string> = {
    W: 'Wishes',
    R: 'Requirements',
    I: 'Interfaces',
    C: 'Conversions',
    E: 'Enhancements',
    F: 'Forms'
  };
  
  return (
    <div>
      <h2>{wricef.title}</h2>
      <p>{wricef.description}</p>
      <select value={wricef.type} disabled>
        {Object.entries(WRICEF_LABELS).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
    </div>
  );
}
```

### Script to Find All `any` Types
```bash
# Find all instances of 'any' in TypeScript files
grep -r ': any' frontend/src --include="*.ts" --include="*.tsx"
grep -r '<any>' frontend/src --include="*.ts" --include="*.tsx"

# Fix count: expect 20+ instances to resolve
```

---

## Critical Issue #7: useEffect Memory Leak in TopBar

**File**: `frontend/src/app/components/TopBar.tsx`  
**Problem**: Notification polling continues after component unmounts  
**Impact**: Memory leak on route changes, accumulates over time  
**Fix Time**: 2 hours

### Before (BAD) ❌
```typescript
// TopBar.tsx
export function TopBar() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    // ❌ BAD: No cleanup - interval never cleared
    const interval = setInterval(async () => {
      const data = await fetchNotifications();
      setNotifications(data);
    }, 5000);
  }, []);
  
  return (
    <header>
      <Bell notifications={notifications} />
    </header>
  );
}
```

### After (GOOD) ✅
```typescript
// TopBar.tsx
export function TopBar() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout;
    
    // Fetch immediately
    const fetchAndSetNotifications = async () => {
      if (!mounted) return; // Don't update if unmounted
      
      try {
        const data = await fetchNotifications();
        if (mounted) {
          setNotifications(data);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };
    
    fetchAndSetNotifications();
    
    // Poll every 5 seconds
    intervalId = setInterval(fetchAndSetNotifications, 5000);
    
    // ✅ GOOD: Cleanup on unmount
    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);
  
  return (
    <header>
      <Bell notifications={notifications} />
    </header>
  );
}
```

### Alternative: Using AbortController (Modern Approach)
```typescript
// TopBar.tsx (React 18+ with suspense)
export function TopBar() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    const abortController = new AbortController();
    let intervalId: NodeJS.Timeout;
    
    const fetchAndSetNotifications = async () => {
      try {
        const response = await fetch('/odata/v4/Notifications', {
          signal: abortController.signal
        });
        
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        setNotifications(data.value || []);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          // Expected on unmount, ignore
          return;
        }
        console.error('Failed to fetch notifications:', error);
      }
    };
    
    fetchAndSetNotifications();
    intervalId = setInterval(fetchAndSetNotifications, 5000);
    
    return () => {
      // Both cancel fetch and clear interval
      abortController.abort();
      clearInterval(intervalId);
    };
  }, []);
  
  return (
    <header>
      <Bell notifications={notifications} />
    </header>
  );
}
```

---

## Critical Issue #8: Missing Async Error Boundary

**File**: `frontend/src/app/pages`  
**Problem**: Promise rejections from API calls not caught by error boundary  
**Impact**: White screen of death on network failure  
**Fix Time**: 4 hours

### Before (BAD) ❌
```typescript
// App.tsx
export function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/tickets" element={<TicketList />} />
      </Routes>
    </ErrorBoundary>
  );
}

// TicketList.tsx
export function TicketList() {
  const [tickets, setTickets] = useState([]);
  
  useEffect(() => {
    // ❌ BAD: Promise rejection not caught by ErrorBoundary
    fetchTickets().then(setTickets);
  }, []);
  
  return <div>{/* render tickets */}</div>;
}
```

### After (GOOD) ✅

#### Step 1: Create AsyncErrorBoundary
```typescript
// frontend/src/app/components/AsyncErrorBoundary.tsx
import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface State {
  error: Error | null;
  hasError: boolean;
}

export class AsyncErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { error, hasError: true };
  }
  
  componentDidMount() {
    // Handle unhandled promise rejections
    this.unhandledRejectioHandler = (event: PromiseRejectionEvent) => {
      this.setState({
        error: event.reason instanceof Error 
          ? event.reason 
          : new Error(String(event.reason)),
        hasError: true
      });
    };
    
    window.addEventListener('unhandledrejection', this.unhandledRejectioHandler);
  }
  
  componentWillUnmount() {
    if (this.unhandledRejectioHandler) {
      window.removeEventListener('unhandledrejection', this.unhandledRejectioHandler);
    }
  }
  
  private unhandledRejectioHandler?: (event: PromiseRejectionEvent) => void;
  
  handleRetry = () => {
    this.setState({ error: null, hasError: false });
  };
  
  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }
      
      return (
        <div className="error-container">
          <h1>Something went wrong</h1>
          <p>{this.state.error.message}</p>
          <button onClick={this.handleRetry}>Try again</button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

#### Step 2: Wrap App with AsyncErrorBoundary
```typescript
// App.tsx
export function App() {
  return (
    <AsyncErrorBoundary
      fallback={(error, retry) => (
        <ErrorPage error={error} onRetry={retry} />
      )}
    >
      <Routes>
        <Route path="/tickets" element={<TicketList />} />
      </Routes>
    </AsyncErrorBoundary>
  );
}
```

#### Step 3: Use try-catch in async operations
```typescript
// TicketList.tsx
export function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadTickets = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchTickets();
        setTickets(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        
        // Let AsyncErrorBoundary know
        throw err;
      } finally {
        setLoading(false);
      }
    };
    
    loadTickets();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  
  return (
    <div>
      {tickets.map(ticket => (
        <TicketRow key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}
```

#### Step 4: Global error handler
```typescript
// main.tsx
// Catch any unhandled promise rejections globally
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // In production, send to error tracking (Sentry, etc.)
  if (process.env.PROD) {
    // sendToErrorTracking(event.reason);
  }
  
  // Prevent default error handling
  event.preventDefault();
});
```

---

## Implementation Checklist

### Week 1: Critical Fixes (42 hours)

- [ ] **Issue #1**: N+1 queries - Batch notifications
  - Time: 4h
  - Files: `wricef.domain.service.js`
  - Test: Add batch insert test

- [ ] **Issue #4**: Missing 404s - Add existence checks
  - Time: 6h
  - Files: `base-service.js`, all service handlers
  - Test: Add 404 response tests

- [ ] **Issue #5**: Input validation - Add max lengths
  - Time: 2h
  - Files: `schema.cds`, add validators.js
  - Test: Add validation tests

- [ ] **Issue #7**: TopBar memory leak - Add cleanup
  - Time: 2h
  - Files: `TopBar.tsx`
  - Test: Verify interval cleanup in unmount

- [ ] **Issue #6**: Replace `any` types
  - Time: 16h
  - Files: All `.tsx` files with `any`
  - Test: Enable `noImplicitAny` in tsconfig

- [ ] **Issue #2**: Transaction isolation - Add db.transaction()
  - Time: 12h
  - Files: Multi-step services (ticket, wricef, project)
  - Test: Rollback on failure tests

### Week 2: High-Priority Fixes (45 hours)

Continue with SQL injection fixes, authorization checks, request timeouts, etc.

---

## Verification Steps

After implementing each fix:

1. **Run type checking**: `npm run typecheck`
2. **Run tests**: `npm test`
3. **Test manually** in dev environment
4. **Check performance**: No performance regression
5. **Review with team**: Code review before merging

---

*Each fix includes testing strategy and examples. Implement one at a time, test, merge, then move to next.*
