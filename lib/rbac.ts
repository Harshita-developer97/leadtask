import type { Role } from '@prisma/client';

/**
 * Single source of truth for every permission in the app. Both the
 * middleware (route-level gate) and the service layer (data-level gate)
 * call into this file, so there is exactly one place that defines what
 * each role can do.
 */
export const PERMISSIONS = {
  LEADS_VIEW_ALL: 'LEADS_VIEW_ALL',
  LEADS_VIEW_ASSIGNED: 'LEADS_VIEW_ASSIGNED',
  LEADS_CREATE: 'LEADS_CREATE',
  LEADS_UPDATE_STATUS: 'LEADS_UPDATE_STATUS',
  LEADS_DELETE: 'LEADS_DELETE',
  LEADS_ASSIGN: 'LEADS_ASSIGN',
  NOTES_CREATE: 'NOTES_CREATE',
  NOTES_DELETE: 'NOTES_DELETE',
  USERS_MANAGE: 'USERS_MANAGE',
  ANALYTICS_VIEW: 'ANALYTICS_VIEW',
  ACTIVITY_VIEW: 'ACTIVITY_VIEW',
} as const;

export type Permission = keyof typeof PERMISSIONS;

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    'LEADS_VIEW_ALL',
    'LEADS_CREATE',
    'LEADS_UPDATE_STATUS',
    'LEADS_DELETE',
    'LEADS_ASSIGN',
    'NOTES_CREATE',
    'NOTES_DELETE',
    'USERS_MANAGE',
    'ANALYTICS_VIEW',
    'ACTIVITY_VIEW',
  ],
  MEMBER: ['LEADS_VIEW_ASSIGNED', 'LEADS_UPDATE_STATUS', 'NOTES_CREATE', 'ACTIVITY_VIEW'],
};

export function can(role: Role, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
}

export function assertPermission(role: Role, permission: Permission): void {
  if (!can(role, permission)) {
    const error = new Error(`Role ${role} lacks permission ${permission}`);
    error.name = 'ForbiddenError';
    throw error;
  }
}

/** Routes that require an authenticated session at all (checked in middleware.ts). */
export const PROTECTED_PREFIXES = ['/dashboard'];

/** Routes under /dashboard that are admin-only at the route level. */
export const ADMIN_ONLY_PREFIXES = ['/dashboard/users', '/dashboard/analytics'];

/** API prefixes that are admin-only regardless of the resource inside them. */
export const ADMIN_ONLY_API_PREFIXES = ['/api/users'];
