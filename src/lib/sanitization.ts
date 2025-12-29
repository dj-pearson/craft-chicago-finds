/**
 * Input Sanitization Library
 * Prevents XSS, SQL injection, and other security vulnerabilities
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Use this for any user-generated content that needs to be rendered as HTML
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}

// Whitelist of safe CSS classes for rich text content
// Only these classes are allowed to prevent CSS injection attacks
const SAFE_CSS_CLASSES = [
  'text-center', 'text-left', 'text-right',
  'font-bold', 'font-italic', 'font-semibold',
  'text-sm', 'text-base', 'text-lg', 'text-xl',
  'mt-2', 'mt-4', 'mb-2', 'mb-4', 'my-2', 'my-4',
  'ml-2', 'ml-4', 'mr-2', 'mr-4', 'mx-2', 'mx-4',
  'p-2', 'p-4', 'px-2', 'px-4', 'py-2', 'py-4',
  'rounded', 'rounded-md', 'rounded-lg',
  'border', 'border-gray-200', 'border-gray-300',
  'bg-gray-50', 'bg-gray-100',
  'list-disc', 'list-decimal',
  'underline', 'line-through', 'italic',
];

/**
 * Sanitize CSS class attribute to only allow whitelisted classes
 * Prevents CSS injection attacks via arbitrary class names
 */
function sanitizeClasses(node: Element): void {
  const classAttr = node.getAttribute('class');
  if (!classAttr) return;

  const classes = classAttr.split(/\s+/).filter(Boolean);
  const safeClasses = classes.filter(cls => SAFE_CSS_CLASSES.includes(cls));

  if (safeClasses.length > 0) {
    node.setAttribute('class', safeClasses.join(' '));
  } else {
    node.removeAttribute('class');
  }
}

/**
 * Sanitize rich text content (for blog posts, descriptions)
 * More permissive than sanitizeHtml but still safe
 * Uses a whitelist approach for CSS classes to prevent CSS injection
 */
export function sanitizeRichText(dirty: string): string {
  // First pass: sanitize with DOMPurify allowing class attribute
  const sanitized = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'span', 'div',
      'b', 'i', 'em', 'strong', 'u', 's',
      'a', 'img',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
  });

  // Second pass: filter class attributes to only allow whitelisted classes
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = sanitized;

  // Process all elements with class attributes
  const elementsWithClass = tempDiv.querySelectorAll('[class]');
  elementsWithClass.forEach(sanitizeClasses);

  return tempDiv.innerHTML;
}

/**
 * Strip all HTML tags - use for plain text fields
 */
export function stripHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}

/**
 * Sanitize user input for database storage
 * Trims whitespace and removes control characters
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Sanitize phone number - removes all non-digit characters
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Sanitize URL to prevent javascript: and data: URIs
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  
  // Block javascript: and data: URIs
  if (
    trimmed.toLowerCase().startsWith('javascript:') ||
    trimmed.toLowerCase().startsWith('data:') ||
    trimmed.toLowerCase().startsWith('vbscript:')
  ) {
    return '';
  }
  
  // Ensure URL has a protocol
  if (!trimmed.match(/^https?:\/\//i)) {
    return `https://${trimmed}`;
  }
  
  return trimmed;
}

/**
 * Sanitize search query
 * Prevents SQL injection and special character attacks
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
    .substring(0, 200); // Limit length
}

/**
 * Sanitize slug for URLs
 */
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .substring(0, 100); // Limit length
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: string | number): number | null {
  const num = typeof input === 'string' ? parseFloat(input) : input;
  return isNaN(num) || !isFinite(num) ? null : num;
}

/**
 * Sanitize price input (ensures 2 decimal places)
 */
export function sanitizePrice(input: string | number): number | null {
  const num = sanitizeNumber(input);
  if (num === null || num < 0) return null;
  return Math.round(num * 100) / 100;
}

/**
 * Sanitize JSON input
 * Safely parse JSON and handle errors
 */
export function sanitizeJson<T = any>(input: string): T | null {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

/**
 * Sanitize object keys and values recursively
 * Useful for form data before sending to API
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: {
    sanitizeStrings?: boolean;
    stripHtml?: boolean;
    maxDepth?: number;
  } = {}
): T {
  const { sanitizeStrings = true, stripHtml: shouldStripHtml = false, maxDepth = 10 } = options;

  function sanitizeValue(value: any, depth: number): any {
    if (depth > maxDepth) return value;

    if (typeof value === 'string') {
      if (shouldStripHtml) {
        return stripHtml(value);
      }
      if (sanitizeStrings) {
        return sanitizeInput(value);
      }
      return value;
    }

    if (Array.isArray(value)) {
      return value.map(item => sanitizeValue(item, depth + 1));
    }

    if (value !== null && typeof value === 'object') {
      const sanitized: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val, depth + 1);
      }
      return sanitized;
    }

    return value;
  }

  return sanitizeValue(obj, 0) as T;
}

/**
 * Validate and sanitize external URL
 * Only allows http/https protocols
 */
export function validateExternalUrl(url: string): { valid: boolean; sanitized: string; error?: string } {
  try {
    const sanitized = sanitizeUrl(url);
    if (!sanitized) {
      return { valid: false, sanitized: '', error: 'Invalid URL protocol' };
    }

    const parsed = new URL(sanitized);
    
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, sanitized: '', error: 'Only HTTP/HTTPS URLs are allowed' };
    }

    return { valid: true, sanitized: parsed.href };
  } catch (error) {
    return { valid: false, sanitized: '', error: 'Invalid URL format' };
  }
}

/**
 * Escape special characters for use in RegExp
 */
export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Prevent ReDoS (Regular Expression Denial of Service)
 * Limits input length for regex operations
 */
export function safeLengthForRegex(input: string, maxLength: number = 1000): string {
  return input.substring(0, maxLength);
}

/**
 * Sanitize CSV input (prevents formula injection)
 */
export function sanitizeCsvCell(cell: string): string {
  const trimmed = cell.trim();
  
  // Prevent formula injection in Excel/Google Sheets
  if (trimmed.match(/^[=+\-@]/)) {
    return `'${trimmed}`;
  }
  
  return trimmed;
}

/**
 * Sanitize file path to prevent directory traversal
 */
export function sanitizeFilePath(path: string): string {
  return path
    .replace(/\.\./g, '') // Remove ..
    .replace(/[\/\\]/g, '-') // Replace path separators
    .replace(/[^\w.-]/g, '') // Keep only safe characters
    .substring(0, 255); // Limit length
}
