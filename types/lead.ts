export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL_SENT' | 'WON' | 'LOST';
export type LeadSource = 'WEBSITE' | 'REFERRAL' | 'COLD_OUTREACH' | 'SOCIAL_MEDIA' | 'EVENT' | 'OTHER';

export interface AssignedUserSummary {
  id: string;
  name: string;
  email: string;
}

export interface LeadListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  status: LeadStatus;
  source: LeadSource;
  createdAt: string;
  updatedAt: string;
  assignments: Array<{ assignedTo: AssignedUserSummary }>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LeadListResponse {
  items: LeadListItem[];
  pagination: PaginationMeta;
}

export const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  PROPOSAL_SENT: 'Proposal sent',
  WON: 'Won',
  LOST: 'Lost',
};

export const SOURCE_LABELS: Record<LeadSource, string> = {
  WEBSITE: 'Website',
  REFERRAL: 'Referral',
  COLD_OUTREACH: 'Cold outreach',
  SOCIAL_MEDIA: 'Social media',
  EVENT: 'Event',
  OTHER: 'Other',
};

export const STATUS_BADGE_VARIANT: Record<LeadStatus, 'default' | 'accent' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  NEW: 'outline',
  CONTACTED: 'default',
  QUALIFIED: 'accent',
  PROPOSAL_SENT: 'warning',
  WON: 'success',
  LOST: 'destructive',
};
