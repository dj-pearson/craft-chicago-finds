const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  categories: {
    navigation: [],
    authentication: [],
    forms: [],
    links: [],
    ui: [],
    ux: [],
    performance: [],
    accessibility: [],
    responsiveness: [],
    functionality: []
  }
};

// Helper to log test results
function logTest(category, test, status, details = '') {
  const result = { test, status, details, timestamp: new Date().toISOString() };
  testResults.categories[category].push(result);
  testResults.summary.total++;
  if (status === 'PASS') testResults.summary.passed++;
  else if (status === 'FAIL') testResults.summary.failed++;
  else if (status === 'WARN') testResults.summary.warnings++;

  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${emoji} [${category}] ${test}: ${status} ${details ? `- ${details}` : ''}`);
}

// Wait for network idle
async function waitForNetworkIdle(page, timeout = 30000) {
  try {
    await page.waitForNetworkIdle({ timeout, idleTime: 500 });
  } catch (error) {
    console.log('⚠️ Network idle timeout, continuing...');
  }
}

// Test navigation and page loads
async function testNavigation(browser, baseUrl) {
  console.log('\n🧭 Testing Navigation...\n');
  const page = await browser.newPage();

  const routes = [
    '/',
    '/chicago',
    '/chicago/browse',
    '/chicago/search',
    '/chicago/sellers',
    '/login',
    '/signup',
    '/about',
    '/how-it-works',
    '/seller-signup',
    '/dashboard',
    '/admin'
  ];

  for (const route of routes) {
    try {
      const response = await page.goto(`${baseUrl}${route}`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      const status = response.status();
      if (status === 200) {
        logTest('navigation', `Route ${route}`, 'PASS', `Loaded successfully (${status})`);
      } else if (status === 404) {
        logTest('navigation', `Route ${route}`, 'FAIL', `Page not found (${status})`);
      } else if (status >= 500) {
        logTest('navigation', `Route ${route}`, 'FAIL', `Server error (${status})`);
      } else {
        logTest('navigation', `Route ${route}`, 'WARN', `Unexpected status (${status})`);
      }

      // Check for console errors
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.waitForTimeout(2000);

      if (errors.length > 0) {
        logTest('navigation', `Console errors on ${route}`, 'WARN', `${errors.length} errors found`);
      }
    } catch (error) {
      logTest('navigation', `Route ${route}`, 'FAIL', error.message);
    }
  }

  await page.close();
}

// Test all links on a page
async function testLinks(browser, baseUrl) {
  console.log('\n🔗 Testing Links...\n');
  const page = await browser.newPage();

  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Get all links
    const links = await page.$$eval('a[href]', anchors =>
      anchors.map(a => ({
        href: a.href,
        text: a.innerText.trim(),
        visible: a.offsetParent !== null
      }))
    );

    logTest('links', 'Link extraction', 'PASS', `Found ${links.length} links`);

    // Check for broken links (sample first 20)
    const linksToTest = links.filter(l => l.visible && l.href.startsWith('http')).slice(0, 20);

    for (const link of linksToTest) {
      try {
        const linkPage = await browser.newPage();
        const response = await linkPage.goto(link.href, {
          waitUntil: 'domcontentloaded',
          timeout: 10000
        });

        if (response.status() === 404) {
          logTest('links', `Broken link: ${link.text}`, 'FAIL', link.href);
        } else if (response.status() >= 500) {
          logTest('links', `Server error link: ${link.text}`, 'FAIL', link.href);
        }

        await linkPage.close();
      } catch (error) {
        logTest('links', `Failed to load: ${link.text}`, 'FAIL', `${link.href} - ${error.message}`);
      }
    }

    // Check for links with empty href or href="#"
    const emptyLinks = await page.$$eval('a[href]', anchors =>
      anchors.filter(a => !a.href || a.href === '#' || a.href.endsWith('#')).length
    );

    if (emptyLinks > 0) {
      logTest('links', 'Empty/placeholder links', 'WARN', `${emptyLinks} links with empty or # href`);
    }
  } catch (error) {
    logTest('links', 'Link testing', 'FAIL', error.message);
  }

  await page.close();
}

