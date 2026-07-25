import { describe, expect, it } from 'vitest';
import { registerSchema, loginSchema } from '@/lib/validators/auth';
import { publicLeadSchema, leadQuerySchema, createNoteSchema } from '@/lib/validators/lead';

describe('auth validators', () => {
  it('rejects a password without an uppercase letter or number', () => {
    const result = registerSchema.safeParse({ name: 'Jordan Lee', email: 'jordan@test.com', password: 'lowercaseonly' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid registration payload', () => {
    const result = registerSchema.safeParse({ name: 'Jordan Lee', email: 'jordan@test.com', password: 'Password123!' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email on login', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'x' });
    expect(result.success).toBe(false);
  });
});

describe('public lead form validator', () => {
  it('accepts a valid submission with the honeypot left empty', () => {
    const result = publicLeadSchema.safeParse({
      name: 'Jordan Lee',
      email: 'jordan@acme.com',
      source: 'WEBSITE',
      companyWebsite: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a submission with the honeypot field filled in', () => {
    const result = publicLeadSchema.safeParse({
      name: 'Bot',
      email: 'bot@spam.com',
      source: 'WEBSITE',
      companyWebsite: 'http://spam.example',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid phone number', () => {
    const result = publicLeadSchema.safeParse({
      name: 'Jordan Lee',
      email: 'jordan@acme.com',
      phone: 'not-a-phone-number!!',
      source: 'WEBSITE',
    });
    expect(result.success).toBe(false);
  });
});

describe('lead query validator', () => {
  it('applies sensible defaults for pagination', () => {
    const result = leadQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.sortBy).toBe('createdAt');
    expect(result.sortOrder).toBe('desc');
  });

  it('coerces string query params into numbers', () => {
    const result = leadQuerySchema.parse({ page: '3', limit: '25' });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(25);
  });

  it('caps the page size at 100', () => {
    const result = leadQuerySchema.safeParse({ limit: '500' });
    expect(result.success).toBe(false);
  });
});

describe('note validator', () => {
  it('rejects an empty note', () => {
    const result = createNoteSchema.safeParse({ text: '' });
    expect(result.success).toBe(false);
  });
});
