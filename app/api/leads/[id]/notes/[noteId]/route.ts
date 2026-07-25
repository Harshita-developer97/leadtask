import { NextRequest } from 'next/server';
import { requireActingUser } from '@/lib/session';
import { leadService } from '@/services/lead.service';
import { ok, withErrorHandling } from '@/lib/api-response';

interface Params {
  params: Promise<{ id: string; noteId: string }>;
}

export const DELETE = withErrorHandling(async (_req: NextRequest, { params }: Params) => {
  const actingUser = await requireActingUser();
  const { noteId } = await params;
  const result = await leadService.deleteNote(actingUser, noteId);
  return ok(result, 'Note deleted');
});
