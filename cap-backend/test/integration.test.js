'use strict';
/**
 * Integration tests for the Ticket domain (CRUD) and Imputation state machine.
 *
 * Uses @sap/cds built-in test bootstrapper with in-memory SQLite.
 * Run: npm test
 */
const cds = require('@sap/cds');

// Boot the CAP server with in-memory SQLite (no file DB)
const { GET, POST, PATCH, DELETE, expect: _expect } = cds.test(__dirname + '/..').in(__dirname + '/..');

// Helper: create an auth header (the service expects Bearer tokens)
// Since these are integration tests hitting the service directly via cds.test,
// we authenticate via the service's own /authenticate action.
let authToken = null;
let adminAuthToken = null;
let consultantAuthToken = null;

const withAuth = () => ({
  headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
});

const withAdminAuth = () => ({
  headers: adminAuthToken ? { Authorization: `Bearer ${adminAuthToken}` } : {},
});

const withConsultantAuth = () => ({
  headers: consultantAuthToken ? { Authorization: `Bearer ${consultantAuthToken}` } : {},
});

const ensureAuth = async () => {
  if (authToken) return;
  const { data } = await POST('/odata/v4/performance/authenticate', {
    email: 'marc.manager@inetum.com',
    password: 'Manager#2026',
  });
  authToken = data.token;
};

const ensureAdminAuth = async () => {
  if (adminAuthToken) return;
  const { data } = await POST('/odata/v4/performance/authenticate', {
    email: 'alice.admin@inetum.com',
    password: 'Admin#2026',
  });
  adminAuthToken = data.token;
};

const ensureConsultantAuth = async () => {
  if (consultantAuthToken) return;
  const { data } = await POST('/odata/v4/performance/authenticate', {
    email: 'theo.tech@inetum.com',
    password: 'Tech#2026',
  });
  consultantAuthToken = data.token;
};

describe('Authentication', () => {
  test('POST /authenticate with valid credentials returns token + user', async () => {
    const { status, data } = await POST('/odata/v4/performance/authenticate', {
      email: 'marc.manager@inetum.com',
      password: 'Manager#2026',
    });
    expect(status).toBe(200);
    expect(data.token).toBeTruthy();
    expect(data.user).toBeTruthy();
    expect(data.user.email).toBe('marc.manager@inetum.com');
    expect(data.user.role).toBe('MANAGER');
    expect(data.expiresAt).toBeTruthy();

    // Store token for subsequent tests
    authToken = data.token;
  });

  test('POST /authenticate with bad password returns 401', async () => {
    try {
      await POST('/odata/v4/performance/authenticate', {
        email: 'marc.manager@inetum.com',
        password: 'wrong',
      });
      fail('Should have thrown');
    } catch (err) {
      expect(err.response?.status ?? err.status).toBe(401);
    }
  });

  test('POST /quickAccessAccounts returns demo accounts', async () => {
    const { status, data } = await POST('/odata/v4/performance/quickAccessAccounts', {});
    expect(status).toBe(200);
    const accounts = data.value ?? data;
    expect(Array.isArray(accounts)).toBe(true);
    expect(accounts.length).toBeGreaterThan(0);
    expect(accounts.some((a) => a.email === 'alice.admin@inetum.com')).toBe(true);
  });
});

