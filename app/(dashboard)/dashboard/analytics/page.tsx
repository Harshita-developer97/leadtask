import { auth } from '@/lib/auth';
import { analyticsService } from '@/services/analytics.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SOURCE_LABELS } from '@/types/lead';

export default async function AnalyticsPage() {
  const session = await auth();
  const actingUser = { id: session!.user.id, role: session!.user.role };
  const breakdown = await analyticsService.orgWideBreakdown(actingUser);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Org-wide lead distribution and recent activity.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Leads by source</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {breakdown.bySource.map((row) => (
              <Bar key={row.source} label={SOURCE_LABELS[row.source as keyof typeof SOURCE_LABELS]} value={row.count} max={Math.max(...breakdown.bySource.map((r) => r.count), 1)} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Active leads per rep</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {breakdown.byAssignee.length === 0 && <p className="text-sm text-muted-foreground">No assignments yet.</p>}
            {breakdown.byAssignee.map((row) => (
              <Bar key={row.userId} label={row.name} value={row.count} max={Math.max(...breakdown.byAssignee.map((r) => r.count), 1)} />
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            {breakdown.recentActivity.map((activity) => (
              <li key={activity.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                <span>
                  <span className="font-medium">{activity.lead.name}</span> — {activity.message}
                </span>
                <span className="text-xs text-muted-foreground">{new Date(activity.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-secondary">
        <div className="h-2 rounded-full bg-signal-copper" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
