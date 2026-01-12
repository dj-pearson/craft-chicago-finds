import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DMCANotice() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    claimant_name: "",
    claimant_email: "",
    claimant_address: "",
    infringing_url: "",
    original_work_description: "",
    claimant_signature: "",
    good_faith_belief: false,
    accuracy_statement: false,
    penalty_of_perjury: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.good_faith_belief || !formData.accuracy_statement || !formData.penalty_of_perjury) {
      toast({
        title: "Incomplete Submission",
        description: "Please check all required certifications",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Set response deadline to 10 business days from now
      const responseDeadline = new Date();
      responseDeadline.setDate(responseDeadline.getDate() + 14);

      const { error } = await supabase
        .from("dmca_notices")
        .insert({
          notice_type: 'takedown',
          claimant_name: formData.claimant_name,
          claimant_email: formData.claimant_email,
          claimant_address: formData.claimant_address,
          infringing_url: formData.infringing_url,
          original_work_description: formData.original_work_description,
          claimant_signature: formData.claimant_signature,
          response_deadline: responseDeadline.toISOString(),
        });

      if (error) throw error;

      toast({
        title: "DMCA Notice Submitted",
        description: "Your copyright infringement notice has been submitted. We will review and respond within 10 business days.",
      });

      // Reset form
      setFormData({
        claimant_name: "",
        claimant_email: "",
        claimant_address: "",
        infringing_url: "",
        original_work_description: "",
        claimant_signature: "",
        good_faith_belief: false,
        accuracy_statement: false,
        penalty_of_perjury: false,
      });
    } catch (error) {
      console.error("DMCA submission error:", error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit DMCA notice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" role="main" className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
            <FileText className="h-8 w-8" />
            File a DMCA Takedown Notice
          </h1>
          <p className="text-muted-foreground">
            Submit a copyright infringement notice under the Digital Millennium Copyright Act
          </p>
        </div>

        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <p className="font-semibold mb-1">Important Legal Notice</p>
            <p>
              Filing a false DMCA notice may result in legal liability. Please ensure you have the 
              legal right to file this notice and that all information provided is accurate.
            </p>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Copyright Infringement Claim</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="claimant_name">Your Full Name *</Label>
                <Input
                  id="claimant_name"
                  value={formData.claimant_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, claimant_name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="claimant_email">Your Email Address *</Label>
                <Input
                  id="claimant_email"
                  type="email"
                  value={formData.claimant_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, claimant_email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="claimant_address">Your Physical Address *</Label>
                <Input
                  id="claimant_address"
                  value={formData.claimant_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, claimant_address: e.target.value }))}
                  placeholder="Street, City, State, ZIP"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="infringing_url">URL of Infringing Content *</Label>
                <Input
                  id="infringing_url"
                  type="url"
                  value={formData.infringing_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, infringing_url: e.target.value }))}
                  placeholder="https://craftlocal.net/listing/..."
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Provide the complete URL of the listing or content that infringes your copyright
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="original_work_description">
                  Description of Your Original Work *
                </Label>
                <Textarea
                  id="original_work_description"
                  value={formData.original_work_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, original_work_description: e.target.value }))}
                  placeholder="Describe your original copyrighted work and how it is being infringed..."
                  rows={6}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Include details about your original work, when it was created, and how the listed 
                  content infringes on your copyright
                </p>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h3 className="font-semibold text-lg">Required Certifications</h3>
                
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="good_faith"
                    checked={formData.good_faith_belief}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, good_faith_belief: checked as boolean }))
                    }
                  />
                  <Label htmlFor="good_faith" className="cursor-pointer leading-relaxed">
                    I have a good faith belief that use of the copyrighted material in the manner 
                    complained of is not authorized by the copyright owner, its agent, or the law.
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="accuracy"
                    checked={formData.accuracy_statement}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, accuracy_statement: checked as boolean }))
                    }
                  />
                  <Label htmlFor="accuracy" className="cursor-pointer leading-relaxed">
                    The information in this notification is accurate.
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="perjury"
                    checked={formData.penalty_of_perjury}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, penalty_of_perjury: checked as boolean }))
                    }
                  />
                  <Label htmlFor="perjury" className="cursor-pointer leading-relaxed">
                    Under penalty of perjury, I am the owner, or authorized to act on behalf of the 
                    owner, of an exclusive right that is allegedly infringed.
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signature">Electronic Signature *</Label>
                <Input
                  id="signature"
                  value={formData.claimant_signature}
                  onChange={(e) => setFormData(prev => ({ ...prev, claimant_signature: e.target.value }))}
                  placeholder="Type your full name"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Type your full name to serve as your electronic signature
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
                size="lg"
              >
                {loading ? "Submitting..." : "Submit DMCA Takedown Notice"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By submitting this form, you acknowledge that you understand the legal implications 
                of filing a DMCA notice and that all information provided is true and accurate.
              </p>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. Review (1-2 Business Days)</h4>
              <p className="text-sm text-muted-foreground">
                Our team will review your DMCA notice to ensure it meets legal requirements.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2. Content Removal (If Valid)</h4>
              <p className="text-sm text-muted-foreground">
                If your notice is valid, we will remove or disable access to the infringing content.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">3. Seller Notification</h4>
              <p className="text-sm text-muted-foreground">
                The seller will be notified of the takedown and may file a counter-notice.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">4. Counter-Notice Period (10-14 Days)</h4>
              <p className="text-sm text-muted-foreground">
                If the seller files a valid counter-notice, the content may be restored unless you 
                file a lawsuit within 10-14 business days.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
