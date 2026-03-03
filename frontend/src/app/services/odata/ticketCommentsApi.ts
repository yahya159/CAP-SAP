import type { TicketComment } from '../../types/entities';
import type { ODataQueryOptions, ODataRequestOptions } from './core';
import {
  listEntities,
  createEntity,
  updateEntity,
  quoteLiteral,
  normalizeEntityRecord,
} from './core';

export const TicketCommentsAPI = {
  async list(
    options?: ODataQueryOptions,
    requestOptions?: ODataRequestOptions
  ): Promise<TicketComment[]> {
    return await listEntities<TicketComment>('ticket', 'TicketComments', options, requestOptions, true);
  },

  async getByTicket(
    ticketId: string,
    requestOptions?: ODataRequestOptions
  ): Promise<TicketComment[]> {
    return await TicketCommentsAPI.list(
      {
        $filter: `ticketId eq ${quoteLiteral(ticketId)}`,
        $orderby: 'createdAt asc',
      },
      requestOptions
    );
  },

  async create(
    comment: Omit<TicketComment, 'id' | 'createdAt' | 'updatedAt'>,
    requestOptions?: ODataRequestOptions
  ): Promise<TicketComment> {
    return await createEntity<TicketComment>('ticket', 'TicketComments', comment, requestOptions);
  },

  async resolve(
    id: string,
    resolved: boolean,
    requestOptions?: ODataRequestOptions
  ): Promise<TicketComment> {
    const data = await updateEntity<TicketComment>('ticket', 'TicketComments',
      id,
      { resolved },
      requestOptions
    );
    return normalizeEntityRecord(data);
  },
};
