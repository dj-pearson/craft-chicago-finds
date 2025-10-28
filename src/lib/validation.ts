/**
 * Input Validation Schemas
 * Centralized validation rules using Zod
 */

import { z } from 'zod';

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
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),

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
