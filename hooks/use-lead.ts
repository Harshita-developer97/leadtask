'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface LeadDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string | null;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  assignments: Array<{
    id: string;
    active: boolean;
    createdAt: string;
    assignedTo: { id: string; name: string; email: string };
    assignedBy: { id: string; name: string; email: string };
  }>;
  notes: Array<{ id: string; text: string; createdAt: string; author: { id: string; name: string } }>;
  activities: Array<{
    id: string;
    action: string;
    message: string;
    createdAt: string;
    user: { id: string; name: string } | null;
  }>;
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message ?? 'Request failed');
  }
  return body.data;
}

export function useLead(id: string) {
  return useQuery<LeadDetail>({
    queryKey: ['lead', id],
    queryFn: () => fetchJson(`/api/leads/${id}`),
  });
}

export function useUpdateLeadStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => fetchJson(`/api/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useAddNote(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => fetchJson(`/api/leads/${id}/notes`, { method: 'POST', body: JSON.stringify({ text }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lead', id] }),
  });
}

export function useDeleteNote(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => fetchJson(`/api/leads/${leadId}/notes/${noteId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lead', leadId] }),
  });
}

export function useAssignLead(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignedToId: string) =>
      fetchJson(`/api/leads/${id}/assign`, { method: 'POST', body: JSON.stringify({ assignedToId }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/leads/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export type { LeadDetail };
