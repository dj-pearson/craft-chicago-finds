const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Mobile test results
const mobileTestResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  issues: [],
  pages: {}
};

function logIssue(severity, page, category, issue, details = '') {
  const result = { severity, page, category, issue, details, timestamp: new Date().toISOString() };
  mobileTestResults.issues.push(result);
  mobileTestResults.summary.total++;

  if (severity === 'CRITICAL') mobileTestResults.summary.failed++;
  else if (severity === 'WARNING') mobileTestResults.summary.warnings++;
  else mobileTestResults.summary.passed++;

  const emoji = severity === 'PASS' ? '✅' : severity === 'CRITICAL' ? '❌' : '⚠️';
  console.log(`${emoji} [${page}] ${category}: ${issue} ${details ? `- ${details}` : ''}`);
}

async function testMobilePage(browser, url, pageName) {
  console.log(`\n📱 Testing ${pageName} on mobile...\n`);

  const page = await browser.newPage();

  // Set mobile viewport (iPhone 12)
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // 1. Check for horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    if (hasHorizontalScroll) {
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      logIssue('CRITICAL', pageName, 'Layout', 'Horizontal scroll detected', `Width: ${scrollWidth}px vs ${clientWidth}px`);
    } else {
      logIssue('PASS', pageName, 'Layout', 'No horizontal scroll');
    }

    // 2. Check font sizes (minimum 16px for readability)
    const smallFonts = await page.evaluate(() => {
      const elements = document.querySelectorAll('p, span, a, li, div, button, input, label');
      const tooSmall = [];

      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const fontSize = parseFloat(styles.fontSize);
        const text = el.innerText?.trim() || '';

        // Only check elements with actual text
        if (text && fontSize < 14 && el.offsetParent !== null) {
          tooSmall.push({
            tag: el.tagName,
            fontSize: fontSize,
            text: text.substring(0, 30)
          });
        }
      });

      return tooSmall;
    });

    if (smallFonts.length > 0) {
      logIssue('WARNING', pageName, 'Typography', 'Small font sizes detected', `${smallFonts.length} elements < 14px`);
    } else {
      logIssue('PASS', pageName, 'Typography', 'Font sizes readable');
    }

    // 3. Check touch target sizes (minimum 44x44px for iOS, 48x48px for Android)
    const smallTouchTargets = await page.evaluate(() => {
      const MIN_SIZE = 44;
      const clickable = document.querySelectorAll('a, button, input[type="button"], input[type="submit"], [role="button"], [onclick]');
      const tooSmall = [];

      clickable.forEach(el => {
        const rect = el.getBoundingClientRect();
        const isVisible = el.offsetParent !== null;

        if (isVisible && (rect.width < MIN_SIZE || rect.height < MIN_SIZE)) {
          tooSmall.push({
            tag: el.tagName,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            text: el.innerText?.trim().substring(0, 20) || el.getAttribute('aria-label') || 'no text'
          });
        }
      });

      return tooSmall;
    });

    if (smallTouchTargets.length > 0) {
      logIssue('CRITICAL', pageName, 'Touch Targets', 'Small touch targets found', `${smallTouchTargets.length} elements < 44x44px`);
    } else {
      logIssue('PASS', pageName, 'Touch Targets', 'All touch targets adequate size');
    }

    // 4. Check button spacing
    const poorlySpacedButtons = await page.evaluate(() => {
      const MIN_SPACING = 8;
      const buttons = Array.from(document.querySelectorAll('button, a[role="button"]'));
      const issues = [];

      buttons.forEach((btn, index) => {
        if (btn.offsetParent === null) return;

        const rect1 = btn.getBoundingClientRect();
        buttons.slice(index + 1).forEach(otherBtn => {
          if (otherBtn.offsetParent === null) return;

          const rect2 = otherBtn.getBoundingClientRect();

          // Check if buttons are on same row (within 10px vertical tolerance)
          if (Math.abs(rect1.top - rect2.top) < 10) {
            const horizontalGap = Math.abs(rect1.right - rect2.left);
            if (horizontalGap < MIN_SPACING && horizontalGap > 0) {
              issues.push({
                button1: btn.innerText?.trim().substring(0, 20) || 'button',
                button2: otherBtn.innerText?.trim().substring(0, 20) || 'button',
                gap: Math.round(horizontalGap)
              });
            }
          }
        });
      });

      return issues;
    });

    if (poorlySpacedButtons.length > 0) {
      logIssue('WARNING', pageName, 'Spacing', 'Buttons too close together', `${poorlySpacedButtons.length} instances found`);
    } else {
      logIssue('PASS', pageName, 'Spacing', 'Button spacing adequate');
    }

    // 5. Check for fixed/sticky elements that might cover content
    const problematicFixed = await page.evaluate(() => {
      const fixed = document.querySelectorAll('[style*="fixed"], [style*="sticky"], .fixed, .sticky');
      const issues = [];

      fixed.forEach(el => {
        const styles = window.getComputedStyle(el);
        if (styles.position === 'fixed' || styles.position === 'sticky') {
          const rect = el.getBoundingClientRect();
          const height = rect.height;
          const screenHeight = window.innerHeight;

          // If fixed element takes up > 20% of screen, it's potentially problematic
          if (height > screenHeight * 0.2) {
            issues.push({
              tag: el.tagName,
              height: Math.round(height),
              percentOfScreen: Math.round((height / screenHeight) * 100)
            });
          }
        }
      });

      return issues;
    });

    if (problematicFixed.length > 0) {
      logIssue('WARNING', pageName, 'Layout', 'Large fixed elements', `${problematicFixed.length} elements taking >20% of screen`);
    } else {
      logIssue('PASS', pageName, 'Layout', 'Fixed elements appropriately sized');
    }

    // 6. Check modal/dialog positioning on mobile
    const modals = await page.evaluate(() => {
      const dialogs = document.querySelectorAll('[role="dialog"], [role="alertdialog"], .modal, .dialog');
      const issues = [];

      dialogs.forEach(dialog => {
        if (dialog.offsetParent === null) return;

        const rect = dialog.getBoundingClientRect();
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        // Check if modal is wider than screen
        if (rect.width > screenWidth) {
          issues.push({
            type: 'width overflow',
            width: Math.round(rect.width)
          });
        }

        // Check if modal is taller than screen (should scroll)
        if (rect.height > screenHeight * 0.9) {
          issues.push({
            type: 'height too large',
            height: Math.round(rect.height),
            percentOfScreen: Math.round((rect.height / screenHeight) * 100)
          });
        }
      });

      return issues;
    });

    if (modals.length > 0) {
      logIssue('WARNING', pageName, 'Modals', 'Modal sizing issues', `${modals.length} problems detected`);
    }

    // 7. Check image responsiveness
    const oversizedImages = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      const issues = [];
      const screenWidth = window.innerWidth;

      images.forEach(img => {
        if (img.offsetParent === null) return;

        const rect = img.getBoundingClientRect();

        // If image is wider than screen
        if (rect.width > screenWidth) {
          issues.push({
            src: img.src?.substring(0, 50) || 'unknown',
            width: Math.round(rect.width),
            naturalWidth: img.naturalWidth
          });
        }
      });

      return issues;
    });

    if (oversizedImages.length > 0) {
      logIssue('WARNING', pageName, 'Images', 'Oversized images', `${oversizedImages.length} images wider than screen`);
    } else {
      logIssue('PASS', pageName, 'Images', 'All images fit screen');
    }

    // 8. Check form input sizes
    const formInputIssues = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
      const issues = [];
      const MIN_HEIGHT = 44;

      inputs.forEach(input => {
        if (input.offsetParent === null) return;

        const rect = input.getBoundingClientRect();

        if (rect.height < MIN_HEIGHT) {
          issues.push({
            type: input.tagName,
            inputType: input.type || 'text',
            height: Math.round(rect.height),
            id: input.id || 'no-id'
          });
        }
      });

      return issues;
    });

    if (formInputIssues.length > 0) {
      logIssue('WARNING', pageName, 'Forms', 'Small form inputs', `${formInputIssues.length} inputs < 44px height`);
    } else {
      logIssue('PASS', pageName, 'Forms', 'Form inputs adequate size');
    }

    // 9. Check text overflow/wrapping
    const textOverflow = await page.evaluate(() => {
      const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, span, a');
      const issues = [];

      textElements.forEach(el => {
        if (el.offsetParent === null) return;

        const styles = window.getComputedStyle(el);
        const hasEllipsis = styles.textOverflow === 'ellipsis';
        const isOverflowing = el.scrollWidth > el.clientWidth;

        if (hasEllipsis && isOverflowing) {
          const text = el.innerText?.trim() || '';
          if (text.length > 0) {
            issues.push({
              tag: el.tagName,
              text: text.substring(0, 40)
            });
          }
        }
      });

      return issues;
    });

    if (textOverflow.length > 5) {
      logIssue('WARNING', pageName, 'Typography', 'Text truncation', `${textOverflow.length} elements with ellipsis overflow`);
    }

    // 10. Check viewport meta tag
    const viewportMeta = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta ? meta.getAttribute('content') : null;
    });

    if (!viewportMeta) {
      logIssue('CRITICAL', pageName, 'Meta Tags', 'Missing viewport meta tag');
    } else if (!viewportMeta.includes('width=device-width')) {
      logIssue('CRITICAL', pageName, 'Meta Tags', 'Viewport meta tag incorrect', viewportMeta);
    } else {
      logIssue('PASS', pageName, 'Meta Tags', 'Viewport meta tag correct');
    }

    // 11. Check for hamburger menu on mobile
    const hasMobileNav = await page.evaluate(() => {
      // Look for common mobile menu indicators
      const hamburger = document.querySelector('[aria-label*="menu" i], .mobile-menu, .hamburger, button[class*="menu" i]');
      const mobileNav = document.querySelector('nav[class*="mobile" i], .mobile-navigation');
      return {
        hasHamburger: !!hamburger,
        hasMobileNav: !!mobileNav
      };
    });

    if (!hasMobileNav.hasHamburger && !hasMobileNav.hasMobileNav) {
      logIssue('WARNING', pageName, 'Navigation', 'No mobile menu detected');
    } else {
      logIssue('PASS', pageName, 'Navigation', 'Mobile navigation present');
    }

    // 12. Test click/tap delays
    const tapPerformance = await page.evaluate(() => {
      const button = document.querySelector('button, a');
      if (!button) return { tested: false };

      const styles = window.getComputedStyle(button);
      const hasTouchAction = styles.touchAction !== 'auto';

      return {
        tested: true,
        hasTouchAction,
        touchAction: styles.touchAction
      };
    });

    // 13. Check z-index stacking issues
    const zIndexIssues = await page.evaluate(() => {
      const elements = document.querySelectorAll('[style*="z-index"], .modal, .dialog, .dropdown, [role="dialog"]');
      const zIndexes = [];

      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const zIndex = parseInt(styles.zIndex);
        if (!isNaN(zIndex) && zIndex > 999) {
          zIndexes.push({
            tag: el.tagName,
            class: el.className?.substring(0, 30) || '',
            zIndex
          });
        }
      });

      return zIndexes;
    });

    if (zIndexIssues.length > 5) {
      logIssue('WARNING', pageName, 'Z-Index', 'Many high z-index values', `${zIndexIssues.length} elements with z-index > 999`);
    }

    // Take screenshot
    const screenshotPath = `mobile-screenshots/${pageName.replace(/\s+/g, '_')}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);

  } catch (error) {
    logIssue('CRITICAL', pageName, 'Page Load', 'Failed to load or test page', error.message);
  } finally {
    await page.close();
  }
}

async function runMobileTests() {
  console.log('📱 Starting Mobile-First Optimization Testing\n');
  console.log('================================================\n');

  const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
  console.log(`Testing URL: ${baseUrl}\n`);

  // Create screenshots directory
  const screenshotsDir = path.join(process.cwd(), 'mobile-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Test critical pages
    const pages = [
      { url: '/', name: 'Homepage' },
      { url: '/auth', name: 'Login/Signup' },
      { url: '/chicago', name: 'City Page' },
      { url: '/chicago/browse', name: 'Browse Page' },
      { url: '/cart', name: 'Cart' },
      { url: '/dashboard', name: 'Seller Dashboard' },
      { url: '/marketplace', name: 'National Marketplace' },
      { url: '/terms', name: 'Terms Page' },
      { url: '/privacy', name: 'Privacy Page' }
    ];

    for (const pageInfo of pages) {
      await testMobilePage(browser, `${baseUrl}${pageInfo.url}`, pageInfo.name);
    }

  } catch (error) {
    console.error('❌ Fatal error during mobile testing:', error);
  } finally {
    await browser.close();
  }

  // Generate report
  console.log('\n\n================================================');
  console.log('📊 MOBILE OPTIMIZATION SUMMARY');
  console.log('================================================\n');
  console.log(`Total Tests: ${mobileTestResults.summary.total}`);
  console.log(`✅ Passed: ${mobileTestResults.summary.passed}`);
  console.log(`❌ Critical Issues: ${mobileTestResults.summary.failed}`);
  console.log(`⚠️  Warnings: ${mobileTestResults.summary.warnings}`);

  // Save detailed report
  const reportPath = path.join(process.cwd(), 'mobile-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(mobileTestResults, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  // Generate markdown report
  generateMobileReport(mobileTestResults);

  console.log('\n🏁 Mobile testing complete!\n');
}

function generateMobileReport(results) {
  let markdown = `# Mobile-First Optimization Report\n\n`;
  markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `- **Total Tests:** ${results.summary.total}\n`;
  markdown += `- **✅ Passed:** ${results.summary.passed}\n`;
  markdown += `- **❌ Critical Issues:** ${results.summary.failed}\n`;
  markdown += `- **⚠️ Warnings:** ${results.summary.warnings}\n`;
  markdown += `- **Success Rate:** ${Math.round((results.summary.passed / results.summary.total) * 100)}%\n\n`;

  // Group issues by page
  const pageGroups = {};
  results.issues.forEach(issue => {
    if (!pageGroups[issue.page]) {
      pageGroups[issue.page] = { critical: [], warnings: [], passed: [] };
    }
    if (issue.severity === 'CRITICAL') {
      pageGroups[issue.page].critical.push(issue);
    } else if (issue.severity === 'WARNING') {
      pageGroups[issue.page].warnings.push(issue);
    } else {
      pageGroups[issue.page].passed.push(issue);
    }
  });

  markdown += `## Critical Issues by Page\n\n`;
  for (const [page, issues] of Object.entries(pageGroups)) {
    if (issues.critical.length > 0) {
      markdown += `### ❌ ${page}\n\n`;
      issues.critical.forEach(issue => {
        markdown += `- **${issue.category}**: ${issue.issue}`;
        if (issue.details) markdown += ` - ${issue.details}`;
        markdown += `\n`;
      });
      markdown += `\n`;
    }
  }

  markdown += `## Warnings by Page\n\n`;
  for (const [page, issues] of Object.entries(pageGroups)) {
    if (issues.warnings.length > 0) {
      markdown += `### ⚠️ ${page}\n\n`;
      issues.warnings.forEach(issue => {
        markdown += `- **${issue.category}**: ${issue.issue}`;
        if (issue.details) markdown += ` - ${issue.details}`;
        markdown += `\n`;
      });
      markdown += `\n`;
    }
  }

  markdown += `## Mobile Optimization Checklist\n\n`;
  markdown += `### Layout & Design\n`;
  markdown += `- [ ] No horizontal scrolling on any page\n`;
  markdown += `- [ ] All text is readable (minimum 14px)\n`;
  markdown += `- [ ] Touch targets are minimum 44x44px\n`;
  markdown += `- [ ] Adequate spacing between clickable elements (8px minimum)\n`;
  markdown += `- [ ] Images scale properly to screen width\n`;
  markdown += `- [ ] Fixed/sticky elements don't cover too much content\n\n`;

  markdown += `### Forms & Inputs\n`;
  markdown += `- [ ] All form inputs are minimum 44px height\n`;
  markdown += `- [ ] Input fields have proper labels\n`;
  markdown += `- [ ] Autocomplete attributes for faster mobile entry\n`;
  markdown += `- [ ] Proper input types (email, tel, number, etc.)\n\n`;

  markdown += `### Navigation\n`;
  markdown += `- [ ] Mobile menu (hamburger) present and functional\n`;
  markdown += `- [ ] Easy thumb-zone navigation\n`;
  markdown += `- [ ] Back buttons accessible\n`;
  markdown += `- [ ] Clear visual hierarchy\n\n`;

  markdown += `### Performance\n`;
  markdown += `- [ ] Images optimized for mobile\n`;
  markdown += `- [ ] Minimal use of large fonts/assets\n`;
  markdown += `- [ ] Fast tap response (no 300ms delay)\n`;
  markdown += `- [ ] Lazy loading for below-fold content\n\n`;

  markdown += `### Meta & Configuration\n`;
  markdown += `- [ ] Viewport meta tag present and correct\n`;
  markdown += `- [ ] Touch icons configured\n`;
  markdown += `- [ ] Proper mobile-friendly meta tags\n\n`;

  const reportPath = path.join(process.cwd(), 'MOBILE-OPTIMIZATION-REPORT.md');
  fs.writeFileSync(reportPath, markdown);
  console.log(`📝 Mobile report saved to: ${reportPath}`);
}

runMobileTests().catch(console.error);
