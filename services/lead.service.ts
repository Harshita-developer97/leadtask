import { leadRepository, type LeadListFilters } from '@/repositories/lead.repository';
import { noteRepository, activityRepository, assignmentRepository } from '@/repositories/lead-support.repository';
import { assertPermission, can } from '@/lib/rbac';
import { ApiError } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import type { CreateLeadInput, PublicLeadInput, UpdateLeadInput } from '@/lib/validators/lead';
import type { Role } from '@prisma/client';

interface ActingUser {
  id: string;
  role: Role;
}

export const leadService = {
  /**
   * Admins see every lead. Members only ever see leads currently assigned
   * to them — this scoping happens once, here, so every caller (API route,
   * server component) automatically gets the correct RBAC-filtered result
   * and can never accidentally leak another member's leads.
   */
  async list(actingUser: ActingUser, filters: Omit<LeadListFilters, 'restrictToAssigneeId'>) {
    const scoped: LeadListFilters =
      actingUser.role === 'ADMIN'
        ? filters
        : { ...filters, restrictToAssigneeId: actingUser.id };

    const { items, total } = await leadRepository.list(scoped);
    return {
      items,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit) || 1,
      },
    };
  },

  async getById(actingUser: ActingUser, id: string) {
    const lead = await leadRepository.findById(id);
    if (!lead) throw new ApiError('Lead not found', 404);

    if (actingUser.role === 'MEMBER') {
      const assigned = lead.assignments.some(
        (a: { assignedToId: string; active: boolean }) => a.assignedToId === actingUser.id && a.active
      );
      if (!assigned) throw new ApiError('You do not have access to this lead', 403);
    }

    return lead;
  },

  /** Used by the authenticated dashboard "create lead" action. */
  async create(actingUser: ActingUser, input: CreateLeadInput) {
    assertPermission(actingUser.role, 'LEADS_CREATE');

    const lead = await leadRepository.create({
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      company: input.company || null,
      message: input.message || null,
      source: input.source,
      status: 'NEW',
      createdBy: { connect: { id: actingUser.id } },
    });

    await activityRepository.record({
      leadId: lead.id,
      userId: actingUser.id,
      action: 'LEAD_CREATED',
      message: `Lead created by ${actingUser.id}`,
    });

    logger.lead('Lead created', { leadId: lead.id, userId: actingUser.id });
    return lead;
  },

  /** Used by the public, unauthenticated landing-page form. Always status = NEW, no owner. */
  async createFromPublicForm(input: PublicLeadInput) {
    const lead = await leadRepository.create({
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      company: input.company || null,
      message: input.message || null,
      source: input.source,
      status: 'NEW',
    });

    await activityRepository.record({
      leadId: lead.id,
      action: 'LEAD_CREATED',
      message: 'Lead submitted via public website form',
    });

    logger.lead('Public lead submitted', { leadId: lead.id });
    return lead;
  },

  async update(actingUser: ActingUser, id: string, input: UpdateLeadInput) {
    const existing = await this.getById(actingUser, id);

    // Members may only ever change status on a lead assigned to them; every
    // other field is admin-only.
    const changingOnlyStatus = Object.keys(input).every((k) => k === 'status');
    if (actingUser.role === 'MEMBER') {
      if (!changingOnlyStatus) {
        throw new ApiError('Members can only update lead status', 403);
      }
      assertPermission(actingUser.role, 'LEADS_UPDATE_STATUS');
    }

    const statusChanged = input.status && input.status !== existing.status;

    const updated = await leadRepository.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
      ...(input.company !== undefined ? { company: input.company || null } : {}),
      ...(input.message !== undefined ? { message: input.message || null } : {}),
      ...(input.source !== undefined ? { source: input.source } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    });

    if (statusChanged) {
      await activityRepository.record({
        leadId: id,
        userId: actingUser.id,
        action: 'STATUS_CHANGED',
        message: `Status changed from ${existing.status} to ${input.status}`,
        meta: { from: existing.status, to: input.status },
      });
    } else {
      await activityRepository.record({
        leadId: id,
        userId: actingUser.id,
        action: 'LEAD_UPDATED',
        message: 'Lead details updated',
      });
    }

    logger.lead('Lead updated', { leadId: id, userId: actingUser.id, statusChanged });
    return updated;
  },

  async delete(actingUser: ActingUser, id: string) {
    assertPermission(actingUser.role, 'LEADS_DELETE');

    const existing = await leadRepository.findById(id);
    if (!existing) throw new ApiError('Lead not found', 404);

    // Record the activity before the cascade delete removes the lead's own
    // activity rows, so it's visible in centralized logs even though it
    // won't be visible in the (now-deleted) lead's timeline.
    logger.lead('Lead deleted', { leadId: id, userId: actingUser.id });

    await leadRepository.delete(id);
    return { id };
  },

  async assign(actingUser: ActingUser, leadId: string, assignedToId: string) {
    assertPermission(actingUser.role, 'LEADS_ASSIGN');

    const lead = await leadRepository.findById(leadId);
    if (!lead) throw new ApiError('Lead not found', 404);

    const assignment = await assignmentRepository.reassign({
      leadId,
      assignedToId,
      assignedById: actingUser.id,
    });

    await activityRepository.record({
      leadId,
      userId: actingUser.id,
      action: 'ASSIGNMENT_CHANGED',
      message: `Lead assigned to a team member`,
      meta: { assignedToId },
    });

    logger.assignment('Lead assigned', { leadId, assignedToId, assignedBy: actingUser.id });
    return assignment;
  },

  async addNote(actingUser: ActingUser, leadId: string, text: string) {
    await this.getById(actingUser, leadId); // enforces visibility scoping
    assertPermission(actingUser.role, 'NOTES_CREATE');

    const note = await noteRepository.create({ leadId, authorId: actingUser.id, text });

    await activityRepository.record({
      leadId,
      userId: actingUser.id,
      action: 'NOTE_ADDED',
      message: 'Note added to lead',
    });

    return note;
  },

  async deleteNote(actingUser: ActingUser, noteId: string) {
    assertPermission(actingUser.role, 'NOTES_DELETE');

    const note = await noteRepository.findById(noteId);
    if (!note) throw new ApiError('Note not found', 404);

    await noteRepository.delete(noteId);
    return { id: noteId };
  },

  canDeleteNotes(role: Role) {
    return can(role, 'NOTES_DELETE');
  },
};
