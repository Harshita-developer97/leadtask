import { NextRequest } from 'next/server';
import { requireActingUser } from '@/lib/session';
import { leadService } from '@/services/lead.service';
import { activityRepository } from '@/repositories/lead-support.repository';
import { ok, withErrorHandling } from '@/lib/api-response';

interface Params {
  params: Promise<{ id: string }>;
}

export const GET = withErrorHandling(async (_req: NextRequest, { params }: Params) => {
  const actingUser = await requireActingUser();
  const { id } = await params;

  // Reuses getById's visibility check so Members can't read another
  // member's activity timeline by guessing a lead id.
  await leadService.getById(actingUser, id);

  const activities = await activityRepository.listForLead(id);
  return ok(activities, 'Activity retrieved');
});
