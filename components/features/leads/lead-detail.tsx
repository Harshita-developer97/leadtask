'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLead, useUpdateLeadStatus, useAddNote, useDeleteNote, useAssignLead, useDeleteLead } from '@/hooks/use-lead';
import { useTeamMembers } from '@/hooks/use-team-members';
import { STATUS_BADGE_VARIANT, STATUS_LABELS, SOURCE_LABELS, type LeadStatus } from '@/types/lead';

export function LeadDetail({ leadId, role }: { leadId: string; role: 'ADMIN' | 'MEMBER' }) {
  const router = useRouter();
  const { data: lead, isLoading, isError } = useLead(leadId);
  const updateStatus = useUpdateLeadStatus(leadId);
  const addNote = useAddNote(leadId);
  const deleteNote = useDeleteNote(leadId);
  const assignLead = useAssignLead(leadId);
  const deleteLead = useDeleteLead();
  const { data: team } = useTeamMembers(role === 'ADMIN');
  const [noteText, setNoteText] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !lead) {
    return <p className="text-sm text-destructive">This lead could not be loaded, or you don&apos;t have access to it.</p>;
  }

  const currentAssignee = lead.assignments.find((a) => a.active)?.assignedTo;

  async function handleDelete() {
    if (!confirm('Delete this lead permanently? This cannot be undone.')) return;
    try {
      await deleteLead.mutateAsync(leadId);
      toast.success('Lead deleted');
      router.push('/dashboard/leads');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete lead');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold tracking-tight">{lead.name}</h1>
            <Badge variant={STATUS_BADGE_VARIANT[lead.status as LeadStatus]}>{STATUS_LABELS[lead.status as LeadStatus]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {lead.email} {lead.company ? `· ${lead.company}` : ''} · {SOURCE_LABELS[lead.source as keyof typeof SOURCE_LABELS]}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={lead.status}
            onValueChange={(value) => {
              updateStatus.mutate(value, {
                onSuccess: () => toast.success('Status updated'),
                onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not update status'),
              });
            }}
          >
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {role === 'ADMIN' && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="notes">
        <TabsList>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          {role === 'ADMIN' && <TabsTrigger value="assignment">Assignment</TabsTrigger>}
        </TabsList>

        <TabsContent value="notes">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!noteText.trim()) return;
                  addNote.mutate(noteText, {
                    onSuccess: () => {
                      setNoteText('');
                      toast.success('Note added');
                    },
                    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not add note'),
                  });
                }}
                className="flex gap-2"
              >
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note about this lead…"
                  rows={2}
                  className="flex-1"
                />
                <Button type="submit" disabled={addNote.isPending}>
                  {addNote.isPending ? 'Adding…' : 'Add'}
                </Button>
              </form>

              {lead.notes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}

              <ul className="space-y-3">
                {lead.notes.map((note) => (
                  <li key={note.id} className="rounded-md border border-border p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <p>{note.text}</p>
                      {role === 'ADMIN' && (
                        <button
                          onClick={() =>
                            deleteNote.mutate(note.id, { onSuccess: () => toast.success('Note deleted') })
                          }
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          aria-label="Delete note"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {note.author.name} · {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardContent className="pt-6">
              {lead.activities.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
              <ol className="space-y-4 border-l border-border pl-4">
                {lead.activities.map((activity) => (
                  <li key={activity.id} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-signal-copper" />
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.user?.name ?? 'System'} · {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        {role === 'ADMIN' && (
          <TabsContent value="assignment">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <p className="text-sm">
                  Currently assigned to <span className="font-medium">{currentAssignee?.name ?? 'nobody'}</span>
                </p>
                <Select
                  onValueChange={(value) =>
                    assignLead.mutate(value, {
                      onSuccess: () => toast.success('Lead assigned'),
                      onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not assign lead'),
                    })
                  }
                >
                  <SelectTrigger className="w-64"><SelectValue placeholder="Assign to…" /></SelectTrigger>
                  <SelectContent>
                    {team?.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">History</p>
                  <ul className="space-y-2 text-sm">
                    {lead.assignments.map((a) => (
                      <li key={a.id} className="flex items-center justify-between rounded-md border border-border p-2">
                        <span>
                          {a.assignedTo.name} {a.active && <Badge variant="success" className="ml-2">Active</Badge>}
                        </span>
                        <span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
