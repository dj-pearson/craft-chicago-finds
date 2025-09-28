import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Store, Shield, CreditCard, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
import { z } from "zod";

const sellerSchema = z.object({
  business_name: z.string().max(100, "Business name must be less than 100 characters").optional(),
  seller_description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  business_address: z.string().max(200, "Address must be less than 200 characters").optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  tax_id: z.string().max(50, "Tax ID must be less than 50 characters").optional(),
});

interface SellerSettingsProps {
  user: User;
  profile: any;
}

export const SellerSettings = ({ user, profile }: SellerSettingsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    business_name: profile?.business_name || "",
    seller_description: profile?.seller_description || "",
    business_address: profile?.business_address || "",
    website: profile?.website || "",
    tax_id: profile?.tax_id || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const validatedData = sellerSchema.parse(formData);
      
      // TODO: Implement seller settings update in Supabase
      console.log("Seller settings update:", validatedData);

      toast({
        title: "Seller settings updated",
        description: "Your seller information has been successfully updated.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: "Update failed",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = () => {
    toast({
      title: "Feature coming soon",
      description: "Seller verification process will be available soon.",
    });
  };

  const handlePayoutSetup = () => {
    toast({
      title: "Feature coming soon",
      description: "Payment setup will be available soon.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Seller Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Seller Status
          </CardTitle>
          <CardDescription>
            Your current seller account status and verification level
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Account Type</p>
              <p className="text-sm text-muted-foreground">Seller Account</p>
            </div>
            <Badge variant="outline">Active</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Verification Status</p>
              <p className="text-sm text-muted-foreground">
                {profile?.seller_verified ? "Verified seller" : "Pending verification"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {profile?.seller_verified ? (
                <Badge className="bg-success text-success-foreground">
                  <Shield className="mr-1 h-3 w-3" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Pending
                </Badge>
              )}
            </div>
          </div>

          {!profile?.seller_verified && (
            <div className="flex items-start gap-3 p-3 bg-muted/50 border rounded-lg">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Complete your verification</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Get verified to build trust with buyers and access advanced seller features.
                </p>
                <Button size="sm" onClick={handleVerification}>
                  Start Verification
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            Update your business details and seller profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                placeholder="Your business or shop name"
              />
              {errors.business_name && <p className="text-sm text-destructive">{errors.business_name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="seller_description">Seller Description</Label>
              <Textarea
                id="seller_description"
                value={formData.seller_description}
                onChange={(e) => setFormData(prev => ({ ...prev, seller_description: e.target.value }))}
                placeholder="Tell buyers about your craft, story, and what makes your products special..."
                rows={4}
                maxLength={1000}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{errors.seller_description && <span className="text-destructive">{errors.seller_description}</span>}</span>
                <span>{formData.seller_description.length}/1000</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_address">Business Address</Label>
              <Input
                id="business_address"
                value={formData.business_address}
                onChange={(e) => setFormData(prev => ({ ...prev, business_address: e.target.value }))}
                placeholder="Your business address (for tax and shipping purposes)"
              />
              {errors.business_address && <p className="text-sm text-destructive">{errors.business_address}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website/Portfolio</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://yourwebsite.com"
              />
              {errors.website && <p className="text-sm text-destructive">{errors.website}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_id">Tax ID (Optional)</Label>
              <Input
                id="tax_id"
                value={formData.tax_id}
                onChange={(e) => setFormData(prev => ({ ...prev, tax_id: e.target.value }))}
                placeholder="Your tax identification number"
              />
              <p className="text-xs text-muted-foreground">
                This information is kept private and used only for tax reporting purposes.
              </p>
              {errors.tax_id && <p className="text-sm text-destructive">{errors.tax_id}</p>}
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Business Info"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Settings
          </CardTitle>
          <CardDescription>
            Set up how you receive payments from sales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Payout Method</p>
              <p className="text-sm text-muted-foreground">
                {(profile as any)?.stripe_account_id ? "Stripe connected" : "Not set up"}
              </p>
            </div>
            <Button variant="outline" onClick={handlePayoutSetup}>
              {(profile as any)?.stripe_account_id ? "Manage" : "Set Up"}
            </Button>
          </div>

          {!(profile as any)?.stripe_account_id && (
            <div className="flex items-start gap-3 p-3 bg-muted/50 border rounded-lg">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Payment setup required</p>
                <p className="text-sm text-muted-foreground">
                  You need to set up a payment method to receive earnings from sales.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seller Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Seller Performance</CardTitle>
          <CardDescription>
            Overview of your seller metrics and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Total Sales</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Active Listings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Total Reviews</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">0%</p>
              <p className="text-sm text-muted-foreground">Response Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};