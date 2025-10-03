import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Clock, 
  FileText, 
  ShieldAlert,
  CheckCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface ComplianceIssue {
  id: string;
  type: 'verification' | 'tax_document' | 'disclosure' | 'performance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  deadline?: Date;
  actionUrl?: string;
  actionText?: string;
}

export const ComplianceAlerts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState<ComplianceIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkComplianceStatus();
    }
  }, [user]);

  const checkComplianceStatus = async () => {
    if (!user) return;

    const complianceIssues: ComplianceIssue[] = [];

    try {
      // Check seller verification status
      const { data: verification } = await supabase
        .from("seller_verifications")
        .select("*")
        .eq("seller_id", user.id)
        .eq("verification_type", "identity")
        .single();

      if (verification?.revenue_annual >= 5000 && verification.verification_status === 'pending') {
        const daysUntilDeadline = verification.verification_deadline 
          ? Math.ceil((new Date(verification.verification_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null;

        complianceIssues.push({
          id: 'identity-verification',
          type: 'verification',
          severity: daysUntilDeadline && daysUntilDeadline <= 3 ? 'critical' : 'high',
          title: 'Identity Verification Required',
          description: `Your annual revenue has exceeded $5,000. Federal law requires identity verification within 10 days.${
            daysUntilDeadline ? ` ${daysUntilDeadline} days remaining.` : ''
          }`,
          deadline: verification.verification_deadline ? new Date(verification.verification_deadline) : undefined,
          actionUrl: '/dashboard?tab=verification',
          actionText: 'Complete Verification'
        });
      }

      // Check W-9 status - placeholder for future implementation
      const hasTaxDocs = false; // This would check seller_tax_documents table when available

      if (!hasTaxDocs && verification?.revenue_annual >= 600) {
        complianceIssues.push({
          id: 'w9-required',
          type: 'tax_document',
          severity: 'high',
          title: 'W-9 Form Required',
          description: 'Your earnings require submission of IRS Form W-9 for tax reporting purposes.',
          actionUrl: '/dashboard?tab=tax-documents',
          actionText: 'Submit W-9'
        });
      }

      // Check public disclosure requirement
      const { data: disclosure } = await supabase
        .from("seller_public_disclosures")
        .select("*")
        .eq("seller_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (verification?.revenue_annual >= 20000 && !disclosure) {
        complianceIssues.push({
          id: 'public-disclosure',
          type: 'disclosure',
          severity: 'high',
          title: 'Public Business Disclosure Required',
          description: 'Federal law requires high-volume sellers to provide public business contact information.',
          actionUrl: '/dashboard?tab=verification',
          actionText: 'Add Disclosure'
        });
      }

      // Check moderation issues
      const { data: moderationIssues } = await supabase
        .from("moderation_queue")
        .select("*")
        .eq("seller_id", user.id)
        .eq("status", "pending");

      if (moderationIssues && moderationIssues.length > 0) {
        complianceIssues.push({
          id: 'moderation-pending',
          type: 'performance',
          severity: 'medium',
          title: `${moderationIssues.length} Listing(s) Under Review`,
          description: 'Some of your listings are pending moderation review. This may affect their visibility.',
          actionUrl: '/dashboard?tab=listings',
          actionText: 'View Listings'
        });
      }

      setIssues(complianceIssues);
    } catch (error) {
      console.error("Error checking compliance status:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: ComplianceIssue['severity']) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'high': return <ShieldAlert className="h-5 w-5 text-orange-500" />;
      case 'medium': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'low': return <FileText className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: ComplianceIssue['severity']) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Checking compliance status...</div>
        </CardContent>
      </Card>
    );
  }

  if (issues.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
          <CardDescription>Your account compliance and requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">All Requirements Met</p>
              <p className="text-sm text-muted-foreground">
                Your account is in good standing with all compliance requirements.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Compliance Alerts</CardTitle>
            <CardDescription>Action required on your account</CardDescription>
          </div>
          <Badge variant="destructive">{issues.length} Issue{issues.length !== 1 ? 's' : ''}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {issues.map((issue) => (
          <Alert key={issue.id} variant={issue.severity === 'critical' ? 'destructive' : 'default'}>
            <div className="flex gap-3">
              {getSeverityIcon(issue.severity)}
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <AlertTitle className="mb-1">{issue.title}</AlertTitle>
                  <Badge variant={getSeverityColor(issue.severity)} className="shrink-0">
                    {issue.severity.toUpperCase()}
                  </Badge>
                </div>
                <AlertDescription className="text-sm">
                  {issue.description}
                </AlertDescription>
                {issue.deadline && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Deadline: {issue.deadline.toLocaleDateString()}
                  </p>
                )}
                {issue.actionUrl && (
                  <Button 
                    size="sm" 
                    onClick={() => navigate(issue.actionUrl!)}
                    variant={issue.severity === 'critical' ? 'destructive' : 'default'}
                  >
                    {issue.actionText || 'Take Action'}
                  </Button>
                )}
              </div>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};
