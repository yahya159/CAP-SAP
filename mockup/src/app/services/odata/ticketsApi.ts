import type { Ticket } from './core';
import type { ODataQueryOptions, ODataRequestOptions } from './core';
import { listEntities, getEntityById, createEntity, updateEntity, quoteLiteral } from './core';

export const TicketsAPI = {
  async list(
    options?: ODataQueryOptions,
    requestOptions?: ODataRequestOptions
  ): Promise<Ticket[]> {
    return await listEntities<Ticket>('Tickets', options, requestOptions, true);
  },

  async getAll(requestOptions?: ODataRequestOptions): Promise<Ticket[]> {
    return await TicketsAPI.list(undefined, requestOptions);
  },

  async getByProject(projectId: string, requestOptions?: ODataRequestOptions): Promise<Ticket[]> {
    return await TicketsAPI.list(
      {
        $filter: `projectId eq ${quoteLiteral(projectId)}`,
      },
      requestOptions
    );
  },

  async getById(id: string, requestOptions?: ODataRequestOptions): Promise<Ticket | null> {
    return await getEntityById<Ticket>('Tickets', id, requestOptions);
  },

  async create(
    ticket: Omit<Ticket, 'id' | 'createdAt' | 'ticketCode'>,
    requestOptions?: ODataRequestOptions
  ): Promise<Ticket> {
    return await createEntity<Ticket>('Tickets', ticket, requestOptions);
  },

  async update(
    id: string,
    ticket: Partial<Ticket>,
    requestOptions?: ODataRequestOptions
  ): Promise<Ticket> {
    return await updateEntity<Ticket>('Tickets', id, ticket, requestOptions);
  },
};
