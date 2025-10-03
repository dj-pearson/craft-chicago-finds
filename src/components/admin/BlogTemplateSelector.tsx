import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Lightbulb,
  Wand2,
  Clock,
  BarChart3,
  CheckCircle,
  Calendar,
  Gift,
  MapPin,
  Users,
  BookOpen,
  Star,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BlogTemplate {
  id: string;
  template_name: string;
  target_length: string;
  structure: string[];
  seo_requirements: {
    title_format: string;
    meta_description_length: string;
    header_structure: string;
    internal_links: string;
    external_links: string;
  };
  applicable_clusters: number[];
}

interface Keyword {
  id: string;
  cluster_id: number;
  primary_keyword: string;
  search_volume: string;
  competition: string;
  buyer_intent: string;
  local_modifier: boolean;
  seasonal: boolean;
  content_type: string;
  blog_angle: string;
  cluster_name?: string;
}

interface BlogTemplateSelectorProps {
  selectedKeywords: Keyword[];
  onTemplateSelect: (template: BlogTemplate, generatedOutline: string) => void;
  className?: string;
}

export const BlogTemplateSelector = ({
  selectedKeywords,
  onTemplateSelect,
  className = "",
}: BlogTemplateSelectorProps) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<BlogTemplate[]>([]);
  const [recommendedTemplate, setRecommendedTemplate] =
    useState<BlogTemplate | null>(null);
  const [generatedOutline, setGeneratedOutline] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedKeywords.length > 0 && templates.length > 0) {
      determineRecommendedTemplate();
    }
  }, [selectedKeywords, templates]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("blog_post_templates")
        .select("*")
        .order("template_name");

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Error",
        description: "Failed to load templates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const determineRecommendedTemplate = () => {
    if (selectedKeywords.length === 0) return;

    // Analyze the selected keywords to determine the best template
    const clusterCounts = selectedKeywords.reduce((acc, keyword) => {
      acc[keyword.cluster_id] = (acc[keyword.cluster_id] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const dominantCluster = Object.entries(clusterCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0];

    if (dominantCluster) {
      const clusterId = parseInt(dominantCluster);
      const recommended = templates.find((template) =>
        template.applicable_clusters.includes(clusterId)
      );
      setRecommendedTemplate(recommended || null);
    }
  };

  const generateBlogOutline = async (template: BlogTemplate) => {
    setGenerating(true);
    try {
      // Create a comprehensive outline based on the template and selected keywords
      const primaryKeyword = selectedKeywords[0]?.primary_keyword || "";
      const keywordList = selectedKeywords
        .map((kw) => kw.primary_keyword)
        .join(", ");
      const clusterTypes = [
        ...new Set(selectedKeywords.map((kw) => kw.cluster_name)),
      ].join(", ");

      const outline = generateOutlineContent(
        template,
        primaryKeyword,
        keywordList,
        clusterTypes
      );
      setGeneratedOutline(outline);

      return outline;
    } catch (error) {
      console.error("Error generating outline:", error);
      toast({
        title: "Error",
        description: "Failed to generate outline. Please try again.",
        variant: "destructive",
      });
      return "";
    } finally {
      setGenerating(false);
    }
  };

  const generateOutlineContent = (
    template: BlogTemplate,
    primaryKeyword: string,
    keywordList: string,
    clusterTypes: string
  ): string => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().toLocaleString("default", {
      month: "long",
    });

    let outline = `# ${template.template_name} Outline\n\n`;
    outline += `**Primary Keyword:** ${primaryKeyword}\n`;
    outline += `**Target Keywords:** ${keywordList}\n`;
    outline += `**Content Types:** ${clusterTypes}\n`;
    outline += `**Target Length:** ${template.target_length}\n\n`;

    outline += `## SEO Requirements\n`;
    outline += `- **Title Format:** ${template.seo_requirements.title_format
      .replace("[Keyword]", primaryKeyword)
      .replace("[Year]", currentYear.toString())}\n`;
    outline += `- **Meta Description:** ${template.seo_requirements.meta_description_length}\n`;
    outline += `- **Header Structure:** ${template.seo_requirements.header_structure}\n`;
    outline += `- **Internal Links:** ${template.seo_requirements.internal_links}\n`;
    outline += `- **External Links:** ${template.seo_requirements.external_links}\n\n`;

    outline += `## Content Structure\n\n`;

    template.structure.forEach((section, index) => {
      outline += `### ${index + 1}. ${section}\n`;

      // Add specific guidance based on section type and keywords
      switch (section.toLowerCase()) {
        case "introduction with local angle":
          outline += `- Hook readers with the importance of ${primaryKeyword}\n`;
          outline += `- Establish Chicago/local context immediately\n`;
          outline += `- Preview what readers will learn\n`;
          outline += `- Include primary keyword naturally\n\n`;
          break;

        case "why handmade gifts matter":
          outline += `- Quality and uniqueness benefits\n`;
          outline += `- Supporting local artisans and community\n`;
          outline += `- Environmental and ethical considerations\n`;
          outline += `- Personal connection and story behind products\n\n`;
          break;

        case "featured product categories":
          outline += `- Highlight top categories based on selected keywords\n`;
          outline += `- Include price ranges and what to expect\n`;
          outline += `- Showcase variety available locally\n`;
          outline += `- Link to relevant marketplace categories\n\n`;
          break;

        case "local maker spotlights":
          outline += `- Feature 3-5 Chicago makers relevant to keywords\n`;
          outline += `- Include their story and specialties\n`;
          outline += `- Highlight what makes them unique\n`;
          outline += `- Include contact/shop information\n\n`;
          break;

        case "shopping tips":
          outline += `- Best times to shop (seasonal considerations)\n`;
          outline += `- Questions to ask makers\n`;
          outline += `- How to identify quality handmade items\n`;
          outline += `- Pickup vs shipping considerations\n\n`;
          break;

        case "call-to-action to browse marketplace":
          outline += `- Direct readers to specific marketplace categories\n`;
          outline += `- Encourage signing up for updates\n`;
          outline += `- Invite readers to follow for more local content\n`;
          outline += `- Include links to related blog posts\n\n`;
          break;

        default:
          outline += `- [Develop content for: ${section}]\n`;
          outline += `- Include relevant keywords naturally\n`;
          outline += `- Maintain local Chicago focus\n`;
          outline += `- Link to marketplace when appropriate\n\n`;
      }
    });

    outline += `## Keyword Integration Strategy\n\n`;
    selectedKeywords.forEach((keyword) => {
      outline += `- **${
        keyword.primary_keyword
      }:** Use in ${keyword.blog_angle.replace(/_/g, " ")} context\n`;
    });

    outline += `\n## Content Calendar Notes\n`;
    outline += `- **Publishing Month:** ${currentMonth} ${currentYear}\n`;
    outline += `- **Seasonal Relevance:** ${
      selectedKeywords.some((kw) => kw.seasonal)
        ? "High - includes seasonal keywords"
        : "Standard"
    }\n`;
    outline += `- **Local Focus:** ${
      selectedKeywords.some((kw) => kw.local_modifier)
        ? "High - includes Chicago-specific terms"
        : "Standard"
    }\n`;

    return outline;
  };

  const handleTemplateSelect = async (template: BlogTemplate) => {
    const outline = await generateBlogOutline(template);
    onTemplateSelect(template, outline);
  };

  const getTemplateIcon = (templateName: string) => {
    if (templateName.includes("Gift")) return Gift;
    if (templateName.includes("Event")) return Calendar;
    if (templateName.includes("Local")) return MapPin;
    if (templateName.includes("Education")) return BookOpen;
    if (templateName.includes("Category")) return BarChart3;
    return FileText;
  };

  const getTemplateColor = (templateName: string) => {
    if (templateName.includes("Gift")) return "bg-pink-100 text-pink-800";
    if (templateName.includes("Event")) return "bg-purple-100 text-purple-800";
    if (templateName.includes("Local")) return "bg-blue-100 text-blue-800";
    if (templateName.includes("Education"))
      return "bg-green-100 text-green-800";
    if (templateName.includes("Category"))
      return "bg-orange-100 text-orange-800";
    return "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading templates...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {selectedKeywords.length === 0 ? (
        <Card>
          <CardContent className="text-center p-8">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select Keywords First
            </h3>
            <p className="text-gray-600">
              Choose your target keywords to get personalized template
              recommendations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Recommended Template */}
          {recommendedTemplate && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-blue-600" />
                  Recommended Template
                </CardTitle>
                <CardDescription>
                  Based on your selected keywords, this template will work best
                  for your content.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {(() => {
                        const Icon = getTemplateIcon(
                          recommendedTemplate.template_name
                        );
                        return <Icon className="h-5 w-5 text-blue-600" />;
                      })()}
                      <h3 className="font-medium">
                        {recommendedTemplate.template_name}
                      </h3>
                      <Badge
                        className={getTemplateColor(
                          recommendedTemplate.template_name
                        )}
                      >
                        Recommended
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {recommendedTemplate.target_length}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {recommendedTemplate.structure.length} sections
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Content Structure:
                      </Label>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {recommendedTemplate.structure.map((section, index) => (
                          <li key={index}>{section}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleTemplateSelect(recommendedTemplate)}
                    disabled={generating}
                    className="ml-4"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Use Template
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Templates */}
          <Card>
            <CardHeader>
              <CardTitle>All Available Templates</CardTitle>
              <CardDescription>
                Choose from our collection of proven blog post templates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => {
                  const Icon = getTemplateIcon(template.template_name);
                  const isRecommended = recommendedTemplate?.id === template.id;

                  return (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isRecommended ? "ring-2 ring-blue-500" : ""
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className="h-5 w-5 text-gray-600" />
                              <h3 className="font-medium text-sm">
                                {template.template_name}
                              </h3>
                              {isRecommended && (
                                <Badge variant="outline" className="text-xs">
                                  Recommended
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {template.target_length}
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {template.structure.length} sections
                              </div>
                            </div>

                            <p className="text-xs text-gray-600 line-clamp-2">
                              {template.structure.slice(0, 3).join(" • ")}
                              {template.structure.length > 3 && "..."}
                            </p>
                          </div>

                          <ChevronRight className="h-4 w-4 text-gray-400 ml-2" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Generated Outline Preview */}
          {generatedOutline && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Generated Blog Outline
                </CardTitle>
                <CardDescription>
                  Your personalized blog post outline based on selected keywords
                  and template.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    value={generatedOutline}
                    onChange={(e) => setGeneratedOutline(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                    placeholder="Generated outline will appear here..."
                  />

                  <div className="flex justify-end">
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedOutline);
                        toast({
                          title: "Copied!",
                          description: "Outline copied to clipboard.",
                        });
                      }}
                      variant="outline"
                    >
                      Copy Outline
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
