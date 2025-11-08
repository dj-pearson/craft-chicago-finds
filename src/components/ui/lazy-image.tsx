import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  loading?: "lazy" | "eager";
  // PERFORMANCE: Added responsive image support
  srcSet?: string;
  sizes?: string;
  // PERFORMANCE: WebP/AVIF support (auto-detect from URL)
  enableWebP?: boolean;
}

export const LazyImage = ({
  src,
  alt,
  className,
  fallback,
  loading = "lazy",
  srcSet,
  sizes = "100vw",
  enableWebP = true,
  ...props
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        // PERFORMANCE: Increased rootMargin for earlier preloading
        rootMargin: "100px",
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  const shouldLoad = loading === "eager" || isInView;

  // PERFORMANCE: Auto-generate WebP URL if original is JPG/PNG
  const getWebPSrc = (originalSrc: string): string | null => {
    if (!enableWebP) return null;

    // Check if URL has common image extensions
    if (originalSrc.match(/\.(jpg|jpeg|png)$/i)) {
      return originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }

    // For Supabase Storage URLs, try appending format parameter
    if (originalSrc.includes('supabase') && !originalSrc.includes('format=')) {
      const separator = originalSrc.includes('?') ? '&' : '?';
      return `${originalSrc}${separator}format=webp`;
    }

    return null;
  };

  const webpSrc = getWebPSrc(src);
  const webpSrcSet = srcSet && enableWebP
    ? srcSet.split(',').map(s => {
        const [url, descriptor] = s.trim().split(' ');
        const webpUrl = getWebPSrc(url);
        return webpUrl ? `${webpUrl} ${descriptor || ''}`.trim() : s;
      }).join(', ')
    : null;

  return (
    <div ref={imgRef} className={cn("relative overflow-hidden", className)}>
      {shouldLoad && (
        <picture>
          {/* PERFORMANCE: WebP source for modern browsers */}
          {webpSrc && (
            <source
              srcSet={webpSrcSet || webpSrc}
              type="image/webp"
              sizes={sizes}
            />
          )}

          {/* Fallback to original format */}
          <img
            src={src}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            loading={loading}
            decoding="async"
            className={cn(
              "transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0",
              hasError && "hidden",
              className
            )}
            {...props}
          />
        </picture>
      )}

      {/* Loading placeholder */}
      {!isLoaded && !hasError && shouldLoad && (
        <div
          className={cn(
            "absolute inset-0 bg-muted animate-pulse",
            className
          )}
        />
      )}

      {/* Error fallback */}
      {hasError && (
        <div
          className={cn(
            "absolute inset-0 bg-muted flex items-center justify-center",
            className
          )}
        >
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
              Image failed to load
            </div>
          )}
        </div>
      )}

      {/* Initial placeholder before intersection */}
      {!shouldLoad && (
        <div className={cn("absolute inset-0 bg-muted", className)} />
      )}
    </div>
  );
};
