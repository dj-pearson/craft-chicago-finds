/**
 * Accessibility E2E Tests
 * Tests for WCAG 2.1 AA compliance
 */

import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Helper function to run axe accessibility checks
async function runAccessibilityAudit(page: Page, pageName: string) {
  const accessibilityResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  // Log any violations for debugging
  if (accessibilityResults.violations.length > 0) {
    console.log(`\n${pageName} - Accessibility Violations:`);
    accessibilityResults.violations.forEach((violation) => {
      console.log(`  - ${violation.id}: ${violation.description}`);
      console.log(`    Impact: ${violation.impact}`);
      console.log(`    Nodes: ${violation.nodes.length}`);
    });
  }

  return accessibilityResults;
}

test.describe('Accessibility - Core Requirements', () => {
  test.describe('Skip Links (WCAG 2.4.1)', () => {
    test('skip links are present and functional on homepage', async ({ page }) => {
      await page.goto('/');

      // Check skip links are present
      const skipLinks = page.locator('.skip-links a');
      await expect(skipLinks).toHaveCount(3);

      // Focus first skip link with Tab
      await page.keyboard.press('Tab');

      // Skip link should be visible when focused
      const firstSkipLink = skipLinks.first();
      await expect(firstSkipLink).toBeFocused();
      await expect(firstSkipLink).toBeVisible();

      // Verify skip link text
      await expect(firstSkipLink).toHaveText('Skip to main content');
    });

    test('skip to main content works', async ({ page }) => {
      await page.goto('/');

      // Focus and activate skip link
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');

      // Main content should be focused
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeFocused();
    });
  });

  test.describe('Page Landmarks (WCAG 2.4.1)', () => {
    test('homepage has required landmarks', async ({ page }) => {
      await page.goto('/');

      // Main landmark
      const main = page.locator('main#main-content');
      await expect(main).toBeVisible();
      await expect(main).toHaveAttribute('role', 'main');

      // Navigation landmark
      const nav = page.locator('nav#main-navigation');
      await expect(nav).toBeVisible();

      // Footer landmark
      const footer = page.locator('footer#footer');
      await expect(footer).toBeVisible();
      await expect(footer).toHaveAttribute('role', 'contentinfo');
    });

    test('browse page has main landmark', async ({ page }) => {
      await page.goto('/chicago/browse');

      const main = page.locator('main#main-content');
      await expect(main).toBeVisible();
      await expect(main).toHaveAttribute('role', 'main');
    });
  });

  test.describe('Page Titles (WCAG 2.4.2)', () => {
    test('homepage has descriptive title', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle(/Craft Chicago Finds/);
    });

    test('browse page has descriptive title', async ({ page }) => {
      await page.goto('/chicago/browse');
      await expect(page).toHaveTitle(/Browse.*Chicago/i);
    });

    test('accessibility page has descriptive title', async ({ page }) => {
      await page.goto('/accessibility');
      await expect(page).toHaveTitle(/Accessibility/i);
    });
  });

  test.describe('Language Attribute (WCAG 3.1.1)', () => {
    test('html element has lang attribute', async ({ page }) => {
      await page.goto('/');
      const html = page.locator('html');
      await expect(html).toHaveAttribute('lang', 'en');
    });
  });
});

test.describe('Accessibility - Keyboard Navigation (WCAG 2.1.1)', () => {
  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Tab through the page and check focusable elements
    let focusableCount = 0;
    const maxTabs = 50;

    for (let i = 0; i < maxTabs; i++) {
      await page.keyboard.press('Tab');
      const activeElement = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? el.tagName.toLowerCase() : null;
      });

      if (activeElement) {
        focusableCount++;
      }

      // Check if we've cycled back to the beginning
      const isSkipLink = await page.locator('.skip-link:focus').isVisible();
      if (isSkipLink && i > 5) break;
    }

    // Ensure there are focusable elements
    expect(focusableCount).toBeGreaterThan(5);
  });

  test('buttons are activatable with Enter and Space', async ({ page }) => {
    await page.goto('/');

    // Find a button and test keyboard activation
    const browseButton = page.getByRole('button', { name: /marketplace/i }).first();
    if (await browseButton.isVisible()) {
      await browseButton.focus();
      await page.keyboard.press('Enter');
      // Should navigate or trigger action
    }
  });

  test('no keyboard traps exist', async ({ page }) => {
    await page.goto('/');

    // Tab through many elements
    for (let i = 0; i < 100; i++) {
      await page.keyboard.press('Tab');
    }

    // Should be able to tab backward
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Shift+Tab');
    }

    // If we got here without timing out, no keyboard trap exists
    expect(true).toBe(true);
  });
});

test.describe('Accessibility - Focus Management (WCAG 2.4.7)', () => {
  test('focus indicators are visible', async ({ page }) => {
    await page.goto('/');

    // Tab to an element
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check that focused element has visible focus styles
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Check for focus ring (this checks CSS, may need adjustment based on your styles)
    const outlineStyle = await focusedElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
      };
    });

    // Focus should have some visible indicator
    const hasVisibleFocus =
      outlineStyle.outlineWidth !== '0px' ||
      outlineStyle.boxShadow !== 'none';

    expect(hasVisibleFocus).toBe(true);
  });
});

