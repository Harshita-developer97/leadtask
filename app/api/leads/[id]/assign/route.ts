import { NextRequest } from 'next/server';
import { requireActingUser } from '@/lib/session';
import { leadService } from '@/services/lead.service';
import { assignLeadSchema } from '@/lib/validators/lead';
import { ok, withErrorHandling } from '@/lib/api-response';

interface Params {
  params: Promise<{ id: string }>;
}

export const POST = withErrorHandling(async (req: NextRequest, { params }: Params) => {
  const actingUser = await requireActingUser();
  const { id } = await params;
  const body = await req.json();
  const { assignedToId } = assignLeadSchema.parse(body);

  const assignment = await leadService.assign(actingUser, id, assignedToId);
  return ok(assignment, 'Lead assigned');
});
