import { describe, expect, it } from 'vitest';
import { getDefaultRouteForRole } from './roleRouting';
import type { UserRole } from '../types/entities';

describe('getDefaultRouteForRole', () => {
  it('returns the expected dashboard route for each role', () => {
    const expectedRoutes: Record<UserRole, string> = {
      ADMIN: '/admin/dashboard',
      MANAGER: '/manager/dashboard',
      PROJECT_MANAGER: '/project-manager/dashboard',
      DEV_COORDINATOR: '/dev-coordinator/dashboard',
      CONSULTANT_TECHNIQUE: '/consultant-tech/dashboard',
      CONSULTANT_FONCTIONNEL: '/consultant-func/dashboard',
    };

    (Object.keys(expectedRoutes) as UserRole[]).forEach((role) => {
      expect(getDefaultRouteForRole(role)).toBe(expectedRoutes[role]);
    });
  });
});