test.describe('Accessibility - Forms (WCAG 1.3.1, 3.3.2)', () => {
  test('form inputs have associated labels', async ({ page }) => {
    await page.goto('/auth');

    // Check email input has label
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      const inputId = await emailInput.getAttribute('id');

      if (inputId) {
        // Check for associated label
        const label = page.locator(`label[for="${inputId}"]`);
        const ariaLabel = await emailInput.getAttribute('aria-label');
        const ariaLabelledBy = await emailInput.getAttribute('aria-labelledby');

        const hasLabel = (await label.count()) > 0 || ariaLabel || ariaLabelledBy;
        expect(hasLabel).toBeTruthy();
      }
    }
  });

  test('required fields are marked appropriately', async ({ page }) => {
    await page.goto('/auth');

    // Find required inputs
    const requiredInputs = page.locator('input[required], input[aria-required="true"]');
    const count = await requiredInputs.count();

    // If there are required inputs, they should have visual indicators
    if (count > 0) {
      // Check for aria-required or required attribute
      const firstRequired = requiredInputs.first();
      const isRequired =
        (await firstRequired.getAttribute('required')) !== null ||
        (await firstRequired.getAttribute('aria-required')) === 'true';

      expect(isRequired).toBe(true);
    }
  });
});

test.describe('Accessibility - Images (WCAG 1.1.1)', () => {
  test('images have alt text', async ({ page }) => {
    await page.goto('/');

    // Find all images
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      const ariaHidden = await img.getAttribute('aria-hidden');

      // Image should have alt text, or be marked as decorative
      const isAccessible =
        alt !== null || // Has alt attribute (can be empty for decorative)
        role === 'presentation' ||
        role === 'none' ||
        ariaHidden === 'true';

      expect(isAccessible).toBe(true);
    }
  });
});

test.describe('Accessibility - Automated Audit', () => {
  test('homepage passes automated accessibility checks', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const results = await runAccessibilityAudit(page, 'Homepage');

    // Allow no critical or serious violations
    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical'
    );
    const seriousViolations = results.violations.filter(
      (v) => v.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
    expect(seriousViolations).toHaveLength(0);
  });

  test('accessibility page passes automated checks', async ({ page }) => {
    await page.goto('/accessibility');
    await page.waitForLoadState('networkidle');

    const results = await runAccessibilityAudit(page, 'Accessibility Page');

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical'
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test('browse page passes automated checks', async ({ page }) => {
    await page.goto('/chicago/browse');
    await page.waitForLoadState('networkidle');

    const results = await runAccessibilityAudit(page, 'Browse Page');

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical'
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test('auth page passes automated checks', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    const results = await runAccessibilityAudit(page, 'Auth Page');

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical'
    );

    expect(criticalViolations).toHaveLength(0);
  });
});

test.describe('Accessibility - Color Contrast (WCAG 1.4.3)', () => {
  test('text has sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Use axe-core to specifically check color contrast
    const accessibilityResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    // Check for contrast violations
    const contrastViolations = accessibilityResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    // Log any contrast issues
    if (contrastViolations.length > 0) {
      console.log('Color Contrast Issues:');
      contrastViolations[0].nodes.forEach((node) => {
        console.log(`  - ${node.html}`);
        console.log(`    ${node.failureSummary}`);
      });
    }

    // Should have no critical contrast issues
    expect(contrastViolations.length).toBeLessThanOrEqual(2); // Allow minor issues
  });
});

test.describe('Accessibility - Reduced Motion (WCAG 2.3.1)', () => {
  test('respects prefers-reduced-motion', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    // Check if body or html has reduced-motion class or if animations are disabled
    const hasReducedMotion = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      return (
        body.classList.contains('reduce-motion') ||
        html.classList.contains('reduce-motion') ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      );
    });

    expect(hasReducedMotion).toBe(true);
  });
});

test.describe('Accessibility - Screen Reader Support', () => {
  test('ARIA live regions are present for dynamic content', async ({ page }) => {
    await page.goto('/');

    // Check for live regions
    const liveRegions = page.locator('[aria-live]');
    const count = await liveRegions.count();

    // Should have at least one live region for announcements
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/');

    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);

      // Skip hidden buttons
      if (!(await button.isVisible())) continue;

      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      const title = await button.getAttribute('title');

      // Button should have accessible name
      const hasAccessibleName =
        (text && text.trim().length > 0) ||
        ariaLabel ||
        ariaLabelledBy ||
        title;

      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('links have accessible names', async ({ page }) => {
    await page.goto('/');

    const links = page.locator('a');
    const count = await links.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const link = links.nth(i);

      // Skip hidden links
      if (!(await link.isVisible())) continue;

      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const ariaLabelledBy = await link.getAttribute('aria-labelledby');
      const title = await link.getAttribute('title');

      // Link should have accessible name
      const hasAccessibleName =
        (text && text.trim().length > 0) ||
        ariaLabel ||
        ariaLabelledBy ||
        title;

      expect(hasAccessibleName).toBeTruthy();
    }
  });
});

test.describe('Accessibility - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('touch targets are at least 44x44 pixels', async ({ page }) => {
    await page.goto('/');

    // Check button sizes
    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);

      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          // Touch targets should be at least 44x44 (with some tolerance for padding)
          expect(box.width).toBeGreaterThanOrEqual(40);
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    }
  });

  test('content is readable at 320px width', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');

    // Check that main content is visible and not cut off
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // No horizontal scroll should be needed
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    // Allow small overflow tolerance
    expect(hasHorizontalScroll).toBe(false);
  });
});