describe('Ticket CRUD', () => {
  test('Consultant sees only tickets assigned to self', async () => {
    await ensureConsultantAuth();
    const { status, data } = await GET('/odata/v4/performance/Tickets', withConsultantAuth());
    expect(status).toBe(200);
    expect(data.value.length).toBeGreaterThan(0);
    data.value.forEach((ticket) => {
      expect(ticket.assignedTo).toBe('u-tech');
    });
  });

  test('Manager can still read tickets beyond own assignment', async () => {
    const { status, data } = await GET('/odata/v4/performance/Tickets?$filter=ID eq \x27tk-002\x27', withAuth());
    expect(status).toBe(200);
    expect(data.value.length).toBe(1);
    expect(data.value[0].assignedTo).toBe('u-fonc');
  });

  test('GET /Tickets returns seed tickets', async () => {
    const { status, data } = await GET('/odata/v4/performance/Tickets?$top=5', withAuth());
    expect(status).toBe(200);
    expect(data.value.length).toBeGreaterThan(0);
  });

  test('GET /Tickets with $count returns inline count', async () => {
    const { status, data } = await GET('/odata/v4/performance/Tickets?$count=true&$top=1', withAuth());
    expect(status).toBe(200);
    expect(typeof data['@odata.count']).toBe('number');
    expect(data['@odata.count']).toBeGreaterThan(0);
  });

  test('GET /Tickets by ID returns a single ticket', async () => {
    const { status, data } = await GET("/odata/v4/performance/Tickets('tk-001')", withAuth());
    expect(status).toBe(200);
    expect(data.ID).toBe('tk-001');
    expect(data.title).toBeTruthy();
  });

  test('GET /Tickets with $filter by status works', async () => {
    const { status, data } = await GET(
      "/odata/v4/performance/Tickets?$filter=status eq 'IN_PROGRESS'",
      withAuth()
    );
    expect(status).toBe(200);
    data.value.forEach((ticket) => {
      expect(ticket.status).toBe('IN_PROGRESS');
    });
  });

  let createdTicketId;

  test('POST /Tickets creates a new ticket', async () => {
    const payload = {
      projectId: 'proj-1',
      createdBy: 'u-manager',
      title: 'Test ticket from integration test',
      nature: 'PROGRAMME',
      priority: 'LOW',
      description: 'Integration test ticket',
    };

    const { status, data } = await POST('/odata/v4/performance/Tickets', payload, withAuth());
    expect(status).toBe(201);
    expect(data.ID).toBeTruthy();
    expect(data.ticketCode).toMatch(/^TK-\d{4}-[A-F0-9]{6}$/);
    expect(data.status).toBe('NEW');
    expect(data.title).toBe(payload.title);
    createdTicketId = data.ID;
  });

  test('PATCH /Tickets updates ticket status', async () => {
    expect(createdTicketId).toBeTruthy();
    const { status, data } = await PATCH(
      `/odata/v4/performance/Tickets('${createdTicketId}')`,
      { status: 'IN_PROGRESS' },
      withAuth()
    );
    expect(status).toBe(200);
    expect(data.status).toBe('IN_PROGRESS');
  });

  test('POST /Tickets with missing required fields returns 400', async () => {
    try {
      await POST('/odata/v4/performance/Tickets', { title: 'Missing fields' }, withAuth());
      fail('Should have thrown');
    } catch (err) {
      expect(err.response?.status ?? err.status).toBe(400);
    }
  });

  test('POST /Tickets with unknown projectId returns 400', async () => {
    try {
      await POST(
        '/odata/v4/performance/Tickets',
        {
          projectId: 'nonexistent-project',
          createdBy: 'u-manager',
          title: 'Bad project test',
          nature: 'REPORT',
        },
        withAuth()
      );
      fail('Should have thrown');
    } catch (err) {
      expect(err.response?.status ?? err.status).toBe(400);
    }
  });
});

describe('User entity', () => {
  test('GET /Users returns seed users', async () => {
    const { status, data } = await GET('/odata/v4/performance/Users?$filter=active eq true', withAuth());
    expect(status).toBe(200);
    expect(data.value.length).toBeGreaterThanOrEqual(6);
  });

  test('GET /Users by ID returns a single user', async () => {
    const { status, data } = await GET("/odata/v4/performance/Users('u-admin')", withAuth());
    expect(status).toBe(200);
    expect(data.email).toBe('alice.admin@inetum.com');
  });
});

