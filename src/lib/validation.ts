/**
 * Input Validation Schemas
 * Centralized validation rules using Zod
 */

import { z } from 'zod';

/**
 * Common weak passwords list
 * Top 100 most commonly used passwords that should be blocked
 */
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '123456', '12345678', '123456789',
  '1234567890', 'qwerty', 'qwerty123', 'abc123', 'letmein', 'welcome',
  'monkey', 'dragon', 'master', 'login', 'princess', 'sunshine',
  'passw0rd', 'shadow', 'admin', 'admin123', 'root', 'toor',
  'administrator', 'changeme', 'guest', 'default', 'test', 'test123',
  'qazwsx', 'trustno1', 'iloveyou', 'football', 'baseball', 'basketball',
  'soccer', 'hockey', 'batman', 'superman', 'starwars', 'harrypotter',
  'pokemon', 'whatever', 'nothing', 'secret', 'access', 'password!',
  'summer', 'winter', 'spring', 'autumn', 'fall', 'january', 'february',
  'march', 'april', 'may', 'june', 'july', 'august', 'september',
  'october', 'november', 'december', 'monday', 'tuesday', 'wednesday',
  'thursday', 'friday', 'saturday', 'sunday', 'computer', 'internet',
  'freedom', 'america', 'jesus', 'heaven', 'love', 'money', 'power',
  '654321', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1q2w3e4r', '1qaz2wsx',
  'passpass', 'pass1234', 'p@ssw0rd', 'p@ssword', 'P@ssw0rd', 'Password1',
  'letmein1', 'welcome1', 'admin1', 'user', 'user123', 'guest123',
  'password1!', 'Password1!', 'Passw0rd!', 'Welcome1!', 'Qwerty123!',
]);

/**
 * Check if password is in the common passwords list
 */
function isCommonPassword(password: string): boolean {
  const normalizedPassword = password.toLowerCase();
  return COMMON_PASSWORDS.has(normalizedPassword);
}

/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';

/**
 * Password strength result with details
 */
export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number; // 0-100
  feedback: string[];
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
    notCommon: boolean;
  };
}

/**
 * Calculate password strength with detailed feedback
 */
export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    notCommon: !isCommonPassword(password),
  };

  const feedback: string[] = [];
  let score = 0;

  // Base score from requirements
  if (requirements.length) score += 15;
  else feedback.push('Use at least 8 characters');

  if (requirements.uppercase) score += 15;
  else feedback.push('Add an uppercase letter');

  if (requirements.lowercase) score += 15;
  else feedback.push('Add a lowercase letter');

  if (requirements.number) score += 15;
  else feedback.push('Add a number');

  if (requirements.special) score += 15;
  else feedback.push('Add a special character (!@#$%^&*...)');

  if (!requirements.notCommon) {
    feedback.push('Avoid common passwords');
    score = Math.max(0, score - 30);
  }

  // Bonus points for length beyond minimum
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 5;
  if (password.length >= 20) score += 5;

  // Penalty for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 10);
    feedback.push('Avoid repeated characters');
  }

  // Penalty for sequential characters
  if (/012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) {
    score = Math.max(0, score - 10);
    feedback.push('Avoid sequential characters');
  }

  // Cap score at 100
  score = Math.min(100, score);

  // Determine strength level
  let strength: PasswordStrength;
  if (score < 30) strength = 'weak';
  else if (score < 50) strength = 'fair';
  else if (score < 70) strength = 'good';
  else if (score < 90) strength = 'strong';
  else strength = 'very-strong';

  return {
    strength,
    score,
    feedback,
    requirements,
  };
}

/**
 * Common validators
 */
