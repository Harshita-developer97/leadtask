import { NextRequest } from 'next/server';
import { requireActingUser } from '@/lib/session';
import { leadService } from '@/services/lead.service';
import { createNoteSchema } from '@/lib/validators/lead';
import { created, withErrorHandling } from '@/lib/api-response';

interface Params {
  params: Promise<{ id: string }>;
}

export const POST = withErrorHandling(async (req: NextRequest, { params }: Params) => {
  const actingUser = await requireActingUser();
  const { id } = await params;
  const body = await req.json();
  const { text } = createNoteSchema.parse(body);

  const note = await leadService.addNote(actingUser, id, text);
  return created(note, 'Note added');
});
