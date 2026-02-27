import type { DocumentationObject, Ticket, Wricef, WricefObject } from './core';
import type { ODataQueryOptions, ODataRequestOptions } from './core';
import { listEntities, getEntityById, createEntity, updateEntity, deleteEntity, quoteLiteral } from './core';
import { TicketsAPI } from './ticketsApi';

// ---------------------------------------------------------------------------
// WRICEF sync helpers
// ---------------------------------------------------------------------------

const WRICEF_SOURCE_PREFIX = 'wricef-object:';

const normalizeText = (value?: string | null): string => (value ?? '').trim().toLowerCase();
const normalizeRef = (value?: string | null): string =>
  normalizeText(value).replace(/[^a-z0-9_-]/g, '');

const isTicketLinkedToWricefObject = (ticketRef?: string | null, objectRef?: string | null): boolean => {
  const normalizedTicket = normalizeRef(ticketRef);
  const normalizedObject = normalizeRef(objectRef);
  if (!normalizedTicket || !normalizedObject) return false;
  const compactTicket = normalizedTicket.replace(/[^a-z0-9]/g, '');
  const compactObject = normalizedObject.replace(/[^a-z0-9]/g, '');
  return (
    normalizedTicket === normalizedObject ||
    normalizedTicket.startsWith(`${normalizedObject}-tk-`) ||
    compactTicket === compactObject ||
    compactTicket.startsWith(`${compactObject}tk`)
  );
};

const buildWricefObjectContent = (object: WricefObject): string => {
  return [
    `# ${object.type} Object - ${object.id}`,
    '',
    '## Title',
    object.title,
    '',
    '## Description',
    object.description || '-',
    '',
    '## Complexity',
    object.complexity,
    '',
    '## Module',
    object.module,
  ].join('\n');
};

const resolveWricefLinkedTicketIds = (
  projectTickets: Ticket[],
  wricefObject: WricefObject
): string[] => {
  return projectTickets
    .filter((t) => isTicketLinkedToWricefObject(t.wricefId, wricefObject.id))
    .map((t) => t.id);
};

// ---------------------------------------------------------------------------
// DocumentationAPI
// ---------------------------------------------------------------------------

export const DocumentationAPI = {
  async list(
    options?: ODataQueryOptions,
    requestOptions?: ODataRequestOptions
  ): Promise<DocumentationObject[]> {
    return await listEntities<DocumentationObject>(
      'DocumentationObjects',
      options,
      requestOptions,
      true
    );
  },

  async getAll(requestOptions?: ODataRequestOptions): Promise<DocumentationObject[]> {
    return await DocumentationAPI.list(undefined, requestOptions);
  },

  async getByProject(
    projectId: string,
    requestOptions?: ODataRequestOptions
  ): Promise<DocumentationObject[]> {
    return await DocumentationAPI.list(
      {
        $filter: `projectId eq ${quoteLiteral(projectId)}`,
      },
      requestOptions
    );
  },

  async getById(
    id: string,
    requestOptions?: ODataRequestOptions
  ): Promise<DocumentationObject | null> {
    return await getEntityById<DocumentationObject>('DocumentationObjects', id, requestOptions);
  },

  async getByTicketId(
    ticketId: string,
    requestOptions?: ODataRequestOptions
  ): Promise<DocumentationObject[]> {
    return await DocumentationAPI.list(
      {
        $filter: `contains(relatedTicketIds,${quoteLiteral(ticketId)})`,
      },
      requestOptions
    );
  },

  async create(
    documentation: Omit<DocumentationObject, 'id' | 'createdAt' | 'updatedAt'>,
    requestOptions?: ODataRequestOptions
  ): Promise<DocumentationObject> {
    return await createEntity<DocumentationObject>(
      'DocumentationObjects',
      documentation,
      requestOptions
    );
  },

  async update(
    id: string,
    data: Partial<DocumentationObject>,
    requestOptions?: ODataRequestOptions
  ): Promise<DocumentationObject> {
    return await updateEntity<DocumentationObject>('DocumentationObjects', id, data, requestOptions);
  },

  async delete(id: string, requestOptions?: ODataRequestOptions): Promise<void> {
    await deleteEntity('DocumentationObjects', id, requestOptions);
  },

  async syncProjectWricef(
    projectId: string,
    wricef: Wricef,
    wricefObjects: WricefObject[],
    actorId: string
  ): Promise<{ created: number; updated: number; deleted: number; total: number }> {
    const docsForProject = (
      await DocumentationAPI.getByProject(projectId)
    ).filter((doc) => doc.sourceSystem === 'WRICEF');

    const docBySourceRef = new Map<string, DocumentationObject>();
    docsForProject.forEach((doc) => {
      if (doc.sourceRefId) docBySourceRef.set(doc.sourceRefId, doc);
    });

    const projectTickets = await TicketsAPI.getByProject(projectId);

    let created = 0;
    let updated = 0;
    let deleted = 0;
    const activeSourceRefs = new Set<string>();

    for (const wricefObject of wricefObjects) {
      const sourceRefId = `${WRICEF_SOURCE_PREFIX}${projectId}:${wricefObject.id}`;
      activeSourceRefs.add(sourceRefId);
      const linkedTicketIds = resolveWricefLinkedTicketIds(projectTickets, wricefObject);

      const docPayload: Omit<DocumentationObject, 'id' | 'createdAt' | 'updatedAt'> = {
        title: wricefObject.title || wricefObject.id,
        description:
          wricefObject.description ||
          `WRICEF object ${wricefObject.id} imported from ${wricef.sourceFileName}`,
        type: 'GENERAL',
        content: buildWricefObjectContent(wricefObject),
        attachedFiles: [],
        relatedTicketIds: linkedTicketIds,
        projectId,
        authorId: actorId,
        sourceSystem: 'WRICEF',
        sourceRefId,
      };

      const existingDoc = docBySourceRef.get(sourceRefId);
      if (existingDoc) {
        await DocumentationAPI.update(existingDoc.id, docPayload);
        updated += 1;
      } else {
        await DocumentationAPI.create(docPayload);
        created += 1;
      }
    }

    const staleDocs = docsForProject.filter((doc) => doc.sourceRefId && !activeSourceRefs.has(doc.sourceRefId));
    for (const staleDoc of staleDocs) {
      await DocumentationAPI.delete(staleDoc.id);
      deleted += 1;
    }

    return {
      created,
      updated,
      deleted,
      total: wricefObjects.length,
    };
  },
};
