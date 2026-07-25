'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { STATUS_LABELS, type LeadListItem, type LeadStatus } from '@/types/lead';

const COLUMNS: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST'];

async function fetchColumn(status: LeadStatus): Promise<LeadListItem[]> {
  const res = await fetch(`/api/leads?status=${status}&limit=50&sortBy=updatedAt&sortOrder=desc`);
  const body = await res.json();
  if (!res.ok || !body.success) throw new Error(body.message);
  return body.data.items;
}

export function PipelineBoard() {
  const queryClient = useQueryClient();
  const [dragLeadId, setDragLeadId] = useState<string | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());

  const results = useQueries({
    queries: COLUMNS.map((status) => ({
      queryKey: ['leads', 'pipeline', status],
      queryFn: () => fetchColumn(status),
    })),
  });

  async function moveLeadTo(leadId: string, status: LeadStatus) {
    setPending((prev) => new Set(prev).add(leadId));
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.message);

      toast.success(`Moved to ${STATUS_LABELS[status]}`);
      COLUMNS.forEach((s) => queryClient.invalidateQueries({ queryKey: ['leads', 'pipeline', s] }));
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not move lead');
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(leadId);
        return next;
      });
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((status, i) => {
        const query = results[i];
        const leads = query?.data ?? [];
        const isLoading = query?.isLoading ?? true;

        return (
          <div
            key={status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const leadId = e.dataTransfer.getData('text/plain') || dragLeadId;
              if (leadId) moveLeadTo(leadId, status);
              setDragLeadId(null);
            }}
            className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-secondary/30"
          >
            <div className="flex items-center justify-between border-b border-border p-3">
              <span className="text-sm font-semibold">{STATUS_LABELS[status]}</span>
              <Badge variant="outline">{isLoading ? '…' : leads.length}</Badge>
            </div>

            <div className="flex-1 space-y-2 p-2">
              {isLoading &&
                Array.from({ length: 2 }).map((_, k) => <Skeleton key={k} className="h-16 w-full" />)}

              {!isLoading && leads.length === 0 && (
                <p className="p-3 text-center text-xs text-muted-foreground">No leads here.</p>
              )}

              {leads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', lead.id);
                    setDragLeadId(lead.id);
                  }}
                  className="cursor-grab rounded-md border border-border bg-card p-3 text-sm shadow-sm active:cursor-grabbing"
                  style={{ opacity: pending.has(lead.id) ? 0.5 : 1 }}
                >
                  <Link href={`/dashboard/leads/${lead.id}`} className="font-medium hover:underline">
                    {lead.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{lead.company ?? lead.email}</p>
                  {lead.assignments[0]?.assignedTo && (
                    <p className="mt-1 text-xs text-muted-foreground">→ {lead.assignments[0].assignedTo.name}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
