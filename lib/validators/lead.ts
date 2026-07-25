import { z } from 'zod';

const phoneRegex = /^[+()\d\s-]{7,20}$/;

export const leadSourceEnum = z.enum([
  'WEBSITE',
  'REFERRAL',
  'COLD_OUTREACH',
  'SOCIAL_MEDIA',
  'EVENT',
  'OTHER',
]);

export const leadStatusEnum = z.enum([
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'WON',
  'LOST',
]);

/** Used by the internal, authenticated "create lead" flow inside the dashboard. */
export const createLeadSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z.string().trim().regex(phoneRegex, 'Enter a valid phone number').optional().or(z.literal('')),
  company: z.string().trim().max(150).optional().or(z.literal('')),
  message: z.string().trim().max(2000).optional().or(z.literal('')),
  source: leadSourceEnum.default('OTHER'),
});

/**
 * Used by the public, unauthenticated landing-page lead form.
 * Includes a honeypot field for spam prevention: real users never see or
 * fill it in, so any submission with it populated is silently dropped.
 */
export const publicLeadSchema = createLeadSchema.extend({
  companyWebsite: z.literal('').optional(), // honeypot — must stay empty
});

export const updateLeadSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().regex(phoneRegex).optional().or(z.literal('')),
  company: z.string().trim().max(150).optional().or(z.literal('')),
  message: z.string().trim().max(2000).optional().or(z.literal('')),
  source: leadSourceEnum.optional(),
  status: leadStatusEnum.optional(),
});

export const assignLeadSchema = z.object({
  assignedToId: z.string().uuid('Select a valid team member'),
});

export const createNoteSchema = z.object({
  text: z.string().trim().min(1, 'Note cannot be empty').max(4000),
});

export const leadQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(200).optional(),
  status: leadStatusEnum.optional(),
  source: leadSourceEnum.optional(),
  assignedToId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type PublicLeadInput = z.infer<typeof publicLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type LeadQueryInput = z.infer<typeof leadQuerySchema>;
