import { NextRequest } from 'next/server';
import { requireActingUser } from '@/lib/session';
import { leadService } from '@/services/lead.service';
import { createLeadSchema, leadQuerySchema } from '@/lib/validators/lead';
import { created, ok, withErrorHandling } from '@/lib/api-response';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const actingUser = await requireActingUser();
  const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
  const query = leadQuerySchema.parse(searchParams);

  const result = await leadService.list(actingUser, query);
  return ok(result, 'Leads retrieved');
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const actingUser = await requireActingUser();
  const body = await req.json();
  const input = createLeadSchema.parse(body);

  const lead = await leadService.create(actingUser, input);
  return created(lead, 'Lead created');
});