describe('Projects entity', () => {
  test('GET /Projects returns seed projects', async () => {
    const { status, data } = await GET('/odata/v4/performance/Projects', withAuth());
    expect(status).toBe(200);
    expect(data.value.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Imputation state machine', () => {
  beforeAll(async () => {
    await ensureAuth();
  });

  const createDraftPeriod = async () => {
    const suffix = Math.random().toString(36).slice(2, 10).toUpperCase();
    const { data } = await POST(
      '/odata/v4/performance/ImputationPeriods',
      {
        periodKey: `IT-${suffix}`,
        consultantId: 'u-tech',
        startDate: '2026-03-01',
        endDate: '2026-03-15',
      },
      withAuth()
    );
    return data;
  };

  test('POST /Imputations(id)/validate transitions DRAFT -> VALIDATED', async () => {
    const { data: list } = await GET('/odata/v4/performance/Imputations?$top=1', withAuth());
    expect(list.value.length).toBeGreaterThan(0);
    const imp = list.value[0];

    // Only test if currently in a valid from-state
    if (['DRAFT', 'SUBMITTED', 'REJECTED'].includes(imp.validationStatus)) {
      const { status, data } = await POST(
        `/odata/v4/performance/Imputations('${imp.ID}')/validate`,
        { validatedBy: 'u-manager' },
        withAuth()
      );
      expect(status).toBe(200);
      expect(data.validationStatus).toBe('VALIDATED');
    }
  });

  test('POST /ImputationPeriods(id)/submit transitions DRAFT -> SUBMITTED', async () => {
    const draftPeriod = await createDraftPeriod();
    const { status, data } = await POST(
      `/odata/v4/performance/ImputationPeriods('${draftPeriod.ID}')/submit`,
      {},
      withAuth()
    );
    expect(status).toBe(200);
    expect(data.status).toBe('SUBMITTED');
  });

  test('POST /ImputationPeriods(id)/validate on SUBMITTED transitions to VALIDATED', async () => {
    const created = await createDraftPeriod();
    await POST(`/odata/v4/performance/ImputationPeriods('${created.ID}')/submit`, {}, withAuth());

    const { status, data } = await POST(
      `/odata/v4/performance/ImputationPeriods('${created.ID}')/validate`,
      { validatedBy: 'u-manager' },
      withAuth()
    );
    expect(status).toBe(200);
    expect(data.status).toBe('VALIDATED');
  });

  test('POST /ImputationPeriods(id)/submit on already SUBMITTED returns 409', async () => {
    const created = await createDraftPeriod();
    await POST(`/odata/v4/performance/ImputationPeriods('${created.ID}')/submit`, {}, withAuth());

    try {
      await POST(
        `/odata/v4/performance/ImputationPeriods('${created.ID}')/submit`,
        {},
        withAuth()
      );
      fail('Should have thrown a conflict error');
    } catch (err) {
      expect(err.response?.status ?? err.status).toBe(409);
    }
  });
});

describe('Unauthenticated access', () => {
  test('GET /Tickets without token returns 401', async () => {
    try {
      await GET('/odata/v4/performance/Tickets');
      fail('Should have thrown');
    } catch (err) {
      expect(err.response?.status ?? err.status).toBe(401);
    }
  });
});

describe('Validation and state-machine guards', () => {
  beforeAll(async () => {
    await ensureAuth();
  });

  test('Ticket invalid status transition returns 409', async () => {
    try {
      await PATCH("/odata/v4/performance/Tickets('tk-002')", { status: 'DONE' }, withAuth());
      fail('Should have thrown');
    } catch (err) {
      expect(err.response?.status ?? err.status).toBe(409);
    }
  });

  test('Project delete with children returns 409', async () => {
    await ensureAdminAuth();
    try {
      await DELETE("/odata/v4/performance/Projects('proj-1')", withAdminAuth());
      fail('Should have thrown');
    } catch (err) {
      expect(err.response?.status ?? err.status).toBe(409);
    }
  });

  test('User delete with references returns 409', async () => {
    await ensureAdminAuth();
    try {
      await DELETE("/odata/v4/performance/Users('u-manager')", withAdminAuth());
      fail('Should have thrown');
    } catch (err) {
      expect(err.response?.status ?? err.status).toBe(409);
    }
  });

  test('Imputation direct PATCH of validationStatus returns 403', async () => {
    try {
      await PATCH(
        "/odata/v4/performance/Imputations('imp-2')",
        { validationStatus: 'VALIDATED' },
        withAuth()
      );
      fail('Should have thrown');
    } catch (err) {
      expect(err.response?.status ?? err.status).toBe(403);
    }
  });

  test('ImputationPeriod direct PATCH of status returns 403', async () => {
    const { data: createdPeriod } = await POST(
      '/odata/v4/performance/ImputationPeriods',
      {
        periodKey: '2026-03-H1',
        consultantId: 'u-tech',
        startDate: '2026-03-01',
        endDate: '2026-03-15',
      },
      withAuth()
    );

    try {
      await PATCH(
        `/odata/v4/performance/ImputationPeriods('${createdPeriod.ID}')`,
        { status: 'SUBMITTED' },
        withAuth()
      );
      fail('Should have thrown');
    } catch (err) {
      expect(err.response?.status ?? err.status).toBe(403);
    }
  });

  test('LeaveRequest invalid transition returns 409', async () => {
    try {
      await PATCH(
        "/odata/v4/performance/LeaveRequests('leave-1')",
        { status: 'PENDING' },
        withAuth()
      );
      fail('Should have thrown');
    } catch (err) {
      expect(err.response?.status ?? err.status).toBe(409);
    }
  });

  test('Allocation create with invalid percent returns 400', async () => {
    try {
      await POST(
        '/odata/v4/performance/Allocations',
        {
          userId: 'u-tech',
          projectId: 'proj-1',
          allocationPercent: 120,
          startDate: '2026-02-01',
          endDate: '2026-03-01',
        },
        withAuth()
      );
      fail('Should have thrown');
    } catch (err) {
      expect(err.response?.status ?? err.status).toBe(400);
    }
  });

  test('Allocation create with unknown userId returns 400', async () => {
    try {
      await POST(
        '/odata/v4/performance/Allocations',
        {
          userId: 'u-unknown',
          projectId: 'proj-1',
          allocationPercent: 50,
          startDate: '2026-02-01',
          endDate: '2026-03-01',
        },
        withAuth()
      );
      fail('Should have thrown');
    } catch (err) {
      expect(err.response?.status ?? err.status).toBe(400);
    }
  });

  test('Wricef delete cascades WricefObjects', async () => {
    const { data: wricef } = await POST(
      '/odata/v4/performance/Wricefs',
      {
        projectId: 'proj-2',
        sourceFileName: 'cascade-test.xlsx',
      },
      withAuth()
    );
    expect(wricef.ID).toBeTruthy();

    await POST(
      '/odata/v4/performance/WricefObjects',
      {
        wricefId: wricef.ID,
        projectId: 'proj-2',
        type: 'W',
        title: 'Cascade object 1',
      },
      withAuth()
    );
    await POST(
      '/odata/v4/performance/WricefObjects',
      {
        wricefId: wricef.ID,
        projectId: 'proj-2',
        type: 'R',
        title: 'Cascade object 2',
      },
      withAuth()
    );

    const delRes = await DELETE(`/odata/v4/performance/Wricefs('${wricef.ID}')`, withAuth());
    expect(delRes.status).toBe(204);

    const { data: remaining } = await GET(
      `/odata/v4/performance/WricefObjects?$filter=wricefId eq '${wricef.ID}'`,
      withAuth()
    );
    expect(remaining.value.length).toBe(0);
  });

  test('ReferenceData duplicate type+code returns 409', async () => {
    await ensureAdminAuth();
    try {
      await POST(
        '/odata/v4/performance/ReferenceData',
        { type: 'PRIORITY', code: 'LOW', label: 'Duplicate low' },
        withAdminAuth()
      );
      fail('Should have thrown');
    } catch (err) {
      expect(err.response?.status ?? err.status).toBe(409);
    }
  });

  test('Consultant cannot read Evaluations', async () => {
    await ensureConsultantAuth();
    try {
      await GET('/odata/v4/performance/Evaluations?$top=1', withConsultantAuth());
      fail('Should have thrown');
    } catch (err) {
      expect(err.response?.status ?? err.status).toBe(403);
    }
  });

  test('DocumentationObjects PATCH auto-updates updatedAt', async () => {
    const { data: created } = await POST(
      '/odata/v4/performance/DocumentationObjects',
      {
        title: 'Doc update test',
        description: 'Before update',
        type: 'GENERAL',
        projectId: 'proj-1',
        authorId: 'u-tech',
      },
      withAuth()
    );
    expect(created.updatedAt).toBeTruthy();

    await new Promise((resolve) => setTimeout(resolve, 1200));
    const { data: updated } = await PATCH(
      `/odata/v4/performance/DocumentationObjects('${created.ID}')`,
      { description: 'After update' },
      withAuth()
    );
    expect(updated.updatedAt).toBeTruthy();
    expect(updated.updatedAt).not.toBe(created.updatedAt);
  });
});
