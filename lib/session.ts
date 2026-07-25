import { auth } from '@/lib/auth';
import { ApiError } from '@/lib/api-response';

export async function requireActingUser() {
  const session = await auth();
  if (!session?.user) {
    throw new ApiError('Authentication required', 401);
  }
  return { id: session.user.id, role: session.user.role };
}
