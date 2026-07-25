import Link from 'next/link';
import { ArrowRight, Inbox } from 'lucide-react';
import { auth } from '@/lib/auth';
import { analyticsService } from '@/services/analytics.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function DashboardOverviewPage() {
  const session = await auth();
  const actingUser = { id: session!.user.id, role: session!.user.role };
  const stats = await analyticsService.summaryFor(actingUser);

  const cards = [
    { label: 'Total leads', value: stats.total },
    { label: 'New', value: stats.new },
    { label: 'Qualified', value: stats.qualified },
    { label: 'Won', value: stats.won },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {session!.user.role === 'ADMIN' ? 'Pipeline overview' : 'Your leads'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {session!.user.role === 'ADMIN'
            ? 'A snapshot of every lead in the system.'
            : 'A snapshot of the leads currently assigned to you.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-semibold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.total === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No leads yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              New leads submitted through the public website will show up here automatically, or add one manually.
            </p>
            <Button asChild>
              <Link href="/dashboard/leads">
                Go to leads <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Next step</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard/leads">Manage leads</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/pipeline">View pipeline board</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
