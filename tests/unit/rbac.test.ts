import { describe, expect, it } from 'vitest';
import { can, assertPermission } from '@/lib/rbac';

describe('rbac', () => {
  describe('ADMIN role', () => {
    it('can view all leads, delete leads, and manage users', () => {
      expect(can('ADMIN', 'LEADS_VIEW_ALL')).toBe(true);
      expect(can('ADMIN', 'LEADS_DELETE')).toBe(true);
      expect(can('ADMIN', 'USERS_MANAGE')).toBe(true);
      expect(can('ADMIN', 'LEADS_ASSIGN')).toBe(true);
      expect(can('ADMIN', 'NOTES_DELETE')).toBe(true);
    });
  });

  describe('MEMBER role', () => {
    it('can view assigned leads, update status, and add notes', () => {
      expect(can('MEMBER', 'LEADS_VIEW_ASSIGNED')).toBe(true);
      expect(can('MEMBER', 'LEADS_UPDATE_STATUS')).toBe(true);
      expect(can('MEMBER', 'NOTES_CREATE')).toBe(true);
    });

    it('cannot delete leads, manage users, assign leads, delete notes, or view all leads', () => {
      expect(can('MEMBER', 'LEADS_DELETE')).toBe(false);
      expect(can('MEMBER', 'USERS_MANAGE')).toBe(false);
      expect(can('MEMBER', 'LEADS_ASSIGN')).toBe(false);
      expect(can('MEMBER', 'NOTES_DELETE')).toBe(false);
      expect(can('MEMBER', 'LEADS_VIEW_ALL')).toBe(false);
    });
  });

  describe('assertPermission', () => {
    it('does not throw when the role has the permission', () => {
      expect(() => assertPermission('ADMIN', 'LEADS_DELETE')).not.toThrow();
    });

    it('throws a ForbiddenError when the role lacks the permission', () => {
      expect(() => assertPermission('MEMBER', 'LEADS_DELETE')).toThrow();
      try {
        assertPermission('MEMBER', 'LEADS_DELETE');
      } catch (error) {
        expect((error as Error).name).toBe('ForbiddenError');
      }
    });
  });
});
