import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Eye, RotateCcw, Download } from "lucide-react";

interface PersonalizationOption {
  id: string;
  option_type: 'text' | 'font' | 'color' | 'size' | 'position';
  option_name: string;
  option_key: string;
  is_required: boolean;
  max_characters?: number;
  allowed_values: string[];
  default_value?: string;
  additional_cost: number;
  preview_rules: {
    position?: { x: number; y: number };
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    maxWidth?: number;
  };
}

interface PersonalizationPreviewProps {
  productImage: string;
  productTitle: string;
  personalizationOptions: PersonalizationOption[];
  onPersonalizationChange: (personalizations: Record<string, any>) => void;
  className?: string;
}

export const PersonalizationPreview = ({
  productImage,
  productTitle,
  personalizationOptions,
  onPersonalizationChange,
  className = ""
}: PersonalizationPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [personalizations, setPersonalizations] = useState<Record<string, string>>({});
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [additionalCost, setAdditionalCost] = useState(0);

  // Initialize default values
  useEffect(() => {
    const defaults: Record<string, string> = {};
    personalizationOptions.forEach(option => {
      if (option.default_value) {
        defaults[option.option_key] = option.default_value;
      }
    });
    setPersonalizations(defaults);
  }, [personalizationOptions]);

  // Calculate additional cost
  useEffect(() => {
    let cost = 0;
    personalizationOptions.forEach(option => {
      if (personalizations[option.option_key] && personalizations[option.option_key] !== option.default_value) {
        cost += option.additional_cost;
      }
    });
    setAdditionalCost(cost);
  }, [personalizations, personalizationOptions]);

  // Notify parent of changes
  useEffect(() => {
    onPersonalizationChange({
      personalizations,
      additionalCost,
      previewData: generatePreviewData()
    });
  }, [personalizations, additionalCost]);

  const generatePreviewData = () => {
    return {
      personalizations,
      canvasData: isPreviewMode ? getCanvasDataURL() : null,
      timestamp: Date.now()
    };
  };

  const getCanvasDataURL = () => {
    if (canvasRef.current) {
      return canvasRef.current.toDataURL('image/png');
    }
    return null;
  };

  const drawPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw product image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Draw personalizations
      personalizationOptions.forEach(option => {
        const value = personalizations[option.option_key];
        if (!value || option.option_type !== 'text') return;

        const rules = option.preview_rules;
        const x = (rules.position?.x || 0.5) * canvas.width;
        const y = (rules.position?.y || 0.5) * canvas.height;
        
        // Get font settings
        const fontSize = rules.fontSize || 16;
        const fontFamily = personalizations[`${option.option_key}_font`] || rules.fontFamily || 'Arial';
        const color = personalizations[`${option.option_key}_color`] || rules.color || '#000000';
        
        // Set font and style
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add text stroke for better visibility
        ctx.strokeStyle = color === '#000000' ? '#FFFFFF' : '#000000';
        ctx.lineWidth = 1;
        ctx.strokeText(value, x, y);
        ctx.fillText(value, x, y);
      });
      
      setImageLoaded(true);
    };
    
    img.onerror = () => {
      console.error('Failed to load product image for preview');
      setImageLoaded(false);
    };
    
    img.src = productImage;
  };

  useEffect(() => {
    if (isPreviewMode) {
      drawPreview();
    }
  }, [personalizations, isPreviewMode, productImage]);

  const handlePersonalizationChange = (key: string, value: string) => {
    setPersonalizations(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetPersonalizations = () => {
    const defaults: Record<string, string> = {};
    personalizationOptions.forEach(option => {
      if (option.default_value) {
        defaults[option.option_key] = option.default_value;
      }
    });
    setPersonalizations(defaults);
  };

  const downloadPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `${productTitle.replace(/[^a-zA-Z0-9]/g, '_')}_preview.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const renderPersonalizationInput = (option: PersonalizationOption) => {
    const value = personalizations[option.option_key] || '';
    
    switch (option.option_type) {
      case 'text':
        return (
          <div key={option.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={option.option_key} className="text-sm font-medium">
                {option.option_name}
                {option.is_required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {option.additional_cost > 0 && (
                <Badge variant="secondary" className="text-xs">
                  +${option.additional_cost.toFixed(2)}
                </Badge>
              )}
            </div>
            <Input
              id={option.option_key}
              value={value}
              onChange={(e) => handlePersonalizationChange(option.option_key, e.target.value)}
              maxLength={option.max_characters}
              placeholder={`Enter ${option.option_name.toLowerCase()}`}
              className="text-sm"
            />
            {option.max_characters && (
              <div className="text-xs text-muted-foreground text-right">
                {value.length}/{option.max_characters} characters
              </div>
            )}
          </div>
        );
      
      case 'font':
        return (
          <div key={option.id} className="space-y-2">
            <Label className="text-sm font-medium">{option.option_name}</Label>
            <Select
              value={personalizations[option.option_key] || option.default_value}
              onValueChange={(value) => handlePersonalizationChange(option.option_key, value)}
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {option.allowed_values.map((font) => (
                  <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      
      case 'color':
        return (
          <div key={option.id} className="space-y-2">
            <Label className="text-sm font-medium">{option.option_name}</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={personalizations[option.option_key] || option.default_value || '#000000'}
                onChange={(e) => handlePersonalizationChange(option.option_key, e.target.value)}
                className="w-10 h-8 rounded border border-input cursor-pointer"
              />
              <Input
                value={personalizations[option.option_key] || option.default_value || '#000000'}
                onChange={(e) => handlePersonalizationChange(option.option_key, e.target.value)}
                placeholder="#000000"
                className="text-sm font-mono"
                maxLength={7}
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (personalizationOptions.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Personalize Your Item</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              {isPreviewMode ? 'Hide' : 'Show'} Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetPersonalizations}
              className="text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
        </div>
        {additionalCost > 0 && (
          <div className="text-sm text-primary font-medium">
            Additional cost: +${additionalCost.toFixed(2)}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Preview Canvas */}
        {isPreviewMode && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Live Preview</Label>
              {imageLoaded && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadPreview}
                  className="text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              )}
            </div>
            <div className="relative bg-muted rounded-lg p-4">
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="w-full max-w-sm mx-auto border rounded-lg bg-white"
                style={{ aspectRatio: '1' }}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-sm text-muted-foreground">Loading preview...</div>
                </div>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Personalization Options */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Customization Options</Label>
          <div className="space-y-4">
            {personalizationOptions.map(renderPersonalizationInput)}
          </div>
        </div>

        {/* Validation Messages */}
        {personalizationOptions.some(opt => opt.is_required && !personalizations[opt.option_key]) && (
          <div className="text-sm text-red-500">
            Please fill in all required personalization fields.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
