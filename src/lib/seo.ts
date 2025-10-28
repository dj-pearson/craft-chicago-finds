/**
 * SEO Utilities
 * Helper functions for SEO optimization
 */

/**
 * Generate meta description from content
 */
export function generateMetaDescription(content: string, maxLength: number = 160): string {
  // Remove HTML tags
  const text = content.replace(/<[^>]*>/g, '');
  
  // Remove extra whitespace
  const cleaned = text.replace(/\s+/g, ' ').trim();
  
  // Truncate to max length
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  // Find last complete sentence within limit
  const truncated = cleaned.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastPeriod > maxLength - 50) {
    return truncated.substring(0, lastPeriod + 1);
  }
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Generate URL slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Extract keywords from content
 */
export function extractKeywords(content: string, maxKeywords: number = 10): string[] {
  // Remove HTML tags and common words
  const text = content.replace(/<[^>]*>/g, '').toLowerCase();
  
  // Common stop words to exclude
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
  ]);
  
  // Split into words and filter
  const words = text
    .split(/\W+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
  
  // Count word frequency
  const frequency = new Map<string, number>();
  words.forEach(word => {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  });
  
  // Sort by frequency and return top keywords
  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

/**
 * Validate meta description length
 */
export function isValidMetaDescription(description: string): {
  valid: boolean;
  length: number;
  message?: string;
} {
  const length = description.length;
  
  if (length < 50) {
    return {
      valid: false,
      length,
      message: 'Meta description too short (minimum 50 characters)',
    };
  }
  
  if (length > 160) {
    return {
      valid: false,
      length,
      message: 'Meta description too long (maximum 160 characters)',
    };
  }
  
  return { valid: true, length };
}

/**
 * Validate page title length
 */
export function isValidPageTitle(title: string): {
  valid: boolean;
  length: number;
  message?: string;
} {
  const length = title.length;
  
  if (length < 30) {
    return {
      valid: false,
      length,
      message: 'Title too short (minimum 30 characters)',
    };
  }
  
  if (length > 60) {
    return {
      valid: false,
      length,
      message: 'Title too long (maximum 60 characters)',
    };
  }
  
  return { valid: true, length };
}

/**
 * Calculate SEO score for content
 */
export function calculateSEOScore(params: {
  title: string;
  description: string;
  headings: string[];
  content: string;
  images: { alt: string }[];
  links: { text: string; url: string }[];
}): {
  score: number;
  issues: string[];
  suggestions: string[];
} {
  let score = 0;
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Title validation (25 points)
  const titleValidation = isValidPageTitle(params.title);
  if (titleValidation.valid) {
    score += 25;
  } else {
    issues.push(titleValidation.message!);
  }
  
  // Description validation (25 points)
  const descValidation = isValidMetaDescription(params.description);
  if (descValidation.valid) {
    score += 25;
  } else {
    issues.push(descValidation.message!);
  }
  
  // Heading structure (20 points)
  if (params.headings.length > 0) {
    score += 10;
    if (params.headings.length >= 3) {
      score += 10;
    } else {
      suggestions.push('Add more headings for better structure');
    }
  } else {
    issues.push('No headings found');
  }
  
  // Content length (15 points)
  const wordCount = params.content.split(/\s+/).length;
  if (wordCount >= 300) {
    score += 15;
  } else if (wordCount >= 150) {
    score += 10;
    suggestions.push('Add more content (target: 300+ words)');
  } else {
    issues.push('Content too short (minimum 150 words)');
  }
  
  // Images with alt text (10 points)
  const imagesWithAlt = params.images.filter(img => img.alt).length;
  if (params.images.length > 0) {
    const altRatio = imagesWithAlt / params.images.length;
    score += Math.round(10 * altRatio);
    
    if (altRatio < 1) {
      issues.push(`${params.images.length - imagesWithAlt} images missing alt text`);
    }
  }
  
  // Internal links (5 points)
  const internalLinks = params.links.filter(link => 
    !link.url.startsWith('http') || link.url.includes('craftlocal.net')
  );
  
  if (internalLinks.length >= 3) {
    score += 5;
  } else if (internalLinks.length > 0) {
    score += 3;
    suggestions.push('Add more internal links');
  } else {
    suggestions.push('Add internal links to related content');
  }
  
  return { score, issues, suggestions };
}

/**
 * Generate Open Graph image URL
 */
export function generateOGImageUrl(params: {
  title: string;
  description?: string;
  image?: string;
}): string {
  // In production, this would call an OG image generation service
  // For now, return default or provided image
  return params.image || '/og-image-default.jpg';
}

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(path: string, baseUrl: string = 'https://craftlocal.net'): string {
  // Remove trailing slash
  const cleanPath = path.replace(/\/$/, '');
  
  // Remove query parameters for canonical
  const pathWithoutQuery = cleanPath.split('?')[0];
  
  return `${baseUrl}${pathWithoutQuery}`;
}

/**
 * Check if URL should be indexed
 */
export function shouldIndexPage(path: string): boolean {
  const noIndexPatterns = [
    '/admin',
    '/dashboard',
    '/auth',
    '/checkout',
    '/cart',
    '/messages',
    '/orders',
    '/profile/edit',
  ];
  
  return !noIndexPatterns.some(pattern => path.startsWith(pattern));
}
