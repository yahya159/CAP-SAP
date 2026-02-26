import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AuthAPI,
  DocumentationAPI,
  ImputationPeriodsAPI,
  ImputationsAPI,
  TimeLogsAPI,
  TicketsAPI,
  UsersAPI,
} from './odataClient';

const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status >= 200 && status < 300 ? 'OK' : 'ERROR',
  text: async () => JSON.stringify(body),
});

describe('CAP contract smoke', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('calls Users by email using server filter', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        value: [
          {
            id: 'u-1',
            name: 'User One',
            email: 'user.one@corp.test',
            role: 'MANAGER',
            active: true,
            skills: [],
            certifications: [],
            availabilityPercent: 100,
          },
        ],
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await UsersAPI.getByEmail('user.one@corp.test');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(fetchMock.mock.calls[0][0], 'https://local.test');
    expect(url.pathname).toBe('/odata/v4/performance/Users');
    expect(url.searchParams.get('$filter')).toContain("active eq true");
    expect(url.searchParams.get('$filter')).toContain("email eq 'user.one@corp.test'");
  });

  it('authenticates through backend action endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        ID: 'u-1',
        name: 'User One',
        email: 'user.one@corp.test',
        role: 'MANAGER',
        active: true,
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const user = await AuthAPI.authenticate('user.one@corp.test', 'Secret#1');
    expect(user?.id).toBe('u-1');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/odata/v4/performance/authenticate');
    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    expect(requestInit.method).toBe('POST');
    expect(requestInit.body).toBe(
      JSON.stringify({ email: 'user.one@corp.test', password: 'Secret#1' })
    );
  });

  it('queries ticket and documentation entity sets with project scoped filters', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ value: [] }))
      .mockResolvedValueOnce(jsonResponse({ value: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await TicketsAPI.getByProject('p-123');
    await DocumentationAPI.getByProject('p-123');

    const ticketsUrl = new URL(fetchMock.mock.calls[0][0], 'https://local.test');
    expect(ticketsUrl.pathname).toBe('/odata/v4/performance/Tickets');
    expect(ticketsUrl.searchParams.get('$filter')).toBe("projectId eq 'p-123'");

    const docsUrl = new URL(fetchMock.mock.calls[1][0], 'https://local.test');
    expect(docsUrl.pathname).toBe('/odata/v4/performance/DocumentationObjects');
    expect(docsUrl.searchParams.get('$filter')).toBe("projectId eq 'p-123'");
  });

  it('invokes Imputations action endpoints with expected payloads', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ ID: 'imp-1' }))
      .mockResolvedValueOnce(jsonResponse({ ID: 'imp-1' }));
    vi.stubGlobal('fetch', fetchMock);

    const validated = await ImputationsAPI.validate('imp-1', 'manager-1');
    const rejected = await ImputationsAPI.reject('imp-1', 'manager-1');

    expect(validated.id).toBe('imp-1');
    expect(rejected.id).toBe('imp-1');

    expect(fetchMock.mock.calls[0][0]).toBe('/odata/v4/performance/Imputations(\'imp-1\')/validate');
    expect(fetchMock.mock.calls[1][0]).toBe('/odata/v4/performance/Imputations(\'imp-1\')/reject');

    const validateInit = fetchMock.mock.calls[0][1] as RequestInit;
    const rejectInit = fetchMock.mock.calls[1][1] as RequestInit;
    expect(validateInit.method).toBe('POST');
    expect(rejectInit.method).toBe('POST');
    expect(validateInit.body).toBe(JSON.stringify({ validatedBy: 'manager-1' }));
    expect(rejectInit.body).toBe(JSON.stringify({ validatedBy: 'manager-1' }));
  });

  it('invokes StraTIME action endpoints', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ ID: 'log-1' }))
      .mockResolvedValueOnce(jsonResponse({ ID: 'period-1' }));
    vi.stubGlobal('fetch', fetchMock);

    const log = await TimeLogsAPI.sendToStraTIME('log-1');
    const period = await ImputationPeriodsAPI.sendToStraTIME('period-1', 'manager-1');

    expect(log.id).toBe('log-1');
    expect(period.id).toBe('period-1');

    expect(fetchMock.mock.calls[0][0]).toBe('/odata/v4/performance/TimeLogs(\'log-1\')/sendToStraTIME');
    expect(fetchMock.mock.calls[1][0]).toBe('/odata/v4/performance/ImputationPeriods(\'period-1\')/sendToStraTIME');

    const periodInit = fetchMock.mock.calls[1][1] as RequestInit;
    expect(periodInit.method).toBe('POST');
    expect(periodInit.body).toBe(JSON.stringify({ sentBy: 'manager-1' }));
  });
});
