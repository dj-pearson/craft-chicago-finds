/**
 * Skip Links Component
 * Allows keyboard users to skip to main content
 */

import { useEffect } from 'react';

interface SkipLink {
  id: string;
  label: string;
}

const skipLinks: SkipLink[] = [
  { id: 'main-content', label: 'Skip to main content' },
  { id: 'main-navigation', label: 'Skip to navigation' },
  { id: 'footer', label: 'Skip to footer' },
];

export function SkipLinks() {
  useEffect(() => {
    // Ensure main content has proper landmark
    const mainContent = document.getElementById('main-content');
    if (mainContent && !mainContent.hasAttribute('role')) {
      mainContent.setAttribute('role', 'main');
    }
  }, []);

  const handleSkipClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    
    if (target) {
      // Make target focusable if it isn't already
      if (!target.hasAttribute('tabindex')) {
        target.tabIndex = -1;
      }
      
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="skip-links">
      {skipLinks.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          className="skip-link"
          onClick={(e) => handleSkipClick(e, id)}
        >
          {label}
        </a>
      ))}
    </div>
  );
}
