import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Upload, 
  X, 
  Camera, 
  AlertTriangle,
  Package,
  Truck,
  RefreshCw,
  DollarSign
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ProtectionClaimFormProps {
  orderId: string;
  sellerId: string;
  productTitle: string;
  orderAmount: number;
  onSubmit: () => void;
  onCancel: () => void;
}

type ClaimType = 'not_as_described' | 'damaged' | 'not_received' | 'wrong_item' | 'defective';

const CLAIM_TYPES = [
  {
    value: 'not_as_described' as ClaimType,
    label: 'Item Not as Described',
    description: 'The item received differs significantly from the listing',
    icon: Package
  },
  {
    value: 'damaged' as ClaimType,
    label: 'Item Damaged',
    description: 'The item arrived damaged or broken',
    icon: AlertTriangle
  },
  {
    value: 'not_received' as ClaimType,
    label: 'Item Not Received',
    description: 'You never received the item',
    icon: Truck
  },
  {
    value: 'wrong_item' as ClaimType,
    label: 'Wrong Item',
    description: 'You received a different item than ordered',
    icon: RefreshCw
  },
  {
    value: 'defective' as ClaimType,
    label: 'Defective Item',
    description: 'The item has manufacturing defects or doesn\'t work properly',
    icon: X
  }
];

export const ProtectionClaimForm = ({ 
  orderId, 
  sellerId, 
  productTitle,
  orderAmount,
  onSubmit, 
  onCancel 
}: ProtectionClaimFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [claimType, setClaimType] = useState<ClaimType | ''>('');
  const [description, setDescription] = useState('');
  const [evidenceImages, setEvidenceImages] = useState<File[]>([]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + evidenceImages.length > 8) {
      toast({
        title: "Too many images",
        description: "You can upload up to 8 evidence images",
        variant: "destructive"
      });
      return;
    }
    setEvidenceImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setEvidenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const submitClaim = async () => {
    if (!claimType || !description.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a claim type and provide a description",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit a claim",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Upload evidence images if any
      let imageUrls: string[] = [];
      if (evidenceImages.length > 0) {
        for (const image of evidenceImages) {
          const fileExt = image.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(`protection-claims/${fileName}`, image);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(`protection-claims/${fileName}`);

          imageUrls.push(publicUrl);
        }
      }

      // TODO: Implement protection claims when protection_claims table is created
      console.log('Protection claim submitted:', {
        orderId,
        sellerId,
        claimType,
        description: description.trim(),
        imageUrls
      });

      toast({
        title: "Claim submitted",
        description: "Your protection claim has been submitted. We'll review it within 24 hours.",
      });

      onSubmit();
    } catch (error) {
      console.error('Error submitting protection claim:', error);
      toast({
        title: "Failed to submit claim",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedClaimType = CLAIM_TYPES.find(type => type.value === claimType);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          Buyer Protection Claim
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          <p className="font-medium">{productTitle}</p>
          <p>Order Amount: ${orderAmount.toFixed(2)}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Claim Type Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">What's the issue? *</Label>
          <Select value={claimType} onValueChange={(value) => setClaimType(value as ClaimType)}>
            <SelectTrigger>
              <SelectValue placeholder="Select the type of issue" />
            </SelectTrigger>
            <SelectContent>
              {CLAIM_TYPES.map((type) => {
                const IconComponent = type.icon;
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {selectedClaimType && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <selectedClaimType.icon className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-blue-900">{selectedClaimType.label}</div>
                <div className="text-sm text-blue-700">{selectedClaimType.description}</div>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Detailed Description *
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please provide a detailed description of the issue. Include what you expected vs. what you received, any attempts to resolve with the seller, etc."
            className="min-h-[120px]"
            maxLength={2000}
          />
          <div className="text-xs text-muted-foreground text-right">
            {description.length}/2000 characters
          </div>
        </div>

        <Separator />

        {/* Evidence Upload */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Evidence Photos (Recommended)</Label>
          <div className="text-sm text-muted-foreground mb-3">
            Upload clear photos that show the issue. This helps us resolve your claim faster.
          </div>
          
          <div className="flex flex-wrap gap-2">
            {evidenceImages.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Evidence ${index + 1}`}
                  className="w-24 h-24 object-cover rounded border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {evidenceImages.length < 8 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 border-2 border-dashed border-muted-foreground/25 rounded flex items-center justify-center hover:border-primary/50 transition-colors"
              >
                <div className="text-center">
                  <Camera className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                  <div className="text-xs text-muted-foreground">Add Photo</div>
                </div>
              </button>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground">
            Upload up to 8 photos (JPG, PNG). Good evidence photos increase claim success rate.
          </p>
        </div>

        <Separator />

        {/* Resolution Info */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-sm mb-2">What happens next?</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• We'll review your claim within 24 hours</li>
            <li>• The seller will be notified and can respond</li>
            <li>• If approved, you may receive a full or partial refund</li>
            <li>• You'll be notified of the decision via email</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            onClick={submitClaim}
            disabled={loading || !claimType || !description.trim()}
            className="flex-1"
          >
            {loading ? "Submitting Claim..." : "Submit Protection Claim"}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          By submitting this claim, you confirm that the information provided is accurate. 
          False claims may result in account restrictions.
        </div>
      </CardContent>
    </Card>
  );
};
