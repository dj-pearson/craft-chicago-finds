import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const SellerVerification = () => {
  const { user } = useAuth();

  // Verification is now handled by Stripe Connect
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Seller Identity Verification
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            Seller verification is now handled through Stripe Connect. Please complete your Stripe onboarding to verify your identity and accept payments.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
