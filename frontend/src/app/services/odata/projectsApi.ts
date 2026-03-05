import type { Project } from './core';
import type { ODataQueryOptions, ODataRequestOptions } from './core';
import { listEntities, createEntity, updateEntity, deleteEntity, quoteLiteral } from './core';

interface ProjectRaw extends Omit<Project, 'techKeywords' | 'abaqueEstimate'> {
  techKeywords?: unknown;
  abaqueEstimate?: unknown;
}

const PROJECT_BASE_SELECT =
  'ID,name,projectType,managerId,startDate,endDate,status,priority,description,progress,complexity,documentation,createdAt,modifiedAt';

const parseJsonIfString = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const asRows = (value: unknown): unknown[] => {
  const parsed = parseJsonIfString(value);
  return Array.isArray(parsed) ? parsed : [];
};

const normalizeTechKeywords = (value: unknown): string[] =>
  asRows(value)
    .map((entry) => {
      if (typeof entry === 'string') return entry.trim();
      const candidate = asRecord(entry);
      if (!candidate) return '';
      return String(candidate.keyword ?? candidate.value ?? '').trim();
    })
    .filter((keyword) => keyword.length > 0);

const normalizeAbaqueEstimate = (value: unknown): Project['abaqueEstimate'] | undefined => {
  const parsed = parseJsonIfString(value);

  // Read direct array if passed directly via payload
  if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.nature) {
    return parsed as Project['abaqueEstimate'];
  }

  // Parse OData Composition (array of rows with details field)
  const rows = asRows(parsed);
  if (!rows.length) return undefined;

  // Since we overwrite the entire matrix as a single details JSON object inside the array, we get the last one
  const candidates: Array<Project['abaqueEstimate']> = rows
    .map((row) => {
      const record = asRecord(row);
      if (!record) return null;

      const details = parseJsonIfString(record.details ?? record.value ?? record);
      if (Array.isArray(details)) {
        return details as Project['abaqueEstimate'];
      }
      return null;
    })
    .filter((entry): entry is Project['abaqueEstimate'] => Boolean(entry));

  if (!candidates.length) return undefined;
  return candidates[candidates.length - 1];
};

const toKeywordRows = (value: unknown): Array<{ keyword: string }> =>
  normalizeTechKeywords(value).map((keyword) => ({ keyword }));

const toAbaqueEstimateRows = (value: unknown): Array<{ details: string }> => {
  const estimate = normalizeAbaqueEstimate(value);
  if (!estimate) return [];
  // Store the entire array in a single composition row for simplicity
  return [{ details: JSON.stringify(estimate) }];
};

const toProjectPayload = (project: Partial<Project>): Record<string, unknown> => {
  const payload: Record<string, unknown> = { ...project };

  if ('techKeywords' in project && project.techKeywords !== undefined) {
    payload.techKeywords = toKeywordRows(project.techKeywords);
  }
  if ('abaqueEstimate' in project && project.abaqueEstimate !== undefined) {
    payload.abaqueEstimate = toAbaqueEstimateRows(project.abaqueEstimate);
  }

  return payload;
};

const normalizeProject = (raw: ProjectRaw): Project => {
  // Exclude composition fields via destructure; normalized separately below
  const { techKeywords: _kw, abaqueEstimate: _ae, ...base } = raw;
  const techKeywords = normalizeTechKeywords(raw.techKeywords);
  const abaqueEstimate = normalizeAbaqueEstimate(raw.abaqueEstimate);
  return {
    ...base,
    ...(techKeywords.length ? { techKeywords } : {}),
    ...(abaqueEstimate ? { abaqueEstimate } : {}),
  };
};

const withMappedPayloadFallback = (project: Project, input: Partial<Project>): Project => {
  const withKeywords =
    input.techKeywords !== undefined && project.techKeywords === undefined
      ? { ...project, techKeywords: normalizeTechKeywords(input.techKeywords) }
      : project;
  if (input.abaqueEstimate !== undefined && withKeywords.abaqueEstimate === undefined) {
    return {
      ...withKeywords,
      abaqueEstimate: normalizeAbaqueEstimate(input.abaqueEstimate),
    };
  }
  return withKeywords;
};

const isMissingProjectCompositionTable = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  return /no such table: .*Project(TechKeywords|AbaqueEstimates)/i.test(error.message);
};

const listWithCompositionFallback = async (
  options?: ODataQueryOptions,
  requestOptions?: ODataRequestOptions
): Promise<Project[]> => {
  const mergedOptions: ODataQueryOptions = {
    ...options,
    $select: options?.$select ?? PROJECT_BASE_SELECT,
    $expand: options?.$expand ?? 'techKeywords,abaqueEstimate',
  };
  try {
    const rows = await listEntities<ProjectRaw>('core', 'Projects', mergedOptions, requestOptions, true);
    return rows.map(normalizeProject);
  } catch (error) {
    if (!isMissingProjectCompositionTable(error)) throw error;
    const legacyRows = await listEntities<ProjectRaw>('core', 'Projects',
      {
        ...options,
        $select: options?.$select ?? `${PROJECT_BASE_SELECT},techKeywords,abaqueEstimate`,
      },
      requestOptions,
      true
    );
    return legacyRows.map(normalizeProject);
  }
};

export const ProjectsAPI = {
  async list(
    options?: ODataQueryOptions,
    requestOptions?: ODataRequestOptions
  ): Promise<Project[]> {
    return await listWithCompositionFallback(options, requestOptions);
  },

  async getAll(requestOptions?: ODataRequestOptions): Promise<Project[]> {
    return await ProjectsAPI.list(undefined, requestOptions);
  },

  async getById(id: string, requestOptions?: ODataRequestOptions): Promise<Project | null> {
    const rows = await ProjectsAPI.list(
      {
        $filter: `ID eq ${quoteLiteral(id)}`,
        $top: 1,
      },
      requestOptions
    );
    return rows[0] ?? null;
  },

  async create(
    project: Omit<Project, 'id'>,
    requestOptions?: ODataRequestOptions
  ): Promise<Project> {
    const created = await createEntity<ProjectRaw>('core', 'Projects',
      toProjectPayload(project),
      requestOptions
    );
    return withMappedPayloadFallback(normalizeProject(created), project);
  },

  async update(
    id: string,
    project: Partial<Project>,
    requestOptions?: ODataRequestOptions
  ): Promise<Project> {
    const updated = await updateEntity<ProjectRaw>('core', 'Projects',
      id,
      toProjectPayload(project),
      requestOptions
    );
    return withMappedPayloadFallback(normalizeProject(updated), project);
  },

  async delete(id: string, requestOptions?: ODataRequestOptions): Promise<void> {
    await deleteEntity('core', 'Projects', id, requestOptions);
  },
};
