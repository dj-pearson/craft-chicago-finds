import { useState, useEffect, useCallback, useRef, TouchEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Package, Maximize2, X } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { LazyImage } from "@/components/ui/lazy-image";

interface ProductImagesProps {
  images: string[];
  title: string;
}

export const ProductImages = ({ images, title }: ProductImagesProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Touch gesture state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Touch handlers for swipe gestures
  const onTouchStart = useCallback((e: TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && images.length > 1) {
      nextImage();
    }
    if (isRightSwipe && images.length > 1) {
      prevImage();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  }, [images.length, nextImage, prevImage]);

  const openLightbox = useCallback(() => {
    setIsLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false);
  }, []);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        prevImage();
      } else if (e.key === "ArrowRight") {
        nextImage();
      } else if (e.key === "Escape") {
        closeLightbox();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, prevImage, nextImage, closeLightbox]);

  if (!images || images.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="aspect-square bg-muted flex items-center justify-center rounded-lg">
            <Package className="h-16 w-16 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <Card>
        <CardContent className="p-0">
          <div
            className="relative aspect-square overflow-hidden rounded-lg group touch-pan-y"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <button
              onClick={openLightbox}
              className="w-full h-full cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
              aria-label="Click to view full size image, swipe left or right to navigate"
            >
              <LazyImage
                src={images[currentImageIndex]}
                alt={`${title} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 select-none"
                loading="eager"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </button>

            {/* Zoom indicator - desktop only */}
            <div className="absolute top-2 right-2 bg-background/80 hover:bg-background/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block">
              <Maximize2 className="h-4 w-4 text-foreground" />
            </div>

            {/* Image counter dots - mobile friendly */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10 md:hidden">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex
                        ? 'bg-primary w-4'
                        : 'bg-background/60 hover:bg-background/80'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Navigation arrows - hidden on mobile for cleaner swipe UX */}
            {images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background/90 backdrop-blur-sm z-10 hidden md:flex"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background/90 backdrop-blur-sm z-10 hidden md:flex"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Swipe hint - mobile only, shown briefly */}
            {images.length > 1 && (
              <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground bg-background/70 backdrop-blur-sm px-2 py-1 rounded md:hidden opacity-70">
                Swipe to navigate
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Thumbnail Grid */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                index === currentImageIndex
                  ? 'border-primary'
                  : 'border-border hover:border-primary/50'
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <LazyImage
                src={image}
                alt={`${title} - Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                sizes="100px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-7xl w-full h-[90vh] md:h-[90vh] p-0 bg-black/95">
          <VisuallyHidden>
            <DialogTitle>{title} - Image {currentImageIndex + 1} of {images.length}</DialogTitle>
          </VisuallyHidden>

          <div
            className="relative w-full h-full flex items-center justify-center touch-pan-y"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Full-size image */}
            <LazyImage
              src={images[currentImageIndex]}
              alt={`${title} - Full size image ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain select-none"
              loading="eager"
              sizes="100vw"
            />

            {/* Close button - larger touch target on mobile */}
            <Button
              variant="outline"
              size="icon"
              onClick={closeLightbox}
              className="absolute top-4 right-4 bg-background/80 hover:bg-background/90 backdrop-blur-sm h-10 w-10 md:h-9 md:w-9"
              aria-label="Close lightbox"
            >
              <X className="h-5 w-5 md:h-4 md:w-4" />
            </Button>

            {/* Navigation buttons - larger on mobile, hidden behind swipe on touch devices */}
            {images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevImage}
                  className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background/90 backdrop-blur-sm h-12 w-12 md:h-10 md:w-10 opacity-60 md:opacity-100"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextImage}
                  className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background/90 backdrop-blur-sm h-12 w-12 md:h-10 md:w-10 opacity-60 md:opacity-100"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>

                {/* Image counter dots - mobile */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 md:hidden">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        index === currentImageIndex
                          ? 'bg-white w-5'
                          : 'bg-white/40 hover:bg-white/60'
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Image counter - desktop */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium hidden md:block">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}

            {/* Keyboard hints - desktop only */}
            <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-muted-foreground hidden md:block">
              Press ESC to close {images.length > 1 && "• Arrow keys to navigate"}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};