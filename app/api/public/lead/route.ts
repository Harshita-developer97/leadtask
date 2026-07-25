import { NextRequest } from 'next/server';
import { leadService } from '@/services/lead.service';
import { publicLeadSchema } from '@/lib/validators/lead';
import { created, fail, ok, withErrorHandling } from '@/lib/api-response';
import { isRateLimited } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (isRateLimited(`public-lead:${ip}`, { windowMs: 60_000, max: 5 })) {
    logger.error('Public lead form rate limited', { ip });
    return fail('Too many submissions. Please try again in a minute.', 429);
  }

  const body = await req.json();
  const input = publicLeadSchema.parse(body);

  // Honeypot: a real visitor never fills this hidden field in. If it has a
  // value, silently pretend success so the bot doesn't learn its submission
  // was rejected, without ever writing to the database.
  if (input.companyWebsite) {
    logger.error('Public lead form honeypot triggered', { ip });
    return ok({ id: 'noop' }, 'Thanks! We will be in touch soon.');
  }

  const lead = await leadService.createFromPublicForm(input);
  return created({ id: lead.id }, 'Thanks! We will be in touch soon.');
});
