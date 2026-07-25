'use client';

import { useQuery } from '@tanstack/react-query';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  createdAt: string;
}

export function useTeamMembers(enabled: boolean) {
  return useQuery<TeamMember[]>({
    queryKey: ['users'],
    enabled,
    queryFn: async () => {
      const res = await fetch('/api/users');
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.message ?? 'Failed to load team');
      return body.data;
    },
  });
}
