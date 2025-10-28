import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    // Navigate to auth page
    await page.goto('/auth');
    
    // Check for auth form elements
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/auth');
    
    // Enter invalid email
    await page.getByPlaceholder(/email/i).fill('invalid-email');
    await page.getByPlaceholder(/password/i).fill('password123');
    
    // Try to submit
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show validation error
    await expect(page.getByText(/invalid email/i)).toBeVisible({ timeout: 3000 });
  });

  test('should toggle between sign in and sign up', async ({ page }) => {
    await page.goto('/auth');
    
    // Should start on sign in
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    
    // Click to switch to sign up
    await page.getByRole('button', { name: /sign up/i }).first().click();
    
    // Should now show sign up
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
    
    // Should have display name field for sign up
    await expect(page.getByPlaceholder(/display name/i)).toBeVisible();
  });

  test('should handle Google OAuth button', async ({ page }) => {
    await page.goto('/auth');
    
    // Check for Google sign-in button
    const googleButton = page.getByRole('button', { name: /google/i });
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
  });

  test('should validate password requirements on signup', async ({ page }) => {
    await page.goto('/auth');
    
    // Switch to sign up
    await page.getByRole('button', { name: /sign up/i }).first().click();
    
    // Enter weak password
    await page.getByPlaceholder(/email/i).fill('test@example.com');
    await page.getByPlaceholder(/display name/i).fill('Test User');
    await page.getByPlaceholder(/password/i).fill('123');
    
    // Try to submit
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Should show password requirement error
    await expect(page.getByText(/password.*at least/i)).toBeVisible({ timeout: 3000 });
  });

  test('should remember email when switching between sign in and sign up', async ({ page }) => {
    await page.goto('/auth');
    
    const testEmail = 'test@example.com';
    
    // Enter email on sign in
    await page.getByPlaceholder(/email/i).fill(testEmail);
    
    // Switch to sign up
    await page.getByRole('button', { name: /sign up/i }).first().click();
    
    // Email should still be there
    await expect(page.getByPlaceholder(/email/i)).toHaveValue(testEmail);
  });

  test('should show loading state during authentication', async ({ page }) => {
    await page.goto('/auth');
    
    // Fill in credentials
    await page.getByPlaceholder(/email/i).fill('test@example.com');
    await page.getByPlaceholder(/password/i).fill('ValidPassword123!');
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show loading state (button disabled or loading spinner)
    const submitButton = page.getByRole('button', { name: /sign in/i });
    await expect(submitButton).toBeDisabled({ timeout: 1000 });
  });
});

test.describe('Authentication - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should be fully functional on mobile', async ({ page }) => {
    await page.goto('/auth');
    
    // All form elements should be visible and tappable
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    
    // Touch targets should be large enough (44x44px minimum)
    const signInButton = page.getByRole('button', { name: /sign in/i });
    const box = await signInButton.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  });
});
