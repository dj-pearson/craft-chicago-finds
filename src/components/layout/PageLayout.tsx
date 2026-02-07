/**
 * PageLayout Component
 * Provides consistent page structure with accessibility landmarks
 * WCAG 2.4.1 - Bypass Blocks compliance
 */

import { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LiveRegion } from '@/components/accessibility/LiveRegion';

interface PageLayoutProps {
  children: ReactNode;
  /** Page title announced to screen readers on navigation */
  pageTitle?: string;
  /** Whether to show the header */
  showHeader?: boolean;
  /** Whether to show the footer */
  showFooter?: boolean;
  /** Additional CSS classes for the main content area */
  mainClassName?: string;
  /** Whether this is a full-width layout (no container) */
  fullWidth?: boolean;
}

export function PageLayout({
  children,
  pageTitle,
  showHeader = true,
  showFooter = true,
  mainClassName = '',
  fullWidth = false,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Live region for page navigation announcements */}
      {pageTitle && (
        <LiveRegion message={`Navigated to ${pageTitle}`} politeness="polite" />
      )}

      {showHeader && <Header />}

      <main
        id="main-content"
        role="main"
        tabIndex={-1}
        className={`flex-1 focus:outline-none ${mainClassName}`}
        aria-label={pageTitle || 'Main content'}
      >
        {fullWidth ? children : (
          <div className="container mx-auto px-4">
            {children}
          </div>
        )}
      </main>

      {showFooter && <Footer />}
    </div>
  );
}

export default PageLayout;
