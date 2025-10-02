import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Info, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const PublicDisclosure = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [disclosure, setDisclosure] = useState<any>(null);
  const [requiresDisclosure, setRequiresDisclosure] = useState(false);
  
  const [formData, setFormData] = useState({
    business_name: "",
    contact_name: "",
    business_address: "",
    contact_email: "",
    contact_phone: "",
  });

  useEffect(() => {
    if (user) {
      checkDisclosureRequirement();
      loadDisclosure();
    }
  }, [user]);

  const checkDisclosureRequirement = async () => {
    if (!user) return;
    
    try {
      const { data: verification, error } = await supabase
        .from("seller_verifications")
        .select("revenue_annual, revenue_30_day")
        .eq("seller_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // INFORM Act: Requires disclosure for sellers with $20k+ in annual revenue
      const meetsThreshold = verification && verification.revenue_annual >= 20000;
      setRequiresDisclosure(meetsThreshold);
    } catch (error) {
      console.error("Error checking disclosure requirement:", error);
    }
  };

  const loadDisclosure = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("seller_public_disclosures")
      .select("*")
      .eq("seller_id", user.id)
      .maybeSingle();

    if (data) {
      setDisclosure(data);
      setFormData({
        business_name: data.business_name || "",
        contact_name: data.contact_name || "",
        business_address: data.business_address || "",
        contact_email: data.contact_email || "",
        contact_phone: data.contact_phone || "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("seller_public_disclosures")
        .upsert({
          seller_id: user.id,
          ...formData,
          is_active: true,
          disclosure_required_since: new Date().toISOString().split('T')[0],
        });

      if (error) throw error;

      toast({
        title: "Disclosure Submitted",
        description: "Your public business information has been updated.",
      });

      loadDisclosure();
    } catch (error) {
      console.error("Disclosure error:", error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit disclosure",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!requiresDisclosure) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Public Business Disclosure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <p className="font-semibold mb-1">Not Currently Required</p>
              <p>
                Public business disclosure is required by the INFORM Consumers Act when you reach 
                $20,000 in annual sales. You'll be notified when this applies to your account.
              </p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Public Business Disclosure (Required)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <p className="font-semibold mb-1">INFORM Consumers Act Requirement</p>
            <p>
              Because you've exceeded $20,000 in annual sales, federal law requires us to publicly 
              display your business contact information to help build consumer trust and prevent fraud.
            </p>
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="business_name">Business Name *</Label>
            <Input
              id="business_name"
              value={formData.business_name}
              onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
              placeholder="Your business or operating name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_name">Contact Name *</Label>
            <Input
              id="contact_name"
              value={formData.contact_name}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
              placeholder="Primary contact person"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_address">Business Address *</Label>
            <Input
              id="business_address"
              value={formData.business_address}
              onChange={(e) => setFormData(prev => ({ ...prev, business_address: e.target.value }))}
              placeholder="Street, City, State, ZIP"
              required
            />
            <p className="text-xs text-muted-foreground">
              This address will be publicly visible to customers
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email *</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
              placeholder="business@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_phone">Contact Phone *</Label>
            <Input
              id="contact_phone"
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
              placeholder="(555) 123-4567"
              required
            />
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-2">Privacy Notice</h4>
            <p className="text-sm text-muted-foreground">
              This information will be displayed on your public seller profile. Customers will be able 
              to see this information to verify your business identity and contact you if needed.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading} size="lg">
            {loading ? "Saving..." : disclosure ? "Update Public Information" : "Submit Public Disclosure"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
