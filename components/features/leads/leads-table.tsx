'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLeads } from '@/hooks/use-leads';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { CreateLeadDialog } from './create-lead-dialog';
import {
  STATUS_BADGE_VARIANT,
  STATUS_LABELS,
  SOURCE_LABELS,
  type LeadListItem,
  type LeadStatus,
  type LeadSource,
} from '@/types/lead';

const columnHelper = createColumnHelper<LeadListItem>();

export function LeadsTable({ isAdmin, initialSearch }: { isAdmin: boolean; initialSearch?: string }) {
  const [search, setSearch] = useState(initialSearch ?? '');
  const [status, setStatus] = useState<LeadStatus | 'ALL'>('ALL');
  const [source, setSource] = useState<LeadSource | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const debouncedSearch = useDebouncedValue(search, 350);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useLeads({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    status: status === 'ALL' ? undefined : status,
    source: source === 'ALL' ? undefined : source,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: () => (
          <input
            type="checkbox"
            aria-label="Select all leads on this page"
            checked={!!data?.items.length && selected.size === data.items.length}
            onChange={(e) => {
              if (e.target.checked && data) setSelected(new Set(data.items.map((l) => l.id)));
              else setSelected(new Set());
            }}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Select ${row.original.name}`}
            checked={selected.has(row.original.id)}
            onChange={(e) => {
              setSelected((prev) => {
                const next = new Set(prev);
                if (e.target.checked) next.add(row.original.id);
                else next.delete(row.original.id);
                return next;
              });
            }}
          />
        ),
      }),
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => (
          <Link href={`/dashboard/leads/${info.row.original.id}`} className="font-medium hover:underline">
            {info.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor('email', { header: 'Email' }),
      columnHelper.accessor('company', { header: 'Company', cell: (info) => info.getValue() ?? '—' }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => <Badge variant={STATUS_BADGE_VARIANT[info.getValue()]}>{STATUS_LABELS[info.getValue()]}</Badge>,
      }),
      columnHelper.accessor('source', { header: 'Source', cell: (info) => SOURCE_LABELS[info.getValue()] }),
      columnHelper.display({
        id: 'assignee',
        header: 'Assigned to',
        cell: ({ row }) => row.original.assignments[0]?.assignedTo.name ?? '—',
      }),
    ],
    [data, selected]
  );

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  async function bulkDelete() {
    if (!confirm(`Delete ${selected.size} lead(s)? This cannot be undone.`)) return;
    await Promise.all(
      Array.from(selected).map((id) => fetch(`/api/leads/${id}`, { method: 'DELETE' }))
    );
    toast.success('Selected leads deleted');
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ['leads'] });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search leads…"
            className="pl-9"
            aria-label="Search leads"
          />
        </div>

        <Select value={status} onValueChange={(v) => { setStatus(v as LeadStatus | 'ALL'); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={source} onValueChange={(v) => { setSource(v as LeadSource | 'ALL'); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All sources</SelectItem>
            {Object.entries(SOURCE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          {isAdmin && selected.size > 0 && (
            <Button variant="destructive" size="sm" onClick={bulkDelete}>
              <Trash2 className="h-4 w-4" />
              Delete ({selected.size})
            </Button>
          )}
          <CreateLeadDialog />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/50 text-left">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-medium text-muted-foreground">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-[140px]" />
                    </td>
                  ))}
                </tr>
              ))}

            {!isLoading && isError && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-destructive">
                  {error instanceof Error ? error.message : 'Failed to load leads.'}
                </td>
              </tr>
            )}

            {!isLoading && !isError && data?.items.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No leads match these filters.
                </td>
              </tr>
            )}

            {!isLoading &&
              !isError &&
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {data && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total} total leads
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
