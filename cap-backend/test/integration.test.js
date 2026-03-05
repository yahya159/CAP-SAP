'use strict';
/**
 * Integration tests for the Ticket domain (CRUD) and Imputation state machine.
 *
 * Uses @sap/cds built-in test bootstrapper backing to the persistent SQLite DB.
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
  const { data } = await POST('/odata/v4/user/authenticate', {
    email: 'marc.manager@inetum.com',
    password: 'Manager#2026',
  });
  authToken = data.token;
};

const ensureAdminAuth = async () => {
  if (adminAuthToken) return;
  const { data } = await POST('/odata/v4/user/authenticate', {
    email: 'alice.admin@inetum.com',
    password: 'Admin#2026',
  });
  adminAuthToken = data.token;
};

const ensureConsultantAuth = async () => {
  if (consultantAuthToken) return;
  const { data } = await POST('/odata/v4/user/authenticate', {
    email: 'theo.tech@inetum.com',
    password: 'Tech#2026',
  });
  consultantAuthToken = data.token;
};

// ---------------------------------------------------------------------------
// Dynamic seed ID resolution – avoids hardcoded DB IDs tied to specific CSV rows.
// IDs are resolved once at the start of the test run by querying the live API.
// ---------------------------------------------------------------------------
const seedIds = {
  adminId: null,
  managerId: null,
  techId: null,
  foncId: null,
  project1Id: null,
  project2Id: null,
  anyTicketId: null,
  foncTicketId: null,
  newStatusTicketId: null,
  draftImputationId: null,
  approvedLeaveId: null,
};

const requireSeedId = (key) => {
  const value = seedIds[key];
  expect(value).toBeTruthy();
  return value;
};

const resolveSeedIds = async () => {
  await ensureAdminAuth();
  await ensureAuth();

  // Resolve user IDs by canonical email addresses (stable across re-seeds)
  const { data: usersData } = await GET(
    '/odata/v4/user/Users?$filter=active eq true',
    withAdminAuth()
  );
  const users = usersData.value ?? [];
  seedIds.adminId = users.find((u) => u.email === 'alice.admin@inetum.com')?.ID ?? null;
  seedIds.managerId = users.find((u) => u.email === 'marc.manager@inetum.com')?.ID ?? null;
  seedIds.techId = users.find((u) => u.email === 'theo.tech@inetum.com')?.ID ?? null;
  seedIds.foncId = users.find((u) => u.email === 'fatima.fonc@inetum.com')?.ID ?? null;

  // Resolve projects by canonical names instead of relying on list order
  const { data: projectsData } = await GET('/odata/v4/core/Projects?$top=100', withAdminAuth());
  const projects = projectsData.value ?? [];
  seedIds.project1Id =
    projects.find((p) => p.name === 'SAP S/4HANA Migration - Acme Corp')?.ID ?? null;
  seedIds.project2Id =
    projects.find((p) => p.name === 'Fiori Launchpad - Groupe Lebon')?.ID ?? null;

  // Resolve tickets by canonical ticketCode instead of relying on list order
  const { data: ticketsData } = await GET('/odata/v4/ticket/Tickets?$top=100', withAdminAuth());
  const tickets = ticketsData.value ?? [];
  seedIds.anyTicketId = tickets.find((t) => t.ticketCode === 'TK-2026-0001')?.ID ?? null;
  if (seedIds.foncId) {
    seedIds.foncTicketId = tickets.find((t) => t.assignedTo === seedIds.foncId)?.ID ?? null;
  }
  seedIds.newStatusTicketId = tickets.find((t) => t.ticketCode === 'TK-2026-0002')?.ID ?? null;

  // Resolve a non-VALIDATED imputation (for direct-PATCH guard test)
  const { data: impData } = await GET(
    "/odata/v4/time/Imputations?$filter=validationStatus eq 'SUBMITTED'&$top=5",
    withAdminAuth()
  );
  seedIds.draftImputationId =
    (impData.value ?? []).find((imputation) => imputation.periodKey === '2026-02-H1')?.ID ?? null;

  // Resolve an APPROVED leave request (for invalid-transition test)
  const { data: leaveData } = await GET(
    "/odata/v4/user/LeaveRequests?$filter=status eq 'APPROVED'&$top=10",
    withAdminAuth()
  );
  seedIds.approvedLeaveId =
    (leaveData.value ?? []).find((leave) => leave.reason === 'Annual holidays')?.ID ?? null;
};

beforeAll(async () => {
  await resolveSeedIds();
  requireSeedId('adminId');
  requireSeedId('managerId');
  requireSeedId('techId');
  requireSeedId('foncId');
  requireSeedId('project1Id');
  requireSeedId('project2Id');
  requireSeedId('anyTicketId');
  requireSeedId('foncTicketId');
  requireSeedId('newStatusTicketId');
  requireSeedId('draftImputationId');
  requireSeedId('approvedLeaveId');
}, 30000);

describe('Authentication', () => {
  test('POST /authenticate with valid credentials returns token + user', async () => {
    const { status, data } = await POST('/odata/v4/user/authenticate', {
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
      await POST('/odata/v4/user/authenticate', {
        email: 'marc.manager@inetum.com',
        password: 'wrong',
      });
      fail('Should have thrown');
    } catch (err) {
      expect(err.response?.status ?? err.status).toBe(401);
    }
  });

  test('POST /quickAccessAccounts returns demo accounts', async () => {
    const { status, data } = await POST('/odata/v4/user/quickAccessAccounts', {});
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
    const techId = requireSeedId('techId');
    const { status, data } = await GET('/odata/v4/ticket/Tickets', withConsultantAuth());
    expect(status).toBe(200);
    expect(data.value.length).toBeGreaterThan(0);
    data.value.forEach((ticket) => {
      expect(ticket.assignedTo).toBe(techId);
    });
  });

  test('Manager can still read tickets beyond own assignment', async () => {
    const foncId = requireSeedId('foncId');
    const { status, data } = await GET(
      `/odata/v4/ticket/Tickets?$filter=assignedTo eq '${foncId}'&$top=1`,
      withAuth()
    );
    expect(status).toBe(200);
    expect(data.value.length).toBeGreaterThanOrEqual(1);
    expect(data.value[0].assignedTo).toBe(foncId);
  });

  test('GET /Tickets returns seed tickets', async () => {
    const { status, data } = await GET('/odata/v4/ticket/Tickets?$top=5', withAuth());
    expect(status).toBe(200);
    expect(data.value.length).toBeGreaterThan(0);
  });

  test('GET /Tickets with $count returns inline count', async () => {
    const { status, data } = await GET('/odata/v4/ticket/Tickets?$count=true&$top=1', withAuth());
    expect(status).toBe(200);
    expect(typeof data['@odata.count']).toBe('number');
    expect(data['@odata.count']).toBeGreaterThan(0);
  });

  test('GET /Tickets by ID returns a single ticket', async () => {
    const ticketId = requireSeedId('anyTicketId');
    const { status, data } = await GET(`/odata/v4/ticket/Tickets('${ticketId}')`, withAuth());
    expect(status).toBe(200);
    expect(data.ID).toBe(ticketId);
    expect(data.title).toBeTruthy();
  });

  test('GET /Tickets with $filter by status works', async () => {
    const { status, data } = await GET(
      "/odata/v4/ticket/Tickets?$filter=status eq 'IN_PROGRESS'",
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
      projectId: requireSeedId('project1Id'),
      createdBy: requireSeedId('managerId'),
      title: 'Test ticket from integration test',
      nature: 'PROGRAMME',
      priority: 'LOW',
      description: 'Integration test ticket',
    };

    const { status, data } = await POST('/odata/v4/ticket/Tickets', payload, withAuth());
    expect(status).toBe(201);
    expect(data.ID).toBeTruthy();
    expect(data.ticketCode).toMatch(/^TK-\d{4}-[A-F0-9]{6}$/);
    expect(data.status).toBe('NEW');
    expect(data.title).toBe(payload.title);
    createdTicketId = data.ID;
  });

  test('CREATE /Tickets writes an audit log entry', async () => {
    expect(createdTicketId).toBeTruthy();
    const auditRow = await cds.db.run(
      SELECT.one
        .from('sap.performance.dashboard.db.AuditLogs')
        .where({ entityId: createdTicketId, action: 'CREATE' })
    );
    expect(auditRow).toBeTruthy();
    expect(auditRow.entityName).toBe('TicketService.Tickets');
  });

  test('PATCH /Tickets updates ticket status', async () => {
    expect(createdTicketId).toBeTruthy();
    const { status, data } = await PATCH(
      `/odata/v4/ticket/Tickets('${createdTicketId}')`,
      { status: 'IN_PROGRESS' },
      withAuth()
    );
    expect(status).toBe(200);
    expect(data.status).toBe('IN_PROGRESS');
  });

  test('POST /Tickets with missing required fields returns 400', async () => {
    try {
      await POST('/odata/v4/ticket/Tickets', { title: 'Missing fields' }, withAuth());
      fail('Should have thrown');
    } catch (err) {
      expect(err.response?.status ?? err.status).toBe(400);
    }
  });

  test('POST /Tickets with unknown projectId returns 400', async () => {
    try {
      await POST(
        '/odata/v4/ticket/Tickets',
        {
          projectId: 'nonexistent-project',
          createdBy: requireSeedId('managerId'),
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
    const { status, data } = await GET('/odata/v4/user/Users?$filter=active eq true', withAuth());
    expect(status).toBe(200);
    expect(data.value.length).toBeGreaterThanOrEqual(6);
  });

  test('GET /Users by ID returns a single user', async () => {
    const adminId = requireSeedId('adminId');
    const { status, data } = await GET(`/odata/v4/user/Users('${adminId}')`, withAuth());
    expect(status).toBe(200);
    expect(data.email).toBe('alice.admin@inetum.com');
  });
});

describe('Projects entity', () => {
  test('GET /Projects returns seed projects', async () => {
    const { status, data } = await GET('/odata/v4/core/Projects', withAuth());
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
      '/odata/v4/time/ImputationPeriods',
      {
        periodKey: `IT-${suffix}`,
        consultantId: requireSeedId('techId'),
        startDate: '2026-03-01',
        endDate: '2026-03-15',
      },
      withAuth()
    );
    return data;
  };

  test('POST /Imputations(id)/validate transitions DRAFT -> VALIDATED', async () => {
    const { data: list } = await GET('/odata/v4/time/Imputations?$top=1', withAuth());
    expect(list.value.length).toBeGreaterThan(0);
    const imp = list.value[0];

    // Only test if currently in a valid from-state
    if (['DRAFT', 'SUBMITTED', 'REJECTED'].includes(imp.validationStatus)) {
      const { status, data } = await POST(
        `/odata/v4/time/Imputations('${imp.ID}')/validate`,
        { validatedBy: requireSeedId('managerId') },
        withAuth()
      );
      expect(status).toBe(200);
      expect(data.validationStatus).toBe('VALIDATED');
    }
  });

  test('POST /ImputationPeriods(id)/submit transitions DRAFT -> SUBMITTED', async () => {
    const draftPeriod = await createDraftPeriod();
    const { status, data } = await POST(
      `/odata/v4/time/ImputationPeriods('${draftPeriod.ID}')/submit`,
      {},
      withAuth()
    );
    expect(status).toBe(200);
    expect(data.status).toBe('SUBMITTED');
  });

  test('POST /ImputationPeriods(id)/validate on SUBMITTED transitions to VALIDATED', async () => {
    const created = await createDraftPeriod();
    await POST(`/odata/v4/time/ImputationPeriods('${created.ID}')/submit`, {}, withAuth());

    const { status, data } = await POST(
      `/odata/v4/time/ImputationPeriods('${created.ID}')/validate`,
      { validatedBy: requireSeedId('managerId') },
      withAuth()
    );
    expect(status).toBe(200);
    expect(data.status).toBe('VALIDATED');
  });

  test('POST /ImputationPeriods(id)/submit on already SUBMITTED returns 409', async () => {
    const created = await createDraftPeriod();
    await POST(`/odata/v4/time/ImputationPeriods('${created.ID}')/submit`, {}, withAuth());

    try {
      await POST(
        `/odata/v4/time/ImputationPeriods('${created.ID}')/submit`,
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
      await GET('/odata/v4/ticket/Tickets');
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
      await PATCH(`/odata/v4/ticket/Tickets('${requireSeedId('newStatusTicketId')}')`, { status: 'DONE' }, withAuth());
      fail('Should have thrown');
    } catch (err) {
      expect(err.response?.status ?? err.status).toBe(409);
    }
  });

  test('Project delete with children returns 409', async () => {
    await ensureAdminAuth();
    try {
      await DELETE(`/odata/v4/core/Projects('${requireSeedId('project1Id')}')`, withAdminAuth());
      fail('Should have thrown');
    } catch (err) {
      expect(err.response?.status ?? err.status).toBe(409);
    }
  });

  test('User delete with references returns 409', async () => {
    await ensureAdminAuth();
    try {
      await DELETE(`/odata/v4/user/Users('${requireSeedId('managerId')}')`, withAdminAuth());
      fail('Should have thrown');
    } catch (err) {
      expect(err.response?.status ?? err.status).toBe(409);
    }
  });

  test('Imputation direct PATCH of validationStatus returns 403', async () => {
    try {
      await PATCH(
        `/odata/v4/time/Imputations('${requireSeedId('draftImputationId')}')`,
        { validationStatus: 'VALIDATED' },
        withAuth()
      );
      fail('Should have thrown');
    } catch (err) {
      expect(err.response?.status ?? err.status).toBe(403);
    }
  });

  test('ImputationPeriod direct PATCH of status returns 403', async () => {
    const periodSuffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    const { data: createdPeriod } = await POST(
      '/odata/v4/time/ImputationPeriods',
      {
        periodKey: `2026-03-GUARD-${periodSuffix}`,
        consultantId: requireSeedId('techId'),
        startDate: '2026-03-01',
        endDate: '2026-03-15',
      },
      withAuth()
    );

    try {
      await PATCH(
        `/odata/v4/time/ImputationPeriods('${createdPeriod.ID}')`,
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
        `/odata/v4/user/LeaveRequests('${requireSeedId('approvedLeaveId')}')`,
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
        '/odata/v4/user/Allocations',
        {
          userId: requireSeedId('techId'),
          projectId: requireSeedId('project1Id'),
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
        '/odata/v4/user/Allocations',
        {
          userId: 'u-unknown',
          projectId: requireSeedId('project1Id'),
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
      '/odata/v4/core/Wricefs',
      {
        projectId: requireSeedId('project2Id'),
        sourceFileName: 'cascade-test.xlsx',
      },
      withAuth()
    );
    expect(wricef.ID).toBeTruthy();

    await POST(
      '/odata/v4/core/WricefObjects',
      {
        wricefId: wricef.ID,
        projectId: requireSeedId('project2Id'),
        type: 'W',
        title: 'Cascade object 1',
      },
      withAuth()
    );
    await POST(
      '/odata/v4/core/WricefObjects',
      {
        wricefId: wricef.ID,
        projectId: requireSeedId('project2Id'),
        type: 'R',
        title: 'Cascade object 2',
      },
      withAuth()
    );

    const delRes = await DELETE(`/odata/v4/core/Wricefs('${wricef.ID}')`, withAuth());
    expect(delRes.status).toBe(204);

    const { data: remaining } = await GET(
      `/odata/v4/core/WricefObjects?$filter=wricefId eq '${wricef.ID}'`,
      withAuth()
    );
    expect(remaining.value.length).toBe(0);
  });

  test('ReferenceData duplicate type+code returns 409', async () => {
    await ensureAdminAuth();
    try {
      await POST(
        '/odata/v4/core/ReferenceData',
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
      await GET('/odata/v4/time/Evaluations?$top=1', withConsultantAuth());
      fail('Should have thrown');
    } catch (err) {
      expect(err.response?.status ?? err.status).toBe(403);
    }
  });

  test('DocumentationObjects PATCH auto-updates updatedAt', async () => {
    const { data: created } = await POST(
      '/odata/v4/core/DocumentationObjects',
      {
        title: 'Doc update test',
        description: 'Before update',
        type: 'GENERAL',
        projectId: requireSeedId('project1Id'),
        authorId: requireSeedId('techId'),
      },
      withAuth()
    );
    expect(created.updatedAt).toBeTruthy();

    await new Promise((resolve) => setTimeout(resolve, 1200));
    const { data: updated } = await PATCH(
      `/odata/v4/core/DocumentationObjects('${created.ID}')`,
      { description: 'After update' },
      withAuth()
    );
    expect(updated.updatedAt).toBeTruthy();
    expect(updated.updatedAt).not.toBe(created.updatedAt);
  });
});
