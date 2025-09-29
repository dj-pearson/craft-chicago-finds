import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Wand2, Image as ImageIcon, Crop, Palette, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface AIPhotoHelperProps {
  imageUrl: string;
  onImageProcessed: (newImageUrl: string) => void;
  className?: string;
}

interface PhotoEditOptions {
  remove_background?: boolean;
  crop_to_square?: boolean;
  crop_to_portrait?: boolean;
  auto_exposure?: boolean;
  auto_color?: boolean;
  sharpen?: boolean;
}

export const AIPhotoHelper = ({ imageUrl, onImageProcessed, className }: AIPhotoHelperProps) => {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [options, setOptions] = useState<PhotoEditOptions>({
    remove_background: false,
    crop_to_square: false,
    crop_to_portrait: false,
    auto_exposure: true,
    auto_color: true,
    sharpen: false,
  });

  const handleOptionChange = (option: keyof PhotoEditOptions, checked: boolean) => {
    setOptions(prev => ({
      ...prev,
      [option]: checked
    }));
    
    // Reset mutual exclusions
    if (option === 'crop_to_square' && checked) {
      setOptions(prev => ({ ...prev, crop_to_portrait: false }));
    }
    if (option === 'crop_to_portrait' && checked) {
      setOptions(prev => ({ ...prev, crop_to_square: false }));
    }
  };

  const processImage = async () => {
    if (!imageUrl) {
      toast({
        title: "Error",
        description: "No image to process",
        variant: "destructive",
      });
      return;
    }

    const hasAnyOption = Object.values(options).some(Boolean);
    if (!hasAnyOption) {
      toast({
        title: "No enhancements selected",
        description: "Please select at least one enhancement option",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("optimize-image", {
        body: {
          image_url: imageUrl,
          ai_enhancements: options,
          sizes: [800], // Single size for preview
          quality: 90,
          format: options.remove_background ? "png" : "webp",
        },
      });

      if (error) {
        throw error;
      }

      if (data?.optimized_versions?.[0]?.url) {
        const processedUrl = data.optimized_versions[0].url;
        setPreviewUrl(processedUrl);
        
        toast({
          title: "Image processed successfully!",
          description: "Your photo has been enhanced with AI",
        });
      } else {
        throw new Error("No processed image received");
      }
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Failed to process image",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const useProcessedImage = () => {
    if (previewUrl) {
      onImageProcessed(previewUrl);
      setPreviewUrl(null);
      toast({
        title: "Image updated",
        description: "Your processed image has been applied",
      });
    }
  };

  const discardProcessedImage = () => {
    setPreviewUrl(null);
    toast({
      title: "Changes discarded",
      description: "Keeping your original image",
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          AI Photo Helper
        </CardTitle>
        <CardDescription>
          Enhance your product photos with AI-powered tools. One-click improvements for professional-looking images.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Original</Label>
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              <OptimizedImage
                src={imageUrl}
                alt="Original image"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          {previewUrl && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Enhanced</Label>
              <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                <OptimizedImage
                  src={previewUrl}
                  alt="Enhanced image"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Enhancement Options */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Enhancement Options</Label>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remove_background"
                  checked={options.remove_background}
                  onCheckedChange={(checked) => 
                    handleOptionChange('remove_background', checked as boolean)
                  }
                />
                <Label 
                  htmlFor="remove_background" 
                  className="flex items-center gap-2 text-sm"
                >
                  <ImageIcon className="h-4 w-4" />
                  Remove Background
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="crop_to_square"
                  checked={options.crop_to_square}
                  onCheckedChange={(checked) => 
                    handleOptionChange('crop_to_square', checked as boolean)
                  }
                />
                <Label 
                  htmlFor="crop_to_square" 
                  className="flex items-center gap-2 text-sm"
                >
                  <Crop className="h-4 w-4" />
                  Crop to Square
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="crop_to_portrait"
                  checked={options.crop_to_portrait}
                  onCheckedChange={(checked) => 
                    handleOptionChange('crop_to_portrait', checked as boolean)
                  }
                />
                <Label 
                  htmlFor="crop_to_portrait" 
                  className="flex items-center gap-2 text-sm"
                >
                  <Crop className="h-4 w-4" />
                  Crop to Portrait
                </Label>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto_exposure"
                  checked={options.auto_exposure}
                  onCheckedChange={(checked) => 
                    handleOptionChange('auto_exposure', checked as boolean)
                  }
                />
                <Label 
                  htmlFor="auto_exposure" 
                  className="flex items-center gap-2 text-sm"
                >
                  <Zap className="h-4 w-4" />
                  Fix Exposure
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto_color"
                  checked={options.auto_color}
                  onCheckedChange={(checked) => 
                    handleOptionChange('auto_color', checked as boolean)
                  }
                />
                <Label 
                  htmlFor="auto_color" 
                  className="flex items-center gap-2 text-sm"
                >
                  <Palette className="h-4 w-4" />
                  Enhance Colors
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sharpen"
                  checked={options.sharpen}
                  onCheckedChange={(checked) => 
                    handleOptionChange('sharpen', checked as boolean)
                  }
                />
                <Label 
                  htmlFor="sharpen" 
                  className="flex items-center gap-2 text-sm"
                >
                  <Zap className="h-4 w-4" />
                  Sharpen Image
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          {!previewUrl ? (
            <Button
              onClick={processImage}
              disabled={processing || !Object.values(options).some(Boolean)}
              className="flex-1"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Enhance Photo
                </>
              )}
            </Button>
          ) : (
            <>
              <Button onClick={useProcessedImage} className="flex-1">
                Use Enhanced Image
              </Button>
              <Button variant="outline" onClick={discardProcessedImage} className="flex-1">
                Keep Original
              </Button>
            </>
          )}
        </div>

        {/* Tips */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Tips:</strong></p>
          <p>• Remove background works best with clear product photos</p>
          <p>• Square crops are perfect for social media and grid layouts</p>
          <p>• Auto exposure and color enhance photos taken in poor lighting</p>
        </div>
      </CardContent>
    </Card>
  );
};
