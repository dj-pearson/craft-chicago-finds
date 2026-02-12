import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { FileText, AlertCircle } from "lucide-react";

export const W9FormSubmission = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    legal_name: "",
    business_entity_type: "individual",
    tax_id_type: "ssn",
    tax_id: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    backup_withholding_exempt: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setLoading(true);
    try {
      // Only store last 4 digits of TIN for security
      const taxIdLast4 = formData.tax_id.slice(-4);
      
      const { error } = await supabase
        .from("seller_tax_info")
        .upsert({
          seller_id: user.id,
          legal_name: formData.legal_name,
          business_entity_type: formData.business_entity_type,
          tax_id_type: formData.tax_id_type,
          tax_id_last_4: taxIdLast4,
          tax_address: {
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
          },
          backup_withholding_exempt: formData.backup_withholding_exempt,
          w9_submitted_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "W-9 Submitted Successfully",
        description: "Your tax information has been saved. We will verify your TIN with the IRS.",
      });
    } catch (error) {
      console.error("W-9 submission error:", error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit W-9 form",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          W-9 Tax Information Form
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-semibold mb-1">IRS Reporting Requirement</p>
              <p>
                Sellers who earn $20,000 or more AND have 200+ transactions per year will receive a 1099-K form. 
                We need your tax information to comply with IRS reporting requirements.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="legal_name">Legal Name *</Label>
            <Input
              id="legal_name"
              value={formData.legal_name}
              onChange={(e) => setFormData(prev => ({ ...prev, legal_name: e.target.value }))}
              placeholder="As shown on your tax return"
              autoComplete="name"
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter your name exactly as it appears on your tax return
            </p>
          </div>

          <div className="space-y-3">
            <Label>Business Entity Type *</Label>
            <RadioGroup
              value={formData.business_entity_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, business_entity_type: value }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual" className="cursor-pointer">Individual / Sole Proprietor</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="llc" id="llc" />
                <Label htmlFor="llc" className="cursor-pointer">Limited Liability Company (LLC)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="s_corp" id="s_corp" />
                <Label htmlFor="s_corp" className="cursor-pointer">S Corporation</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="c_corp" id="c_corp" />
                <Label htmlFor="c_corp" className="cursor-pointer">C Corporation</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partnership" id="partnership" />
                <Label htmlFor="partnership" className="cursor-pointer">Partnership</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Taxpayer Identification Number (TIN) Type *</Label>
            <RadioGroup
              value={formData.tax_id_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, tax_id_type: value as "ssn" | "ein" }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ssn" id="ssn" />
                <Label htmlFor="ssn" className="cursor-pointer">Social Security Number (SSN)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ein" id="ein" />
                <Label htmlFor="ein" className="cursor-pointer">Employer Identification Number (EIN)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax_id">
              {formData.tax_id_type === "ssn" ? "Social Security Number" : "Employer Identification Number"} *
            </Label>
            <Input
              id="tax_id"
              type="password"
              value={formData.tax_id}
              onChange={(e) => setFormData(prev => ({ ...prev, tax_id: e.target.value.replace(/\D/g, "") }))}
              placeholder={formData.tax_id_type === "ssn" ? "XXX-XX-XXXX" : "XX-XXXXXXX"}
              maxLength={9}
              required
            />
            <p className="text-xs text-muted-foreground">
              We only store the last 4 digits. Your full TIN is encrypted and secured.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Business Address</h3>
            
            <div className="space-y-2">
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="123 Main Street"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                  placeholder="IL"
                  maxLength={2}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code *</Label>
              <Input
                id="zip"
                value={formData.zip}
                onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value.replace(/\D/g, "") }))}
                maxLength={5}
                placeholder="60601"
                required
              />
            </div>
          </div>

          <div className="flex items-start space-x-2 p-4 bg-muted/50 rounded-lg">
            <Checkbox
              id="backup_withholding"
              checked={formData.backup_withholding_exempt}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, backup_withholding_exempt: checked as boolean }))
              }
            />
            <div className="space-y-1">
              <Label htmlFor="backup_withholding" className="cursor-pointer">
                I am exempt from backup withholding
              </Label>
              <p className="text-xs text-muted-foreground">
                Check this box if you are exempt from backup withholding or if you have not been notified 
                by the IRS that you are subject to backup withholding.
              </p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-3">Certification</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Under penalties of perjury, I certify that:
            </p>
            <ul className="text-sm space-y-1 mb-4">
              <li>1. The number shown on this form is my correct taxpayer identification number, and</li>
              <li>2. I am not subject to backup withholding, or I am exempt from backup withholding, and</li>
              <li>3. I am a U.S. citizen or other U.S. person, and</li>
              <li>4. The information on this form is true, correct, and complete.</li>
            </ul>
          </div>

          <Button type="submit" className="w-full" disabled={loading} size="lg">
            {loading ? "Submitting..." : "Submit W-9 Form"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Your information is encrypted and stored securely. We will never share your tax information 
            with third parties except as required by law.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
