import type { User } from './core';
import type { ODataQueryOptions, ODataRequestOptions } from './core';
import { listEntities, getEntityById, createEntity, updateEntity, deleteEntity, quoteLiteral } from './core';

export const UsersAPI = {
  async list(
    options?: ODataQueryOptions,
    requestOptions?: ODataRequestOptions
  ): Promise<User[]> {
    return await listEntities<User>('Users', options, requestOptions, true);
  },

  async getAll(requestOptions?: ODataRequestOptions): Promise<User[]> {
    return await UsersAPI.list(undefined, requestOptions);
  },

  async getActive(requestOptions?: ODataRequestOptions): Promise<User[]> {
    return await UsersAPI.list(
      {
        $filter: 'active eq true',
      },
      requestOptions
    );
  },

  async getByEmail(
    email: string,
    requestOptions?: ODataRequestOptions
  ): Promise<User | null> {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return null;
    const normalizedEmail = trimmedEmail.toLowerCase();

    const exactMatch = await listEntities<User>(
      'Users',
      {
        $filter: `active eq true and email eq ${quoteLiteral(trimmedEmail)}`,
        $top: 1,
      },
      requestOptions
    );
    if (exactMatch[0]) return exactMatch[0];

    if (normalizedEmail !== trimmedEmail) {
      const normalizedMatch = await listEntities<User>(
        'Users',
        {
          $filter: `active eq true and email eq ${quoteLiteral(normalizedEmail)}`,
          $top: 1,
        },
        requestOptions
      );
      if (normalizedMatch[0]) return normalizedMatch[0];
    }

    try {
      const caseInsensitiveMatch = await listEntities<User>(
        'Users',
        {
          $filter: `active eq true and tolower(email) eq ${quoteLiteral(normalizedEmail)}`,
          $top: 1,
        },
        requestOptions
      );
      return caseInsensitiveMatch[0] ?? null;
    } catch {
      return null;
    }
  },

  async getById(id: string, requestOptions?: ODataRequestOptions): Promise<User | null> {
    return await getEntityById<User>('Users', id, requestOptions);
  },

  async create(user: Omit<User, 'id'>, requestOptions?: ODataRequestOptions): Promise<User> {
    return await createEntity<User>('Users', user, requestOptions);
  },

  async update(
    id: string,
    user: Partial<User>,
    requestOptions?: ODataRequestOptions
  ): Promise<User> {
    return await updateEntity<User>('Users', id, user, requestOptions);
  },

  async delete(id: string, requestOptions?: ODataRequestOptions): Promise<void> {
    await deleteEntity('Users', id, requestOptions);
  },
};
