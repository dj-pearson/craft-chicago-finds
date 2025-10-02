import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const TaxDocuments = () => {
  const { user } = useAuth();
  const [forms1099K, setForms1099K] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTaxDocuments();
    }
  }, [user]);

  const loadTaxDocuments = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tax_form_1099k")
        .select("*")
        .eq("seller_id", user.id)
        .order("tax_year", { ascending: false });

      if (error) throw error;
      setForms1099K(data || []);
    } catch (error) {
      console.error("Error loading tax documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Tax Documents (1099-K Forms)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <p className="font-semibold mb-1">IRS Form 1099-K</p>
            <p>
              If you earned $20,000 or more AND had 200+ transactions in a calendar year, 
              we're required to report your earnings to the IRS. Your 1099-K form will be 
              available here by January 31st of the following year.
            </p>
          </AlertDescription>
        </Alert>

        {loading ? (
          <p className="text-muted-foreground">Loading tax documents...</p>
        ) : forms1099K.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No 1099-K forms available yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Forms will appear here if you meet the IRS reporting threshold.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {forms1099K.map((form) => (
              <div 
                key={form.id} 
                className="border rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-semibold">Tax Year {form.tax_year}</h4>
                  <div className="text-sm text-muted-foreground mt-1 space-y-1">
                    <p>Gross Amount: {formatCurrency(form.gross_amount)}</p>
                    <p>Total Transactions: {form.transaction_count.toLocaleString()}</p>
                    {form.issued_date && (
                      <p>Issued: {new Date(form.issued_date).toLocaleDateString()}</p>
                    )}
                  </div>
                  {form.corrections_made && (
                    <p className="text-xs text-amber-600 mt-2">
                      * Corrected form - replaces previous version
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {form.form_url ? (
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <a href={form.form_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </a>
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled>
                      Pending Generation
                    </Button>
                  )}
                  {form.filed_with_irs ? (
                    <span className="text-xs text-green-600 text-center">
                      Filed with IRS
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground text-center">
                      Not yet filed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-6 border-t">
          <h4 className="font-semibold mb-2">Need Help?</h4>
          <p className="text-sm text-muted-foreground">
            If you have questions about your 1099-K form or tax reporting, please consult with a 
            tax professional. We recommend keeping detailed records of all your sales throughout the year.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
