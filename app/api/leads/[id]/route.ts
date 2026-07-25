import { NextRequest } from 'next/server';
import { requireActingUser } from '@/lib/session';
import { leadService } from '@/services/lead.service';
import { updateLeadSchema } from '@/lib/validators/lead';
import { ok, withErrorHandling } from '@/lib/api-response';

interface Params {
  params: Promise<{ id: string }>;
}

export const GET = withErrorHandling(async (_req: NextRequest, { params }: Params) => {
  const actingUser = await requireActingUser();
  const { id } = await params;
  const lead = await leadService.getById(actingUser, id);
  return ok(lead, 'Lead retrieved');
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }: Params) => {
  const actingUser = await requireActingUser();
  const { id } = await params;
  const body = await req.json();
  const input = updateLeadSchema.parse(body);

  const lead = await leadService.update(actingUser, id, input);
  return ok(lead, 'Lead updated');
});

export const DELETE = withErrorHandling(async (_req: NextRequest, { params }: Params) => {
  const actingUser = await requireActingUser();
  const { id } = await params;
  const result = await leadService.delete(actingUser, id);
  return ok(result, 'Lead deleted');
});
