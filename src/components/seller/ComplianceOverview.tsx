import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Clock, XCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ComplianceStatus {
  verification_status?: string;
  tax_info_complete: boolean;
  disclosure_required: boolean;
  disclosure_complete: boolean;
  performance_meets_standards: boolean;
  revenue_annual: number;
}

export const ComplianceOverview = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<ComplianceStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadComplianceStatus();
    }
  }, [user]);

  const loadComplianceStatus = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Check verification status
      const { data: verification } = await supabase
        .from("seller_verifications")
        .select("verification_status, revenue_annual")
        .eq("seller_id", user.id)
        .maybeSingle();

      // Check tax info
      const { data: taxInfo } = await supabase
        .from("seller_tax_info")
        .select("w9_submitted_at")
        .eq("seller_id", user.id)
        .maybeSingle();

      // Check public disclosure
      const { data: disclosure } = await supabase
        .from("seller_public_disclosures")
        .select("is_active")
        .eq("seller_id", user.id)
        .maybeSingle();

      // Check performance metrics
      const { data: performance } = await supabase
        .from("seller_performance_metrics")
        .select("meets_standards")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const revenueAnnual = verification?.revenue_annual || 0;
      const requiresDisclosure = revenueAnnual >= 20000;

      setStatus({
        verification_status: verification?.verification_status,
        tax_info_complete: !!taxInfo?.w9_submitted_at,
        disclosure_required: requiresDisclosure,
        disclosure_complete: !!disclosure?.is_active,
        performance_meets_standards: performance?.meets_standards !== false,
        revenue_annual: revenueAnnual,
      });
    } catch (error) {
      console.error("Error loading compliance status:", error);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationBadge = (status?: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-amber-600 border-amber-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" />Not Started</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading compliance status...</p>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const allCompliant = 
    status.verification_status === 'verified' &&
    status.tax_info_complete &&
    (!status.disclosure_required || status.disclosure_complete) &&
    status.performance_meets_standards;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Compliance Status</span>
          {allCompliant ? (
            <Badge className="bg-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              All Requirements Met
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-600 border-amber-600">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Action Required
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Identity Verification */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <p className="font-medium">Identity Verification</p>
            <p className="text-sm text-muted-foreground">INFORM Consumers Act requirement</p>
          </div>
          {getVerificationBadge(status.verification_status)}
        </div>

        {/* Tax Information */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <p className="font-medium">W-9 Tax Information</p>
            <p className="text-sm text-muted-foreground">Required for payment processing</p>
          </div>
          {status.tax_info_complete ? (
            <Badge className="bg-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-600 border-amber-600">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Required
            </Badge>
          )}
        </div>

        {/* Public Disclosure */}
        {status.disclosure_required && (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Public Business Disclosure</p>
              <p className="text-sm text-muted-foreground">Required for $20k+ annual revenue</p>
            </div>
            {status.disclosure_complete ? (
              <Badge className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Required
              </Badge>
            )}
          </div>
        )}

        {/* Performance Standards */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <p className="font-medium">Performance Standards</p>
            <p className="text-sm text-muted-foreground">Seller quality metrics</p>
          </div>
          {status.performance_meets_standards ? (
            <Badge className="bg-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Meeting Standards
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Below Standards
            </Badge>
          )}
        </div>

        {!allCompliant && (
          <Alert className="border-amber-200 bg-amber-50">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              <p className="font-semibold mb-1">Action Required</p>
              <p className="text-sm">
                Complete the required items above to maintain full selling privileges. 
                Navigate to the respective tabs to complete each requirement.
              </p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
