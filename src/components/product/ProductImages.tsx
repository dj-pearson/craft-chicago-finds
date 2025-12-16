import { useState, useEffect, useCallback } from "react";
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

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

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
          <div className="relative aspect-square overflow-hidden rounded-lg group">
            <button
              onClick={openLightbox}
              className="w-full h-full cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
              aria-label="Click to view full size image"
            >
              <LazyImage
                src={images[currentImageIndex]}
                alt={`${title} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="eager"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </button>

            {/* Zoom indicator */}
            <div className="absolute top-2 right-2 bg-background/80 hover:bg-background/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <Maximize2 className="h-4 w-4 text-foreground" />
            </div>

            {images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background/90 backdrop-blur-sm z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background/90 backdrop-blur-sm z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
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
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black/95">
          <VisuallyHidden>
            <DialogTitle>{title} - Image {currentImageIndex + 1} of {images.length}</DialogTitle>
          </VisuallyHidden>

          <div className="relative w-full h-full flex items-center justify-center">
            {/* Full-size image */}
            <LazyImage
              src={images[currentImageIndex]}
              alt={`${title} - Full size image ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              loading="eager"
              sizes="100vw"
            />

            {/* Close button */}
            <Button
              variant="outline"
              size="icon"
              onClick={closeLightbox}
              className="absolute top-4 right-4 bg-background/80 hover:bg-background/90 backdrop-blur-sm"
              aria-label="Close lightbox"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background/90 backdrop-blur-sm"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background/90 backdrop-blur-sm"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>

                {/* Image counter */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}

            {/* Keyboard hints */}
            <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-muted-foreground">
              Press ESC to close {images.length > 1 && "• Arrow keys to navigate"}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};