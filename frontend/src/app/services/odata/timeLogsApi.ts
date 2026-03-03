import type { TimeLog } from './core';
import type { ODataQueryOptions, ODataRequestOptions } from './core';
import { listEntities, createEntity, updateEntity, odataFetch, entityPath, normalizeEntityRecord, quoteLiteral } from './core';

export const TimeLogsAPI = {
  async list(
    options?: ODataQueryOptions,
    requestOptions?: ODataRequestOptions
  ): Promise<TimeLog[]> {
    return await listEntities<TimeLog>('time', 'TimeLogs', options, requestOptions, true);
  },

  async getAll(requestOptions?: ODataRequestOptions): Promise<TimeLog[]> {
    return await TimeLogsAPI.list(undefined, requestOptions);
  },

  async getByConsultant(
    consultantId: string,
    requestOptions?: ODataRequestOptions
  ): Promise<TimeLog[]> {
    return await TimeLogsAPI.list(
      {
        $filter: `consultantId eq ${quoteLiteral(consultantId)}`,
      },
      requestOptions
    );
  },

  async getByTicket(ticketId: string, requestOptions?: ODataRequestOptions): Promise<TimeLog[]> {
    return await TimeLogsAPI.list(
      {
        $filter: `ticketId eq ${quoteLiteral(ticketId)}`,
      },
      requestOptions
    );
  },

  async create(timeLog: Omit<TimeLog, 'id'>, requestOptions?: ODataRequestOptions): Promise<TimeLog> {
    return await createEntity<TimeLog>('time', 'TimeLogs', timeLog, requestOptions);
  },

  async update(
    id: string,
    data: Partial<TimeLog>,
    requestOptions?: ODataRequestOptions
  ): Promise<TimeLog> {
    return await updateEntity<TimeLog>('time', 'TimeLogs', id, data, requestOptions);
  },

  async sendToStraTIME(id: string, requestOptions?: ODataRequestOptions): Promise<TimeLog> {
    const data = await odataFetch<TimeLog>('time', `${entityPath('TimeLogs', id)}/sendToStraTIME`, {
      ...requestOptions,
      method: 'POST',
    });
    if (!data) throw new Error(`sendToStraTIME returned no data for TimeLog '${id}'`);
    return normalizeEntityRecord(data);
  },
};