// Test forms
async function testForms(browser, baseUrl) {
  console.log('\n📝 Testing Forms...\n');
  const page = await browser.newPage();

  // Test login form
  try {
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle2', timeout: 30000 });

    const loginForm = await page.$('form');
    if (loginForm) {
      logTest('forms', 'Login form exists', 'PASS');

      // Check for email field
      const emailField = await page.$('input[type="email"], input[name*="email"]');
      if (emailField) {
        logTest('forms', 'Email field exists', 'PASS');
      } else {
        logTest('forms', 'Email field missing', 'FAIL');
      }

      // Check for password field
      const passwordField = await page.$('input[type="password"]');
      if (passwordField) {
        logTest('forms', 'Password field exists', 'PASS');
      } else {
        logTest('forms', 'Password field missing', 'FAIL');
      }

      // Check for submit button
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        logTest('forms', 'Submit button exists', 'PASS');
      } else {
        logTest('forms', 'Submit button missing', 'FAIL');
      }

      // Test validation - try to submit empty form
      try {
        await page.click('button[type="submit"]');
        await page.waitForTimeout(1000);

        // Check for validation messages
        const validationMessages = await page.$$eval('[role="alert"], .error, .text-red-500',
          elements => elements.map(e => e.innerText)
        );

        if (validationMessages.length > 0) {
          logTest('forms', 'Login form validation', 'PASS', 'Validation messages displayed');
        } else {
          logTest('forms', 'Login form validation', 'WARN', 'No validation messages found');
        }
      } catch (error) {
        logTest('forms', 'Login form validation test', 'WARN', error.message);
      }
    } else {
      logTest('forms', 'Login form exists', 'FAIL', 'No form found on login page');
    }
  } catch (error) {
    logTest('forms', 'Login form test', 'FAIL', error.message);
  }

  // Test signup form
  try {
    await page.goto(`${baseUrl}/signup`, { waitUntil: 'networkidle2', timeout: 30000 });

    const signupForm = await page.$('form');
    if (signupForm) {
      logTest('forms', 'Signup form exists', 'PASS');

      // Count input fields
      const inputs = await page.$$('input');
      logTest('forms', 'Signup form fields', 'PASS', `${inputs.length} input fields found`);

      // Check for required fields
      const requiredFields = await page.$$('input[required]');
      if (requiredFields.length > 0) {
        logTest('forms', 'Required fields marked', 'PASS', `${requiredFields.length} required fields`);
      } else {
        logTest('forms', 'Required fields marked', 'WARN', 'No required attributes found');
      }
    } else {
      logTest('forms', 'Signup form exists', 'FAIL', 'No form found on signup page');
    }
  } catch (error) {
    logTest('forms', 'Signup form test', 'FAIL', error.message);
  }

  await page.close();
}

// Test UI/UX elements
async function testUIUX(browser, baseUrl) {
  console.log('\n🎨 Testing UI/UX...\n');
  const page = await browser.newPage();

  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Check for navigation/header
    const header = await page.$('header, nav, [role="navigation"]');
    if (header) {
      logTest('ui', 'Navigation header exists', 'PASS');
    } else {
      logTest('ui', 'Navigation header exists', 'FAIL', 'No header or nav found');
    }

    // Check for footer
    const footer = await page.$('footer');
    if (footer) {
      logTest('ui', 'Footer exists', 'PASS');
    } else {
      logTest('ui', 'Footer exists', 'WARN', 'No footer found');
    }

    // Check for logo
    const logo = await page.$('[alt*="logo" i], [class*="logo" i], img[src*="logo" i]');
    if (logo) {
      logTest('ui', 'Logo exists', 'PASS');
    } else {
      logTest('ui', 'Logo exists', 'WARN', 'No logo found');
    }

    // Check for search functionality
    const searchInput = await page.$('input[type="search"], input[placeholder*="search" i]');
    if (searchInput) {
      logTest('ui', 'Search input exists', 'PASS');
    } else {
      logTest('ui', 'Search input exists', 'WARN', 'No search input found on homepage');
    }

    // Check for buttons with visible text
    const buttons = await page.$$eval('button', btns =>
      btns.filter(btn => btn.offsetParent !== null).map(btn => ({
        text: btn.innerText.trim(),
        hasText: btn.innerText.trim().length > 0,
        hasAriaLabel: btn.hasAttribute('aria-label')
      }))
    );

    const buttonsWithoutText = buttons.filter(b => !b.hasText && !b.hasAriaLabel);
    if (buttonsWithoutText.length > 0) {
      logTest('ux', 'Buttons without text/labels', 'WARN', `${buttonsWithoutText.length} buttons without text or aria-label`);
    } else {
      logTest('ux', 'All buttons have text/labels', 'PASS');
    }

    // Check for loading states
    const loadingIndicators = await page.$('[role="status"], [aria-busy="true"], .loading, .spinner');
    if (loadingIndicators) {
      logTest('ux', 'Loading indicators present', 'PASS');
    } else {
      logTest('ux', 'Loading indicators present', 'WARN', 'No loading indicators found');
    }

    // Check for images without alt text
    const imagesWithoutAlt = await page.$$eval('img', imgs =>
      imgs.filter(img => !img.hasAttribute('alt') || img.alt === '').length
    );

    if (imagesWithoutAlt > 0) {
      logTest('accessibility', 'Images without alt text', 'FAIL', `${imagesWithoutAlt} images missing alt text`);
    } else {
      logTest('accessibility', 'All images have alt text', 'PASS');
    }

    // Check for sufficient color contrast (basic check)
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor
      };
    });
    logTest('ui', 'Body styles computed', 'PASS', `Color: ${bodyStyles.color}, BG: ${bodyStyles.backgroundColor}`);

  } catch (error) {
    logTest('ui', 'UI/UX testing', 'FAIL', error.message);
  }

  await page.close();
}

