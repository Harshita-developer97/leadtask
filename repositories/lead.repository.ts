import { db } from '@/lib/db';
import type { Prisma, LeadSource, LeadStatus } from '@prisma/client';

export interface LeadListFilters {
  page: number;
  limit: number;
  search?: string;
  status?: LeadStatus;
  source?: LeadSource;
  assignedToId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy: 'createdAt' | 'updatedAt' | 'name' | 'status';
  sortOrder: 'asc' | 'desc';
  /** When set, restricts results to leads with an active assignment to this user (Member scoping). */
  restrictToAssigneeId?: string;
}

function buildWhere(filters: LeadListFilters): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {};

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search, mode: 'insensitive' } },
      { company: { contains: filters.search, mode: 'insensitive' } },
      { message: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.status) where.status = filters.status;
  if (filters.source) where.source = filters.source;

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {
      ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
      ...(filters.dateTo ? { lte: filters.dateTo } : {}),
    };
  }

  const assigneeId = filters.restrictToAssigneeId ?? filters.assignedToId;
  if (assigneeId) {
    where.assignments = { some: { assignedToId: assigneeId, active: true } };
  }

  return where;
}

export const leadRepository = {
  async list(filters: LeadListFilters) {
    const where = buildWhere(filters);
    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await Promise.all([
      db.lead.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        include: {
          assignments: {
            where: { active: true },
            include: { assignedTo: { select: { id: true, name: true, email: true } } },
          },
        },
      }),
      db.lead.count({ where }),
    ]);

    return { items, total };
  },

  findById(id: string) {
    return db.lead.findUnique({
      where: { id },
      include: {
        assignments: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
            assignedBy: { select: { id: true, name: true, email: true } },
          },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          include: { author: { select: { id: true, name: true, email: true } } },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
  },

  create(data: Prisma.LeadCreateInput) {
    return db.lead.create({ data });
  },

  update(id: string, data: Prisma.LeadUpdateInput) {
    return db.lead.update({ where: { id }, data });
  },

  delete(id: string) {
    return db.lead.delete({ where: { id } });
  },

  isAssignedTo(leadId: string, userId: string) {
    return db.leadAssignment.findFirst({
      where: { leadId, assignedToId: userId, active: true },
    });
  },
};
