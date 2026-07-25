import { NextRequest } from 'next/server';
import { authService } from '@/services/auth.service';
import { registerSchema } from '@/lib/validators/auth';
import { created, withErrorHandling } from '@/lib/api-response';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const input = registerSchema.parse(body);
  const user = await authService.register(input);
  return created(user, 'Account created successfully');
});
