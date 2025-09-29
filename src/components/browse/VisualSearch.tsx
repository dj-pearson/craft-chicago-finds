import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, X, Search, Loader2, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface VisualSearchProps {
  onSearchResults: (results: any[]) => void;
  cityId?: string;
}

interface SimilarProduct {
  id: string;
  title: string;
  price: number;
  images: string[];
  similarity_score: number;
}

export const VisualSearch = ({
  onSearchResults,
  cityId,
}: VisualSearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<SimilarProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = () => {
    // For now, just trigger file input for camera access
    // In a real implementation, you'd use getUserMedia for camera access
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("capture", "environment");
      fileInputRef.current.click();
    }
  };

  const performVisualSearch = async () => {
    if (!selectedImage || !cityId) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Convert base64 to blob
      const response = await fetch(selectedImage);
      const blob = await response.blob();

      // Upload image to Supabase storage for processing
      const fileName = `visual-search-${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("temp-images")
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("temp-images").getPublicUrl(fileName);

      // Call our visual search function
      const { data: searchResults, error: searchError } =
        await supabase.functions.invoke("visual-search", {
          body: {
            image_url: publicUrl,
            city_id: cityId,
            limit: 12,
          },
        });

      if (searchError) throw searchError;

      // Clean up temp image
      await supabase.storage.from("temp-images").remove([fileName]);

      setResults(searchResults || []);
      onSearchResults(searchResults || []);
    } catch (err) {
      console.error("Visual search error:", err);
      setError("Failed to perform visual search. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const clearSearch = () => {
    setSelectedImage(null);
    setResults([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Eye className="h-4 w-4" />
          Visual Search
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Visual Search
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload an Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedImage ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-20 flex-col gap-2"
                    >
                      <Upload className="h-6 w-6" />
                      Upload Image
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCameraCapture}
                      className="h-20 flex-col gap-2"
                    >
                      <Camera className="h-6 w-6" />
                      Take Photo
                    </Button>
                  </div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="text-center text-sm text-muted-foreground">
                    Upload a photo to find similar products. Max file size: 5MB
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={selectedImage}
                      alt="Search image"
                      className="w-full h-48 object-contain rounded-lg border"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={clearSearch}
                      className="absolute top-2 right-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={performVisualSearch}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Find Similar Products
                      </>
                    )}
                  </Button>
                </div>
              )}

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Similar Products Found
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {results.map((product) => (
                    <div key={product.id} className="space-y-2">
                      <div className="relative">
                        <img
                          src={product.images[0] || "/placeholder.svg"}
                          alt={product.title}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Badge
                          variant="secondary"
                          className="absolute top-2 right-2 text-xs"
                        >
                          {Math.round(product.similarity_score * 100)}% match
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm line-clamp-2">
                          {product.title}
                        </h4>
                        <p className="text-sm font-semibold text-primary">
                          ${product.price}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
