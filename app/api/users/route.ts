import { NextRequest } from 'next/server';
import { requireActingUser } from '@/lib/session';
import { userService } from '@/services/user.service';
import { registerSchema } from '@/lib/validators/auth';
import { z } from 'zod';
import { created, ok, withErrorHandling } from '@/lib/api-response';

const createUserSchema = registerSchema.extend({
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

export const GET = withErrorHandling(async () => {
  const actingUser = await requireActingUser();
  const users = await userService.list(actingUser);
  return ok(users, 'Users retrieved');
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const actingUser = await requireActingUser();
  const body = await req.json();
  const input = createUserSchema.parse(body);

  const user = await userService.createUser(actingUser, input);
  return created(user, 'User created');
});
