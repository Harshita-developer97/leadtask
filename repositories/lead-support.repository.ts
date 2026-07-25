import { db } from '@/lib/db';
import type { ActivityAction, Prisma } from '@prisma/client';

export const noteRepository = {
  create(data: { leadId: string; authorId: string; text: string }) {
    return db.leadNote.create({ data });
  },

  delete(id: string) {
    return db.leadNote.delete({ where: { id } });
  },

  findById(id: string) {
    return db.leadNote.findUnique({ where: { id } });
  },
};

export const activityRepository = {
  record(data: {
    leadId: string;
    userId?: string | null;
    action: ActivityAction;
    message: string;
    meta?: Prisma.InputJsonValue;
  }) {
    return db.leadActivity.create({ data });
  },

  listForLead(leadId: string) {
    return db.leadActivity.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  },
};

export const assignmentRepository = {
  async reassign(data: { leadId: string; assignedToId: string; assignedById: string }) {
    return db.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.leadAssignment.updateMany({
        where: { leadId: data.leadId, active: true },
        data: { active: false },
      });

      return tx.leadAssignment.create({
        data: {
          leadId: data.leadId,
          assignedToId: data.assignedToId,
          assignedById: data.assignedById,
          active: true,
        },
      });
    });
  },

  history(leadId: string) {
    return db.leadAssignment.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        assignedBy: { select: { id: true, name: true, email: true } },
      },
    });
  },
};
