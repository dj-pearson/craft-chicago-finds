import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const ComplianceControls = () => {
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const { toast } = useToast();

  const triggerComplianceCheck = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('trigger_compliance_check');
      
      if (error) throw error;

      setLastRun(new Date());
      toast({
        title: "Compliance Check Triggered",
        description: "Automated compliance notifications have been sent to sellers requiring action.",
      });
    } catch (error) {
      console.error("Error triggering compliance check:", error);
      toast({
        title: "Error",
        description: "Failed to trigger compliance check. Please try again.",
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
          <Bell className="h-5 w-5" />
          Compliance Monitoring
        </CardTitle>
        <CardDescription>
          Automated seller compliance checks and notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This system automatically notifies sellers about:
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Identity verification requirements (revenue ≥ $5,000)</li>
              <li>W-9 form submission (revenue ≥ $600)</li>
              <li>Public disclosure requirements (revenue ≥ $20,000)</li>
              <li>Pending moderation issues</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Button 
            onClick={triggerComplianceCheck}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Triggering..." : "Trigger Manual Compliance Check"}
          </Button>
          
          {lastRun && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Last run: {lastRun.toLocaleString()}
            </div>
          )}
        </div>

        <Alert>
          <AlertDescription className="text-sm">
            <strong>Automated Schedule:</strong> Compliance checks run automatically via edge function.
            Use the manual trigger above for immediate checks.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
