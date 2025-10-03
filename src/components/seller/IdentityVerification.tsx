import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { identityVerificationSchema, type IdentityVerificationData } from "@/lib/compliance-validation";
import { AlertCircle, CheckCircle } from "lucide-react";

export function IdentityVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<IdentityVerificationData>({
    full_name: "",
    date_of_birth: "",
    ssn_last_4: "",
    address: "",
    id_document_type: "drivers_license",
    id_document_number: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate form data
      const validatedData = identityVerificationSchema.parse(formData);
      
      if (!user?.id) {
        throw new Error("You must be logged in to submit identity verification");
      }

      // Submit to seller_verifications table
      const { error } = await supabase
        .from("seller_verifications")
        .upsert({
          seller_id: user.id,
          verification_type: "identity",
          verification_status: "pending",
          submitted_at: new Date().toISOString(),
          verification_data: validatedData,
        });

      if (error) throw error;

      toast({
        title: "Identity Verification Submitted",
        description: "Your identity verification has been submitted for review. We'll notify you once it's processed.",
      });

    } catch (error: any) {
      console.error("Identity verification error:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit identity verification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Identity Verification</h2>
      
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Federal law requires identity verification for sellers who exceed $5,000 in annual sales.
          Your information is encrypted and stored securely.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Legal Name</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="As it appears on your ID"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Date of Birth</Label>
          <Input
            id="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ssn_last_4">Last 4 Digits of SSN</Label>
          <Input
            id="ssn_last_4"
            value={formData.ssn_last_4}
            onChange={(e) => setFormData({ ...formData, ssn_last_4: e.target.value.replace(/\D/g, '').slice(0, 4) })}
            placeholder="1234"
            maxLength={4}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Residential Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Street address, city, state, ZIP"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="id_document_type">ID Document Type</Label>
          <select
            id="id_document_type"
            className="w-full p-2 border rounded-md"
            value={formData.id_document_type}
            onChange={(e) => setFormData({ ...formData, id_document_type: e.target.value as any })}
            required
          >
            <option value="drivers_license">Driver's License</option>
            <option value="passport">Passport</option>
            <option value="state_id">State ID</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="id_document_number">ID Document Number</Label>
          <Input
            id="id_document_number"
            value={formData.id_document_number}
            onChange={(e) => setFormData({ ...formData, id_document_number: e.target.value.toUpperCase() })}
            placeholder="Document number"
            required
          />
        </div>

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            By submitting, you certify that all information provided is accurate and truthful.
          </AlertDescription>
        </Alert>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Submitting..." : "Submit Identity Verification"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground mt-4">
        Your data is encrypted and securely stored in compliance with federal privacy regulations.
      </p>
    </Card>
  );
}
