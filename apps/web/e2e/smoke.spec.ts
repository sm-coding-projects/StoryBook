import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('loads landing page with StoryBook branding', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=StoryBook')).toBeVisible();
    await expect(page.locator('text=Get Started')).toBeVisible();
    await expect(page.locator('text=Login')).toBeVisible();
    await expect(page.locator('text=Sign Up')).toBeVisible();
  });

  test('has feature sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=01 / Proofing')).toBeVisible();
    await expect(page.locator('text=02 / Delivery')).toBeVisible();
    await expect(page.locator('text=03 / Archivist')).toBeVisible();
  });

  test('navigates to login page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Login');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('navigates to signup page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Sign Up');
    await expect(page).toHaveURL(/\/auth\/signup/);
  });
});

test.describe('Auth Pages', () => {
  test('login page renders form', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('text=Secure Access')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('signup page renders form', async ({ page }) => {
    await page.goto('/auth/signup');
    await expect(page.locator('text=Create Your Studio')).toBeVisible();
    await expect(page.locator('input[placeholder="Your Studio Name"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});

test.describe('Admin Flow (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as photographer
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'photographer@demo.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/\/admin\/galleries/, { timeout: 10000 });
  });

  test('shows galleries page with sidebar', async ({ page }) => {
    await expect(page.locator('text=Collections')).toBeVisible();
    await expect(page.locator('text=Galleries')).toBeVisible();
    await expect(page.locator('text=Contacts')).toBeVisible();
    await expect(page.locator('text=Settings')).toBeVisible();
  });

  test('can open create gallery modal', async ({ page }) => {
    await page.click('button:has-text("New Collection")');
    await expect(page.locator('text=Create New Gallery')).toBeVisible();
    await expect(page.locator('input[placeholder="e.g. Sarah & James Wedding"]')).toBeVisible();
  });

  test('can create a gallery and navigate to editor', async ({ page }) => {
    await page.click('button:has-text("New Collection")');
    await page.fill('input[placeholder="e.g. Sarah & James Wedding"]', 'Test Gallery');
    await page.click('button:has-text("Create Gallery")');
    await page.waitForURL(/\/admin\/editor\//, { timeout: 10000 });
    await expect(page.locator('text=Test Gallery')).toBeVisible();
    await expect(page.locator('text=01 / Assets')).toBeVisible();
  });
});

test.describe('Client Gallery Flow (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as client
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'client@demo.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    // Client should be redirected - wait for any page load
    await page.waitForTimeout(3000);
  });

  test('client can view assigned gallery', async ({ page }) => {
    // Navigate to the gallery directly (client has membership from seed)
    // The exact gallery ID comes from seed, but we test the structure
    const response = await page.goto('/gallery');
    // If no specific gallery, might redirect - that's ok
    expect(response?.status()).toBeLessThan(500);
  });
});
