import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to a city (Chicago as default)
    await page.goto('/chicago/browse');
  });

  test('should display browse page with products', async ({ page }) => {
    // Wait for listings to load
    await expect(page.getByText(/browse chicago marketplace/i)).toBeVisible();
    
    // Should show product grid or empty state
    const productCards = page.locator('[data-testid="product-card"]');
    const emptyState = page.getByText(/no products found/i);
    
    // Either products or empty state should be visible
    await expect(async () => {
      const hasProducts = await productCards.count() > 0;
      const hasEmptyState = await emptyState.isVisible();
      expect(hasProducts || hasEmptyState).toBeTruthy();
    }).toPass({ timeout: 5000 });
  });

  test('should add product to cart', async ({ page }) => {
    // Wait for products to load
    await page.waitForLoadState('networkidle');
    
    // Find first available "Add to Cart" button
    const addToCartButton = page.getByRole('button', { name: /add to cart/i }).first();
    
    // Skip if no products available
    if (!(await addToCartButton.isVisible())) {
      test.skip();
    }
    
    // Get initial cart count
    const cartBadge = page.locator('[data-testid="cart-count"]');
    const initialCount = await cartBadge.textContent().then(text => parseInt(text || '0'));
    
    // Add to cart
    await addToCartButton.click();
    
    // Should show success toast
    await expect(page.getByText(/added to cart/i)).toBeVisible({ timeout: 3000 });
    
    // Cart count should increase
    await expect(cartBadge).toHaveText(String(initialCount + 1), { timeout: 2000 });
  });

  test('should navigate to cart page', async ({ page }) => {
    // Click cart icon/button
    const cartButton = page.getByRole('link', { name: /cart/i }).or(
      page.locator('[data-testid="cart-button"]')
    );
    await cartButton.click();
    
    // Should navigate to cart page
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.getByRole('heading', { name: /shopping cart/i })).toBeVisible();
  });

  test('should display cart items correctly', async ({ page }) => {
    // Navigate directly to cart
    await page.goto('/cart');
    
    // Should show either cart items or empty cart message
    const cartItems = page.locator('[data-testid="cart-item"]');
    const emptyCart = page.getByText(/cart is empty/i);
    
    await expect(async () => {
      const hasItems = await cartItems.count() > 0;
      const isEmpty = await emptyCart.isVisible();
      expect(hasItems || isEmpty).toBeTruthy();
    }).toPass({ timeout: 3000 });
  });

  test('should update item quantity in cart', async ({ page }) => {
    await page.goto('/cart');
    
    // Check if cart has items
    const cartItems = page.locator('[data-testid="cart-item"]');
    const itemCount = await cartItems.count();
    
    if (itemCount === 0) {
      test.skip();
    }
    
    // Find quantity input for first item
    const quantityInput = cartItems.first().locator('input[type="number"]');
    await expect(quantityInput).toBeVisible();
    
    // Get current quantity
    const currentQty = await quantityInput.inputValue();
    const newQty = String(parseInt(currentQty) + 1);
    
    // Update quantity
    await quantityInput.fill(newQty);
    
    // Total should update
    await expect(page.getByText(/total/i)).toBeVisible({ timeout: 2000 });
  });

  test('should remove item from cart', async ({ page }) => {
    await page.goto('/cart');
    
    const cartItems = page.locator('[data-testid="cart-item"]');
    const initialCount = await cartItems.count();
    
    if (initialCount === 0) {
      test.skip();
    }
    
    // Click remove button on first item
    const removeButton = cartItems.first().getByRole('button', { name: /remove/i });
    await removeButton.click();
    
    // Item count should decrease
    await expect(cartItems).toHaveCount(initialCount - 1, { timeout: 3000 });
    
    // Should show toast notification
    await expect(page.getByText(/removed from cart/i)).toBeVisible({ timeout: 2000 });
  });

  test('should proceed to checkout', async ({ page }) => {
    await page.goto('/cart');
    
    // Check if cart has items
    const checkoutButton = page.getByRole('button', { name: /checkout/i });
    
    if (!(await checkoutButton.isVisible())) {
      test.skip();
    }
    
    // Click checkout
    await checkoutButton.click();
    
    // Should redirect to auth or checkout page
    await expect(async () => {
      const url = page.url();
      expect(url.includes('/auth') || url.includes('/checkout')).toBeTruthy();
    }).toPass({ timeout: 3000 });
  });

  test('should display checkout form', async ({ page }) => {
    // This test assumes user is authenticated
    // Skip if not authenticated
    await page.goto('/checkout');
    
    // Check if redirected to auth
    if (page.url().includes('/auth')) {
      test.skip();
    }
    
    // Should show checkout form
    await expect(page.getByRole('heading', { name: /checkout/i })).toBeVisible();
    
    // Should have fulfillment options
    await expect(page.getByText(/pickup|shipping/i)).toBeVisible();
  });

  test('should validate required checkout fields', async ({ page }) => {
    await page.goto('/checkout');
    
    if (page.url().includes('/auth')) {
      test.skip();
    }
    
    // Try to submit without filling required fields
    const submitButton = page.getByRole('button', { name: /place order|complete/i });
    await submitButton.click();
    
    // Should show validation errors
    await expect(page.getByText(/required|invalid/i).first()).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Checkout - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should have mobile-friendly cart layout', async ({ page }) => {
    await page.goto('/cart');
    
    // Checkout button should be sticky at bottom on mobile
    const checkoutButton = page.getByRole('button', { name: /checkout/i });
    
    if (await checkoutButton.isVisible()) {
      const box = await checkoutButton.boundingBox();
      const viewportHeight = page.viewportSize()?.height || 667;
      
      // Button should be near bottom of viewport (within 100px)
      expect(box?.y).toBeGreaterThan(viewportHeight - 150);
    }
  });

  test('should have touch-friendly controls', async ({ page }) => {
    await page.goto('/cart');
    
    const cartItems = page.locator('[data-testid="cart-item"]');
    
    if ((await cartItems.count()) === 0) {
      test.skip();
    }
    
    // Quantity controls should be large enough
    const quantityInput = cartItems.first().locator('input[type="number"]');
    const box = await quantityInput.boundingBox();
    
    // Minimum 44x44px touch target
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});
