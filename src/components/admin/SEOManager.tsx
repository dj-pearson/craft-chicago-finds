import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart3,
  FileText,
  Link2,
  Search,
  Settings,
  TrendingUp,
  Globe,
  Image as ImageIcon,
  Shield,
  Smartphone,
  Zap,
  Target,
  Eye,
  Code,
  AlertCircle,
  Activity,
  FileSearch,
  Clock,
  CheckCircle,
  ExternalLink,
  Layers,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEOResultsDisplay } from "./SEOResultsDisplay";
import { toast } from "sonner";

export function SEOManager() {
  const [activeTab, setActiveTab] = useState("audit");
  const [auditUrl, setAuditUrl] = useState("");
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [auditResults, setAuditResults] = useState<any>(null);

  const [crawlUrl, setCrawlUrl] = useState("");
  const [maxPages, setMaxPages] = useState(50);
  const [isRunningCrawl, setIsRunningCrawl] = useState(false);
  const [crawlResults, setCrawlResults] = useState<any>(null);

  const runAudit = async () => {
    if (!auditUrl) {
      toast.error("Please enter a URL to audit");
      return;
    }

    setIsRunningAudit(true);
    setAuditResults(null);

    try {
      const { data, error } = await supabase.functions.invoke("seo-audit", {
        body: { url: auditUrl },
      });

      if (error) throw error;

      setAuditResults(data.results);
      toast.success("SEO audit completed successfully!");
    } catch (error: any) {
      console.error("Audit error:", error);
      toast.error(`Audit failed: ${error.message}`);
    } finally {
      setIsRunningAudit(false);
    }
  };

  const runCrawl = async () => {
    if (!crawlUrl) {
      toast.error("Please enter a URL to crawl");
      return;
    }

    setIsRunningCrawl(true);
    setCrawlResults(null);

    try {
      const { data, error } = await supabase.functions.invoke("crawl-site", {
        body: { startUrl: crawlUrl, maxPages },
      });

      if (error) throw error;

      setCrawlResults(data);
      toast.success(`Crawled ${data.pages_crawled} pages successfully!`);
    } catch (error: any) {
      console.error("Crawl error:", error);
      toast.error(`Crawl failed: ${error.message}`);
    } finally {
      setIsRunningCrawl(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-4 lg:grid-cols-6 gap-2 h-auto">
        <TabsTrigger value="audit" className="flex items-center gap-1">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Audit</span>
        </TabsTrigger>
        <TabsTrigger value="keywords" className="flex items-center gap-1">
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Keywords</span>
        </TabsTrigger>
        <TabsTrigger value="meta" className="flex items-center gap-1">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Meta Tags</span>
        </TabsTrigger>
        <TabsTrigger value="crawler" className="flex items-center gap-1">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">Crawler</span>
        </TabsTrigger>
        <TabsTrigger value="performance" className="flex items-center gap-1">
          <Zap className="h-4 w-4" />
          <span className="hidden sm:inline">Performance</span>
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center gap-1">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
        </TabsTrigger>
      </TabsList>

      {/* Audit Tab */}
      <TabsContent value="audit" className="space-y-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="audit-url">URL to Audit</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="audit-url"
                placeholder="https://example.com"
                value={auditUrl}
                onChange={(e) => setAuditUrl(e.target.value)}
              />
              <Button onClick={runAudit} disabled={isRunningAudit}>
                {isRunningAudit ? "Running..." : "Run Audit"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Performs a comprehensive 50+ point SEO audit including technical, content, and performance checks
            </p>
          </div>

          {auditResults && <SEOResultsDisplay results={auditResults} />}
        </div>
      </TabsContent>

      {/* Keywords Tab */}
      <TabsContent value="keywords" className="space-y-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Keyword Tracking</h3>
          <p className="text-sm text-muted-foreground">
            Track your keyword positions across search engines and monitor ranking changes over time
          </p>

          <div className="grid gap-4">
            <div>
              <Label htmlFor="keyword">Keyword</Label>
              <Input id="keyword" placeholder="handmade pottery chicago" className="mt-2" />
            </div>
            <div>
              <Label htmlFor="target-url">Target URL</Label>
              <Input id="target-url" placeholder="https://example.com/pottery" className="mt-2" />
            </div>
            <div>
              <Label htmlFor="target-position">Target Position</Label>
              <Input id="target-position" type="number" placeholder="3" className="mt-2" />
            </div>
            <Button>Add Keyword</Button>
          </div>

          <div className="mt-6">
            <h4 className="font-medium mb-2">Tracked Keywords</h4>
            <p className="text-sm text-muted-foreground">
              No keywords are currently being tracked. Add keywords above to start monitoring.
            </p>
          </div>
        </div>
      </TabsContent>

      {/* Meta Tags Tab */}
      <TabsContent value="meta" className="space-y-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Global Meta Tag Management</h3>
          <p className="text-sm text-muted-foreground">
            Configure default meta tags for your website
          </p>

          <div className="grid gap-4">
            <div>
              <Label htmlFor="site-name">Site Name</Label>
              <Input id="site-name" placeholder="Craft Chicago Finds" className="mt-2" />
            </div>
            <div>
              <Label htmlFor="default-title">Default Title Template</Label>
              <Input
                id="default-title"
                placeholder="{{page}} | Craft Chicago Finds"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="default-description">Default Meta Description</Label>
              <Textarea
                id="default-description"
                placeholder="Discover unique handmade crafts from local Chicago artisans..."
                className="mt-2"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="og-image">Default OG Image URL</Label>
              <Input
                id="og-image"
                placeholder="https://example.com/og-image.jpg"
                className="mt-2"
              />
            </div>
            <Button>Save Settings</Button>
          </div>
        </div>
      </TabsContent>

      {/* Site Crawler Tab */}
      <TabsContent value="crawler" className="space-y-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="crawl-url">Start URL</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="crawl-url"
                placeholder="https://example.com"
                value={crawlUrl}
                onChange={(e) => setCrawlUrl(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Max pages"
                value={maxPages}
                onChange={(e) => setMaxPages(parseInt(e.target.value) || 50)}
                className="w-32"
              />
              <Button onClick={runCrawl} disabled={isRunningCrawl}>
                {isRunningCrawl ? "Crawling..." : "Start Crawl"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Crawl your website to discover all pages, check for broken links, and analyze site structure
            </p>
          </div>

          {crawlResults && (
            <div className="border rounded-lg p-4 space-y-2">
              <h4 className="font-semibold">Crawl Results</h4>
              <p className="text-sm">
                <span className="font-medium">Pages Crawled:</span> {crawlResults.pages_crawled}
              </p>
              <p className="text-sm">
                <span className="font-medium">Session ID:</span> {crawlResults.crawl_session_id}
              </p>
              <div className="mt-4">
                <h5 className="text-sm font-medium mb-2">Pages Found:</h5>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {crawlResults.results?.slice(0, 10).map((result: any, index: number) => (
                    <div key={index} className="text-xs p-2 bg-muted rounded flex items-center justify-between">
                      <span className="truncate flex-1">{result.page_url}</span>
                      <span
                        className={`ml-2 ${
                          result.status_code === 200
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {result.status_code}
                      </span>
                    </div>
                  ))}
                  {crawlResults.results?.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      ... and {crawlResults.results.length - 10} more pages
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </TabsContent>

      {/* Performance Tab */}
      <TabsContent value="performance" className="space-y-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Core Web Vitals</h3>
          <p className="text-sm text-muted-foreground">
            Monitor Core Web Vitals (LCP, FID, CLS) and overall page performance
          </p>

          <div className="grid gap-4">
            <div>
              <Label htmlFor="perf-url">URL to Check</Label>
              <div className="flex gap-2 mt-2">
                <Input id="perf-url" placeholder="https://example.com" />
                <Button>Check Vitals</Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mt-6">
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium text-muted-foreground">LCP</h4>
              <p className="text-2xl font-bold mt-1">N/A</p>
              <p className="text-xs text-muted-foreground mt-1">Largest Contentful Paint</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium text-muted-foreground">FID</h4>
              <p className="text-2xl font-bold mt-1">N/A</p>
              <p className="text-xs text-muted-foreground mt-1">First Input Delay</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium text-muted-foreground">CLS</h4>
              <p className="text-2xl font-bold mt-1">N/A</p>
              <p className="text-xs text-muted-foreground mt-1">Cumulative Layout Shift</p>
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Settings Tab */}
      <TabsContent value="settings" className="space-y-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">SEO Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure global SEO settings and integrations
          </p>

          <div className="grid gap-4">
            <div>
              <Label htmlFor="site-url">Site URL</Label>
              <Input id="site-url" defaultValue="https://craftlocal.com" className="mt-2" />
            </div>
            <div>
              <Label htmlFor="ga-id">Google Analytics ID</Label>
              <Input id="ga-id" placeholder="G-XXXXXXXXXX" className="mt-2" />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Google Search Console</h4>
                <p className="text-sm text-muted-foreground">Connect to sync search performance data</p>
              </div>
              <Button variant="outline">Connect</Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Automated Monitoring</h4>
                <p className="text-sm text-muted-foreground">Enable daily SEO audits and alerts</p>
              </div>
              <Button variant="outline">Configure</Button>
            </div>
            <Button>Save Settings</Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
