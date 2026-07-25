'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { publicLeadSchema } from '@/lib/validators/lead';

type FormValues = z.infer<typeof publicLeadSchema>;

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: 'Website',
  REFERRAL: 'Referral',
  COLD_OUTREACH: 'Cold outreach',
  SOCIAL_MEDIA: 'Social media',
  EVENT: 'Event',
  OTHER: 'Other',
};

export function PublicLeadForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(publicLeadSchema),
    defaultValues: { source: 'WEBSITE' },
  });

  const source = watch('source');

  async function onSubmit(values: FormValues) {
    try {
      const res = await fetch('/api/public/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        toast.error(body.message ?? 'Something went wrong. Please try again.');
        return;
      }

      setSubmitted(true);
      reset();
    } catch {
      toast.error('Network error. Please check your connection and try again.');
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-signal-teal/30 bg-signal-teal/10 p-8 text-center">
        <h3 className="font-display text-xl font-semibold text-signal-teal">Message sent</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Thanks for reaching out — a member of the team will follow up shortly.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => setSubmitted(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      {/* Honeypot field: hidden from real users via CSS + tabIndex, so a
          bot filling every field blind will trip it. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="companyWebsite">Leave this field empty</label>
        <input id="companyWebsite" tabIndex={-1} autoComplete="off" {...register('companyWebsite')} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="Jordan Lee" {...register('name')} aria-invalid={!!errors.name} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" placeholder="jordan@company.com" {...register('email')} aria-invalid={!!errors.email} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" placeholder="+1 555 000 1234" {...register('phone')} aria-invalid={!!errors.phone} />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="company">Company (optional)</Label>
          <Input id="company" placeholder="Acme Inc." {...register('company')} />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="source">How did you hear about us?</Label>
        <Select value={source} onValueChange={(v) => setValue('source', v as FormValues['source'])}>
          <SelectTrigger id="source">
            <SelectValue placeholder="Select a source" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SOURCE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="message">What are you looking to solve?</Label>
        <Textarea id="message" rows={4} placeholder="Tell us a bit about your team and goals…" {...register('message')} />
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="justify-self-start">
        {isSubmitting ? 'Sending…' : 'Talk to sales'}
      </Button>
    </form>
  );
}