// Test performance
async function testPerformance(browser, baseUrl) {
  console.log('\n⚡ Testing Performance...\n');
  const page = await browser.newPage();

  try {
    // Enable performance metrics
    await page.setCacheEnabled(false);

    const startTime = Date.now();
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    const loadTime = Date.now() - startTime;

    if (loadTime < 3000) {
      logTest('performance', 'Page load time', 'PASS', `${loadTime}ms`);
    } else if (loadTime < 5000) {
      logTest('performance', 'Page load time', 'WARN', `${loadTime}ms (slower than ideal)`);
    } else {
      logTest('performance', 'Page load time', 'FAIL', `${loadTime}ms (too slow)`);
    }

    // Get performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const perfData = window.performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        domInteractive: perfData.domInteractive - perfData.fetchStart,
        loadComplete: perfData.loadEventEnd - perfData.fetchStart
      };
    });

    logTest('performance', 'DOM Interactive', 'PASS', `${Math.round(performanceMetrics.domInteractive)}ms`);
    logTest('performance', 'DOM Content Loaded', 'PASS', `${Math.round(performanceMetrics.domContentLoaded)}ms`);

    // Check for large images
    const imagesSizes = await page.$$eval('img', imgs =>
      imgs.map(img => ({
        src: img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayWidth: img.width,
        displayHeight: img.height,
        size: img.naturalWidth * img.naturalHeight
      }))
    );

    const largeImages = imagesSizes.filter(img => img.size > 2073600); // > 1920x1080
    if (largeImages.length > 0) {
      logTest('performance', 'Large images detected', 'WARN', `${largeImages.length} images larger than 1920x1080`);
    } else {
      logTest('performance', 'Image sizes optimized', 'PASS');
    }

    // Check bundle size
    const resourceSizes = await page.evaluate(() => {
      const resources = window.performance.getEntriesByType('resource');
      return resources.map(r => ({
        name: r.name,
        size: r.transferSize,
        type: r.initiatorType
      }));
    });

    const jsSize = resourceSizes
      .filter(r => r.type === 'script')
      .reduce((sum, r) => sum + r.size, 0);
    const cssSize = resourceSizes
      .filter(r => r.type === 'css' || r.name.includes('.css'))
      .reduce((sum, r) => sum + r.size, 0);

    logTest('performance', 'JavaScript bundle size', jsSize < 500000 ? 'PASS' : 'WARN', `${Math.round(jsSize / 1024)}KB`);
    logTest('performance', 'CSS bundle size', cssSize < 100000 ? 'PASS' : 'WARN', `${Math.round(cssSize / 1024)}KB`);

  } catch (error) {
    logTest('performance', 'Performance testing', 'FAIL', error.message);
  }

  await page.close();
}

