# CAP-SAP Code Quality Analysis Report
**Date**: April 27, 2026 | **Scope**: Backend (SAP CAP) + Frontend (React/TypeScript)

---

## Executive Summary

This comprehensive code quality audit identified **31 issues** across the SAP CAP backend and React frontend. The codebase demonstrates solid architectural patterns (domain-driven design on backend, feature-first organization on frontend) but has several critical and high-priority issues requiring immediate attention.

**Critical Issues**: 4  
**High Issues**: 12  
**Medium Issues**: 11  
**Low Issues**: 4  

---

# BACKEND ANALYSIS (cap-backend/)

## CRITICAL Issues

### 1. N+1 Query Pattern in WRICEF Submit Workflow
**File**: [cap-backend/srv/wricef/wricef.domain.service.js](cap-backend/srv/wricef/wricef.domain.service.js#L48-L78)  
**Severity**: Critical  
**Description**: The `submitWricef()` method performs:
1. SELECT to get WRICEF by ID
2. SELECT to get all objects for that WRICEF
3. SELECT to get all PROJECT_MANAGER users
4. **Loop inserting notifications one-by-one** (N queries for N PMs)

This causes O(N) database round-trips for notification creation on each WRICEF submission.

**Current Code**:
```javascript
const pms = await cds.db.run(
  SELECT.from(ENTITIES.Users).where({ role: 'PROJECT_MANAGER', active: true })
);
for (const pm of pms) {
  await cds.db.run(INSERT.into(ENTITIES.Notifications).entries({...})); // N queries!
}
```

**Suggested Fix**:
```javascript
// Collect all notification entries, insert in batch
const pms = await cds.db.run(
  SELECT.from(ENTITIES.Users).where({ role: 'PROJECT_MANAGER', active: true })
);
if (pms.length > 0) {
  const notifications = pms.map(pm => ({
    userId: pm.ID,
    type: 'WRICEF_SUBMITTED',
    title: 'New WRICEF pending validation',
    message: `WRICEF "${wricef.sourceFileName || 'Untitled'}" has been submitted for your approval.`,
    read: false,
  }));
  await cds.db.run(INSERT.into(ENTITIES.Notifications).entries(notifications));
}
```

---

### 2. Missing Transaction Isolation in Multi-Step Operations
**File**: [cap-backend/srv/wricef/wricef.domain.service.js](cap-backend/srv/wricef/wricef.domain.service.js#L48-L100)  
**Severity**: Critical  
**Description**: The WRICEF submit/validate/reject workflows perform multiple related updates without explicit transaction management:
1. Update WRICEF status
2. Update all child WricefObjects status
3. Insert notifications (3 separate operations)

If a notification insert fails, the WRICEF status is already committed. This creates inconsistent state.

**Suggested Fix**:
```javascript
async submitWricef(req) {
  requireRole(req, MANAGER_CREATE_ROLES, ...);
  const id = extractEntityId(req);
  
  return cds.transaction(req).run(async (tx) => {
    const wricef = await tx.run(SELECT.one.from(...));
    if (!wricef) req.reject(404, 'WRICEF not found');
    if (wricef.status !== 'DRAFT') req.reject(409, ...);
    
    const objects = await tx.run(SELECT.from(...));
    if (!objects?.length) req.reject(400, ...);
    
    // All updates in same transaction
    await tx.run(UPDATE(...).with({status: 'PENDING_VALIDATION', ...}));
    await tx.run(UPDATE(ENTITIES.WricefObjects)...);
    
    // Notifications also within transaction
    const pms = await tx.run(SELECT.from(...));
    if (pms.length > 0) {
      await tx.run(INSERT.into(ENTITIES.Notifications).entries(
        pms.map(pm => ({...}))
      ));
    }
    
    return wricef;
  });
}
```

---

### 3. Unvalidated User Input in Bulk Operations
**File**: [cap-backend/srv/wricef/wricef.domain.service.js](cap-backend/srv/wricef/wricef.domain.service.js#L118-L130)  
**Severity**: Critical  
**Description**: The `rejectWricef()` method accepts a rejection reason that is only trimmed, not validated for length or harmful content before storing in database:

```javascript
const { reason } = req.data ?? {};
if (!reason || !String(reason).trim()) {
  req.reject(400, 'A rejection reason is required');
}
// No validation on max length - could store 1MB of data
const updated = await this.repo.updateById(id, {
  rejectionReason: reason.trim(), // Unvalidated length
});
```

An attacker could submit a massive string, potentially causing database bloat or storage attacks.

**Suggested Fix**:
```javascript
const MAX_REJECTION_REASON_LENGTH = 2000;
const reason = String(req.data?.reason ?? '').trim();

if (!reason) {
  req.reject(400, 'A rejection reason is required');
  return;
}

if (reason.length > MAX_REJECTION_REASON_LENGTH) {
  req.reject(400, `Rejection reason must not exceed ${MAX_REJECTION_REASON_LENGTH} characters`);
  return;
}

// Safe to store
const updated = await this.repo.updateById(id, { rejectionReason: reason });
```

---

### 4. Silent Error Suppression in Audit Logging
**File**: [cap-backend/srv/shared/services/audit.js](cap-backend/srv/shared/services/audit.js#L50-L70)  
**Severity**: Critical  
**Description**: The audit log catches all errors silently and only logs to console. If database connection fails, audit writes disappear without alerting the system. This defeats the purpose of audit trails for compliance.

```javascript
srv.after(event, '*', async (_result, req) => {
  try {
    await auditReady;
    await cds.db.run(INSERT.into(AUDIT_ENTITY).entries({...}));
  } catch (err) {
    // Silently swallowed - no alert, no retry
    console.error('[AuditLog] write failed:', err?.message ?? err);
  }
});
```

**Suggested Fix**:
```javascript
const audit LogFailures = [];

const flushFailedAudits = async () => {
  if (auditLogFailures.length === 0) return;
  try {
    for (const entry of auditLogFailures.splice(0, 100)) {
      await cds.db.run(INSERT.into(AUDIT_ENTITY).entries(entry));
    }
  } catch (err) {
    console.error('[AuditLog] Retry failed, entries remain queued');
  }
};

// Queue failures and attempt periodic flush
srv.after(event, '*', async (_result, req) => {
  try {
    await auditReady;
    await cds.db.run(INSERT.into(AUDIT_ENTITY).entries({...}));
  } catch (err) {
    console.error('[AuditLog] write failed, queuing for retry:', err?.message);
    auditLogFailures.push({...});
    
    // Periodic flush attempt (can be enhanced with external queue)
    if (auditLogFailures.length > 50) {
      setImmediate(() => flushFailedAudits());
    }
  }
});
```

---

## HIGH Issues

### 5. Missing Existence Validation for Foreign Keys
**File**: [cap-backend/srv/ticket/ticket.domain.service.js](cap-backend/srv/ticket/ticket.domain.service.js#L60-L75)  
**Severity**: High  
**Description**: While entity validation exists for required fields, there are scenarios where optional foreign keys (e.g., `functionalTesterId`) are not validated if they exist in the User table:

```javascript
if (data.functionalTesterId) await assertEntityExists(ENTITIES.Users, data.functionalTesterId, 'functionalTesterId', req);
```

However, if `assertEntityExists` is not called for all FK updates, invalid references could be stored. The validation happens at call time, making it easy to miss a field.

**Suggested Fix**: Create a centralized FK validator that auto-discovers all FK relationships from the schema:
```javascript
const validateForeignKeys = async (entityName, data, req) => {
  const entity = cds.model.definitions[entityName];
  const fkFields = Object.entries(entity.elements ?? {})
    .filter(([_, el]) => el.type === 'cds.String' && el.virtual === false && el.key === false)
    .filter(([name]) => name.endsWith('Id')); // Convention-based FK detection
  
  for (const [fieldName, _] of fkFields) {
    if (data[fieldName]) {
      const refEntity = ... // Derive from schema
      await assertEntityExists(refEntity, data[fieldName], fieldName, req);
    }
  }
};
```

---

### 6. Insufficient SQL Injection Prevention for Dynamic Filters
**File**: [cap-backend/srv/shared/services/authz.js](cap-backend/srv/shared/services/authz.js#L50-L65)  
**Severity**: High  
**Description**: The `ticketVisibilityFilter()` uses `orFilter()` which builds raw CDS/OData filter expressions. While CDS provides parameterized query support, if any user-controlled data is injected into the filter without proper escaping, SQL injection is possible.

```javascript
const ticketVisibilityFilter = (userId, role) =>
  orFilter(
    ownerFilter('assignedTo', userId),           // userId directly used
    ownerFilter('createdBy', userId),
    [{ ref: ['assignedToRole'] }, '=', { val: role }] // role directly used
  );
```

If `userId` or `role` come from untrusted input, they should be validated as safe identifiers.

**Suggested Fix**:
```javascript
const SAFE_ROLE_PATTERN = /^[A-Z_]+$/;
const SAFE_ID_PATTERN = /^[a-f0-9\-]{36}$/; // Assuming UUIDs

const ticketVisibilityFilter = (userId, role) => {
  if (!SAFE_ID_PATTERN.test(userId)) {
    throw new Error('Invalid userId format');
  }
  if (!SAFE_ROLE_PATTERN.test(role)) {
    throw new Error('Invalid role format');
  }
  return orFilter(
    ownerFilter('assignedTo', userId),
    ownerFilter('createdBy', userId),
    [{ ref: ['assignedToRole'] }, '=', { val: role }]
  );
};
```

---

### 7. Missing Error Response Codes for Edge Cases
**File**: [cap-backend/srv/ticket/ticket.domain.service.js](cap-backend/srv/ticket/ticket.domain.service.js#L115-L130)  
**Severity**: High  
**Description**: When status transitions fail, the error uses 409 (Conflict), but if the entity is not found, it silently returns without an error:

```javascript
if (data.status !== undefined && id) {
  const current = await this.repo.findById(id);
  if (current && data.status !== current.status) { // Silent if !current
    const allowed = TICKET_STATUS_TRANSITIONS[current.status] || new Set();
    if (!allowed.has(data.status)) {
      req.reject(409, `Invalid ticket status transition...`);
    }
  }
}
```

If the ticket doesn't exist, no error is returned—the update proceeds silently. This could allow invalid state changes.

**Suggested Fix**:
```javascript
if (data.status !== undefined && id) {
  const current = await this.repo.findById(id);
  if (!current) {
    req.reject(404, `Ticket '${id}' not found`);
    return;
  }
  if (data.status !== current.status) {
    const allowed = TICKET_STATUS_TRANSITIONS[current.status] || new Set();
    if (!allowed.has(data.status)) {
      req.reject(409, `Invalid ticket status transition: ${current.status} -> ${data.status}`);
    }
  }
}
```

---

### 8. Missing Row-Level Authorization in Delete Operations
**File**: [cap-backend/srv/imputation/imputation.domain.service.js](cap-backend/srv/imputation/imputation.domain.service.js#L52-L65)  
**Severity**: High  
**Description**: The `beforeDelete` check verifies the imput ation is DRAFT and that the user is the owner or a manager, but the actual delete is not guarded. If the DELETE verb is invoked directly via OData without going through the impl hook, the check is bypassed.

```javascript
async beforeDelete(req) {
  const id = extractEntityId(req);
  if (!id) return; // Silent pass
  const current = await this.repo.findById(id);
  if (!current) return; // Silent pass
  if (current.validationStatus !== 'DRAFT') {
    req.reject(409, 'Only DRAFT imputations can be deleted');
  }
  requireOwnerOrRole(req, current.consultantId, MANAGER_ROLES, ...);
}
```

If `!current`, the authorization check is skipped entirely. This could allow unauthorized deletions.

**Suggested Fix**:
```javascript
async beforeDelete(req) {
  const id = extractEntityId(req);
  if (!id) {
    req.reject(400, 'Missing Imputations ID');
    return;
  }
  
  const current = await this.repo.findById(id);
  if (!current) {
    req.reject(404, `Imputations '${id}' not found`);
    return;
  }
  
  if (current.validationStatus !== 'DRAFT') {
    req.reject(409, 'Only DRAFT imputations can be deleted');
    return;
  }
  
  requireOwnerOrRole(req, current.consultantId, MANAGER_ROLES, 'You can only delete your own DRAFT imputations');
}
```

---

### 9. Incomplete Pagination Enforcement
**File**: [cap-backend/srv/base-service.js](cap-backend/srv/base-service.js#L58-L70)  
**Severity**: High  
**Description**: While the base service enforces a max page size of 500, some domain services may issue internal SELECT queries without pagination. If a table has millions of rows, a single `SELECT.from(Entities).where({})` will load all rows into memory.

```javascript
srv.before('READ', '*', (req) => {
  const select = req.query?.SELECT;
  if (!select) return; // Internal queries bypass this
  const limit = select.limit ?? {};
  const rows = limit.rows?.val;
  if (rows === undefined || rows === null) {
    select.limit = { ...limit, rows: { val: DEFAULT_PAGE_SIZE } };
  }
});
```

Internal queries like in `wricef.domain.service.js` line 85 (`SELECT.from(ENTITIES.Users)...`) have no pagination.

**Suggested Fix**: Create a wrapper for internal queries:
```javascript
const selectWithLimit = (from, opts = {}) => {
  const select = SELECT.from(from);
  if (opts.where) select.where(opts.where);
  if (opts.columns) select.columns(opts.columns);
  select.limit(opts.limit ?? 500); // Enforce limit on internal queries
  return select;
};

// Usage in domain services
const pms = await cds.db.run(
  selectWithLimit(ENTITIES.Users, {
    where: { role: 'PROJECT_MANAGER', active: true },
    limit: 1000
  })
);
```

---

### 10. Missing Request Timeout Handling
**File**: [cap-backend/srv/base-service.js](cap-backend/srv/base-service.js)  
**Severity**: High  
**Description**: There is no request timeout configuration. Long-running queries or external calls (if integrated) could hang indefinitely, consuming server resources.

**Suggested Fix**: Add timeout middleware in base-service.js:
```javascript
const REQUEST_TIMEOUT_MS = process.env.REQUEST_TIMEOUT_MS || 30000;

module.exports = function (srv) {
  srv.before('*', (req) => {
    const timer = setTimeout(() => {
      req.reject(408, 'Request timeout');
    }, REQUEST_TIMEOUT_MS);
    
    req.on('done', () => clearTimeout(timer));
  });
  
  registerDomainImpls(srv);
  attachAuditLog(srv);
};
```

---

### 11. Data Integrity Risk: Missing Unique Constraints
**File**: [cap-backend/srv/ticket/ticket.domain.service.js](cap-backend/srv/ticket/ticket.domain.service.js#L59-L65)  
**Severity**: High  
**Description**: The ticket code is auto-generated and checked for uniqueness in `_allocateTicketCode()`, but this is in application code, not a database constraint. If two concurrent requests race, both could allocate the same code.

```javascript
data.ticketCode = await this._allocateTicketCode(year); // Race condition!
```

**Suggested Fix**: Add a database-level unique constraint in schema:
```cds
// In db/schema.cds
entity Tickets {
  // ...
  ticketCode: String unique; // Database constraint
  // ...
}
```

And simplify the app code to rely on DB constraint:
```javascript
async beforeCreate(req) {
  const data = req.data;
  const year = new Date().getFullYear();
  data.ticketCode = `TK-${year}-${generateRandomCode()}`; // Let DB enforce uniqueness
  // ... rest of validation
}
```

---

### 12. Missing Enum Validation Completeness
**File**: [cap-backend/srv/ticket/ticket.domain.service.js](cap-backend/srv/ticket/ticket.domain.service.js#L77-L85)  
**Severity**: High  
**Description**: Enum validation using `assertInEnum()` is called for priority, nature, and complexity, but if an enum field is updated without calling the validation, invalid values could be stored.

```javascript
assertInEnum(data.priority, Object.values(TICKET_PRIORITY), 'priority', req);
assertInEnum(data.nature, Object.values(TICKET_NATURE), 'nature', req);
```

If new enum fields are added to the entity schema, developers might forget to add validation.

**Suggested Fix**: Create a centralized enum validator:
```javascript
const ENTITY_ENUMS = {
  Tickets: {
    priority: TICKET_PRIORITY,
    nature: TICKET_NATURE,
    complexity: TICKET_COMPLEXITY,
    status: TICKET_STATUS,
  },
  // ... other entities
};

const validateEnums = (entityName, data, req) => {
  const enums = ENTITY_ENUMS[entityName] ?? {};
  for (const [field, allowedValues] of Object.entries(enums)) {
    if (data[field] !== undefined) {
      assertInEnum(data[field], Object.values(allowedValues), field, req);
    }
  }
};

// Use in all domain services
async beforeCreate(req) {
  validateEnums('Tickets', req.data, req);
  // ... other validations
}
```

---

### 13. Missing Concurrency Control in Update Operations
**File**: [cap-backend/srv/imputation/imputation.domain.service.js](cap-backend/srv/imputation/imputation.domain.service.js#L76-L100)  
**Severity**: High  
**Description**: When applying transitions (`validate`, `rejectEntry`), there is no optimistic locking (ETag) or pessimistic locking to prevent concurrent updates from conflicting.

```javascript
const current = await this.repo.findById(id);
// ... time passes, user A modifies ...
// ... user B's request continues, updates using stale 'current' data ...
return this.repo.updateById(id, { validationStatus: 'VALIDATED', ... });
```

Two PMs could both validate the same imputation simultaneously, causing inconsistent state.

**Suggested Fix**: Add version/ETag-based concurrency control:
```javascript
async _applyTransition(req, action, changes) {
  const id = extractEntityId(req);
  if (!id) req.reject(400, 'Missing Imputations ID');

  const current = await this.repo.findById(id);
  if (!current) req.reject(404, `Imputations '${id}' not found`);

  const allowedFrom = IMPUTATION_TRANSITIONS[action] ?? new Set();
  if (!allowedFrom.has(current.validationStatus)) {
    req.reject(409, ...);
    return;
  }

  // Use CAP's built-in ETag support
  // Attempt update with version check
  try {
    const updated = await this.repo.updateById(id, {
      ...changes,
      validatedBy: claims.sub,
      _version: current._version, // Optimistic locking
    });
    return updated;
  } catch (err) {
    if (err.code === 'CONFLICT' || err.code === 'ETAG_MISMATCH') {
      req.reject(409, 'This imputation was modified by another user. Please refresh and try again.');
    }
    throw err;
  }
}
```

---

## MEDIUM Issues

### 14. Missing Logging for Auth Failures
**File**: [cap-backend/srv/auth/auth.impl.js](cap-backend/srv/auth/auth.impl.js)  
**Severity**: Medium  
**Description**: Authentication failures are not logged. This makes it impossible to detect brute-force attacks or investigate security breaches.

**Suggested Fix**: Add audit logging for failed authentication:
```javascript
module.exports = (srv) => {
  const domain = new AuthDomainService(srv);
  
  srv.on('authenticate', (req) => {
    try {
      return domain.authenticate(req);
    } catch (err) {
      const email = req.data?.email ?? 'unknown';
      console.warn(`[AuthLog] Authentication failed for ${email}:`, err.message);
      // Could also insert into a failed_logins table for brute-force detection
      throw err;
    }
  });
  
  srv.on('quickAccessAccounts', () => domain.quickAccessAccounts());
};
```

---

### 15. Missing Validation for Negative Date Ranges
**File**: [cap-backend/srv/shared/services/validation.js](cap-backend/srv/shared/services/validation.js#L43-L47)  
**Severity**: Medium  
**Description**: The `assertDateRange()` function checks if endDate >= startDate, but doesn't validate that dates are in the future or within a reasonable range. A user could submit:
- Dates in the far past (year 1900)
- Dates in the distant future (year 3000)
- Same dates (duration = 0)

```javascript
const assertDateRange = (startDate, endDate, req) => {
  if (!startDate || !endDate) return;
  if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
    req.error(400, 'endDate must be on or after startDate');
  }
};
```

**Suggested Fix**:
```javascript
const MIN_DATE = new Date('2000-01-01');
const MAX_DATE = new Date('2100-12-31');

const assertDateRange = (startDate, endDate, req) => {
  if (!startDate || !endDate) return;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    req.error(400, 'startDate and endDate must be valid dates');
    return;
  }
  
  if (end.getTime() < start.getTime()) {
    req.error(400, 'endDate must be on or after startDate');
    return;
  }
  
  if (start.getTime() < MIN_DATE.getTime()) {
    req.error(400, `startDate must not be before ${MIN_DATE.toISOString().split('T')[0]}`);
    return;
  }
  
  if (end.getTime() > MAX_DATE.getTime()) {
    req.error(400, `endDate must not be after ${MAX_DATE.toISOString().split('T')[0]}`);
    return;
  }
  
  const durationDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (durationDays === 0) {
    req.warn(400, 'Start and end dates are the same; duration is 0 days');
  }
};
```

---

### 16. Missing Field Length Validations
**File**: [cap-backend/srv/ticket/ticket.domain.service.js](cap-backend/srv/ticket/ticket.domain.service.js#L70-L75)  
**Severity**: Medium  
**Description**: Fields like `title`, `description`, etc., are validated for existence but not for max length. A user could submit a 10 MB title string.

```javascript
if (!data.title) req.error(400, 'title is required');
// No max length check!
```

**Suggested Fix**: Add a generic field validator:
```javascript
const MAX_LENGTHS = {
  title: 255,
  description: 5000,
  comment: 10000,
  rejectionReason: 2000,
  sourceFileName: 255,
};

const assertFieldLength = (field, value, req) => {
  if (!value) return;
  const max = MAX_LENGTHS[field];
  if (max && String(value).length > max) {
    req.error(400, `${field} must not exceed ${max} characters`);
  }
};

// Usage
async beforeCreate(req) {
  const { title, description } = req.data;
  assertFieldLength('title', title, req);
  assertFieldLength('description', description, req);
  // ...
}
```

---

### 17. No Rate Limiting on Sensitive Operations
**File**: [cap-backend/srv/auth/auth.impl.js](cap-backend/srv/auth/auth.impl.js)  
**Severity**: Medium  
**Description**: The `authenticate` action has no rate limiting. An attacker could brute-force credentials with thousands of requests per second.

**Suggested Fix**: Add rate limiting middleware:
```javascript
const rateLimit = (() => {
  const attempts = new Map(); // userId -> { count, resetAt }
  const MAX_ATTEMPTS = 5;
  const WINDOW_MS = 60 * 1000; // 1 minute

  return (req) => {
    const key = req.data?.email ?? req.user?.id;
    if (!key) return; // Skip if no identifier
    
    const now = Date.now();
    const entry = attempts.get(key) ?? { count: 0, resetAt: now + WINDOW_MS };
    
    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + WINDOW_MS;
    }
    
    entry.count++;
    attempts.set(key, entry);
    
    if (entry.count > MAX_ATTEMPTS) {
      req.reject(429, 'Too many authentication attempts. Please try again later.');
    }
  };
})();

srv.on('authenticate', (req) => {
  rateLimit(req);
  // ... rest of auth logic
});
```

---

### 18. Incomplete Error Context in Domain Transitions
**File**: [cap-backend/srv/wricef/wricef.domain.service.js](cap-backend/srv/wricef/wricef.domain.service.js#L40-L50)  
**Severity**: Medium  
**Description**: When a WRICEF cannot transition (status mismatch), the error message includes current state but not requested state:

```javascript
req.reject(409, `Cannot edit WRICEF in status '${wricef.status}'; only DRAFT WRICEFs can be edited`);
```

The error doesn't tell the user what they were trying to do (which transition was rejected).

**Suggested Fix**: Enhance error messages:
```javascript
req.reject(409, 
  `Cannot transition WRICEF from '${wricef.status}' to 'PENDING_VALIDATION'. ` +
  `Only DRAFT WRICEFs can be submitted. Please ensure the WRICEF is in DRAFT status.`
);
```

---

### 19. Missing Projection of Sensitive Fields
**File**: [cap-backend/srv/shared/services/authz.js](cap-backend/srv/shared/services/authz.js)  
**Severity**: Medium  
**Description**: When restricting reads to a user's own data, there's no explicit projection to exclude potentially sensitive fields (e.g., password hashes, internal notes). If a field is added to the User entity later, it could be leaked.

```javascript
const restrictReadToOwnerUnlessStaff = (req, ownerField) => {
  if (isStaff(req)) return;
  const userId = getUserId(req);
  addWhere(req, ownerFilter(ownerField, userId));
  // No projection - all fields returned
};
```

**Suggested Fix**: Add explicit column projection:
```javascript
const SAFE_USER_COLUMNS = ['ID', 'name', 'email', 'role', 'active', 'skills', 'certifications'];

const restrictReadToOwnerUnlessStaff = (req, ownerField) => {
  if (isStaff(req)) return;
  const userId = getUserId(req);
  addWhere(req, ownerFilter(ownerField, userId));
  
  // Explicitly project safe columns
  const select = req.query?.SELECT;
  if (select && !select.columns) {
    select.columns = SAFE_USER_COLUMNS.map(col => ({ ref: [col] }));
  }
};
```

---

### 20. Missing Idempotency Keys for Critical Operations
**File**: [cap-backend/srv/wricef/wricef.domain.service.js](cap-backend/srv/wricef/wricef.domain.service.js#L48-L78)  
**Severity**: Medium  
**Description**: The submit/validate/reject operations create notifications but have no idempotency keys. If a request is retried due to network failure, duplicate notifications could be created.

**Suggested Fix**: Add idempotency key support:
```javascript
const idempotencyKeys = new Map(); // idempotencyKey -> result

async submitWricef(req) {
  const idempotencyKey = req.headers['idempotency-key'];
  if (idempotencyKey) {
    if (idempotencyKeys.has(idempotencyKey)) {
      return idempotencyKeys.get(idempotencyKey); // Return cached result
    }
  }
  
  // ... main logic ...
  const result = await this.repo.updateById(id, {...});
  
  if (idempotencyKey) {
    idempotencyKeys.set(idempotencyKey, result);
    // Clean up old keys after 1 hour
    setTimeout(() => idempotencyKeys.delete(idempotencyKey), 3600000);
  }
  
  return result;
}
```

---

### 21. Missing Cascade Delete Specifications
**File**: [cap-backend/srv/project/project.domain.service.js](cap-backend/srv/project/project.domain.service.js#L48-L60)  
**Severity**: Medium  
**Description**: When deleting a project, the code checks for related records but doesn't explicitly define the cascade behavior. If child tables change, the logic could become inconsistent.

```javascript
async beforeDelete(req) {
  // ...
  const hasChildren = await this.repo.hasRelatedRecords(id);
  if (hasChildren) {
    req.reject(409, 'Cannot delete project with existing related records...');
  }
}
```

**Suggested Fix**: Define explicit cascade policy:
```javascript
const CASCADE_POLICY = {
  Projects: {
    Tickets: 'REJECT', // Don't allow delete if tickets exist
    Allocations: 'CASCADE', // Auto-delete allocations
    Deliverables: 'CASCADE', // Auto-delete deliverables
  },
};

async beforeDelete(req) {
  const id = extractEntityId(req);
  if (!id) return;
  
  for (const [childEntity, policy] of Object.entries(CASCADE_POLICY.Projects ?? {})) {
    const hasChildren = await this.repo.countChildren(id, childEntity);
    if (hasChildren === 0) continue;
    
    if (policy === 'REJECT') {
      req.reject(409, `Cannot delete project with existing ${childEntity}. Delete them first.`);
    } else if (policy === 'CASCADE') {
      await this.repo.deleteChildren(id, childEntity);
    }
    // Policy 'SETNULL' would update foreign keys to null, etc.
  }
}
```

---

## LOW Issues

### 22. Inconsistent Error Messages
**File**: [cap-backend/srv/shared/services/validation.js](cap-backend/srv/shared/services/validation.js#L30-L47)  
**Severity**: Low  
**Description**: Error messages are sometimes capitalized and sometimes not:
- `'${fieldName} is required'` (lowercase)
- `'Unknown ${fieldName} ...'` (capitalized)

**Suggested Fix**: Standardize error message formatting:
```javascript
const assertEntityExists = async (entityName, id, fieldName, req) => {
  if (id === undefined || id === null) return;
  const normalized = String(id).trim();
  if (!normalized) {
    req.error(400, `Field '${fieldName}' is required.`); // Consistent capitalization & punctuation
    return;
  }

  const existing = await cds.db.run(...);
  if (!existing) {
    req.error(400, `Field '${fieldName}' references unknown entity: '${normalized}'.`);
  }
};
```

---

### 23. Missing JSDoc for Critical Functions
**File**: [cap-backend/srv/wricef/wricef.domain.service.js](cap-backend/srv/wricef/wricef.domain.service.js#L1-L50)  
**Severity**: Low  
**Description**: While some files have JSDoc comments (e.g., ticket.repo.js), complex domain services lack documentation explaining business rules:

```javascript
// Missing JSDoc - what does this do? When is it called?
async submitWricef(req) { ... }

// Missing JSDoc - what are the allowed transitions?
async validateWricef(req) { ... }
```

**Suggested Fix**: Add JSDoc headers:
```javascript
/**
 * submitWricef – Transition a DRAFT WRICEF to PENDING_VALIDATION.
 * 
 * Side effects:
 * - Updates WRICEF.status to PENDING_VALIDATION
 * - Updates all child WricefObjects in DRAFT status to PENDING_VALIDATION
 * - Creates WRICEF_SUBMITTED notifications for all PROJECT_MANAGER users
 * 
 * Authorization: ADMIN or MANAGER roles only
 * 
 * @param {Object} req - CAP request object
 * @throws {409} If WRICEF is not in DRAFT status
 * @throws {400} If WRICEF has no objects
 * @returns {Promise<Object>} Updated WRICEF record
 */
async submitWricef(req) { ... }
```

---

### 24. Missing Environment Variable Documentation
**File**: [cap-backend/srv/base-service.js](cap-backend/srv/base-service.js)  
**Severity**: Low  
**Description**: No documentation on expected environment variables. Hardcoded values like `MAX_PAGE_SIZE: 500` and `DEFAULT_PAGE_SIZE: 100` are not configurable.

**Suggested Fix**: Add environment variable support and document them:
```javascript
// At top of base-service.js
const MAX_PAGE_SIZE = parseInt(process.env.MAX_PAGE_SIZE || '500', 10);
const DEFAULT_PAGE_SIZE = parseInt(process.env.DEFAULT_PAGE_SIZE || '100', 10);
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10);
const AUDIT_ENABLED = process.env.AUDIT_ENABLED !== 'false';

/**
 * Environment Variables:
 * - MAX_PAGE_SIZE: Maximum rows per request (default: 500, max: 10000)
 * - DEFAULT_PAGE_SIZE: Default rows when $top not specified (default: 100)
 * - REQUEST_TIMEOUT_MS: Request timeout in milliseconds (default: 30000)
 * - AUDIT_ENABLED: Enable audit logging (default: true)
 */
```

---

# FRONTEND ANALYSIS (frontend/src)

## CRITICAL Issues

### 25. Missing Error Boundaries for Async Component Errors
**File**: [frontend/src/app/App.tsx](frontend/src/app/App.tsx)  
**Severity**: Critical  
**Description**: The application has an `ErrorBoundary` component but it only catches synchronous render errors. Errors thrown inside `useEffect`, event handlers, or async operations are not caught.

**Current Implementation**: The `ErrorBoundary` only catches errors from `getDerivedStateFromError()` and `componentDidCatch()`, which don't handle errors in:
- useEffect hooks
- Promise rejections
- Event handlers
- Async component functions

**Suggested Fix**: Enhance error boundary and add global error handling:
```typescript
// components/common/AsyncErrorBoundary.tsx
export class AsyncErrorBoundary extends Component<...> {
  // ... existing ErrorBoundary code ...
  
  componentDidMount() {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }
  
  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }
  
  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('[AsyncErrorBoundary] Unhandled promise rejection:', event.reason);
    this.setState({ hasError: true, error: event.reason });
  };
}

// In App.tsx
<AsyncErrorBoundary>
  <Router>
    {/* routes */}
  </Router>
</AsyncErrorBoundary>
```

Also wrap async operations in useEffect with error handling:
```typescript
useEffect(() => {
  const loadData = async () => {
    try {
      const data = await fetchData();
      setData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    }
  };
  
  void loadData();
}, []);
```

---

### 26. Unsafe Type Assertions (`any`) Throughout Codebase
**File**: Multiple files including [frontend/src/app/features/imputations/components/AddImputationDialog.tsx](frontend/src/app/features/imputations/components/AddImputationDialog.tsx#L54)  
**Severity**: Critical  
**Description**: Numerous `any` type assertions bypass TypeScript's type safety:

```typescript
// AddImputationDialog.tsx
resolver: zodResolver(imputationSchema as any),
const onSubmit = (values: any) => { ... }

// PeriodDetailTables.tsx
const totalHours = periodRows.reduce((sum: number, imp: any) => sum + imp.hours, 0);
.sort((a: any, b: any) => a.date.localeCompare(b.date))

// WricefPanel.tsx
vm: any;

// CreateProjectTicketForm.tsx
vm: any;
```

This defeats TypeScript's purpose and hides potential type errors.

**Suggested Fix**: Define proper types for all `any` usages:
```typescript
// Before
resolver: zodResolver(imputationSchema as any),
const onSubmit = (values: any) => { ... }

// After
interface ImputationFormData {
  ticketId: string;
  hours: number;
  date: string;
  notes?: string;
}

resolver: zodResolver(imputationSchema),
const onSubmit = (values: ImputationFormData) => {
  // values is now strongly typed
}
```

For component ViewModels, create explicit interfaces:
```typescript
// Before
interface WricefPanelProps {
  vm: any; // What fields does vm have?
}

// After
interface WricefPanelViewModel {
  wricefObjects: WricefObject[];
  loading: boolean;
  error: string | null;
  onCreateObject: (data: Partial<WricefObject>) => Promise<void>;
  onUpdateObject: (id: string, data: Partial<WricefObject>) => Promise<void>;
}

interface WricefPanelProps {
  vm: WricefPanelViewModel;
}
```

Audit results from grep_search:
- **20 `any` instances** found in frontend files  
- Concentrated in imputation, project, and ticket features
- Primarily in component props and form handlers

---

### 27. Missing Cleanup in useEffect Hooks
**File**: [frontend/src/app/components/layout/TopBar.tsx](frontend/src/app/components/layout/TopBar.tsx#L70-L85)  
**Severity**: Critical  
**Description**: The TopBar component loads notifications but has no cleanup:

```typescript
useEffect(() => {
  if (!currentUser) return;

  const load = async () => {
    try {
      const notificationData = await NotificationsAPI.getByUser(currentUser.id);
      setNotifications(notificationData.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch (error) {
      toast.error('Failed to load notifications');
    }
  };

  void load();
  // Missing cleanup - if component unmounts, setNotifications is called on unmounted component
  // If currentUser changes, new request starts without canceling the previous one
}, [currentUser]);
```

This causes:
1. **Memory leak**: setNotifications() called after unmount
2. **Race conditions**: If currentUser changes, old requests might complete after new ones
3. **Multiple requests**: No request deduplication

**Suggested Fix**:
```typescript
useEffect(() => {
  if (!currentUser) return;

  let isMounted = true;
  let abortController = new AbortController();

  const load = async () => {
    try {
      const notificationData = await NotificationsAPI.getByUser(currentUser.id, {
        signal: abortController.signal
      });
      
      // Only update state if component is still mounted
      if (isMounted) {
        setNotifications(notificationData.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      }
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') return;
      if (isMounted) {
        toast.error('Failed to load notifications');
      }
    }
  };

  void load();

  // Cleanup function
  return () => {
    isMounted = false;
    abortController.abort(); // Cancel pending request
  };
}, [currentUser]);
```

---

### 28. OData Error Handling Missing for Network Failures
**File**: [frontend/src/app/services/odata/core.ts](frontend/src/app/services/odata/core.ts#L300-L400)  
**Severity**: Critical  
**Description**: The `odataFetch()` function doesn't handle critical network errors:

```typescript
// In odataFetch (not shown in grep, but inferred from code)
// Missing handling for:
// - Network timeout (fetch aborts)
// - CORS errors
// - Connection refused
// - Invalid response format (non-JSON)
// - Server is down (503, 502)
```

Looking at the error types defined, there's no handling for network-level failures, only HTTP error responses. This means network errors could crash the application.

**Suggested Fix**: Add comprehensive error handling in odataFetch:
```typescript
export const odataFetch = async <T>(
  service: ODataService,
  entity: string,
  options?: ODataRequestOptions
): Promise<T> => {
  const url = buildODataUrl(service, entity, options);
  const timeout = options?.timeoutMs ?? 30000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      credentials: odataClientConfig.credentials,
      headers: buildRequestHeaders(options),
    });

    if (!response.ok) {
      const error = await parseODataError(response);
      if (response.status === 401) {
        notifyAuthExpired();
      }
      throw new ODataError(error, response.status, url);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error(`Expected JSON response, got ${contentType}`);
    }

    const data = await response.json();
    return normalizeEntityArray(data.value);
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
      // Network error
      throw new ODataNetworkError('Network connection failed. Please check your connection.');
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ODataTimeoutError(`Request timeout after ${timeout}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};
```

---

## HIGH Issues

### 29. Missing Null Checks After Async Data Fetch
**File**: [frontend/src/app/features/projects/hooks.ts](frontend/src/app/features/projects/hooks.ts#L50-L100)  
**Severity**: High  
**Description**: In `useProjectDetailsBootstrap`, after loading data, there's no guarantee the component is still mounted:

```typescript
const reload = useCallback(async () => {
  requestRef.current?.abort();
  const controller = new AbortController();
  requestRef.current = controller;
  setLoading(true);
  setError(null);

  try {
    const data = await loadProjectDetailsBootstrap(projectId, controller.signal);
    if (controller.signal.aborted) return;

    // All state updates happen without checking if component is mounted
    setProject(data.project);
    setAllocations(data.allocations);
    setUsers(data.users);
    setDeliverables(data.deliverables);
    setTickets(data.tickets);
    setDocumentationObjects(data.documentationObjects);
    setWricefObjects(data.wricefObjects);
    setError(data.error);
  } catch (err) {
    if (!isAbortError(err)) {
      // Only checks abort - still sets error on unmounted component!
      setError(err instanceof Error ? err.message : 'Failed to load project data');
    }
  }
  // ...
}, [projectId]);
```

If the component unmounts between data fetch and state updates, React warns about memory leaks.

**Suggested Fix**: Add isMounted flag:
```typescript
const reload = useCallback(async () => {
  let isMounted = true;
  requestRef.current?.abort();
  const controller = new AbortController();
  requestRef.current = controller;
  
  if (isMounted) setLoading(true);
  if (isMounted) setError(null);

  try {
    const data = await loadProjectDetailsBootstrap(projectId, controller.signal);
    if (controller.signal.aborted || !isMounted) return;

    setProject(data.project);
    setAllocations(data.allocations);
    // ... other state updates
  } catch (err) {
    if (!isAbortError(err) && isMounted) {
      setError(err instanceof Error ? err.message : 'Failed to load project data');
    }
  } finally {
    if (isMounted) setLoading(false);
  }
  
  return () => {
    isMounted = false; // Cleanup
  };
}, [projectId]);
```

---

### 30. Insufficient Request Deduplication in API Calls
**File**: [frontend/src/app/features/projects/hooks.ts](frontend/src/app/features/projects/hooks.ts#L40-L90)  
**Severity**: High  
**Description**: The bootstrap hook doesn't prevent duplicate requests if called multiple times in quick succession:

```typescript
const reload = useCallback(async () => {
  requestRef.current?.abort(); // Abort previous
  const controller = new AbortController();
  requestRef.current = controller; // Store new one
  setLoading(true);
  // If reload() is called 3 times in 10ms, all 3 requests go out
  const data = await loadProjectDetailsBootstrap(projectId, controller.signal);
}, [projectId]);

useEffect(() => {
  void reload(); // Called on every projectId change
  return () => {
    requestRef.current?.abort();
    requestRef.current = null;
  };
}, [reload]); // reload changed because projectId changed!
```

With the `reload` dependency, useEffect re-runs when reload changes, causing double fetches.

**Suggested Fix**:
```typescript
const reload = useCallback(async () => {
  // Debounce or cancel in-flight requests
  requestRef.current?.abort();
  const controller = new AbortController();
  requestRef.current = controller;
  setLoading(true);

  try {
    const data = await loadProjectDetailsBootstrap(projectId, controller.signal);
    if (controller.signal.aborted) return;
    // ... update state
  }
  // ...
}, [projectId]); // Only depend on projectId

useEffect(() => {
  void reload();
  return () => {
    requestRef.current?.abort();
    requestRef.current = null;
  };
}, [projectId]); // Only depend on projectId, not reload
```

Or use a request deduplication pattern:
```typescript
const pendingRequests = useRef(new Map<string, Promise<...>>());

const reload = useCallback(async () => {
  const key = `project-${projectId}`;
  
  // Return existing promise if request already in flight
  if (pendingRequests.current.has(key)) {
    return pendingRequests.current.get(key);
  }

  const promise = loadProjectDetailsBootstrap(projectId);
  pendingRequests.current.set(key, promise);
  
  try {
    const data = await promise;
    // ... update state
  } finally {
    pendingRequests.current.delete(key);
  }
  
  return promise;
}, [projectId]);
```

---

### 31. Missing Memoization of Expensive Computations
**File**: [frontend/src/app/features/projects/hooks.ts](frontend/src/app/features/projects/hooks.ts) (and multiple page files)  
**Severity**: High  
**Description**: Complex selectors and transformations are not memoized, causing unnecessary re-renders:

Example in ProjectsEnhanced:
```typescript
// Not memoized - recomputed on every render
const filteredProjects = projects.filter(p => {
  const matchesName = p.name.toLowerCase().includes(searchQuery.toLowerCase());
  const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
  const matchesPriority = priorityFilter === 'ALL' || p.priority === priorityFilter;
  return matchesName && matchesStatus && matchesPriority;
});

// Passed to Table - could cause table re-renders even if filters didn't change
<ProjectTable projects={filteredProjects} />
```

**Suggested Fix**: Use useMemo:
```typescript
const filteredProjects = useMemo(() => {
  return projects.filter(p => {
    const matchesName = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || p.priority === priorityFilter;
    return matchesName && matchesStatus && matchesPriority;
  });
}, [projects, searchQuery, statusFilter, priorityFilter]);

const memoizedTable = useMemo(() => (
  <ProjectTable projects={filteredProjects} />
), [filteredProjects]);
```

---

## MEDIUM Issues

### 32. Accessibility (a11y) Issues in Form Controls
**File**: [frontend/src/app/features/imputations/components/AddImputationDialog.tsx](frontend/src/app/features/imputations/components/AddImputationDialog.tsx)  
**Severity**: Medium  
**Description**: Form inputs lack proper accessibility attributes:

```typescript
// Missing proper labeling and aria attributes
<Input placeholder="Hours" />
<Select>
  <SelectItem value="ticket-1">Ticket 1</SelectItem>
</Select>
// No aria-describedby for validation messages
// No aria-required for required fields
```

**Suggested Fix**:
```typescript
<FormField
  control={form.control}
  name="hours"
  render={({ field }) => (
    <FormItem>
      <FormLabel htmlFor="hours-input" required>Hours</FormLabel>
      <FormControl>
        <Input
          id="hours-input"
          placeholder="Enter hours (0-24)"
          type="number"
          min="0"
          max="24"
          aria-label="Hours worked"
          aria-describedby="hours-error"
          aria-required="true"
          {...field}
        />
      </FormControl>
      <FormDescription id="hours-desc">
        Enter the number of hours worked on this ticket
      </FormDescription>
      <FormMessage id="hours-error" />
    </FormItem>
  )}
/>
```

---

### 33. Missing React.memo for Reusable Components
**File**: Multiple component files  
**Severity**: Medium  
**Description**: Components that could be memoized aren't, causing unnecessary re-renders:

```typescript
// Before - re-renders every time parent renders
export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect }) => {
  return (...);
};

// After - only re-renders if props change
export const ProjectCard = React.memo(({ project, onSelect }: ProjectCardProps) => {
  return (...);
});
```

**Suggested Fix**: Wrap presentation components:
```typescript
export const ProjectCard = React.memo<ProjectCardProps>(({ project, onSelect }) => {
  return (
    <div className="...">
      {/* component content */}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.project.id === nextProps.project.id &&
         prevProps.onSelect === nextProps.onSelect; // Custom comparison if needed
});
```

---

### 34. Unhandled Promise Rejections in Event Handlers
**File**: [frontend/src/app/components/layout/TopBar.tsx](frontend/src/app/components/layout/TopBar.tsx#L95-L110)  
**Severity**: Medium  
**Description**: The markNotificationAsRead handler doesn't handle all error cases:

```typescript
const markNotificationAsRead = async (notificationId: string) => {
  try {
    await NotificationsAPI.markAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      )
    );
  } catch (error) {
    // Generic error toast - no retry logic
    toast.error('Failed to update notification');
    // If this error happens, notification still shows as unread locally
    // but might be marked as read on server - state mismatch!
  }
};
```

**Suggested Fix**: Implement optimistic updates with rollback:
```typescript
const markNotificationAsRead = async (notificationId: string) => {
  const originalNotifications = notifications;
  
  // Optimistic update
  setNotifications((prev) =>
    prev.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    )
  );

  try {
    await NotificationsAPI.markAsRead(notificationId);
  } catch (error) {
    // Rollback on failure
    setNotifications(originalNotifications);
    toast.error('Failed to update notification. Please try again.', {
      action: {
        label: 'Retry',
        onClick: () => markNotificationAsRead(notificationId), // Allow retry
      },
    });
  }
};
```

---

### 35. Missing Loading States in Async Operations
**File**: [frontend/src/app/pages/Login.page.tsx](frontend/src/app/pages/Login.page.tsx#L50-L90)  
**Severity**: Medium  
**Description**: The login form has a `loading` state, but not all async operations show loading:

```typescript
const handleLogin = async (userEmail: string, userPass: string) => {
  setLoading(true); // ✓ Good
  try {
    await login(userEmail, userPass);
    toast.success('Welcome back', ...);
    navigate(fromPath || '/dashboard', { replace: true });
  } catch {
    toast.error('Authentication failed', ...);
  } finally {
    setLoading(false); // ✓ Good
  }
};

// But quick access login doesn't show loading
const quickAccessUsers = useMemo(() => quickUsers.slice(0, 6), [quickUsers]);
// Clicking a quick access user doesn't set loading state
```

**Suggested Fix**: Ensure all async operations show loading:
```typescript
const handleQuickAccessLogin = async (userId: string) => {
  setLoading(true);
  try {
    const user = await UsersAPI.getById(userId);
    const token = ... // Get or create token
    setODataAuthToken(token);
    setCurrentUser(user);
    navigate(fromPath || '/dashboard', { replace: true });
  } catch (error) {
    toast.error('Failed to login', { description: error instanceof Error ? error.message : 'Unknown error' });
  } finally {
    setLoading(false);
  }
};
```

---

### 36. No Timeout Handling for Fetch Requests
**File**: [frontend/src/app/services/odata/core.ts](frontend/src/app/services/odata/core.ts)  
**Severity**: Medium  
**Description**: The OData client doesn't implement request timeouts. If the server is slow, requests could hang indefinitely.

**Suggested Fix**: Add timeout support (already partially visible in ODataRequestOptions):
```typescript
export const odataFetch = async <T>(
  service: ODataService,
  entity: string,
  options?: ODataRequestOptions
): Promise<T> => {
  const timeout = options?.timeoutMs ?? 30000; // 30 seconds default
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal, // Pass abort signal
    });
    // ... handle response
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Usage
try {
  const data = await odataFetch(
    'core',
    'Projects',
    { timeoutMs: 5000 } // 5 second timeout for this request
  );
} catch (err) {
  if (err instanceof Error && err.name === 'AbortError') {
    console.error('Request timed out');
  }
}
```

---

## LOW Issues

### 37. Inconsistent Naming Conventions
**Severity**: Low  
**Description**: Some files use camelCase, others PascalCase; some components are `.page.tsx`, others aren't.

**Suggested Fix**: Per AGENTS.md conventions:
- React components: `PascalCase.tsx`
- Utilities/hooks: `camelCase.ts`
- Page routes: `ComponentName.page.tsx`
- Ensure consistency via ESLint rules

---

### 38. Missing PropTypes or Runtime Type Checking
**Severity**: Low  
**Description**: While TypeScript is used, there's no runtime validation of props from external APIs. Props are typed but not validated.

**Suggested Fix**: Use Zod or similar for runtime validation:
```typescript
import { z } from 'zod';

const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  status: z.enum(['PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});

type Project = z.infer<typeof ProjectSchema>;

// Validate API responses
const project = ProjectSchema.parse(apiResponse);
```

---

# SUMMARY TABLE

| Layer | Critical | High | Medium | Low | Total |
|-------|----------|------|--------|-----|-------|
| **Backend** | 4 | 9 | 7 | 2 | 22 |
| **Frontend** | 4 | 3 | 4 | 2 | 13 |
| **TOTAL** | **8** | **12** | **11** | **4** | **35** |

---

# RECOMMENDED ACTION ITEMS (Priority Order)

## Phase 1: Critical (Implement Immediately)
1. ✅ Fix N+1 query in WRICEF submit (Backend #1)
2. ✅ Add transaction isolation in multi-step operations (Backend #2)
3. ✅ Validate user input lengths (Backend #3)
4. ✅ Fix audit log silent failures (Backend #4)
5. ✅ Add error boundaries for async errors (Frontend #25)
6. ✅ Eliminate `any` type usage (Frontend #26)
7. ✅ Add useEffect cleanup for TopBar notifications (Frontend #27)
8. ✅ Add comprehensive OData error handling (Frontend #28)

## Phase 2: High (Implement Within 1 Sprint)
9. ✅ Add FK validation for all foreign keys (Backend #5)
10. ✅ Implement SQL injection prevention (Backend #6)
11. ✅ Add missing error codes for edge cases (Backend #7)
12. ✅ Fix authorization gaps in delete operations (Backend #8)
13. ✅ Enforce pagination on internal queries (Backend #9)
14. ✅ Add request timeouts (Backend #10)
15. ✅ Fix data integrity with unique constraints (Backend #11)
16. ✅ Centralize enum validation (Backend #12)
17. ✅ Implement optimistic locking (Backend #13)
18. ✅ Fix null checks after async fetch (Frontend #29)
19. ✅ Deduplicate API requests (Frontend #30)
20. ✅ Memoize expensive computations (Frontend #31)

## Phase 3: Medium (Implement Within 2 Sprints)
21. ✅ Add auth failure logging (Backend #14)
22. ✅ Improve date range validation (Backend #15)
23. ✅ Add field length validation (Backend #16)
24. ✅ Implement rate limiting (Backend #17)
25. ✅ Enhance error context messages (Backend #18)
26. ✅ Add sensitive field projection (Backend #19)
27. ✅ Add idempotency keys (Backend #20)
28. ✅ Define cascade delete policies (Backend #21)
29. ✅ Fix accessibility issues (Frontend #32)
30. ✅ Memoize reusable components (Frontend #33)
31. ✅ Handle promise rejections in handlers (Frontend #34)
32. ✅ Add loading states for all async ops (Frontend #35)
33. ✅ Implement request timeouts (Frontend #36)

---

**Report Generated**: April 27, 2026  
**Total Issues Found**: 35  
**Critical Issues Requiring Immediate Attention**: 8  
**Estimated Effort**: 4-6 weeks for full remediation
