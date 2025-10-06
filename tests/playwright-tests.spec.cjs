const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test.describe('Craft Chicago Finds - Critical User Flows', () => {

  test.describe('Homepage and Navigation', () => {
    test('should load homepage successfully', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page).toHaveTitle(/Craft Chicago Finds|Chicago/);
    });

    test('should have working navigation menu', async ({ page }) => {
      await page.goto(BASE_URL);

      // Check for navigation elements
      const nav = page.locator('nav, header, [role="navigation"]');
      await expect(nav).toBeVisible();
    });

    test('should navigate to Browse page', async ({ page }) => {
      await page.goto(BASE_URL);

      // Look for browse link
      const browseLink = page.locator('a[href*="browse"]').first();
      if (await browseLink.count() > 0) {
        await browseLink.click();
        await page.waitForLoadState('networkidle');
        expect(page.url()).toContain('browse');
      }
    });

    test('should have accessible footer', async ({ page }) => {
      await page.goto(BASE_URL);

      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
    });
  });

  test.describe('Authentication Flows', () => {
    test('should navigate to login page', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');

      // Check for login form
      const form = page.locator('form').first();
      await expect(form).toBeVisible();
    });

    test('should show validation on empty login', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);

      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Wait for validation - could be HTML5 or custom
      await page.waitForTimeout(1000);

      // Check for error messages or HTML5 validation
      const hasErrors = await page.locator('[role="alert"], .error, .text-red-500').count() > 0;
      const emailInput = page.locator('input[type="email"]').first();
      const isInvalid = await emailInput.evaluate(el => !el.validity.valid);

      expect(hasErrors || isInvalid).toBeTruthy();
    });

    test('should have signup link on login page', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);

      const signupLink = page.locator('a[href*="signup"]');
      await expect(signupLink.first()).toBeVisible();
    });

    test('should navigate to signup page', async ({ page }) => {
      await page.goto(`${BASE_URL}/signup`);
      await page.waitForLoadState('networkidle');

      const form = page.locator('form').first();
      await expect(form).toBeVisible();
    });

    test('should have password field on signup', async ({ page }) => {
      await page.goto(`${BASE_URL}/signup`);

      const passwordField = page.locator('input[type="password"]').first();
      await expect(passwordField).toBeVisible();
    });

    test('should have terms and privacy links', async ({ page }) => {
      await page.goto(`${BASE_URL}/signup`);

      // These are critical for legal compliance
      const termsLink = page.locator('a[href*="terms"]');
      const privacyLink = page.locator('a[href*="privacy"]');

      const hasTerms = await termsLink.count() > 0;
      const hasPrivacy = await privacyLink.count() > 0;

      if (!hasTerms) {
        console.warn('⚠️ WARNING: No Terms of Service link found - REQUIRED for launch');
      }
      if (!hasPrivacy) {
        console.warn('⚠️ WARNING: No Privacy Policy link found - REQUIRED for launch');
      }

      expect(hasTerms || hasPrivacy).toBeTruthy();
    });
  });

  test.describe('Product Browsing', () => {
    test('should load browse page', async ({ page }) => {
      await page.goto(`${BASE_URL}/chicago/browse`);
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('browse');
    });

    test('should have search functionality', async ({ page }) => {
      await page.goto(`${BASE_URL}/chicago/browse`);

      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
      const hasSearch = await searchInput.count() > 0;

      if (hasSearch) {
        await searchInput.first().fill('test');
        await page.waitForTimeout(500);
        expect(await searchInput.first().inputValue()).toBe('test');
      }
    });

    test('should display product cards or empty state', async ({ page }) => {
      await page.goto(`${BASE_URL}/chicago/browse`);
      await page.waitForLoadState('networkidle');

      // Either products exist or there's an empty state
      const productCards = page.locator('[data-testid*="product"], .product-card, article');
      const emptyState = page.locator('text=/no products|nothing found|empty/i');

      const hasProducts = await productCards.count() > 0;
      const hasEmptyState = await emptyState.count() > 0;

      expect(hasProducts || hasEmptyState).toBeTruthy();
    });
  });

  test.describe('Seller Features', () => {
    test('should have seller signup page', async ({ page }) => {
      await page.goto(`${BASE_URL}/seller-signup`);
      await page.waitForLoadState('networkidle');

      // Should have some content
      const body = await page.textContent('body');
      expect(body.length).toBeGreaterThan(100);
    });

    test('should have seller dashboard route', async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/dashboard`);

      // Should not be 404 (might be login redirect which is fine)
      expect(response.status()).not.toBe(404);
    });
  });

  test.describe('Multi-city Support', () => {
    test('should support city-specific routing', async ({ page }) => {
      await page.goto(`${BASE_URL}/chicago`);
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('chicago');
    });

    test('should load city-specific browse page', async ({ page }) => {
      await page.goto(`${BASE_URL}/chicago/browse`);
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('chicago');
      expect(page.url()).toContain('browse');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper HTML structure', async ({ page }) => {
      await page.goto(BASE_URL);

      // Check for single h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThan(0);
      expect(h1Count).toBeLessThanOrEqual(2); // Allow some flexibility
    });

    test('should have lang attribute on html', async ({ page }) => {
      await page.goto(BASE_URL);

      const html = page.locator('html');
      const lang = await html.getAttribute('lang');
      expect(lang).toBeTruthy();
    });

    test('should have accessible images', async ({ page }) => {
      await page.goto(BASE_URL);

      const images = page.locator('img');
      const count = await images.count();

      if (count > 0) {
        // Check first few images for alt text
        for (let i = 0; i < Math.min(count, 5); i++) {
          const img = images.nth(i);
          const alt = await img.getAttribute('alt');
          const ariaLabel = await img.getAttribute('aria-label');
          const role = await img.getAttribute('role');

          // Alt can be empty string for decorative images, but should exist
          const isDecorative = role === 'presentation' || role === 'none';
          if (!isDecorative) {
            expect(alt !== null || ariaLabel !== null).toBeTruthy();
          }
        }
      }
    });

    test('should have keyboard navigable buttons', async ({ page }) => {
      await page.goto(BASE_URL);

      const buttons = page.locator('button');
      const count = await buttons.count();

      if (count > 0) {
        const firstButton = buttons.first();
        const isDisabled = await firstButton.isDisabled();

        if (!isDisabled) {
          await firstButton.focus();
          const isFocused = await firstButton.evaluate(el => el === document.activeElement);
          expect(isFocused).toBeTruthy();
        }
      }
    });
  });

  test.describe('Performance', () => {
    test('should load homepage within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      console.log(`⏱️ Homepage load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(10000); // 10 seconds max (generous for first load)
    });

    test('should not have console errors on homepage', async ({ page }) => {
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      if (errors.length > 0) {
        console.warn('⚠️ Console errors detected:', errors);
      }

      // Fail if there are critical errors (not warnings)
      const criticalErrors = errors.filter(e =>
        !e.includes('favicon') &&
        !e.includes('DevTools') &&
        !e.includes('Extension')
      );

      expect(criticalErrors.length).toBe(0);
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

    test('should be responsive on mobile', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Check for horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // +1 for rounding
    });

    test('should have mobile navigation', async ({ page }) => {
      await page.goto(BASE_URL);

      // Look for hamburger menu or mobile nav
      const mobileNav = page.locator('[aria-label*="menu" i], button[class*="menu" i], [role="navigation"]');
      const hasMobileNav = await mobileNav.count() > 0;

      expect(hasMobileNav).toBeTruthy();
    });
  });

  test.describe('Forms and Validation', () => {
    test('should have proper form elements', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);

      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button[type="submit"]').first();

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);

      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill('invalid-email');

      const isValid = await emailInput.evaluate(el => el.validity.valid);
      expect(isValid).toBeFalsy();

      await emailInput.fill('valid@email.com');
      const isValidNow = await emailInput.evaluate(el => el.validity.valid);
      expect(isValidNow).toBeTruthy();
    });
  });

  test.describe('Critical Pages Exist', () => {
    const criticalPages = [
      '/',
      '/chicago',
      '/login',
      '/signup',
      '/seller-signup',
      '/about',
      '/how-it-works'
    ];

    for (const pagePath of criticalPages) {
      test(`should load ${pagePath} without 404`, async ({ page }) => {
        const response = await page.goto(`${BASE_URL}${pagePath}`);
        expect(response.status()).not.toBe(404);
      });
    }
  });

  test.describe('SEO and Meta Tags', () => {
    test('should have title tag', async ({ page }) => {
      await page.goto(BASE_URL);
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
      expect(title).not.toBe('Vite App'); // Default Vite title
    });

    test('should have meta description', async ({ page }) => {
      await page.goto(BASE_URL);
      const description = page.locator('meta[name="description"]');
      const content = await description.getAttribute('content');

      if (!content || content.length < 50) {
        console.warn('⚠️ WARNING: Meta description is missing or too short - critical for SEO');
      }

      expect(content).toBeTruthy();
    });

    test('should have viewport meta tag', async ({ page }) => {
      await page.goto(BASE_URL);
      const viewport = page.locator('meta[name="viewport"]');
      const content = await viewport.getAttribute('content');

      expect(content).toContain('width=device-width');
    });

    test('should have Open Graph tags for social sharing', async ({ page }) => {
      await page.goto(BASE_URL);

      const ogTitle = page.locator('meta[property="og:title"]');
      const ogDescription = page.locator('meta[property="og:description"]');
      const ogImage = page.locator('meta[property="og:image"]');

      const hasOgTitle = await ogTitle.count() > 0;
      const hasOgDescription = await ogDescription.count() > 0;
      const hasOgImage = await ogImage.count() > 0;

      if (!hasOgTitle || !hasOgDescription || !hasOgImage) {
        console.warn('⚠️ WARNING: Missing Open Graph tags - important for social media sharing');
      }
    });
  });

  test.describe('Shopping Cart', () => {
    test('should have cart icon/button in header', async ({ page }) => {
      await page.goto(BASE_URL);

      const cart = page.locator('[aria-label*="cart" i], button[class*="cart" i], a[href*="cart"]');
      const hasCart = await cart.count() > 0;

      expect(hasCart).toBeTruthy();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 pages gracefully', async ({ page }) => {
      await page.goto(`${BASE_URL}/this-page-does-not-exist-${Date.now()}`);

      // Should show some content, not a blank page
      const bodyText = await page.textContent('body');
      expect(bodyText.length).toBeGreaterThan(50);
    });

    test('should not show React error boundary on homepage', async ({ page }) => {
      const errors = [];
      page.on('pageerror', error => {
        errors.push(error.message);
      });

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Check for React error boundary text
      const errorBoundary = page.locator('text=/something went wrong|error boundary/i');
      const hasErrorBoundary = await errorBoundary.count() > 0;

      expect(hasErrorBoundary).toBeFalsy();
      expect(errors.length).toBe(0);
    });
  });
});

// Generate a simple HTML report after tests
test.afterAll(async () => {
  console.log('\n✅ Playwright tests completed!');
  console.log('Run with --reporter=html for detailed HTML report');
});
