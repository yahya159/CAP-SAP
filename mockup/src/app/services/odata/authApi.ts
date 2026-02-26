import type { User } from './core';
import type { ODataSingleResponse, ODataRequestOptions } from './core';
import { odataFetch, unwrapSingle } from './core';

export const AuthAPI = {
  async authenticate(
    email: string,
    password: string,
    requestOptions?: ODataRequestOptions
  ): Promise<User | null> {
    const data = await odataFetch<User | ODataSingleResponse<User> | undefined>('/authenticate', {
      ...requestOptions,
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password }),
    });
    return unwrapSingle(data);
  },
};