export const validators = {
  email: z.string().email({ message: 'Invalid email address' }).max(255),
  
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(128, { message: 'Password must be less than 128 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, { message: 'Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)' })
    .refine(
      (password) => !isCommonPassword(password),
      { message: 'This password is too common. Please choose a more secure password.' }
    ),

  displayName: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name must be less than 100 characters' })
    .regex(/^[a-zA-Z0-9\s._-]+$/, { message: 'Name contains invalid characters' }),

  url: z
    .string()
    .url({ message: 'Invalid URL' })
    .max(2048, { message: 'URL is too long' })
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      { message: 'URL must use HTTP or HTTPS protocol' }
    ),

  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' }),

  price: z
    .number()
    .positive({ message: 'Price must be positive' })
    .max(1000000, { message: 'Price is too high' })
    .refine((val) => Number.isFinite(val), { message: 'Price must be a valid number' }),

  slug: z
    .string()
    .min(1, { message: 'Slug is required' })
    .max(100, { message: 'Slug must be less than 100 characters' })
    .regex(/^[a-z0-9-]+$/, { message: 'Slug must contain only lowercase letters, numbers, and hyphens' }),

  searchQuery: z
    .string()
    .max(200, { message: 'Search query is too long' })
    .transform((val) => val.trim()),

  description: z
    .string()
    .max(5000, { message: 'Description must be less than 5000 characters' })
    .transform((val) => val.trim()),

  title: z
    .string()
    .min(3, { message: 'Title must be at least 3 characters' })
    .max(200, { message: 'Title must be less than 200 characters' })
    .transform((val) => val.trim()),
};

/**
 * User profile validation
 */
export const profileSchema = z.object({
  displayName: validators.displayName,
  bio: z.string().max(500, { message: 'Bio must be less than 500 characters' }).optional(),
  location: z.string().max(100, { message: 'Location must be less than 100 characters' }).optional(),
  website: validators.url.optional().or(z.literal('')),
});

/**
 * Listing creation validation
 */
export const listingSchema = z.object({
  title: validators.title,
  description: validators.description,
  price: validators.price,
  categoryId: z.string().uuid({ message: 'Invalid category ID' }),
  inventoryCount: z.number().int().min(0, { message: 'Inventory must be 0 or greater' }).optional(),
  tags: z.array(z.string().max(50)).max(10, { message: 'Maximum 10 tags allowed' }).optional(),
  localPickupAvailable: z.boolean().optional(),
  shippingAvailable: z.boolean().optional(),
  pickupLocation: z.string().max(200).optional(),
});

/**
 * Contact form validation
 */
export const contactSchema = z.object({
  name: validators.displayName,
  email: validators.email,
  subject: z.string().min(3).max(200),
  message: z.string().min(10, { message: 'Message must be at least 10 characters' }).max(2000),
});

/**
 * Search validation
 */
export const searchSchema = z.object({
  query: validators.searchQuery,
  categoryId: z.string().uuid().optional(),
  cityId: z.string().uuid().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'date_desc', 'date_asc', 'relevance']).optional(),
}).refine(
  (data) => {
    if (data.minPrice && data.maxPrice) {
      return data.minPrice <= data.maxPrice;
    }
    return true;
  },
  { message: 'Minimum price must be less than maximum price' }
);

/**
 * Review validation
 */
export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5, { message: 'Rating must be between 1 and 5' }),
  title: z.string().min(3).max(100),
  content: z.string().min(10, { message: 'Review must be at least 10 characters' }).max(1000),
  orderId: z.string().uuid(),
});

/**
 * Message validation
 */
export const messageSchema = z.object({
  content: z.string().min(1, { message: 'Message cannot be empty' }).max(2000),
  recipientId: z.string().uuid({ message: 'Invalid recipient ID' }),
  listingId: z.string().uuid({ message: 'Invalid listing ID' }).optional(),
});

/**
 * Checkout validation
 */
export const checkoutSchema = z.object({
  shippingAddress: z.object({
    line1: z.string().min(5).max(200),
    line2: z.string().max(200).optional(),
    city: z.string().min(2).max(100),
    state: z.string().length(2, { message: 'State must be 2 characters (e.g., IL)' }),
    postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, { message: 'Invalid ZIP code' }),
    country: z.string().length(2).default('US'),
  }),
  billingAddress: z.object({
    line1: z.string().min(5).max(200),
    line2: z.string().max(200).optional(),
    city: z.string().min(2).max(100),
    state: z.string().length(2),
    postalCode: z.string().regex(/^\d{5}(-\d{4})?$/),
    country: z.string().length(2).default('US'),
  }).optional(),
  phone: validators.phone,
});

/**
 * Newsletter subscription validation
 */
export const newsletterSchema = z.object({
  email: validators.email,
  name: validators.displayName.optional(),
});

/**
 * Validate data with a schema
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
  };
}
