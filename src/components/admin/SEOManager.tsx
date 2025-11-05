import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  BarChart3, FileText, Link2, Search, Settings, TrendingUp, Globe, Image as ImageIcon,
  Shield, Smartphone, Zap, Target, Eye, Code, AlertCircle, Activity, FileSearch,
  Clock, CheckCircle, ExternalLink, Layers, Repeat, Copy, FileCode, Bell, Link as LinkIcon
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
    <div className="space-y-4">
      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex min-w-full h-auto flex-wrap gap-1 justify-start bg-muted p-2">
            <TabsTrigger value="audit" className="flex items-center gap-1 text-xs"><BarChart3 className="h-3 w-3" />Audit</TabsTrigger>
            <TabsTrigger value="keywords" className="flex items-center gap-1 text-xs"><Search className="h-3 w-3" />Keywords</TabsTrigger>
            <TabsTrigger value="competitors" className="flex items-center gap-1 text-xs"><Target className="h-3 w-3" />Competitors</TabsTrigger>
            <TabsTrigger value="pages" className="flex items-center gap-1 text-xs"><FileText className="h-3 w-3" />Pages</TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-1 text-xs"><Activity className="h-3 w-3" />Monitoring</TabsTrigger>
            <TabsTrigger value="meta" className="flex items-center gap-1 text-xs"><Code className="h-3 w-3" />Meta Tags</TabsTrigger>
            <TabsTrigger value="robots" className="flex items-center gap-1 text-xs"><FileCode className="h-3 w-3" />robots.txt</TabsTrigger>
            <TabsTrigger value="sitemap" className="flex items-center gap-1 text-xs"><Layers className="h-3 w-3" />Sitemap</TabsTrigger>
            <TabsTrigger value="llms" className="flex items-center gap-1 text-xs"><FileCode className="h-3 w-3" />llms.txt</TabsTrigger>
            <TabsTrigger value="structured" className="flex items-center gap-1 text-xs"><Code className="h-3 w-3" />Structured Data</TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-1 text-xs"><Zap className="h-3 w-3" />Performance</TabsTrigger>
            <TabsTrigger value="backlinks" className="flex items-center gap-1 text-xs"><Link2 className="h-3 w-3" />Backlinks</TabsTrigger>
            <TabsTrigger value="broken-links" className="flex items-center gap-1 text-xs"><LinkIcon className="h-3 w-3" />Broken Links</TabsTrigger>
            <TabsTrigger value="link-structure" className="flex items-center gap-1 text-xs"><Link2 className="h-3 w-3" />Link Structure</TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-1 text-xs"><FileText className="h-3 w-3" />Content</TabsTrigger>
            <TabsTrigger value="crawler" className="flex items-center gap-1 text-xs"><Globe className="h-3 w-3" />Site Crawler</TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-1 text-xs"><ImageIcon className="h-3 w-3" />Images</TabsTrigger>
            <TabsTrigger value="redirects" className="flex items-center gap-1 text-xs"><Repeat className="h-3 w-3" />Redirects</TabsTrigger>
            <TabsTrigger value="duplicate" className="flex items-center gap-1 text-xs"><Copy className="h-3 w-3" />Duplicate Content</TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1 text-xs"><Shield className="h-3 w-3" />Security</TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-1 text-xs"><Smartphone className="h-3 w-3" />Mobile Check</TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center gap-1 text-xs"><Clock className="h-3 w-3" />Budget</TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: Audit */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comprehensive SEO Audit</CardTitle>
              <CardDescription>50+ point technical, content, and performance analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="https://example.com" value={auditUrl} onChange={(e) => setAuditUrl(e.target.value)} />
                <Button onClick={runAudit} disabled={isRunningAudit}>{isRunningAudit ? "Running..." : "Run Audit"}</Button>
              </div>
              {auditResults && <SEOResultsDisplay results={auditResults} />}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Keywords */}
        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Keyword Tracking & Position Monitoring</CardTitle>
              <CardDescription>Track rankings across search engines and monitor changes over time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Keyword</Label>
                    <Input placeholder="handmade pottery chicago" className="mt-2" />
                  </div>
                  <div>
                    <Label>Target URL</Label>
                    <Input placeholder="https://example.com/pottery" className="mt-2" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Target Position</Label>
                    <Input type="number" placeholder="3" className="mt-2" />
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select defaultValue="medium">
                      <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full">Add Keyword</Button>
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Tracked Keywords</h4>
                <p className="text-sm text-muted-foreground">No keywords tracked yet. Add keywords above to start monitoring.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Competitors */}
        <TabsContent value="competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitor Analysis</CardTitle>
              <CardDescription>Monitor competitors and discover keyword opportunities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="https://competitor.com" />
                <Button>Add Competitor</Button>
              </div>
              <p className="text-sm text-muted-foreground">No competitors added yet.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: Pages */}
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Page-Level SEO Scores</CardTitle>
              <CardDescription>Individual page analysis and optimization recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Run a site crawl to see page-level scores.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: Monitoring */}
        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Monitoring & Alerts</CardTitle>
              <CardDescription>Set up automated checks and get notified of issues</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Enable Automated Monitoring</h4>
                  <p className="text-sm text-muted-foreground">Run daily SEO checks and receive alerts</p>
                </div>
                <Switch />
              </div>
              <div>
                <Label>Check Interval</Label>
                <Select defaultValue="daily">
                  <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 6: Meta Tags */}
        <TabsContent value="meta" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Global Meta Tag Management</CardTitle>
              <CardDescription>Configure default meta tags for your website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Site Name</Label>
                <Input placeholder="Craft Chicago Finds" className="mt-2" />
              </div>
              <div>
                <Label>Default Title Template</Label>
                <Input placeholder="{{page}} | Craft Chicago Finds" className="mt-2" />
              </div>
              <div>
                <Label>Default Meta Description</Label>
                <Textarea placeholder="Discover unique handmade crafts..." className="mt-2" rows={3} />
              </div>
              <div>
                <Label>Default OG Image URL</Label>
                <Input placeholder="https://example.com/og-image.jpg" className="mt-2" />
              </div>
              <Button>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 7: robots.txt */}
        <TabsContent value="robots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>robots.txt Management</CardTitle>
              <CardDescription>Control search engine crawler access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>robots.txt Content</Label>
                <Textarea className="mt-2 font-mono text-xs" rows={12} defaultValue={`User-agent: *\nAllow: /\n\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: https://craftlocal.com/sitemap.xml`} />
              </div>
              <Button>Save robots.txt</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 8: Sitemap */}
        <TabsContent value="sitemap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>XML Sitemap Generation</CardTitle>
              <CardDescription>Generate and manage your site's XML sitemap</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Automatic Sitemap Generation</h4>
                  <p className="text-sm text-muted-foreground">Auto-update sitemap when content changes</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button>Generate Sitemap Now</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 9: llms.txt */}
        <TabsContent value="llms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>llms.txt for AI Crawlers</CardTitle>
              <CardDescription>Configure AI/LLM crawler instructions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>llms.txt Content</Label>
                <Textarea className="mt-2 font-mono text-xs" rows={8} defaultValue={`# Craft Local - Handmade Marketplace\n\n## About\nMarketplace connecting local artisans with customers.\n\n## Data Usage\n- Product info may be used for search\n- Always attribute original makers`} />
              </div>
              <Button>Save llms.txt</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 10: Structured Data */}
        <TabsContent value="structured" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Structured Data (JSON-LD)</CardTitle>
              <CardDescription>Validate and manage schema.org markup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="URL to validate" />
                <Button>Validate Schema</Button>
              </div>
              <p className="text-sm text-muted-foreground">No structured data validated yet.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 11: Performance */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Core Web Vitals</CardTitle>
              <CardDescription>Monitor LCP, FID, CLS and overall page performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="https://example.com" />
                <Select defaultValue="mobile">
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="desktop">Desktop</SelectItem>
                  </SelectContent>
                </Select>
                <Button>Check Vitals</Button>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 12: Backlinks */}
        <TabsContent value="backlinks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backlink Tracking</CardTitle>
              <CardDescription>Monitor incoming links and their quality</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Backlink tracking requires API integration (Ahrefs, Moz, etc.)</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 13: Broken Links */}
        <TabsContent value="broken-links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Broken Link Detection</CardTitle>
              <CardDescription>Find and fix broken internal and external links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="https://example.com" />
                <Button>Check Links</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 14: Link Structure */}
        <TabsContent value="link-structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Internal Linking Analysis</CardTitle>
              <CardDescription>Analyze internal link structure and anchor text</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Run site crawl to analyze internal linking.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 15: Content */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Analysis & Readability</CardTitle>
              <CardDescription>Analyze content quality, keyword usage, and readability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="https://example.com" />
                <Input placeholder="Target keyword (optional)" className="max-w-xs" />
                <Button>Analyze Content</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 16: Site Crawler */}
        <TabsContent value="crawler" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Full Site Crawler</CardTitle>
              <CardDescription>Crawl up to 500 pages to discover issues</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="https://example.com" value={crawlUrl} onChange={(e) => setCrawlUrl(e.target.value)} />
                <Input type="number" placeholder="Max pages" value={maxPages} onChange={(e) => setMaxPages(parseInt(e.target.value) || 50)} className="w-32" />
                <Button onClick={runCrawl} disabled={isRunningCrawl}>{isRunningCrawl ? "Crawling..." : "Start Crawl"}</Button>
              </div>
              {crawlResults && (
                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold">Crawl Results</h4>
                  <p className="text-sm"><span className="font-medium">Pages Crawled:</span> {crawlResults.pages_crawled}</p>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {crawlResults.results?.slice(0, 10).map((result: any, index: number) => (
                      <div key={index} className="text-xs p-2 bg-muted rounded flex items-center justify-between">
                        <span className="truncate flex-1">{result.page_url}</span>
                        <Badge variant={result.status_code === 200 ? "default" : "destructive"}>{result.status_code}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 17: Images */}
        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Image SEO Analysis</CardTitle>
              <CardDescription>Check alt text, file sizes, and optimization opportunities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="https://example.com" />
                <Button>Analyze Images</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 18: Redirects */}
        <TabsContent value="redirects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Redirect Chain Detection</CardTitle>
              <CardDescription>Find and fix redirect chains</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="https://example.com" />
                <Button>Check Redirects</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 19: Duplicate Content */}
        <TabsContent value="duplicate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Duplicate Content Detection</CardTitle>
              <CardDescription>Find pages with duplicate or similar content</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Run site crawl to detect duplicate content.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 20: Security */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Headers & SSL</CardTitle>
              <CardDescription>Check HTTPS, security headers, and SSL certificate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="https://example.com" />
                <Button>Check Security</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 21: Mobile Check */}
        <TabsContent value="mobile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mobile-First Analysis</CardTitle>
              <CardDescription>Check mobile friendliness and responsiveness</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="https://example.com" />
                <Button>Check Mobile</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 22: Budget */}
        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Budget Monitoring</CardTitle>
              <CardDescription>Set limits for page size, load time, and requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max Page Size (KB)</Label>
                  <Input type="number" placeholder="3000" className="mt-2" />
                </div>
                <div>
                  <Label>Max Load Time (ms)</Label>
                  <Input type="number" placeholder="3000" className="mt-2" />
                </div>
                <div>
                  <Label>Max Requests</Label>
                  <Input type="number" placeholder="100" className="mt-2" />
                </div>
                <div>
                  <Label>Max LCP (ms)</Label>
                  <Input type="number" placeholder="2500" className="mt-2" />
                </div>
              </div>
              <Button>Save Budget</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