// Test responsiveness
async function testResponsiveness(browser, baseUrl) {
  console.log('\n📱 Testing Responsiveness...\n');

  const viewports = [
    { name: 'Mobile (iPhone 12)', width: 390, height: 844 },
    { name: 'Mobile (Samsung Galaxy)', width: 412, height: 915 },
    { name: 'Tablet (iPad)', width: 768, height: 1024 },
    { name: 'Desktop (1080p)', width: 1920, height: 1080 },
    { name: 'Desktop (1440p)', width: 2560, height: 1440 }
  ];

  for (const viewport of viewports) {
    const page = await browser.newPage();

    try {
      await page.setViewport({ width: viewport.width, height: viewport.height });
      await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      // Check for horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      if (hasOverflow) {
        logTest('responsiveness', `${viewport.name} - Horizontal overflow`, 'FAIL', 'Page has horizontal scrollbar');
      } else {
        logTest('responsiveness', `${viewport.name} - No overflow`, 'PASS');
      }

      // Check if navigation is visible
      const navVisible = await page.evaluate(() => {
        const nav = document.querySelector('nav, header, [role="navigation"]');
        return nav ? window.getComputedStyle(nav).display !== 'none' : false;
      });

      if (navVisible) {
        logTest('responsiveness', `${viewport.name} - Navigation visible`, 'PASS');
      } else {
        logTest('responsiveness', `${viewport.name} - Navigation visible`, 'FAIL', 'Navigation not visible');
      }

      // Take screenshot for manual review
      await page.screenshot({
        path: `test-screenshots/${viewport.name.replace(/\s+/g, '_')}.png`,
        fullPage: false
      });

    } catch (error) {
      logTest('responsiveness', `${viewport.name}`, 'FAIL', error.message);
    }

    await page.close();
  }
}

// Test accessibility
async function testAccessibility(browser, baseUrl) {
  console.log('\n♿ Testing Accessibility...\n');
  const page = await browser.newPage();

  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Check for proper heading hierarchy
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', headings =>
      headings.map(h => ({ tag: h.tagName, text: h.innerText.trim() }))
    );

    const h1Count = headings.filter(h => h.tag === 'H1').length;
    if (h1Count === 1) {
      logTest('accessibility', 'Single H1 heading', 'PASS');
    } else if (h1Count === 0) {
      logTest('accessibility', 'Single H1 heading', 'FAIL', 'No H1 found');
    } else {
      logTest('accessibility', 'Single H1 heading', 'WARN', `${h1Count} H1 headings found`);
    }

    // Check for ARIA landmarks
    const landmarks = await page.$$eval('[role]', elements =>
      elements.map(e => e.getAttribute('role'))
    );

    const mainLandmark = landmarks.includes('main');
    if (mainLandmark) {
      logTest('accessibility', 'Main landmark exists', 'PASS');
    } else {
      logTest('accessibility', 'Main landmark exists', 'WARN', 'No role="main" found');
    }

    // Check for form labels
    const inputsWithoutLabels = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"])'));
      return inputs.filter(input => {
        const hasLabel = input.labels && input.labels.length > 0;
        const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
        return !hasLabel && !hasAriaLabel;
      }).length;
    });

    if (inputsWithoutLabels > 0) {
      logTest('accessibility', 'Form inputs with labels', 'FAIL', `${inputsWithoutLabels} inputs without labels`);
    } else {
      logTest('accessibility', 'Form inputs with labels', 'PASS');
    }

    // Check for keyboard navigation (tab order)
    const focusableElements = await page.$$eval(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      elements => elements.length
    );
    logTest('accessibility', 'Focusable elements', 'PASS', `${focusableElements} elements can receive focus`);

    // Check for language attribute
    const hasLang = await page.$eval('html', html => html.hasAttribute('lang'));
    if (hasLang) {
      logTest('accessibility', 'HTML lang attribute', 'PASS');
    } else {
      logTest('accessibility', 'HTML lang attribute', 'FAIL', 'Missing lang attribute on <html>');
    }

    // Check for skip link
    const skipLink = await page.$('a[href="#main"], a[href="#content"]');
    if (skipLink) {
      logTest('accessibility', 'Skip to main content link', 'PASS');
    } else {
      logTest('accessibility', 'Skip to main content link', 'WARN', 'No skip link found');
    }

  } catch (error) {
    logTest('accessibility', 'Accessibility testing', 'FAIL', error.message);
  }

  await page.close();
}

