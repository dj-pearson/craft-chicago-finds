import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { useCityContext } from "@/hooks/useCityContext";

export const EtsyImporter = () => {
  const { toast } = useToast();
  const { currentCity } = useCityContext();
  const [shopId, setShopId] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    imported: number;
    failed: number;
    errors: Array<{ listing_id: number; title: string; error: string }>;
  } | null>(null);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shopId.trim()) {
      toast({
        title: "Error",
        description: "Please enter your Etsy shop ID",
        variant: "destructive",
      });
      return;
    }

    if (!currentCity) {
      toast({
        title: "Error",
        description: "Please select a city first",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportResults(null);

    try {
      console.log("Importing Etsy listings for shop:", shopId);

      const { data, error } = await supabase.functions.invoke('import-etsy-listings', {
        body: {
          shop_id: shopId.trim(),
          city_id: currentCity.id,
        },
      });

      if (error) {
        throw error;
      }

      console.log("Import results:", data);

      setImportResults({
        imported: data.imported || 0,
        failed: data.failed || 0,
        errors: data.errors || [],
      });

      if (data.imported > 0) {
        toast({
          title: "Import Successful!",
          description: `Successfully imported ${data.imported} listing${data.imported !== 1 ? 's' : ''} from Etsy.`,
        });
      }

      if (data.failed > 0) {
        toast({
          title: "Partial Import",
          description: `${data.failed} listing${data.failed !== 1 ? 's' : ''} failed to import. Check the details below.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error importing Etsy listings:", error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import listings from Etsy. Please check your shop ID and try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import from Etsy
            </CardTitle>
            <CardDescription>
              Easily import all your active Etsy listings to Craft Local
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">How to find your Etsy Shop ID:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Go to your Etsy shop page</li>
                <li>Look at the URL: <code className="text-xs bg-muted px-1 py-0.5 rounded">etsy.com/shop/YourShopName</code></li>
                <li>Your Shop ID is the part after "/shop/"</li>
              </ol>
              <a 
                href="https://www.etsy.com/your/shops/me" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm flex items-center gap-1 mt-2"
              >
                Go to Your Etsy Shops <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </AlertDescription>
        </Alert>

        <form onSubmit={handleImport} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shop-id">Etsy Shop ID</Label>
            <Input
              id="shop-id"
              type="text"
              placeholder="e.g., MyArtisanShop"
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              disabled={isImporting}
            />
          </div>

          <Button type="submit" disabled={isImporting} className="w-full">
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing Listings...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import Listings
              </>
            )}
          </Button>
        </form>

        {importResults && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              {importResults.imported > 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">
                    {importResults.imported} listing{importResults.imported !== 1 ? 's' : ''} imported successfully
                  </span>
                </div>
              )}

              {importResults.failed > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">
                      {importResults.failed} listing{importResults.failed !== 1 ? 's' : ''} failed to import
                    </span>
                  </div>

                  {importResults.errors.length > 0 && (
                    <div className="ml-7 space-y-1 text-sm text-muted-foreground">
                      {importResults.errors.slice(0, 5).map((error, index) => (
                        <div key={index} className="text-xs">
                          <span className="font-medium">{error.title}:</span> {error.error}
                        </div>
                      ))}
                      {importResults.errors.length > 5 && (
                        <div className="text-xs italic">
                          ... and {importResults.errors.length - 5} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                All imported listings have been set to "Pending Review" status. 
                Please review and update them before publishing.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
