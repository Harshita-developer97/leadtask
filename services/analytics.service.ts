import { db } from '@/lib/db';
import { assertPermission } from '@/lib/rbac';
import type { Role } from '@prisma/client';

interface ActingUser {
  id: string;
  role: Role;
}

export const analyticsService = {
  /** Scoped summary available to any authenticated user (Members see only their own leads). */
  async summaryFor(actingUser: ActingUser) {
    const where = actingUser.role === 'ADMIN' ? {} : { assignments: { some: { assignedToId: actingUser.id, active: true } } };

    const [total, byStatus] = await Promise.all([
      db.lead.count({ where }),
      db.lead.groupBy({ by: ['status'], where, _count: true }),
    ]);

    const statusCounts = Object.fromEntries(byStatus.map((row) => [row.status, row._count]));

    return {
      total,
      new: statusCounts.NEW ?? 0,
      contacted: statusCounts.CONTACTED ?? 0,
      qualified: statusCounts.QUALIFIED ?? 0,
      proposalSent: statusCounts.PROPOSAL_SENT ?? 0,
      won: statusCounts.WON ?? 0,
      lost: statusCounts.LOST ?? 0,
    };
  },

  /** Admin-only, org-wide breakdown by source and by assignee. */
  async orgWideBreakdown(actingUser: ActingUser) {
    assertPermission(actingUser.role, 'ANALYTICS_VIEW');

    const [bySource, byAssignee, recentActivity] = await Promise.all([
      db.lead.groupBy({ by: ['source'], _count: true }),
      db.leadAssignment.groupBy({ by: ['assignedToId'], where: { active: true }, _count: true }),
      db.leadActivity.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { name: true } }, lead: { select: { name: true } } },
      }),
    ]);

    const assigneeIds = byAssignee.map((row) => row.assignedToId);
    const users = await db.user.findMany({ where: { id: { in: assigneeIds } }, select: { id: true, name: true } });
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    return {
      bySource: bySource.map((row) => ({ source: row.source, count: row._count })),
      byAssignee: byAssignee.map((row) => ({
        userId: row.assignedToId,
        name: userMap.get(row.assignedToId) ?? 'Unknown',
        count: row._count,
      })),
      recentActivity,
    };
  },
};