// Test specific functionality
async function testFunctionality(browser, baseUrl) {
  console.log('\n⚙️ Testing Functionality...\n');
  const page = await browser.newPage();

  try {
    // Test search functionality
    await page.goto(`${baseUrl}/chicago/browse`, { waitUntil: 'networkidle2', timeout: 30000 });

    const searchInput = await page.$('input[type="search"], input[placeholder*="search" i]');
    if (searchInput) {
      await searchInput.type('test');
      await page.waitForTimeout(1000);
      logTest('functionality', 'Search input accepts text', 'PASS');

      // Check if search results update
      const resultsExist = await page.$('[role="list"], .products, .results');
      if (resultsExist) {
        logTest('functionality', 'Search results area exists', 'PASS');
      } else {
        logTest('functionality', 'Search results area exists', 'WARN', 'No results container found');
      }
    } else {
      logTest('functionality', 'Search functionality', 'WARN', 'No search input found');
    }

    // Test filter/sort functionality
    const filterButtons = await page.$$('button[role="combobox"], select, [role="listbox"]');
    if (filterButtons.length > 0) {
      logTest('functionality', 'Filter/sort controls', 'PASS', `${filterButtons.length} controls found`);
    } else {
      logTest('functionality', 'Filter/sort controls', 'WARN', 'No filter controls found');
    }

    // Test clicking on a product card (if exists)
    const productCard = await page.$('[data-testid*="product"], .product-card, article a');
    if (productCard) {
      logTest('functionality', 'Product cards exist', 'PASS');

      try {
        await productCard.click();
        await page.waitForNavigation({ timeout: 5000 });
        logTest('functionality', 'Product card click navigation', 'PASS');
      } catch (error) {
        logTest('functionality', 'Product card click navigation', 'WARN', 'Navigation did not occur or timed out');
      }
    } else {
      logTest('functionality', 'Product cards exist', 'WARN', 'No product cards found');
    }

  } catch (error) {
    logTest('functionality', 'Functionality testing', 'FAIL', error.message);
  }

  await page.close();
}

// Test authentication flows
async function testAuthentication(browser, baseUrl) {
  console.log('\n🔐 Testing Authentication...\n');
  const page = await browser.newPage();

  try {
    // Test login page
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle2', timeout: 30000 });

    // Check for "Forgot Password" link
    const forgotPasswordLink = await page.$('a[href*="forgot"], a[href*="reset"], button:has-text("Forgot")');
    if (forgotPasswordLink) {
      logTest('authentication', 'Forgot password link exists', 'PASS');
    } else {
      logTest('authentication', 'Forgot password link exists', 'FAIL', 'No forgot password option found');
    }

    // Check for signup link on login page
    const signupLink = await page.$('a[href*="signup"], a[href*="register"]');
    if (signupLink) {
      logTest('authentication', 'Signup link on login page', 'PASS');
    } else {
      logTest('authentication', 'Signup link on login page', 'WARN', 'No link to signup from login page');
    }

    // Test signup page
    await page.goto(`${baseUrl}/signup`, { waitUntil: 'networkidle2', timeout: 30000 });

    // Check for login link on signup page
    const loginLink = await page.$('a[href*="login"]');
    if (loginLink) {
      logTest('authentication', 'Login link on signup page', 'PASS');
    } else {
      logTest('authentication', 'Login link on signup page', 'WARN', 'No link to login from signup page');
    }

    // Check for password requirements display
    const passwordRequirements = await page.$('[class*="requirement"], [class*="password-help"], .text-xs, .text-sm');
    if (passwordRequirements) {
      logTest('authentication', 'Password requirements displayed', 'PASS');
    } else {
      logTest('authentication', 'Password requirements displayed', 'WARN', 'No visible password requirements');
    }

    // Check for terms/privacy policy links
    const termsLink = await page.$('a[href*="terms"]');
    const privacyLink = await page.$('a[href*="privacy"]');

    if (termsLink) {
      logTest('authentication', 'Terms of service link', 'PASS');
    } else {
      logTest('authentication', 'Terms of service link', 'FAIL', 'Missing terms link on signup');
    }

    if (privacyLink) {
      logTest('authentication', 'Privacy policy link', 'PASS');
    } else {
      logTest('authentication', 'Privacy policy link', 'FAIL', 'Missing privacy link on signup');
    }

  } catch (error) {
    logTest('authentication', 'Authentication testing', 'FAIL', error.message);
  }

  await page.close();
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Comprehensive Testing Suite for Craft Chicago Finds\n');
  console.log('================================================\n');

  const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
  console.log(`Testing URL: ${baseUrl}\n`);

  // Create screenshots directory
  const screenshotsDir = path.join(process.cwd(), 'test-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    // Run all test suites
    await testNavigation(browser, baseUrl);
    await testLinks(browser, baseUrl);
    await testForms(browser, baseUrl);
    await testAuthentication(browser, baseUrl);
    await testUIUX(browser, baseUrl);
    await testFunctionality(browser, baseUrl);
    await testPerformance(browser, baseUrl);
    await testResponsiveness(browser, baseUrl);
    await testAccessibility(browser, baseUrl);

  } catch (error) {
    console.error('❌ Fatal error during testing:', error);
  } finally {
    await browser.close();
  }

  // Generate report
  console.log('\n\n================================================');
  console.log('📊 TEST SUMMARY');
  console.log('================================================\n');
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`✅ Passed: ${testResults.summary.passed}`);
  console.log(`❌ Failed: ${testResults.summary.failed}`);
  console.log(`⚠️  Warnings: ${testResults.summary.warnings}`);
  console.log(`\nSuccess Rate: ${Math.round((testResults.summary.passed / testResults.summary.total) * 100)}%`);

  // Save detailed report
  const reportPath = path.join(process.cwd(), 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  // Generate markdown report
  generateMarkdownReport(testResults);

  console.log('\n🏁 Testing complete!\n');
}

