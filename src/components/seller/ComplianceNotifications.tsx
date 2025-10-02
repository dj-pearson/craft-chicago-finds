import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCompliance } from "@/hooks/useCompliance";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, DollarSign, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ComplianceNotifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { compliance, loading, isCompliant, criticalIssues } = useCompliance(user?.id || null);

  if (loading || !compliance || isCompliant) return null;

  const handleNavigate = (tab: string) => {
    navigate(`/dashboard?tab=${tab}`);
  };

  return (
    <div className="space-y-3">
      {/* Identity Verification Warning */}
      {compliance.identity?.status === 'pending' && compliance.identity?.deadline && (
        <Alert className="border-amber-200 bg-amber-50">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900">Identity Verification Due</AlertTitle>
          <AlertDescription className="text-amber-800">
            <p className="mb-2">
              Your identity verification is due by{" "}
              {new Date(compliance.identity.deadline).toLocaleDateString()}.
              {compliance.identity.daysRemaining !== null && 
                ` (${compliance.identity.daysRemaining} days remaining)`
              }
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleNavigate('verification')}
              className="border-amber-600 text-amber-900 hover:bg-amber-100"
            >
              Complete Verification
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* W-9 Requirement */}
      {!compliance.taxForms?.w9Submitted && compliance.identity?.status === 'verified' && (
        <Alert className="border-blue-200 bg-blue-50">
          <DollarSign className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">W-9 Form Required</AlertTitle>
          <AlertDescription className="text-blue-800">
            <p className="mb-2">
              You must submit a W-9 form to receive payments. This is required for IRS compliance.
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleNavigate('taxes')}
              className="border-blue-600 text-blue-900 hover:bg-blue-100"
            >
              Submit W-9
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Public Disclosure Requirement */}
      {compliance.publicDisclosure?.required && !compliance.publicDisclosure?.submitted && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Public Disclosure Required</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              Federal law requires sellers with $20,000+ in annual revenue to provide public business contact information.
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleNavigate('verification')}
              className="border-white text-white hover:bg-red-800"
            >
              Submit Disclosure
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Performance Warning */}
      {compliance.performance && !compliance.performance.meetsStandards && (
        <Alert className="border-orange-200 bg-orange-50">
          <ShieldCheck className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900">Performance Below Standards</AlertTitle>
          <AlertDescription className="text-orange-800">
            <p className="mb-2">
              Your seller performance metrics are below platform standards. Review your metrics and take action to improve.
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleNavigate('compliance')}
              className="border-orange-600 text-orange-900 hover:bg-orange-100"
            >
              View Metrics
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
