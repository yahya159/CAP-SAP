import { UserRole } from '../types/entities';
import {
  getBaseRouteForRole as getBaseRouteForRoleFromRegistry,
  getDefaultRouteForRole as getDefaultRouteForRoleFromRegistry,
} from '../routing/routeRegistry';

export const getBaseRouteForRole = (role: UserRole): string =>
  getBaseRouteForRoleFromRegistry(role);

export const getDefaultRouteForRole = (role: UserRole): string =>
  getDefaultRouteForRoleFromRegistry(role);
