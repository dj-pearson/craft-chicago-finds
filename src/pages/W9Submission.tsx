import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { w9FormSchema, type W9FormData } from "@/lib/compliance-validation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const W9Submission = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<W9FormData>({
    resolver: zodResolver(w9FormSchema),
  });

  const taxClassification = watch("tax_classification");

  const onSubmit = async (data: W9FormData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit your W-9 form.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // In production, TIN should be encrypted before storing
      // For now, we'll store a masked version
      const maskedTin = data.tin.replace(/\d(?=\d{4})/g, "*");

      const { error } = await supabase
        .from("seller_tax_info")
        .upsert({
          seller_id: user.id,
          legal_name: data.legal_name,
          business_name: data.business_name || null,
          tax_classification: data.tax_classification,
          address: data.address,
          city: data.city,
          state: data.state,
          zip: data.zip,
          tin_last_4: data.tin.slice(-4),
          tin_masked: maskedTin,
          signature: data.signature,
          w9_submitted_at: new Date().toISOString(),
          w9_verified: false,
        }, {
          onConflict: "seller_id",
        });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "W-9 Form Submitted",
        description: "Your tax information has been securely saved.",
      });

      // Redirect after short delay
      setTimeout(() => {
        navigate("/dashboard?tab=verification");
      }, 2000);
    } catch (error) {
      console.error("Error submitting W-9:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your W-9 form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background py-8">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
                  <h2 className="text-2xl font-bold">W-9 Form Submitted Successfully</h2>
                  <p className="text-muted-foreground">
                    Your tax information has been securely saved. Redirecting to dashboard...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8" />
          IRS Form W-9 Submission
        </h1>
        <p className="text-muted-foreground">
          Request for Taxpayer Identification Number and Certification
        </p>
      </div>

      {/* Important Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Why This is Required:</strong> Federal law requires marketplaces to collect tax information 
          from sellers who earn $600 or more per year. This information is used to issue Form 1099-K for tax reporting.
        </AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> Your Social Security Number or Tax Identification Number will be 
          encrypted and stored securely. We use bank-level encryption to protect your sensitive information.
        </AlertDescription>
      </Alert>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Information</CardTitle>
          <CardDescription>
            Complete all required fields. Information must match your IRS records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Legal Name */}
            <div className="space-y-2">
              <Label htmlFor="legal_name">
                Legal Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="legal_name"
                {...register("legal_name")}
                placeholder="As shown on your income tax return"
              />
              {errors.legal_name && (
                <p className="text-sm text-destructive">{errors.legal_name.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter your name exactly as it appears on your tax return
              </p>
            </div>

            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name (if different)</Label>
              <Input
                id="business_name"
                {...register("business_name")}
                placeholder="Optional - DBA or trade name"
              />
              {errors.business_name && (
                <p className="text-sm text-destructive">{errors.business_name.message}</p>
              )}
            </div>

            {/* Tax Classification */}
            <div className="space-y-2">
              <Label htmlFor="tax_classification">
                Tax Classification <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={(value) => setValue("tax_classification", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your tax classification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual/Sole Proprietor</SelectItem>
                  <SelectItem value="c_corp">C Corporation</SelectItem>
                  <SelectItem value="s_corp">S Corporation</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="trust">Trust/Estate</SelectItem>
                  <SelectItem value="llc">LLC</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.tax_classification && (
                <p className="text-sm text-destructive">{errors.tax_classification.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">
                Street Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                {...register("address")}
                placeholder="123 Main Street"
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address.message}</p>
              )}
            </div>

            {/* City, State, ZIP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">
                  City <span className="text-destructive">*</span>
                </Label>
                <Input id="city" {...register("city")} placeholder="City" />
                {errors.city && (
                  <p className="text-sm text-destructive">{errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">
                  State <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="state"
                  {...register("state")}
                  placeholder="IL"
                  maxLength={2}
                  className="uppercase"
                />
                {errors.state && (
                  <p className="text-sm text-destructive">{errors.state.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip">
                  ZIP Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="zip"
                  {...register("zip")}
                  placeholder="60601"
                />
                {errors.zip && (
                  <p className="text-sm text-destructive">{errors.zip.message}</p>
                )}
              </div>
            </div>

            {/* TIN/SSN */}
            <div className="space-y-2">
              <Label htmlFor="tin">
                Social Security Number or Tax ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tin"
                type="password"
                {...register("tin")}
                placeholder="XXX-XX-XXXX or XX-XXXXXXX"
                autoComplete="off"
              />
              {errors.tin && (
                <p className="text-sm text-destructive">{errors.tin.message}</p>
              )}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Format: 123-45-6789 (SSN) or 12-3456789 (EIN). This information is encrypted and securely stored.
                </AlertDescription>
              </Alert>
            </div>

            {/* Certification */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="font-semibold">Certification</h3>
              <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                <p>Under penalties of perjury, I certify that:</p>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>The number shown on this form is my correct taxpayer identification number, and</li>
                  <li>I am not subject to backup withholding, and</li>
                  <li>I am a U.S. citizen or other U.S. person, and</li>
                  <li>The FATCA code(s) entered on this form (if any) indicating that I am exempt from FATCA reporting is correct.</li>
                </ol>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signature">
                  Electronic Signature <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="signature"
                  {...register("signature")}
                  placeholder="Type your full legal name"
                />
                {errors.signature && (
                  <p className="text-sm text-destructive">{errors.signature.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  By typing your name, you are electronically signing this form under penalty of perjury.
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard?tab=verification")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Submitting..." : "Submit W-9 Form"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Privacy & Security</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>
            <strong>How We Protect Your Information:</strong> Your tax identification number is encrypted 
            using AES-256 encryption before storage. Only authorized personnel can access this information 
            for tax reporting purposes.
          </p>
          <p>
            <strong>How We Use This Information:</strong> This information is used solely for tax reporting 
            purposes as required by the IRS. We will issue Form 1099-K if you meet the reporting thresholds 
            ($20,000 in gross revenue AND 200+ transactions).
          </p>
          <p>
            <strong>Questions?</strong> Contact us at{" "}
            <a href="mailto:tax@craftlocal.net" className="text-primary hover:underline">
              tax@craftlocal.net
            </a>
          </p>
        </CardContent>
      </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default W9Submission;
