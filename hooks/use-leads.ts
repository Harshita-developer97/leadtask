'use client';

import { useQuery } from '@tanstack/react-query';
import type { LeadListResponse } from '@/types/lead';

export interface LeadQueryParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  source?: string;
  assignedToId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

async function fetchLeads(params: LeadQueryParams): Promise<LeadListResponse> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') searchParams.set(key, String(value));
  });

  const res = await fetch(`/api/leads?${searchParams.toString()}`);
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message ?? 'Failed to load leads');
  }
  return body.data as LeadListResponse;
}

export function useLeads(params: LeadQueryParams) {
  return useQuery({
    queryKey: ['leads', params],
    queryFn: () => fetchLeads(params),
    placeholderData: (prev) => prev,
  });
}
