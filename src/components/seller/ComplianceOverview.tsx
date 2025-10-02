import { useAuth } from "@/hooks/useAuth";
import { useCompliance } from "@/hooks/useCompliance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Clock, XCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const ComplianceOverview = () => {
  const { user } = useAuth();
  const { compliance, loading, isCompliant, criticalIssues } = useCompliance(user?.id || null);

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

  if (!compliance) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Compliance Status</span>
          {isCompliant ? (
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
          {getVerificationBadge(compliance.identity?.verification_status)}
        </div>

        {/* Tax Information */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <p className="font-medium">W-9 Tax Information</p>
            <p className="text-sm text-muted-foreground">Required for payment processing</p>
          </div>
          {compliance.taxForms?.w9Submitted ? (
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
        {compliance.publicDisclosure?.required && (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Public Business Disclosure</p>
              <p className="text-sm text-muted-foreground">Required for $20k+ annual revenue</p>
            </div>
            {compliance.publicDisclosure?.submitted ? (
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
          {compliance.performance?.meetsStandards ? (
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

        {!isCompliant && criticalIssues.length > 0 && (
          <Alert className="border-amber-200 bg-amber-50">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              <p className="font-semibold mb-1">Action Required</p>
              <ul className="text-sm list-disc list-inside space-y-1 mt-2">
                {criticalIssues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
