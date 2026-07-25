import { test, expect } from '@playwright/test';

test.describe('Public site', () => {
  test('shows the hero, the mandatory footer link, and accepts a lead submission', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /every lead, tracked/i })).toBeVisible();

    const footerLink = page.getByRole('link', { name: /digital heroes training task/i });
    await expect(footerLink).toHaveAttribute('href', 'https://digitalheroesco.com');

    await page.getByLabel('Full name').fill('E2E Test Lead');
    await page.getByLabel('Work email').fill(`e2e-${Date.now()}@example.com`);
    await page.getByRole('button', { name: /talk to sales/i }).click();

    await expect(page.getByText(/message sent/i)).toBeVisible();
  });
});

test.describe('Authentication + RBAC', () => {
  test('redirects an unauthenticated visitor away from the dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('logs in as a member and cannot reach the admin-only Team page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('member@example.com');
    await page.getByLabel('Password').fill('Password123!');
    await page.getByRole('button', { name: /log in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/dashboard/users');
    await expect(page).toHaveURL(/forbidden|\/dashboard$/);
  });

  test('logs in as an admin and can reach the Team page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('Password123!');
    await page.getByRole('button', { name: /log in/i }).click();

    await page.goto('/dashboard/users');
    await expect(page.getByRole('heading', { name: 'Team' })).toBeVisible();
  });
});
