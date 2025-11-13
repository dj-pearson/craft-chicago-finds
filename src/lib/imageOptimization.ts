/**
 * Image Optimization Utilities
 *
 * Provides helpers for generating responsive images with WebP support
 * and proper srcset/sizes attributes.
 */

interface ResponsiveImageOptions {
  src: string;
  widths?: number[];
  format?: 'webp' | 'original';
  quality?: number;
}

interface ResponsiveImageResult {
  src: string;
  srcSet?: string;
  sizes?: string;
}

/**
 * Generate srcset string for responsive images using Cloudflare Image Resizing
 *
 * @example
 * generateSrcSet({
 *   src: 'https://example.com/image.jpg',
 *   widths: [400, 800, 1200]
 * })
 * // Returns: "/cdn-cgi/image/width=400.../image.jpg 400w, ..."
 */
export function generateSrcSet({
  src,
  widths = [400, 800, 1200, 1600],
  format = 'auto',
  quality = 85
}: ResponsiveImageOptions): string {
  return widths
    .map(width => {
      const optimizedUrl = getOptimizedImageUrl(src, {
        width,
        format: format as 'webp' | 'avif' | 'jpg' | 'png' | 'auto',
        quality
      });
      return `${optimizedUrl} ${width}w`;
    })
    .join(', ');
}

/**
 * Generate responsive image props for common use cases
 *
 * @example
 * <LazyImage {...getResponsiveImage('https://example.com/image.jpg', 'product')} alt="Product" />
 */
export function getResponsiveImage(
  src: string,
  preset: 'thumbnail' | 'product' | 'hero' | 'avatar' = 'product'
): ResponsiveImageResult {
  const presets = {
    thumbnail: {
      widths: [150, 300],
      sizes: '(max-width: 640px) 150px, 300px'
    },
    avatar: {
      widths: [48, 96, 144],
      sizes: '(max-width: 640px) 48px, (max-width: 1024px) 96px, 144px'
    },
    product: {
      widths: [400, 800, 1200],
      sizes: '(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px'
    },
    hero: {
      widths: [800, 1200, 1600, 2000],
      sizes: '100vw'
    }
  };

  const config = presets[preset];

  return {
    src,
    srcSet: generateSrcSet({ src, widths: config.widths }),
    sizes: config.sizes
  };
}

/**
 * Check if image URL supports transformation (Supabase Storage, Cloudflare Images, etc.)
 */
export function supportsTransformation(url: string): boolean {
  return (
    url.includes('supabase') ||
    url.includes('cloudflare') ||
    url.includes('imagedelivery')
  );
}

/**
 * Get optimized image URL with Cloudflare Image Resizing
 *
 * @example
 * getOptimizedImageUrl('image.jpg', { width: 800, format: 'webp' })
 */
export function getOptimizedImageUrl(
  src: string,
  options: {
    width?: number;
    height?: number;
    format?: 'webp' | 'avif' | 'jpg' | 'png' | 'auto';
    quality?: number;
    fit?: 'cover' | 'contain' | 'scale-down' | 'crop' | 'pad';
    gravity?: 'auto' | 'center' | 'left' | 'right' | 'top' | 'bottom';
  } = {}
): string {
  // Default to WebP for better compression
  const {
    width,
    height,
    format = 'auto',
    quality = 85,
    fit = 'scale-down',
    gravity = 'auto'
  } = options;

  try {
    // For external URLs or Supabase storage, use Cloudflare Image Resizing
    // Cloudflare Image Resizing URL format:
    // https://yourdomain.com/cdn-cgi/image/{options}/{source-url}

    const params: string[] = [];

    if (width) params.push(`width=${width}`);
    if (height) params.push(`height=${height}`);
    if (format) params.push(`format=${format}`);
    if (quality) params.push(`quality=${quality}`);
    if (fit) params.push(`fit=${fit}`);
    if (gravity) params.push(`gravity=${gravity}`);

    // Always add these for better performance
    params.push('anim=false'); // Disable animation for static images
    params.push('sharpen=1'); // Light sharpening

    const optionsString = params.join(',');

    // If it's already an absolute URL, use it directly
    if (src.startsWith('http://') || src.startsWith('https://')) {
      // Use Cloudflare Image Resizing proxy
      return `/cdn-cgi/image/${optionsString}/${src}`;
    }

    // For relative URLs, make them absolute first
    const absoluteUrl = new URL(src, window.location.origin).toString();
    return `/cdn-cgi/image/${optionsString}/${absoluteUrl}`;

  } catch (error) {
    console.warn('Failed to generate optimized image URL:', error);
    return src;
  }
}

/**
 * Preload critical images for better LCP
 *
 * @example
 * preloadImage('hero-image.jpg', { as: 'image', fetchpriority: 'high' })
 */
export function preloadImage(
  src: string,
  options: {
    as?: 'image';
    fetchpriority?: 'high' | 'low' | 'auto';
    type?: string;
  } = {}
): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = src;
  link.as = options.as || 'image';

  if (options.fetchpriority) {
    link.setAttribute('fetchpriority', options.fetchpriority);
  }

  if (options.type) {
    link.type = options.type;
  }

  document.head.appendChild(link);
}

/**
 * Calculate image dimensions while maintaining aspect ratio
 */
export function calculateAspectRatio(
  originalWidth: number,
  originalHeight: number,
  targetWidth?: number,
  targetHeight?: number
): { width: number; height: number } {
  if (targetWidth && targetHeight) {
    return { width: targetWidth, height: targetHeight };
  }

  const aspectRatio = originalWidth / originalHeight;

  if (targetWidth) {
    return {
      width: targetWidth,
      height: Math.round(targetWidth / aspectRatio)
    };
  }

  if (targetHeight) {
    return {
      width: Math.round(targetHeight * aspectRatio),
      height: targetHeight
    };
  }

  return { width: originalWidth, height: originalHeight };
}
