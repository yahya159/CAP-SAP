import type { User } from './core';
import type { ODataRequestOptions } from './core';
import { normalizeEntityRecord, odataFetch } from './core';

export interface AuthSession {
  token: string;
  expiresAt: string;
  user: User;
}

export interface QuickAccessAccount {
  id: string;
  name: string;
  email: string;
  role: User['role'];
}

interface AuthSessionResponse {
  token: string;
  expiresAt: string;
  user: User;
}

type QuickAccessAccountsResponse =
  | QuickAccessAccount[]
  | {
      value?: QuickAccessAccount[];
    };

const parseJsonArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'string' && value.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const AuthAPI = {
  async authenticate(
    email: string,
    password: string,
    requestOptions?: ODataRequestOptions
  ): Promise<AuthSession> {
    const data = await odataFetch<AuthSessionResponse>('user', '/authenticate', {
      ...requestOptions,
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password }),
    });
    if (!data) throw new Error('Authentication failed: no response from server');

    const user = normalizeEntityRecord<User>(data.user);
    return {
      token: data.token,
      expiresAt: data.expiresAt,
      user: {
        ...user,
        skills: parseJsonArray<string>(user.skills),
        certifications: parseJsonArray<User['certifications'][number]>(user.certifications),
        availabilityPercent: user.availabilityPercent ?? 100,
      },
    };
  },

  async quickAccessAccounts(requestOptions?: ODataRequestOptions): Promise<QuickAccessAccount[]> {
    const data = await odataFetch<QuickAccessAccountsResponse>('user', '/quickAccessAccounts', {
      ...requestOptions,
      method: 'POST',
      body: JSON.stringify({}),
    });
    if (!data) return [];

    return Array.isArray(data) ? data : (data.value ?? []);
  },
};
