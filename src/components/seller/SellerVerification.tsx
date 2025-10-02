import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, AlertCircle, Upload, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const SellerVerification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    phone_number: "",
    verified_email: "",
    verified_address: { street: "", city: "", state: "", zip: "" },
  });

  useEffect(() => {
    if (user) {
      loadVerification();
    }
  }, [user]);

  const loadVerification = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("seller_verifications")
      .select("*")
      .eq("seller_id", user.id)
      .single();

    if (data) {
      setVerification(data);
      const addr = typeof data.verified_address === 'object' && data.verified_address !== null 
        ? data.verified_address as any
        : { street: "", city: "", state: "", zip: "" };
      setFormData({
        phone_number: data.phone_number || "",
        verified_email: data.verified_email || "",
        verified_address: addr,
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    
    const file = e.target.files[0];
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${field}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      const updateData: any = {};
      updateData[field] = publicUrl;

      const { error: updateError } = await supabase
        .from("seller_verifications")
        .upsert({
          seller_id: user.id,
          ...updateData,
        });

      if (updateError) throw updateError;

      toast({
        title: "Document Uploaded",
        description: "Your document has been uploaded successfully.",
      });

      loadVerification();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("seller_verifications")
        .insert({
          seller_id: user.id,
          verification_type: 'identity',
          ...formData,
          verification_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Verification Submitted",
        description: "Your verification information has been submitted for review.",
      });

      loadVerification();
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit verification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      case 'pending': return 'text-amber-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Seller Identity Verification
        </CardTitle>
      </CardHeader>
      <CardContent>
        {verification?.verification_status === 'verified' && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              Your seller account is verified. You can accept payments and process orders.
            </AlertDescription>
          </Alert>
        )}

        {verification?.verification_status === 'pending' && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              Your verification is pending review. This typically takes 1-2 business days.
            </AlertDescription>
          </Alert>
        )}

        {verification?.verification_status === 'rejected' && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900">
              <p className="font-semibold">Verification Rejected</p>
              {verification.rejection_reason && (
                <p className="mt-1">{verification.rejection_reason}</p>
              )}
              <p className="mt-2">Please update your information and resubmit.</p>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number *</Label>
            <Input
              id="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
              placeholder="(555) 123-4567"
              required
              disabled={verification?.verification_status === 'verified'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="verified_email">Email Address *</Label>
            <Input
              id="verified_email"
              type="email"
              value={formData.verified_email}
              onChange={(e) => setFormData(prev => ({ ...prev, verified_email: e.target.value }))}
              placeholder="seller@example.com"
              required
              disabled={verification?.verification_status === 'verified'}
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Address Verification</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  value={formData.verified_address.street || ""}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    verified_address: { ...prev.verified_address, street: e.target.value }
                  }))}
                  placeholder="123 Main Street"
                  required
                  disabled={verification?.verification_status === 'verified'}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.verified_address.city || ""}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      verified_address: { ...prev.verified_address, city: e.target.value }
                    }))}
                    required
                    disabled={verification?.verification_status === 'verified'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.verified_address.state || ""}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      verified_address: { ...prev.verified_address, state: e.target.value.toUpperCase() }
                    }))}
                    placeholder="IL"
                    maxLength={2}
                    required
                    disabled={verification?.verification_status === 'verified'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code *</Label>
                  <Input
                    id="zip"
                    value={formData.verified_address.zip || ""}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      verified_address: { ...prev.verified_address, zip: e.target.value.replace(/\D/g, "") }
                    }))}
                    maxLength={5}
                    required
                    disabled={verification?.verification_status === 'verified'}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Identity Documents</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="government_id" className="mb-2 block">
                  Government-Issued ID (Driver's License, Passport, etc.) *
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="government_id"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e, 'government_id_url')}
                    disabled={uploading || verification?.verification_status === 'verified'}
                    className="flex-1"
                  />
                  {verification?.government_id_url && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="business_tax_id" className="mb-2 block">
                  Business Tax ID Document (EIN Letter, etc.) - If Applicable
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="business_tax_id"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e, 'business_tax_id_url')}
                    disabled={uploading || verification?.verification_status === 'verified'}
                    className="flex-1"
                  />
                  {verification?.business_tax_id_url && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {verification?.verification_status !== 'verified' && (
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || uploading || !verification?.government_id_url}
              size="lg"
            >
              {loading ? "Submitting..." : verification?.verification_status === 'pending' ? "Update Verification" : "Submit for Verification"}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
