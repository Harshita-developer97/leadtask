import { auth } from '@/lib/auth';
import { LeadDetail } from '@/components/features/leads/lead-detail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;

  return <LeadDetail leadId={id} role={session!.user.role} />;
}
