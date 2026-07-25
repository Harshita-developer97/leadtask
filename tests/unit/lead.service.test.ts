import { describe, expect, it, vi, beforeEach } from 'vitest';
import { leadRepository } from '@/repositories/lead.repository';
import { activityRepository, assignmentRepository, noteRepository } from '@/repositories/lead-support.repository';
import { leadService } from '@/services/lead.service';

vi.mock('@/repositories/lead.repository', () => ({
  leadRepository: {
    list: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/repositories/lead-support.repository', () => ({
  activityRepository: { record: vi.fn() },
  assignmentRepository: { reassign: vi.fn() },
  noteRepository: { create: vi.fn(), delete: vi.fn(), findById: vi.fn() },
}));

const ADMIN = { id: 'admin-1', role: 'ADMIN' as const };
const MEMBER = { id: 'member-1', role: 'MEMBER' as const };

const baseLead = {
  id: 'lead-1',
  status: 'NEW',
  assignments: [{ assignedToId: 'member-1', active: true }],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('leadService.list', () => {
  it('does not scope the query for an admin', async () => {
    vi.mocked(leadRepository.list).mockResolvedValue({ items: [], total: 0 });

    await leadService.list(ADMIN, { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' });

    const callArg = vi.mocked(leadRepository.list).mock.calls[0]![0];
    expect(callArg.restrictToAssigneeId).toBeUndefined();
  });

  it('restricts the query to the acting member for a MEMBER', async () => {
    vi.mocked(leadRepository.list).mockResolvedValue({ items: [], total: 0 });

    await leadService.list(MEMBER, { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' });

    const callArg = vi.mocked(leadRepository.list).mock.calls[0]![0];
    expect(callArg.restrictToAssigneeId).toBe('member-1');
  });
});

describe('leadService.getById', () => {
  it('allows a member to view a lead assigned to them', async () => {
    vi.mocked(leadRepository.findById).mockResolvedValue(baseLead as never);
    await expect(leadService.getById(MEMBER, 'lead-1')).resolves.toEqual(baseLead);
  });

  it('rejects a member viewing a lead not assigned to them', async () => {
    vi.mocked(leadRepository.findById).mockResolvedValue({
      ...baseLead,
      assignments: [{ assignedToId: 'someone-else', active: true }],
    } as never);

    await expect(leadService.getById(MEMBER, 'lead-1')).rejects.toThrow();
  });

  it('throws when the lead does not exist', async () => {
    vi.mocked(leadRepository.findById).mockResolvedValue(null);
    await expect(leadService.getById(ADMIN, 'missing')).rejects.toThrow('Lead not found');
  });
});

describe('leadService.create', () => {
  it('rejects a MEMBER attempting to create a lead', async () => {
    await expect(
      leadService.create(MEMBER, { name: 'Test', email: 't@test.com', source: 'OTHER' })
    ).rejects.toThrow();
  });

  it('creates the lead and records a LEAD_CREATED activity for an admin', async () => {
    vi.mocked(leadRepository.create).mockResolvedValue({ id: 'lead-2' } as never);

    await leadService.create(ADMIN, { name: 'Test', email: 't@test.com', source: 'OTHER' });

    expect(leadRepository.create).toHaveBeenCalled();
    expect(activityRepository.record).toHaveBeenCalledWith(
      expect.objectContaining({ leadId: 'lead-2', action: 'LEAD_CREATED' })
    );
  });
});

describe('leadService.update', () => {
  it('allows a member to change only the status of their own lead', async () => {
    vi.mocked(leadRepository.findById).mockResolvedValue(baseLead as never);
    vi.mocked(leadRepository.update).mockResolvedValue({ ...baseLead, status: 'CONTACTED' } as never);

    await leadService.update(MEMBER, 'lead-1', { status: 'CONTACTED' });

    expect(activityRepository.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'STATUS_CHANGED' })
    );
  });

  it('rejects a member trying to change the lead name', async () => {
    vi.mocked(leadRepository.findById).mockResolvedValue(baseLead as never);

    await expect(leadService.update(MEMBER, 'lead-1', { name: 'New Name' })).rejects.toThrow();
  });
});

describe('leadService.delete', () => {
  it('rejects a MEMBER attempting to delete a lead', async () => {
    await expect(leadService.delete(MEMBER, 'lead-1')).rejects.toThrow();
  });

  it('deletes the lead for an admin', async () => {
    vi.mocked(leadRepository.findById).mockResolvedValue(baseLead as never);
    await leadService.delete(ADMIN, 'lead-1');
    expect(leadRepository.delete).toHaveBeenCalledWith('lead-1');
  });
});

describe('leadService.assign', () => {
  it('rejects a MEMBER attempting to assign a lead', async () => {
    await expect(leadService.assign(MEMBER, 'lead-1', 'member-2')).rejects.toThrow();
  });

  it('reassigns the lead and records an ASSIGNMENT_CHANGED activity for an admin', async () => {
    vi.mocked(leadRepository.findById).mockResolvedValue(baseLead as never);
    vi.mocked(assignmentRepository.reassign).mockResolvedValue({ id: 'assignment-1' } as never);

    await leadService.assign(ADMIN, 'lead-1', 'member-2');

    expect(assignmentRepository.reassign).toHaveBeenCalledWith({
      leadId: 'lead-1',
      assignedToId: 'member-2',
      assignedById: 'admin-1',
    });
    expect(activityRepository.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ASSIGNMENT_CHANGED' })
    );
  });
});

describe('leadService note permissions', () => {
  it('allows a member to add a note to their own lead', async () => {
    vi.mocked(leadRepository.findById).mockResolvedValue(baseLead as never);
    vi.mocked(noteRepository.create).mockResolvedValue({ id: 'note-1' } as never);

    await leadService.addNote(MEMBER, 'lead-1', 'Called and left a voicemail');
    expect(noteRepository.create).toHaveBeenCalled();
  });

  it('rejects a member deleting a note', async () => {
    await expect(leadService.deleteNote(MEMBER, 'note-1')).rejects.toThrow();
  });

  it('allows an admin to delete a note', async () => {
    vi.mocked(noteRepository.findById).mockResolvedValue({ id: 'note-1' } as never);
    await leadService.deleteNote(ADMIN, 'note-1');
    expect(noteRepository.delete).toHaveBeenCalledWith('note-1');
  });
});
