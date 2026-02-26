import type { ImputationPeriod } from './core';
import type { ODataQueryOptions, ODataRequestOptions } from './core';
import { listEntities, createEntity, updateEntity, odataFetch, entityPath, normalizeEntityRecord, quoteLiteral } from './core';

export const ImputationPeriodsAPI = {
  async list(
    options?: ODataQueryOptions,
    requestOptions?: ODataRequestOptions
  ): Promise<ImputationPeriod[]> {
    return await listEntities<ImputationPeriod>('ImputationPeriods', options, requestOptions, true);
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
    return await createEntity<ImputationPeriod>('ImputationPeriods', period, requestOptions);
  },

  async update(
    id: string,
    data: Partial<ImputationPeriod>,
    requestOptions?: ODataRequestOptions
  ): Promise<ImputationPeriod> {
    return await updateEntity<ImputationPeriod>('ImputationPeriods', id, data, requestOptions);
  },

  async submit(id: string, requestOptions?: ODataRequestOptions): Promise<ImputationPeriod> {
    const data = await odataFetch<ImputationPeriod>(`${entityPath('ImputationPeriods', id)}/submit`, {
      ...requestOptions,
      method: 'POST',
    });
    return normalizeEntityRecord(data);
  },

  async validate(
    id: string,
    validatedBy: string,
    requestOptions?: ODataRequestOptions
  ): Promise<ImputationPeriod> {
    const data = await odataFetch<ImputationPeriod>(`${entityPath('ImputationPeriods', id)}/validate`, {
      ...requestOptions,
      method: 'POST',
      body: JSON.stringify({ validatedBy }),
    });
    return normalizeEntityRecord(data);
  },

  async sendToStraTIME(
    id: string,
    sentBy: string,
    requestOptions?: ODataRequestOptions
  ): Promise<ImputationPeriod> {
    const data = await odataFetch<ImputationPeriod>(`${entityPath('ImputationPeriods', id)}/sendToStraTIME`, {
      ...requestOptions,
      method: 'POST',
      body: JSON.stringify({ sentBy }),
    });
    return normalizeEntityRecord(data);
  },

  async reject(
    id: string,
    validatedBy: string,
    requestOptions?: ODataRequestOptions
  ): Promise<ImputationPeriod> {
    const data = await odataFetch<ImputationPeriod>(`${entityPath('ImputationPeriods', id)}/reject`, {
      ...requestOptions,
      method: 'POST',
      body: JSON.stringify({ validatedBy }),
    });
    return normalizeEntityRecord(data);
  },
};
