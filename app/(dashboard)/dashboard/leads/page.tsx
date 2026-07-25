import { auth } from '@/lib/auth';
import { LeadsTable } from '@/components/features/leads/leads-table';

interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const session = await auth();
  const { search } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Leads</h1>
        <p className="text-sm text-muted-foreground">
          {session!.user.role === 'ADMIN' ? 'Every lead across the pipeline.' : 'Leads currently assigned to you.'}
        </p>
      </div>
      <LeadsTable isAdmin={session!.user.role === 'ADMIN'} initialSearch={search} />
    </div>
  );
}
