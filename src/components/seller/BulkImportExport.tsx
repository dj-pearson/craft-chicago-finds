import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Loader2,
  FileSpreadsheet,
  ShoppingBag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCityContext } from "@/hooks/useCityContext";

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  imported_items: Array<{
    title: string;
    price: number;
    status: 'success' | 'error';
  }>;
}

interface BulkImportExportProps {
  onImportComplete?: () => void;
  className?: string;
}

const CSV_TEMPLATE_HEADERS = [
  'title',
  'description',
  'price',
  'category',
  'inventory_count',
  'tags',
  'shipping_available',
  'local_pickup_available',
  'pickup_location',
  'image_urls'
];

export const BulkImportExport = ({ onImportComplete, className }: BulkImportExportProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentCity } = useCityContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importSource, setImportSource] = useState<'csv' | 'etsy'>('csv');

  const downloadTemplate = () => {
    const csvContent = [
      CSV_TEMPLATE_HEADERS.join(','),
      // Sample row
      '"Sample Handmade Bowl","Beautiful ceramic bowl perfect for serving","45.00","Ceramics","1","handmade,ceramic,bowl,kitchen","true","true","123 Main St, Chicago","https://example.com/image1.jpg,https://example.com/image2.jpg"'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'craft-local-import-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Template downloaded",
      description: "Fill out the template and upload it to import your listings",
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        rows.push(row);
      }
    }

    return rows;
  };

  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const validateRow = (row: any, rowIndex: number): string[] => {
    const errors = [];

    if (!row.title || row.title.length < 3) {
      errors.push(`Row ${rowIndex}: Title is required and must be at least 3 characters`);
    }

    if (!row.price || isNaN(parseFloat(row.price)) || parseFloat(row.price) <= 0) {
      errors.push(`Row ${rowIndex}: Valid price is required`);
    }

    if (!row.category) {
      errors.push(`Row ${rowIndex}: Category is required`);
    }

    return errors;
  };

  const importFromCSV = async () => {
    if (!selectedFile || !user || !currentCity) {
      toast({
        title: "Missing information",
        description: "Please select a file and ensure you're logged in",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setImportProgress(0);
    
    try {
      // Read file
      const csvText = await selectedFile.text();
      const rows = parseCSV(csvText);

      if (rows.length === 0) {
        throw new Error("No valid data found in CSV file");
      }

      // Get categories for mapping
      const { data: categories, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name")
        .eq("city_id", currentCity.id)
        .eq("is_active", true);

      if (categoriesError) {
        throw categoriesError;
      }

      const categoryMap = new Map(categories?.map(cat => [cat.name.toLowerCase(), cat.id]) || []);

      // Validate and import
      const results: ImportResult = {
        total: rows.length,
        successful: 0,
        failed: 0,
        errors: [],
        imported_items: []
      };

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        setImportProgress((i / rows.length) * 100);

        // Validate row
        const validationErrors = validateRow(row, i + 2); // +2 for 1-based index and header row
        if (validationErrors.length > 0) {
          results.errors.push(...validationErrors.map(error => ({
            row: i + 2,
            field: 'validation',
            message: error
          })));
          results.failed++;
          results.imported_items.push({
            title: row.title || 'Invalid row',
            price: 0,
            status: 'error'
          });
          continue;
        }

        // Map category
        const categoryId = categoryMap.get(row.category.toLowerCase());
        if (!categoryId) {
          results.errors.push({
            row: i + 2,
            field: 'category',
            message: `Category "${row.category}" not found`
          });
          results.failed++;
          results.imported_items.push({
            title: row.title,
            price: parseFloat(row.price),
            status: 'error'
          });
          continue;
        }

        // Process tags
        const tags = row.tags ? row.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [];
        
        // Process image URLs
        const imageUrls = row.image_urls ? row.image_urls.split(',').map((url: string) => url.trim()).filter(Boolean) : [];

        // Create listing
        try {
          const { error: insertError } = await supabase
            .from("listings")
            .insert({
              seller_id: user.id,
              city_id: currentCity.id,
              title: row.title,
              description: row.description || null,
              price: parseFloat(row.price),
              category_id: categoryId,
              inventory_count: parseInt(row.inventory_count) || 1,
              tags,
              shipping_available: row.shipping_available === 'true',
              local_pickup_available: row.local_pickup_available !== 'false',
              pickup_location: row.pickup_location || null,
              images: imageUrls,
              status: 'draft' // Start as draft for review
            });

          if (insertError) {
            throw insertError;
          }

          results.successful++;
          results.imported_items.push({
            title: row.title,
            price: parseFloat(row.price),
            status: 'success'
          });
        } catch (error) {
          results.errors.push({
            row: i + 2,
            field: 'database',
            message: error instanceof Error ? error.message : 'Unknown error'
          });
          results.failed++;
          results.imported_items.push({
            title: row.title,
            price: parseFloat(row.price),
            status: 'error'
          });
        }
      }

      setImportResult(results);
      setImportProgress(100);

      toast({
        title: "Import completed",
        description: `Successfully imported ${results.successful} of ${results.total} items`,
      });

      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import listings",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const exportListings = async () => {
    if (!user || !currentCity) return;

    setExporting(true);
    try {
      const { data: listings, error } = await supabase
        .from("listings")
        .select(`
          title,
          description,
          price,
          inventory_count,
          tags,
          shipping_available,
          local_pickup_available,
          pickup_location,
          images,
          categories(name)
        `)
        .eq("seller_id", user.id)
        .eq("city_id", currentCity.id);

      if (error) {
        throw error;
      }

      if (!listings || listings.length === 0) {
        toast({
          title: "No listings found",
          description: "You don't have any listings to export",
        });
        return;
      }

      // Convert to CSV
      const csvRows = [CSV_TEMPLATE_HEADERS.join(',')];
      
      listings.forEach(listing => {
        const row = [
          `"${listing.title}"`,
          `"${listing.description || ''}"`,
          listing.price.toString(),
          `"${listing.categories?.name || ''}"`,
          listing.inventory_count.toString(),
          `"${(listing.tags || []).join(',')}"`,
          listing.shipping_available.toString(),
          listing.local_pickup_available.toString(),
          `"${listing.pickup_location || ''}"`,
          `"${(listing.images || []).join(',')}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `craft-local-listings-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export completed",
        description: `Exported ${listings.length} listings`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export listings",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          Bulk Import & Export
        </CardTitle>
        <CardDescription>
          Fast onboarding with CSV import or export your existing listings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>
          
          <TabsContent value="import" className="space-y-6">
            {/* Import Source Selection */}
            <div className="space-y-2">
              <Label>Import Source</Label>
              <Select value={importSource} onValueChange={(value: 'csv' | 'etsy') => setImportSource(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      CSV File
                    </div>
                  </SelectItem>
                  <SelectItem value="etsy">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      Etsy Export (CSV)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Template Download */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">Need a template?</p>
                <p className="text-xs text-muted-foreground">
                  Download our CSV template to get started
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Template
              </Button>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="csv-upload">
                  {importSource === 'csv' ? 'Upload CSV File' : 'Upload Etsy Export'}
                </Label>
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="mt-2"
                />
              </div>

              {selectedFile && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{selectedFile.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Import Progress */}
            {importing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Importing...</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(importProgress)}%
                  </span>
                </div>
                <Progress value={importProgress} className="w-full" />
              </div>
            )}

            {/* Import Button */}
            <Button
              onClick={importFromCSV}
              disabled={!selectedFile || importing}
              className="w-full"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Listings
                </>
              )}
            </Button>

            {/* Import Results */}
            {importResult && (
              <div className="space-y-4 border-t pt-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-2 bg-green-50 rounded">
                    <p className="text-2xl font-bold text-green-600">
                      {importResult.successful}
                    </p>
                    <p className="text-xs text-green-700">Successful</p>
                  </div>
                  <div className="p-2 bg-red-50 rounded">
                    <p className="text-2xl font-bold text-red-600">
                      {importResult.failed}
                    </p>
                    <p className="text-xs text-red-700">Failed</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-2xl font-bold text-gray-600">
                      {importResult.total}
                    </p>
                    <p className="text-xs text-gray-700">Total</p>
                  </div>
                </div>

                {/* Error Details */}
                {importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-red-600">
                      Errors ({importResult.errors.length})
                    </Label>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {importResult.errors.slice(0, 10).map((error, index) => (
                        <div key={index} className="flex items-start gap-2 text-xs p-2 bg-red-50 rounded">
                          <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                          <span>{error.message}</span>
                        </div>
                      ))}
                      {importResult.errors.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center">
                          ... and {importResult.errors.length - 10} more errors
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Success Items */}
                {importResult.imported_items.some(item => item.status === 'success') && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-green-600">
                      Successfully Imported
                    </Label>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {importResult.imported_items
                        .filter(item => item.status === 'success')
                        .slice(0, 5)
                        .map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-xs p-2 bg-green-50 rounded">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="truncate">{item.title}</span>
                          </div>
                          <Badge variant="secondary">${item.price}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <div className="text-center py-8">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">Export Your Listings</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Download all your listings as a CSV file for backup or editing
              </p>
              
              <Button onClick={exportListings} disabled={exporting} className="w-full max-w-sm">
                {exporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export All Listings
                  </>
                )}
              </Button>
            </div>

            {/* Export Tips */}
            <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
              <p><strong>Export includes:</strong></p>
              <p>• All your active and draft listings</p>
              <p>• Product details, pricing, and images</p>
              <p>• Categories and tags</p>
              <p>• Shipping and pickup settings</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
