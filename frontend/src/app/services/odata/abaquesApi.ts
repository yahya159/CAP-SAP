import type { Abaque } from './core';
import type { ODataQueryOptions, ODataRequestOptions } from './core';
import { listEntities, quoteLiteral } from './core';

interface AbaqueEntryRaw {
  ticketNature?: unknown;
  complexity?: unknown;
  standardHours?: unknown;
  type?: unknown;
  field?: unknown;
  value?: unknown;
}

interface AbaqueRaw {
  id?: unknown;
  name?: unknown;
  entries?: unknown;
}

const parseJsonIfString = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (!(trimmed.startsWith('[') || trimmed.startsWith('{'))) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

const normalizeEntries = (value: unknown): Abaque['entries'] => {
  const parsed = parseJsonIfString(value);
  const source = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as { value?: unknown }).value)
      ? (parsed as { value: unknown[] }).value
      : [];

  return source
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const candidate = entry as AbaqueEntryRaw;
      const ticketNature = String(candidate.ticketNature ?? candidate.type ?? '').trim().toUpperCase();
      const complexity = String(candidate.complexity ?? candidate.field ?? '').trim().toUpperCase();
      const standardHours = Number(candidate.standardHours ?? candidate.value);
      if (!ticketNature) return null;
      if (complexity !== 'LOW' && complexity !== 'MEDIUM' && complexity !== 'HIGH') return null;
      if (!Number.isFinite(standardHours)) return null;

      return {
        ticketNature: ticketNature as Abaque['entries'][number]['ticketNature'],
        complexity,
        standardHours,
      };
    })
    .filter((entry): entry is Abaque['entries'][number] => Boolean(entry));
};

const normalizeAbaque = (entry: AbaqueRaw): Abaque => ({
  id: String(entry.id ?? ''),
  name: String(entry.name ?? ''),
  entries: normalizeEntries(entry.entries),
});

const ABAQUE_BASE_SELECT = 'ID,name';

const isMissingAbaqueEntriesTable = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  return /no such table: .*AbaqueEntries/i.test(error.message);
};

export const AbaquesAPI = {
  async list(
    options?: ODataQueryOptions,
    requestOptions?: ODataRequestOptions
  ): Promise<Abaque[]> {
    try {
      const rows = await listEntities<AbaqueRaw>(
        'Abaques',
        {
          ...options,
          $select: options?.$select ?? ABAQUE_BASE_SELECT,
          // Ensure composition data is loaded on CAP models where entries are child rows.
          $expand: options?.$expand ?? 'entries',
        },
        requestOptions,
        true
      );
      return rows.map(normalizeAbaque);
    } catch (error) {
      if (!isMissingAbaqueEntriesTable(error)) throw error;
      const legacyRows = await listEntities<AbaqueRaw>(
        'Abaques',
        {
          ...options,
          $select: options?.$select ?? `${ABAQUE_BASE_SELECT},entries`,
        },
        requestOptions,
        true
      );
      return legacyRows.map(normalizeAbaque);
    }
  },

  async getAll(requestOptions?: ODataRequestOptions): Promise<Abaque[]> {
    return await AbaquesAPI.list(undefined, requestOptions);
  },

  async getById(id: string, requestOptions?: ODataRequestOptions): Promise<Abaque | null> {
    const rows = await AbaquesAPI.list(
      {
        $filter: `ID eq ${quoteLiteral(id)}`,
        $top: 1,
      },
      requestOptions
    );
    return rows[0] ?? null;
  },
};
