import { afterEach, describe, expect, it, vi } from 'vitest';
import { UsersAPI, fetchNextPage, listAllPages, listEntitiesPage } from './odataClient';

describe('odataClient pagination', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('parses relative @odata.nextLink values and preserves paging metadata', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          value: [{ id: 't-1' }],
          '@odata.nextLink': 'Tickets?$skiptoken=next',
          '@odata.count': 42,
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const page = await fetchNextPage<{ id: string }>('Tickets?$skiptoken=abc');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/odata/v4/performance/Tickets?$skiptoken=abc');
    expect(page.items).toEqual([{ id: 't-1' }]);
    expect(page.nextLink).toBe('Tickets?$skiptoken=next');
    expect(page.count).toBe(42);
  });

  it('loads all pages by following @odata.nextLink', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('$skiptoken=next')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              value: [{ id: 't-2' }],
              '@odata.count': 2,
            }),
        });
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            value: [{ id: 't-1' }],
            '@odata.nextLink': 'Tickets?$skiptoken=next',
            '@odata.count': 2,
          }),
      });
    });

    vi.stubGlobal('fetch', fetchMock);

    const result = await listAllPages<{ id: string }>('Tickets', { $top: 1 });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.items).toEqual([{ id: 't-1' }, { id: 't-2' }]);
    expect(result.count).toBe(2);
    expect(result.nextLink).toBeUndefined();
  });

  it('normalizes CAP/OData nested error payloads', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () =>
          JSON.stringify({
            error: {
              code: 'VALIDATION_ERROR',
              message: { value: 'Validation failed' },
              details: [
                {
                  code: 'E_REQUIRED',
                  message: 'field is required',
                  target: 'title',
                },
              ],
              innererror: {
                errordetails: [
                  {
                    code: 'E_TECH',
                    message: { value: 'technical issue' },
                  },
                ],
              },
            },
          }),
      })
    );

    await expect(listEntitiesPage('Users', { $top: 1 })).rejects.toMatchObject({
      name: 'ODataClientError',
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: [
        {
          code: 'E_REQUIRED',
          message: 'field is required',
          target: 'title',
        },
        {
          code: 'E_TECH',
          message: 'technical issue',
        },
      ],
    });
  });

  it('normalizes CAP managed keys from ID/modifiedAt to id/updatedAt', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            value: [
              {
                ID: 'u-1',
                email: 'user.one@corp.test',
                active: true,
                modifiedAt: '2026-02-25T00:00:00Z',
              },
            ],
          }),
      })
    );

    const users = await UsersAPI.list({ $top: 1 });
    expect(users[0]).toMatchObject({
      id: 'u-1',
      updatedAt: '2026-02-25T00:00:00Z',
    });
  });
});