// Generate markdown report
function generateMarkdownReport(results) {
  let markdown = `# Craft Chicago Finds - Comprehensive Testing Report\n\n`;
  markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `- **Total Tests:** ${results.summary.total}\n`;
  markdown += `- **✅ Passed:** ${results.summary.passed}\n`;
  markdown += `- **❌ Failed:** ${results.summary.failed}\n`;
  markdown += `- **⚠️ Warnings:** ${results.summary.warnings}\n`;
  markdown += `- **Success Rate:** ${Math.round((results.summary.passed / results.summary.total) * 100)}%\n\n`;

  markdown += `## Production Readiness Checklist\n\n`;

  const criticalIssues = [];
  const warnings = [];

  for (const [category, tests] of Object.entries(results.categories)) {
    const failed = tests.filter(t => t.status === 'FAIL');
    const warned = tests.filter(t => t.status === 'WARN');

    if (failed.length > 0) {
      criticalIssues.push({ category, issues: failed });
    }
    if (warned.length > 0) {
      warnings.push({ category, issues: warned });
    }
  }

  if (criticalIssues.length > 0) {
    markdown += `### ❌ Critical Issues (Must Fix Before Launch)\n\n`;
    for (const { category, issues } of criticalIssues) {
      markdown += `#### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
      for (const issue of issues) {
        markdown += `- **${issue.test}**: ${issue.details}\n`;
      }
      markdown += `\n`;
    }
  }

  if (warnings.length > 0) {
    markdown += `### ⚠️ Warnings (Recommended to Fix)\n\n`;
    for (const { category, issues } of warnings) {
      markdown += `#### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
      for (const issue of issues) {
        markdown += `- **${issue.test}**: ${issue.details}\n`;
      }
      markdown += `\n`;
    }
  }

  markdown += `## Detailed Results by Category\n\n`;

  for (const [category, tests] of Object.entries(results.categories)) {
    if (tests.length === 0) continue;

    markdown += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
    markdown += `| Test | Status | Details |\n`;
    markdown += `|------|--------|----------|\n`;

    for (const test of tests) {
      const emoji = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
      markdown += `| ${test.test} | ${emoji} ${test.status} | ${test.details || '-'} |\n`;
    }
    markdown += `\n`;
  }

  markdown += `## Recommendations for November 1st Launch\n\n`;
  markdown += `1. **Critical**: Fix all ❌ FAIL items before going live\n`;
  markdown += `2. **High Priority**: Address ⚠️ WARN items that impact user experience\n`;
  markdown += `3. **Testing**: Conduct manual testing of all critical user flows\n`;
  markdown += `4. **Performance**: Monitor and optimize any slow-loading pages\n`;
  markdown += `5. **Accessibility**: Ensure WCAG compliance for inclusive experience\n`;
  markdown += `6. **Mobile**: Test thoroughly on real mobile devices\n`;
  markdown += `7. **Security**: Verify all authentication and authorization flows\n`;
  markdown += `8. **Legal**: Ensure Terms of Service and Privacy Policy are complete\n\n`;

  const reportPath = path.join(process.cwd(), 'TESTING-REPORT.md');
  fs.writeFileSync(reportPath, markdown);
  console.log(`📝 Markdown report saved to: ${reportPath}`);
}

// Run the tests
runTests().catch(console.error);
