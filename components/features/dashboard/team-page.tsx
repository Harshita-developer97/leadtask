'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useTeamMembers } from '@/hooks/use-team-members';
import { initials } from '@/lib/utils';

const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/[0-9]/, 'Include a number'),
  role: z.enum(['ADMIN', 'MEMBER']),
});

type CreateUserInput = z.infer<typeof createUserSchema>;

export function TeamPage() {
  const { data: users, isLoading, isError } = useTeamMembers(true);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({ resolver: zodResolver(createUserSchema), defaultValues: { role: 'MEMBER' } });

  const role = watch('role');

  async function onSubmit(values: CreateUserInput) {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const body = await res.json();

    if (!res.ok || !body.success) {
      toast.error(body.message ?? 'Could not create user');
      return;
    }

    toast.success('Team member added');
    reset();
    setOpen(false);
    queryClient.invalidateQueries({ queryKey: ['users'] });
  }

  async function changeRole(userId: string, newRole: 'ADMIN' | 'MEMBER') {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      toast.error(body.message ?? 'Could not update role');
      return;
    }
    toast.success('Role updated');
    queryClient.invalidateQueries({ queryKey: ['users'] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Team</h1>
          <p className="text-sm text-muted-foreground">Admins can manage every user and role in LeadFlow.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> Add team member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add a team member</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
              <div className="grid gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register('name')} aria-invalid={!!errors.name} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} aria-invalid={!!errors.email} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="password">Temporary password</Label>
                <Input id="password" type="password" {...register('password')} aria-invalid={!!errors.password} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(v) => setValue('role', v as CreateUserInput['role'])}>
                  <SelectTrigger id="role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Adding…' : 'Add member'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Role</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3" colSpan={3}><Skeleton className="h-5 w-full" /></td>
                </tr>
              ))}
            {isError && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-destructive">Failed to load team.</td></tr>
            )}
            {!isLoading && users?.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7"><AvatarFallback>{initials(user.name)}</AvatarFallback></Avatar>
                    {user.name}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={user.role === 'ADMIN' ? 'accent' : 'outline'}>{user.role}</Badge>
                    <Select value={user.role} onValueChange={(v) => changeRole(user.id, v as 'ADMIN' | 'MEMBER')}>
                      <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
