import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, CheckCircle, Clock, FileText } from "lucide-react";
import { Link } from "react-router-dom";

interface ComplianceStatus {
  w9_submitted: boolean;
  identity_verified: boolean;
  public_disclosure_complete: boolean;
  revenue_annual: number;
  revenue_30_day: number;
  verification_deadline?: string;
}

export function ComplianceStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<ComplianceStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const loadStatus = async () => {
      try {
        // Check W9 submission
        const { data: w9Data } = await supabase
          .from("seller_tax_info")
          .select("id")
          .eq("seller_id", user.id)
          .single();

        // Check identity verification
        const { data: verificationData } = await supabase
          .from("seller_verifications")
          .select("verification_status, revenue_annual, revenue_30_day, verification_deadline")
          .eq("seller_id", user.id)
          .eq("verification_type", "identity")
          .single();

        // Check public disclosure
        const { data: disclosureData } = await supabase
          .from("seller_public_disclosures")
          .select("id, is_active")
          .eq("seller_id", user.id)
          .eq("is_active", true)
          .single();

        setStatus({
          w9_submitted: !!w9Data,
          identity_verified: verificationData?.verification_status === "approved",
          public_disclosure_complete: !!disclosureData,
          revenue_annual: verificationData?.revenue_annual || 0,
          revenue_30_day: verificationData?.revenue_30_day || 0,
          verification_deadline: verificationData?.verification_deadline,
        });
      } catch (error) {
        console.error("Error loading compliance status:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
  }, [user?.id]);

  if (loading) {
    return <Card className="p-6">Loading compliance status...</Card>;
  }

  if (!status) {
    return null;
  }

  const needsW9 = status.revenue_annual >= 600 && !status.w9_submitted;
  const needsIdentity = status.revenue_annual >= 5000 && !status.identity_verified;
  const needsDisclosure = status.revenue_annual >= 20000 && !status.public_disclosure_complete;
  const hasDeadline = status.verification_deadline && new Date(status.verification_deadline) > new Date();

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Compliance Status</h2>

      <div className="space-y-4">
        {hasDeadline && needsIdentity && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Action Required:</strong> Identity verification deadline is{" "}
              {new Date(status.verification_deadline!).toLocaleDateString()}. 
              Complete verification to maintain selling privileges.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5" />
              <div>
                <p className="font-medium">W-9 Tax Information</p>
                <p className="text-sm text-muted-foreground">
                  Required at $600 annual revenue
                </p>
              </div>
            </div>
            {status.w9_submitted ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" /> Submitted
              </Badge>
            ) : needsW9 ? (
              <Link to="/w9-submission">
                <Button size="sm" variant="destructive">Submit W-9</Button>
              </Link>
            ) : (
              <Badge variant="secondary">Not Required</Badge>
            )}
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Identity Verification</p>
                <p className="text-sm text-muted-foreground">
                  Required at $5,000 annual revenue
                </p>
              </div>
            </div>
            {status.identity_verified ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" /> Verified
              </Badge>
            ) : needsIdentity ? (
              <Badge variant="destructive" className="gap-1">
                <Clock className="h-3 w-3" /> Action Required
              </Badge>
            ) : (
              <Badge variant="secondary">Not Required</Badge>
            )}
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5" />
              <div>
                <p className="font-medium">Public Business Disclosure</p>
                <p className="text-sm text-muted-foreground">
                  Required at $20,000 annual revenue
                </p>
              </div>
            </div>
            {status.public_disclosure_complete ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" /> Complete
              </Badge>
            ) : needsDisclosure ? (
              <Badge variant="destructive" className="gap-1">
                <Clock className="h-3 w-3" /> Required
              </Badge>
            ) : (
              <Badge variant="secondary">Not Required</Badge>
            )}
          </div>
        </div>

        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-2">Revenue Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Last 30 Days</p>
              <p className="text-lg font-bold">${status.revenue_30_day.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Annual Revenue</p>
              <p className="text-lg font-bold">${status.revenue_annual.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
