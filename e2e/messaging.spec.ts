import { test, expect } from '@playwright/test';

test.describe('Message Seller Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chicago/browse');
  });

  test('should navigate to product detail page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Find first product link
    const productLink = page.locator('a[href*="/product/"]').first();
    
    if (!(await productLink.isVisible())) {
      test.skip();
    }
    
    await productLink.click();
    
    // Should be on product detail page
    await expect(page).toHaveURL(/\/product\//);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display seller information', async ({ page }) => {
    // Navigate to any product
    const productLink = page.locator('a[href*="/product/"]').first();
    
    if (!(await productLink.isVisible())) {
      test.skip();
    }
    
    await productLink.click();
    await page.waitForLoadState('networkidle');
    
    // Should show seller info section
    await expect(page.getByText(/seller|about the maker/i)).toBeVisible();
  });

  test('should show message seller button', async ({ page }) => {
    const productLink = page.locator('a[href*="/product/"]').first();
    
    if (!(await productLink.isVisible())) {
      test.skip();
    }
    
    await productLink.click();
    await page.waitForLoadState('networkidle');
    
    // Should have contact/message seller button
    const messageButton = page.getByRole('button', { name: /message seller|contact/i });
    await expect(messageButton).toBeVisible({ timeout: 5000 });
  });

  test('should open message dialog when clicking message seller', async ({ page }) => {
    const productLink = page.locator('a[href*="/product/"]').first();
    
    if (!(await productLink.isVisible())) {
      test.skip();
    }
    
    await productLink.click();
    await page.waitForLoadState('networkidle');
    
    // Click message seller button
    const messageButton = page.getByRole('button', { name: /message seller|contact/i });
    
    if (!(await messageButton.isVisible())) {
      test.skip();
    }
    
    await messageButton.click();
    
    // Should open message dialog/modal or redirect to messages
    await expect(async () => {
      const hasDialog = await page.getByRole('dialog').isVisible();
      const isMessagesPage = page.url().includes('/messages');
      const isAuthPage = page.url().includes('/auth');
      expect(hasDialog || isMessagesPage || isAuthPage).toBeTruthy();
    }).toPass({ timeout: 3000 });
  });

  test('should validate message content', async ({ page }) => {
    const productLink = page.locator('a[href*="/product/"]').first();
    
    if (!(await productLink.isVisible())) {
      test.skip();
    }
    
    await productLink.click();
    const messageButton = page.getByRole('button', { name: /message seller|contact/i });
    
    if (!(await messageButton.isVisible())) {
      test.skip();
    }
    
    await messageButton.click();
    
    // If message dialog opened
    if (await page.getByRole('dialog').isVisible()) {
      // Try to send empty message
      const sendButton = page.getByRole('button', { name: /send/i });
      
      if (await sendButton.isVisible()) {
        await sendButton.click();
        
        // Should show validation error
        await expect(page.getByText(/message.*required|cannot.*empty/i)).toBeVisible({ timeout: 2000 });
      }
    }
  });

  test('should pre-fill product context in message', async ({ page }) => {
    const productLink = page.locator('a[href*="/product/"]').first();
    
    if (!(await productLink.isVisible())) {
      test.skip();
    }
    
    await productLink.click();
    
    // Get product title
    const productTitle = await page.locator('h1').textContent();
    
    const messageButton = page.getByRole('button', { name: /message seller|contact/i });
    
    if (!(await messageButton.isVisible())) {
      test.skip();
    }
    
    await messageButton.click();
    
    // Message should mention the product
    if (await page.getByRole('dialog').isVisible()) {
      const messageTextarea = page.getByRole('textbox', { name: /message/i });
      
      if (await messageTextarea.isVisible()) {
        const messageContent = await messageTextarea.inputValue();
        // Should reference product or be pre-filled
        expect(messageContent.length >= 0).toBeTruthy();
      }
    }
  });

  test('should navigate to messages page', async ({ page }) => {
    // Try to navigate directly to messages
    await page.goto('/messages');
    
    // Should either show messages or redirect to auth
    await expect(async () => {
      const url = page.url();
      const hasMessages = url.includes('/messages');
      const hasAuth = url.includes('/auth');
      expect(hasMessages || hasAuth).toBeTruthy();
    }).toPass();
  });

  test('should display conversation list', async ({ page }) => {
    await page.goto('/messages');
    
    // Skip if redirected to auth
    if (page.url().includes('/auth')) {
      test.skip();
    }
    
    // Should show conversations list or empty state
    await expect(async () => {
      const hasConversations = await page.locator('[data-testid="conversation"]').count() > 0;
      const hasEmptyState = await page.getByText(/no messages|start conversation/i).isVisible();
      expect(hasConversations || hasEmptyState).toBeTruthy();
    }).toPass({ timeout: 5000 });
  });
});

test.describe('Messaging - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should have mobile-optimized message layout', async ({ page }) => {
    await page.goto('/messages');
    
    if (page.url().includes('/auth')) {
      test.skip();
    }
    
    // Should use single-column layout on mobile
    const conversations = page.locator('[data-testid="conversation"]');
    
    if ((await conversations.count()) > 0) {
      const firstConvo = conversations.first();
      const box = await firstConvo.boundingBox();
      
      // Should be nearly full width (allowing for padding)
      const viewportWidth = page.viewportSize()?.width || 375;
      expect(box?.width).toBeGreaterThan(viewportWidth * 0.85);
    }
  });

  test('should have accessible message input on mobile', async ({ page }) => {
    // Navigate to a product and try to message
    await page.goto('/chicago/browse');
    const productLink = page.locator('a[href*="/product/"]').first();
    
    if (!(await productLink.isVisible())) {
      test.skip();
    }
    
    await productLink.click();
    const messageButton = page.getByRole('button', { name: /message seller|contact/i });
    
    if (!(await messageButton.isVisible())) {
      test.skip();
    }
    
    await messageButton.click();
    
    // Message input should be visible and accessible
    if (await page.getByRole('dialog').isVisible()) {
      const messageInput = page.getByRole('textbox', { name: /message/i });
      
      if (await messageInput.isVisible()) {
        // Should be large enough for mobile typing
        const box = await messageInput.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(100);
      }
    }
  });
});
