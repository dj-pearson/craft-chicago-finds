import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, FileText, Search, BarChart3, Copy, CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ContentOptimizer() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("analyze");

  // Analyze existing content
  const [analyzeUrl, setAnalyzeUrl] = useState("");
  const [analyzeKeyword, setAnalyzeKeyword] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Generate new content
  const [generateKeyword, setGenerateKeyword] = useState("");
  const [contentType, setContentType] = useState("blog_post");
  const [tone, setTone] = useState("informative");
  const [wordCount, setWordCount] = useState(1000);
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  // Optimize page
  const [optimizeUrl, setOptimizeUrl] = useState("");
  const [optimizeKeyword, setOptimizeKeyword] = useState("");
  const [optimizationResult, setOptimizationResult] = useState<any>(null);

  const handleAnalyzeContent = async () => {
    if (!analyzeUrl || !analyzeKeyword) {
      toast({
        title: "Missing Information",
        description: "Please provide both URL and target keyword",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-blog-posts-seo", {
        body: { url: analyzeUrl },
      });

      if (error) throw error;

      setAnalysisResult(data);
      toast({
        title: "Content Analyzed",
        description: `SEO Score: ${data.seo_score}/100`,
      });
    } catch (error: any) {
      console.error("Error analyzing content:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!generateKeyword) {
      toast({
        title: "Missing Keyword",
        description: "Please provide a target keyword",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-content", {
        body: {
          keyword: generateKeyword,
          contentType,
          tone,
          wordCount,
        },
      });

      if (error) throw error;

      setGeneratedContent(data);
      toast({
        title: "Content Generated",
        description: `Generated ${data.word_count} words`,
      });
    } catch (error: any) {
      console.error("Error generating content:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizePage = async () => {
    if (!optimizeUrl || !optimizeKeyword) {
      toast({
        title: "Missing Information",
        description: "Please provide both URL and target keyword",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("optimize-page-content", {
        body: {
          url: optimizeUrl,
          targetKeyword: optimizeKeyword,
        },
      });

      if (error) throw error;

      setOptimizationResult(data);
      toast({
        title: "Page Optimized",
        description: `Optimization Score: ${data.optimization_score}/100`,
      });
    } catch (error: any) {
      console.error("Error optimizing page:", error);
      toast({
        title: "Optimization Failed",
        description: error.message || "Failed to optimize page",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "Content copied successfully",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI-Powered Content Optimizer
          </CardTitle>
          <CardDescription>
            Analyze existing content, generate new SEO-optimized content, and get optimization suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="analyze">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analyze
              </TabsTrigger>
              <TabsTrigger value="generate">
                <FileText className="mr-2 h-4 w-4" />
                Generate
              </TabsTrigger>
              <TabsTrigger value="optimize">
                <Search className="mr-2 h-4 w-4" />
                Optimize
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analyze" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="analyze-url">Page URL</Label>
                  <Input
                    id="analyze-url"
                    placeholder="https://example.com/blog/post"
                    value={analyzeUrl}
                    onChange={(e) => setAnalyzeUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="analyze-keyword">Target Keyword</Label>
                  <Input
                    id="analyze-keyword"
                    placeholder="handmade crafts"
                    value={analyzeKeyword}
                    onChange={(e) => setAnalyzeKeyword(e.target.value)}
                  />
                </div>
                <Button onClick={handleAnalyzeContent} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze Content"
                  )}
                </Button>
              </div>

              {analysisResult && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Analysis Results</h3>
                    <Badge variant={analysisResult.seo_score >= 80 ? "default" : "secondary"}>
                      Score: {analysisResult.seo_score}/100
                    </Badge>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Title</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{analysisResult.title?.text}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Progress value={(analysisResult.title?.length / 60) * 100} className="flex-1" />
                          <span className="text-xs text-muted-foreground">
                            {analysisResult.title?.length} chars
                          </span>
                        </div>
                        {!analysisResult.title?.optimal && (
                          <p className="text-xs text-yellow-600 mt-1">
                            Optimal: 30-60 characters
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Meta Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm line-clamp-2">{analysisResult.meta_description?.text}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Progress value={(analysisResult.meta_description?.length / 160) * 100} className="flex-1" />
                          <span className="text-xs text-muted-foreground">
                            {analysisResult.meta_description?.length} chars
                          </span>
                        </div>
                        {!analysisResult.meta_description?.optimal && (
                          <p className="text-xs text-yellow-600 mt-1">
                            Optimal: 120-160 characters
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Content Stats</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-1">
                        <p>Words: {analysisResult.content?.word_count}</p>
                        <p>Readability: {analysisResult.content?.readability_score}</p>
                        <p>H1 Tags: {analysisResult.content?.h1_count}</p>
                        <p>H2 Tags: {analysisResult.content?.h2_count}</p>
                        <p>Images: {analysisResult.content?.images}</p>
                        <p>Images with Alt: {analysisResult.content?.images_with_alt}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Links</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-1">
                        <p>Internal Links: {analysisResult.content?.internal_links}</p>
                        <p>External Links: {analysisResult.content?.external_links}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {analysisResult.issues && analysisResult.issues.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Issues</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {analysisResult.issues.map((issue: string, i: number) => (
                            <li key={i} className="text-red-600">{issue}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {analysisResult.recommendations.map((rec: string, i: number) => (
                            <li key={i} className="text-blue-600">{rec}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="generate" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="generate-keyword">Target Keyword</Label>
                  <Input
                    id="generate-keyword"
                    placeholder="handmade jewelry Chicago"
                    value={generateKeyword}
                    onChange={(e) => setGenerateKeyword(e.target.value)}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="content-type">Content Type</Label>
                    <Select value={contentType} onValueChange={setContentType}>
                      <SelectTrigger id="content-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blog_post">Blog Post</SelectItem>
                        <SelectItem value="product_description">Product Description</SelectItem>
                        <SelectItem value="category_page">Category Page</SelectItem>
                        <SelectItem value="landing_page">Landing Page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tone">Tone</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger id="tone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="informative">Informative</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="word-count">Word Count</Label>
                    <Select value={wordCount.toString()} onValueChange={(val) => setWordCount(Number(val))}>
                      <SelectTrigger id="word-count">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="500">500 words</SelectItem>
                        <SelectItem value="1000">1,000 words</SelectItem>
                        <SelectItem value="1500">1,500 words</SelectItem>
                        <SelectItem value="2000">2,000 words</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleGenerateContent} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Content
                    </>
                  )}
                </Button>
              </div>

              {generatedContent && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Generated Content</h3>
                    <Badge>{generatedContent.word_count} words</Badge>
                  </div>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Title Variants</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent.content?.title)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {generatedContent.content?.title_variants?.map((title: string, i: number) => (
                        <div
                          key={i}
                          className="flex items-start justify-between p-2 rounded border hover:bg-muted/50 cursor-pointer"
                          onClick={() => copyToClipboard(title)}
                        >
                          <p className="text-sm flex-1">{title}</p>
                          {i === 0 && <Badge variant="outline" className="ml-2">Recommended</Badge>}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Meta Description</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent.content?.meta_description)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{generatedContent.content?.meta_description}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Content Outline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        {generatedContent.outline?.map((section: any, i: number) => (
                          <li key={i}>
                            <strong>{section.heading}</strong>
                            <span className="text-muted-foreground"> ({section.estimated_words} words)</span>
                            {section.subheadings && section.subheadings.length > 0 && (
                              <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                                {section.subheadings.map((sub: string, j: number) => (
                                  <li key={j} className="text-muted-foreground">{sub}</li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>

                  {generatedContent.seo_recommendations && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">SEO Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {generatedContent.seo_recommendations.map((rec: string, i: number) => (
                            <li key={i} className="text-blue-600">{rec}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="optimize" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="optimize-url">Page URL</Label>
                  <Input
                    id="optimize-url"
                    placeholder="https://example.com/page"
                    value={optimizeUrl}
                    onChange={(e) => setOptimizeUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="optimize-keyword">Target Keyword</Label>
                  <Input
                    id="optimize-keyword"
                    placeholder="handmade crafts"
                    value={optimizeKeyword}
                    onChange={(e) => setOptimizeKeyword(e.target.value)}
                  />
                </div>
                <Button onClick={handleOptimizePage} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    "Optimize Page"
                  )}
                </Button>
              </div>

              {optimizationResult && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Optimization Results</h3>
                    <Badge variant={optimizationResult.optimization_score >= 80 ? "default" : "secondary"}>
                      Score: {optimizationResult.optimization_score}/100
                    </Badge>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Current Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        {optimizationResult.current_analysis?.keyword_in_title ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-red-600" />
                        )}
                        <span>Keyword in Title</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {optimizationResult.current_analysis?.keyword_in_meta ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-red-600" />
                        )}
                        <span>Keyword in Meta Description</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {optimizationResult.current_analysis?.keyword_in_h1 ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-red-600" />
                        )}
                        <span>Keyword in H1</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {optimizationResult.current_analysis?.keyword_in_first_paragraph ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-red-600" />
                        )}
                        <span>Keyword in First Paragraph</span>
                      </div>
                      <p className="mt-2">
                        Word Count: <strong>{optimizationResult.current_analysis?.word_count}</strong>
                      </p>
                      <p>
                        Keyword Density: <strong>{optimizationResult.current_analysis?.keyword_density}%</strong>
                      </p>
                    </CardContent>
                  </Card>

                  {optimizationResult.optimizations && optimizationResult.optimizations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Suggested Optimizations</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {optimizationResult.optimizations.map((opt: any, i: number) => (
                          <div key={i} className="border-b pb-4 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-sm capitalize">{opt.element.replace(/_/g, ' ')}</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(opt.optimized)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <p className="text-xs text-muted-foreground">Current:</p>
                                <p className="text-sm">{opt.current}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Optimized:</p>
                                <p className="text-sm font-medium text-green-600">{opt.optimized}</p>
                              </div>
                              <p className="text-xs text-muted-foreground italic">{opt.reason}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {optimizationResult.recommendations && optimizationResult.recommendations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Additional Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {optimizationResult.recommendations.map((rec: string, i: number) => (
                            <li key={i} className="text-blue-600">{rec}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
