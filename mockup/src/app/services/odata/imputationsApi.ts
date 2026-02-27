import type { Imputation } from './core';
import type { ODataQueryOptions, ODataRequestOptions } from './core';
import { listEntities, createEntity, updateEntity, deleteEntity, odataFetch, entityPath, normalizeEntityRecord, quoteLiteral } from './core';

export const ImputationsAPI = {
  async list(
    options?: ODataQueryOptions,
    requestOptions?: ODataRequestOptions
  ): Promise<Imputation[]> {
    return await listEntities<Imputation>('Imputations', options, requestOptions, true);
  },

  async getAll(requestOptions?: ODataRequestOptions): Promise<Imputation[]> {
    return await ImputationsAPI.list(undefined, requestOptions);
  },

  async getByConsultant(
    consultantId: string,
    requestOptions?: ODataRequestOptions
  ): Promise<Imputation[]> {
    return await ImputationsAPI.list(
      {
        $filter: `consultantId eq ${quoteLiteral(consultantId)}`,
      },
      requestOptions
    );
  },

  async getByPeriod(periodKey: string, requestOptions?: ODataRequestOptions): Promise<Imputation[]> {
    return await ImputationsAPI.list(
      {
        $filter: `periodKey eq ${quoteLiteral(periodKey)}`,
      },
      requestOptions
    );
  },

  async create(
    imputation: Omit<Imputation, 'id' | 'createdAt'>,
    requestOptions?: ODataRequestOptions
  ): Promise<Imputation> {
    return await createEntity<Imputation>('Imputations', imputation, requestOptions);
  },

  async update(
    id: string,
    data: Partial<Imputation>,
    requestOptions?: ODataRequestOptions
  ): Promise<Imputation> {
    return await updateEntity<Imputation>('Imputations', id, data, requestOptions);
  },

  async delete(id: string, requestOptions?: ODataRequestOptions): Promise<void> {
    await deleteEntity('Imputations', id, requestOptions);
  },

  async validate(
    id: string,
    validatedBy: string,
    requestOptions?: ODataRequestOptions
  ): Promise<Imputation> {
    const data = await odataFetch<Imputation>(`${entityPath('Imputations', id)}/validate`, {
      ...requestOptions,
      method: 'POST',
      body: JSON.stringify({ validatedBy }),
    });
    if (!data) throw new Error(`validate returned no data for Imputation '${id}'`);
    return normalizeEntityRecord(data);
  },

  async reject(
    id: string,
    validatedBy: string,
    requestOptions?: ODataRequestOptions
  ): Promise<Imputation> {
    const data = await odataFetch<Imputation>(`${entityPath('Imputations', id)}/reject`, {
      ...requestOptions,
      method: 'POST',
      body: JSON.stringify({ validatedBy }),
    });
    if (!data) throw new Error(`reject returned no data for Imputation '${id}'`);
    return normalizeEntityRecord(data);
  },
};
