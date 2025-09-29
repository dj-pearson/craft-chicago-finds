import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  loading?: "lazy" | "eager";
  quality?: number;
  sizes?: string;
  priority?: boolean;
  onHover?: boolean; // Enable hover prefetch
  skeleton?: boolean; // Show skeleton while loading
}

// Generate optimized image URLs with different sizes and formats
const generateImageSrcSet = (originalUrl: string, quality: number = 85) => {
  // Extract file extension and name
  const urlParts = originalUrl.split('.');
  const extension = urlParts.pop() || 'jpg';
  const baseUrl = urlParts.join('.');
  
  // Generate WebP and fallback versions at different sizes
  const sizes = [400, 800, 1200, 1600];
  
  const webpSrcSet = sizes
    .map(size => `${baseUrl}_${size}w.webp ${size}w`)
    .join(', ');
  
  const fallbackSrcSet = sizes
    .map(size => `${baseUrl}_${size}w.${extension} ${size}w`)
    .join(', ');
  
  return {
    webpSrcSet,
    fallbackSrcSet,
    defaultSrc: `${baseUrl}_800w.${extension}` // Default fallback
  };
};

export const OptimizedImage = ({
  src,
  alt,
  className,
  fallback,
  loading = "lazy",
  quality = 85,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority = false,
  onHover = false,
  skeleton = true,
  ...props
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [isHovered, setIsHovered] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || loading === "eager") {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px", // Start loading 100px before the image comes into view
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, loading]);

  // Hover prefetch
  useEffect(() => {
    if (!onHover || !isHovered || isLoaded) return;

    const prefetchImage = new Image();
    prefetchImage.src = src;
  }, [isHovered, onHover, src, isLoaded]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  const handleMouseEnter = () => {
    if (onHover) {
      setIsHovered(true);
    }
  };

  const shouldLoad = isInView || priority;
  const { webpSrcSet, fallbackSrcSet, defaultSrc } = generateImageSrcSet(src, quality);

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      onMouseEnter={handleMouseEnter}
    >
      {shouldLoad && (
        <picture>
          {/* WebP format for modern browsers */}
          <source 
            srcSet={webpSrcSet} 
            sizes={sizes} 
            type="image/webp" 
          />
          
          {/* Fallback format */}
          <source 
            srcSet={fallbackSrcSet} 
            sizes={sizes} 
          />
          
          {/* Final fallback image */}
          <img
            ref={imgRef}
            src={defaultSrc}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            loading={loading}
            className={cn(
              "transition-opacity duration-300 w-full h-full object-cover",
              isLoaded ? "opacity-100" : "opacity-0",
              hasError && "hidden"
            )}
            {...props}
          />
        </picture>
      )}

      {/* Skeleton placeholder */}
      {skeleton && !isLoaded && !hasError && shouldLoad && (
        <div className="absolute inset-0 bg-muted animate-pulse">
          <div className="w-full h-full bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer" />
        </div>
      )}

      {/* Loading spinner (alternative to skeleton) */}
      {!skeleton && !isLoaded && !hasError && shouldLoad && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-muted-foreground/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          {fallback || (
            <div className="text-muted-foreground text-sm text-center p-4">
              <div className="w-8 h-8 mx-auto mb-2 opacity-50">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
              </div>
              Image unavailable
            </div>
          )}
        </div>
      )}

      {/* Initial placeholder before intersection */}
      {!shouldLoad && (
        <div className="absolute inset-0 bg-muted/50" />
      )}
    </div>
  );
};
