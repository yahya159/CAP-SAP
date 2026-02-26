import { describe, expect, it } from 'vitest';
import { UserRole } from '../types/entities';
import {
  getBaseRouteForRole,
  getDefaultRouteForRole,
  getRoleRouteDefinitions,
  getSharedRouteDefinitions,
  getSidebarItemsForRole,
  ROLE_ORDER,
} from './routeRegistry';

describe('routeRegistry', () => {
  it('resolves base and default routes for each role', () => {
    ROLE_ORDER.forEach((role) => {
      const base = getBaseRouteForRole(role);
      const defaultRoute = getDefaultRouteForRole(role);
      expect(base.startsWith('/')).toBe(true);
      expect(defaultRoute).toBe(`${base}/dashboard`);
    });
  });

  it('builds sidebar items only from role route definitions with nav metadata', () => {
    ROLE_ORDER.forEach((role) => {
      const sidebarItems = getSidebarItemsForRole(role);
      const routeDefs = getRoleRouteDefinitions(role);
      const expectedPaths = new Set(
        routeDefs
          .filter((route) => Boolean(route.nav))
          .map((route) => `${getBaseRouteForRole(role)}/${route.path}`)
      );

      expect(sidebarItems.length).toBe(expectedPaths.size);
      sidebarItems.forEach((item) => {
        expect(expectedPaths.has(item.path)).toBe(true);
      });
    });
  });

  it('keeps a dashboard route for every role tree', () => {
    ROLE_ORDER.forEach((role: UserRole) => {
      const hasDashboard = getRoleRouteDefinitions(role).some((route) => route.path === 'dashboard');
      expect(hasDashboard).toBe(true);
    });
  });

  it('stores route renderers directly in the registry', () => {
    ROLE_ORDER.forEach((role) => {
      const routeDefs = getRoleRouteDefinitions(role);
      routeDefs.forEach((route) => {
        if ('redirectTo' in route) {
          expect(typeof route.redirectTo).toBe('string');
          return;
        }

        const hasLazy = 'lazy' in route && Boolean(route.lazy);
        const hasElement = 'element' in route && Boolean(route.element);
        expect(hasLazy || hasElement).toBe(true);
        expect(hasLazy && hasElement).toBe(false);
      });
    });

    getSharedRouteDefinitions().forEach((route) => {
      const hasLazy = 'lazy' in route && Boolean(route.lazy);
      const hasElement = 'element' in route && Boolean(route.element);
      expect(hasLazy || hasElement).toBe(true);
      expect(hasLazy && hasElement).toBe(false);
    });
  });
});
