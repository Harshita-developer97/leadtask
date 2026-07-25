import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireActingUser } from '@/lib/session';
import { userService } from '@/services/user.service';
import { ok, withErrorHandling } from '@/lib/api-response';

const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  role: z.enum(['ADMIN', 'MEMBER']).optional(),
});

interface Params {
  params: Promise<{ id: string }>;
}

export const PATCH = withErrorHandling(async (req: NextRequest, { params }: Params) => {
  const actingUser = await requireActingUser();
  const { id } = await params;
  const body = await req.json();
  const input = updateUserSchema.parse(body);

  const user = await userService.updateUser(actingUser, id, input);
  return ok(user, 'User updated');
});
