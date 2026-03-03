import type { ImputationPeriod } from './core';
import type { ODataQueryOptions, ODataRequestOptions } from './core';
import { listEntities, createEntity, updateEntity, odataFetch, entityPath, normalizeEntityRecord, quoteLiteral } from './core';

export const ImputationPeriodsAPI = {
  async list(
    options?: ODataQueryOptions,
    requestOptions?: ODataRequestOptions
  ): Promise<ImputationPeriod[]> {
    return await listEntities<ImputationPeriod>('time', 'ImputationPeriods', options, requestOptions, true);
  },

  async getAll(requestOptions?: ODataRequestOptions): Promise<ImputationPeriod[]> {
    return await ImputationPeriodsAPI.list(undefined, requestOptions);
  },

  async getByConsultant(
    consultantId: string,
    requestOptions?: ODataRequestOptions
  ): Promise<ImputationPeriod[]> {
    return await ImputationPeriodsAPI.list(
      {
        $filter: `consultantId eq ${quoteLiteral(consultantId)}`,
      },
      requestOptions
    );
  },

  async create(
    period: Omit<ImputationPeriod, 'id'>,
    requestOptions?: ODataRequestOptions
  ): Promise<ImputationPeriod> {
    return await createEntity<ImputationPeriod>('time', 'ImputationPeriods', period, requestOptions);
  },

  async update(
    id: string,
    data: Partial<ImputationPeriod>,
    requestOptions?: ODataRequestOptions
  ): Promise<ImputationPeriod> {
    return await updateEntity<ImputationPeriod>('time', 'ImputationPeriods', id, data, requestOptions);
  },

  async submit(id: string, requestOptions?: ODataRequestOptions): Promise<ImputationPeriod> {
    const data = await odataFetch<ImputationPeriod>('time', `${entityPath('ImputationPeriods', id)}/submit`, {
      ...requestOptions,
      method: 'POST',
    });
    if (!data) throw new Error(`submit returned no data for ImputationPeriod '${id}'`);
    return normalizeEntityRecord(data);
  },

  async validate(
    id: string,
    validatedBy: string,
    requestOptions?: ODataRequestOptions
  ): Promise<ImputationPeriod> {
    const data = await odataFetch<ImputationPeriod>('time', `${entityPath('ImputationPeriods', id)}/validate`, {
      ...requestOptions,
      method: 'POST',
      body: JSON.stringify({ validatedBy }),
    });
    if (!data) throw new Error(`validate returned no data for ImputationPeriod '${id}'`);
    return normalizeEntityRecord(data);
  },

  async sendToStraTIME(
    id: string,
    sentBy: string,
    requestOptions?: ODataRequestOptions
  ): Promise<ImputationPeriod> {
    const data = await odataFetch<ImputationPeriod>('time', `${entityPath('ImputationPeriods', id)}/sendToStraTIME`, {
      ...requestOptions,
      method: 'POST',
      body: JSON.stringify({ sentBy }),
    });
    if (!data) throw new Error(`sendToStraTIME returned no data for ImputationPeriod '${id}'`);
    return normalizeEntityRecord(data);
  },

  async rejectEntry(
    id: string,
    validatedBy: string,
    requestOptions?: ODataRequestOptions
  ): Promise<ImputationPeriod> {
    const data = await odataFetch<ImputationPeriod>('time', `${entityPath('ImputationPeriods', id)}/rejectEntry`, {
      ...requestOptions,
      method: 'POST',
      body: JSON.stringify({ validatedBy }),
    });
    if (!data) throw new Error(`rejectEntry returned no data for ImputationPeriod '${id}'`);
    return normalizeEntityRecord(data);
  },
};
