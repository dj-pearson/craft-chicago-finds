// @ts-nocheck
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  FileText,
  Image,
  Tag,
  Globe,
  Sparkles,
  Save,
  X,
  Clock,
  BarChart3,
  Users,
  Target,
  Lightbulb,
  Wand2,
  RefreshCw,
  Check,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Share2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCityContext } from "@/hooks/useCityContext";
import { seoManager } from "@/lib/seo-utils";
import { KeywordSelector } from "./KeywordSelector";
import { BlogTemplateSelector } from "./BlogTemplateSelector";
import { BlogProductLinker } from "./BlogProductLinker";
import { BlogQuickTemplates } from "./BlogQuickTemplates";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image?: string;
  meta_title: string;
  meta_description: string;
  keywords: string[];
  status: "draft" | "published" | "scheduled";
  publish_date: string;
  author_id: string;
  city_id?: string;
  category: string;
  tags: string[];
  view_count: number;
  ai_generated: boolean;
  seo_score: number;
  readability_score: number;
  word_count: number;
  estimated_reading_time: number;
  webhook_sent_at?: string;
  created_at: string;
  updated_at: string;
}

interface AIArticleTemplate {
  id: string;
  name: string;
  description: string;
  template_type:
    | "guide"
    | "comparison"
    | "listicle"
    | "local_spotlight"
    | "seasonal"
    | "faq"
    | "how_to";
  prompt_template: string;
  target_word_count: number;
  seo_focus: string[];
  required_sections: string[];
  tone?: string;
  is_active?: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

interface BlogManagerProps {
  className?: string;
}

export const BlogManager = ({ className }: BlogManagerProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentCity } = useCityContext();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [templates, setTemplates] = useState<AIArticleTemplate[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [selectedBlogTemplate, setSelectedBlogTemplate] = useState<any>(null);
  const [generatedOutline, setGeneratedOutline] = useState<string>("");

  const [postForm, setPostForm] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    featured_image: "",
    meta_title: "",
    meta_description: "",
    keywords: "",
    status: "draft" as BlogPost["status"],
    publish_date: "",
    category: "",
    tags: "",
    city_id: currentCity?.id || "",
  });

  const [aiGenerationForm, setAiGenerationForm] = useState({
    template_id: "",
    topic: "",
    target_keyword: "",
    city_focus: currentCity?.name || "",
    additional_context: "",
    word_count: 800,
    tone: "professional",
    include_local_references: true,
    include_faqs: true,
    include_call_to_action: true,
  });

  // AI Workflow State
  const [showAIWorkflow, setShowAIWorkflow] = useState(false);
  const [aiWorkflowStep, setAiWorkflowStep] = useState<'keywords' | 'template' | 'review' | 'generating'>('keywords');
  const [aiSelectedKeywords, setAiSelectedKeywords] = useState<any[]>([]);
  const [aiSelectedTemplate, setAiSelectedTemplate] = useState<any>(null);
  const [aiOutline, setAiOutline] = useState<string>("");

  // Webhook state
  const [showWebhookSettings, setShowWebhookSettings] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookName, setWebhookName] = useState("Social Media Webhook");
  const [webhookSettings, setWebhookSettings] = useState<any[]>([]);
  const [selectedWebhookId, setSelectedWebhookId] = useState<string>("");
  const [sendingWebhook, setSendingWebhook] = useState(false);

  useEffect(() => {
    fetchPosts();
    fetchTemplates();
    fetchWebhookSettings();
  }, [currentCity]);

  const fetchWebhookSettings = async () => {
    const { data } = await (supabase as any)
      .from("webhook_settings")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    
    if (data) {
      setWebhookSettings(data);
      const blogWebhook = data.find((w: any) => w.supports_blog === true);
      if (blogWebhook) {
        setSelectedWebhookId(blogWebhook.id);
      }
    }
  };

  const saveWebhookSettings = async () => {
    try {
      if (!webhookUrl) {
        toast({
          title: "Error",
          description: "Please enter a webhook URL",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("webhook_settings")
        .insert({
          name: webhookName,
          webhook_url: webhookUrl,
          content_types: ["blog_article"],
          is_active: true,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Webhook settings saved successfully",
      });

      setShowWebhookSettings(false);
      setWebhookUrl("");
      setWebhookName("Social Media Webhook");
      fetchWebhookSettings();
      
      if (data) {
        setSelectedWebhookId(data.id);
      }
    } catch (error: any) {
      console.error("Error saving webhook:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendToWebhook = async (articleId: string) => {
    try {
      setSendingWebhook(true);

      const { data, error } = await supabase.functions.invoke("send-blog-webhook", {
        body: {
          article_id: articleId,
          webhook_settings_id: selectedWebhookId || undefined,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Article sent to ${data.webhooks_sent} webhook(s)`,
      });

      fetchPosts();
    } catch (error: any) {
      console.error("Error sending to webhook:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingWebhook(false);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("blog_articles")
        .select(
          `
          *,
          cities (
            id,
            name,
            slug
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to load blog posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("blog_article_templates")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const handleKeywordSelection = (keyword: any) => {
    setAiSelectedKeywords(prev => {
      const exists = prev.find(k => k.id === keyword.id);
      if (exists) {
        return prev.filter(k => k.id !== keyword.id);
      }
      return [...prev, keyword];
    });
  };

  const handleTemplateSelection = (template: any, outline: string) => {
    setAiSelectedTemplate(template);
    setAiOutline(outline);
    setAiWorkflowStep('review');
  };

  const generateAIArticleFromWorkflow = async () => {
    if (!aiSelectedTemplate || aiSelectedKeywords.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select keywords and a template",
        variant: "destructive",
      });
      return;
    }

    setAiWorkflowStep('generating');
    setAiGenerating(true);

    try {
      const primaryKeyword = aiSelectedKeywords[0];
      const allKeywords = aiSelectedKeywords.map(k => k.primary_keyword);

      const response = await supabase.functions.invoke("ai-generate-blog", {
        body: {
          template_id: aiSelectedTemplate.id,
          topic: primaryKeyword.primary_keyword,
          target_keyword: primaryKeyword.primary_keyword,
          keywords: allKeywords,
          city_focus: currentCity?.name || "",
          additional_context: aiOutline,
          word_count: aiSelectedTemplate.target_word_count || 800,
          tone: aiSelectedTemplate.tone || "professional",
          include_local_references: true,
          include_faqs: true,
          include_call_to_action: true,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "AI generation failed");
      }

      const result = response.data;

      // Auto-save the generated article as draft
      const wordCount = result.content.split(/\s+/).length;
      const estimatedReadingTime = Math.ceil(wordCount / 200);
      const keywords = Array.isArray(result.keywords) ? result.keywords : result.keywords.split(',').map((k: string) => k.trim());
      const tags = Array.isArray(result.tags) ? result.tags : result.tags.split(',').map((t: string) => t.trim());

      const postData = {
        title: result.title,
        slug: result.slug,
        content: result.content,
        excerpt: result.excerpt,
        featured_image: null,
        meta_title: result.meta_title,
        meta_description: result.meta_description,
        keywords,
        status: 'draft',
        publish_date: null,
        author_id: user?.id,
        city_id: currentCity?.id || null,
        category: result.category,
        tags,
        word_count: wordCount,
        estimated_reading_time: estimatedReadingTime,
        seo_score: calculateSEOScore({
          ...result,
          keywords: keywords.join(", "),
          word_count: wordCount,
        }),
        readability_score: 85,
        ai_generated: true,
        ai_prompt: result.ai_prompt,
      };

      const { error: insertError } = await (supabase as any)
        .from("blog_articles")
        .insert([postData]);

      if (insertError) throw insertError;

      // Close workflow and refresh
      setShowAIWorkflow(false);
      setAiWorkflowStep('keywords');
      setAiSelectedKeywords([]);
      setAiSelectedTemplate(null);
      setAiOutline("");
      fetchPosts();

      toast({
        title: "Article Generated & Saved!",
        description: `AI-generated article saved as draft. ${result.tokens_used} tokens used.`,
      });
    } catch (error) {
      console.error("Error generating article:", error);
      toast({
        title: "Generation Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate article. Please try again.",
        variant: "destructive",
      });
      setAiWorkflowStep('review');
    } finally {
      setAiGenerating(false);
    }
  };

  const generateAIArticle = async () => {
    if (
      !aiGenerationForm.template_id ||
      !aiGenerationForm.topic ||
      !aiGenerationForm.target_keyword
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields for AI generation",
        variant: "destructive",
      });
      return;
    }

    setAiGenerating(true);
    try {
      const response = await supabase.functions.invoke("ai-generate-blog", {
        body: {
          template_id: aiGenerationForm.template_id,
          topic: aiGenerationForm.topic,
          target_keyword: aiGenerationForm.target_keyword,
          city_focus: aiGenerationForm.city_focus,
          additional_context: aiGenerationForm.additional_context,
          word_count: aiGenerationForm.word_count,
          tone: aiGenerationForm.tone,
          include_local_references: aiGenerationForm.include_local_references,
          include_faqs: aiGenerationForm.include_faqs,
          include_call_to_action: aiGenerationForm.include_call_to_action,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "AI generation failed");
      }

      const result = response.data;

      setPostForm((prev) => ({
        ...prev,
        title: result.title,
        slug: result.slug,
        content: result.content,
        excerpt: result.excerpt,
        meta_title: result.meta_title,
        meta_description: result.meta_description,
        keywords: Array.isArray(result.keywords)
          ? result.keywords.join(", ")
          : result.keywords,
        category: result.category,
        tags: Array.isArray(result.tags) ? result.tags.join(", ") : result.tags,
        city_id: currentCity?.id || "",
      }));

      setIsEditing(true);
      setSelectedPost(null);

      toast({
        title: "Article Generated!",
        description: `AI-generated article ready for review (${result.tokens_used} tokens used)`,
      });
    } catch (error) {
      console.error("Error generating article:", error);
      toast({
        title: "Generation Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate article. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const calculateSEOScore = (post: any): number => {
    let score = 0;

    // Title optimization (0-25 points)
    if (post.title && post.title.length >= 30 && post.title.length <= 60)
      score += 25;
    else if (post.title && post.title.length > 0) score += 15;

    // Meta description (0-25 points)
    if (
      post.meta_description &&
      post.meta_description.length >= 120 &&
      post.meta_description.length <= 160
    )
      score += 25;
    else if (post.meta_description && post.meta_description.length > 0)
      score += 15;

    // Keywords (0-20 points)
    if (post.keywords && post.keywords.split(",").length >= 3) score += 20;
    else if (post.keywords && post.keywords.length > 0) score += 10;

    // Content length (0-20 points)
    if (post.word_count >= 800) score += 20;
    else if (post.word_count >= 500) score += 15;
    else if (post.word_count >= 300) score += 10;

    // Image (0-10 points)
    if (post.featured_image) score += 10;

    return score;
  };

  const handleTemplateSelect = (template: any) => {
    setPostForm((prev) => ({
      ...prev,
      title: template.title,
      content: template.content,
      meta_description: template.meta_description,
      keywords: template.keywords,
    }));
    toast({
      title: "Template applied!",
      description: "Customize the content to make it your own.",
    });
  };

  const savePost = async () => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const wordCount = postForm.content.split(/\s+/).length;
      const estimatedReadingTime = Math.ceil(wordCount / 200);
      const keywords = postForm.keywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k);
      const tags = postForm.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);

      const postData = {
        title: postForm.title,
        slug: postForm.slug || generateSlug(postForm.title),
        content: postForm.content,
        excerpt: postForm.excerpt,
        featured_image: postForm.featured_image || null,
        meta_title: postForm.meta_title,
        meta_description: postForm.meta_description,
        keywords,
        status: postForm.status,
        publish_date:
          postForm.status === "scheduled"
            ? postForm.publish_date
            : postForm.status === "published"
            ? new Date().toISOString()
            : null,
        author_id: user.id,
        city_id: postForm.city_id || null,
        category: postForm.category,
        tags,
        word_count: wordCount,
        estimated_reading_time: estimatedReadingTime,
        seo_score: calculateSEOScore({
          ...postForm,
          keywords: keywords.join(", "),
          word_count: wordCount,
        }),
        readability_score: 85, // TODO: Implement readability calculation
        ai_generated: selectedPost?.ai_generated || false,
      };

      if (selectedPost) {
        // Update existing post
        const { error } = await (supabase as any)
          .from("blog_articles")
          .update(postData)
          .eq("id", selectedPost.id);

        if (error) throw error;
      } else {
        // Create new post
        const { error } = await (supabase as any)
          .from("blog_articles")
          .insert([postData]);

        if (error) throw error;
      }

      setIsEditing(false);
      setSelectedPost(null);
      resetForm();
      fetchPosts(); // Refresh the list

      toast({
        title: "Post Saved!",
        description: selectedPost
          ? "Post updated successfully"
          : "New post created successfully",
      });
    } catch (error) {
      console.error("Error saving post:", error);
      toast({
        title: "Save Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deletePost = async (postId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from("blog_articles")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast({
        title: "Post Deleted",
        description: "Post has been permanently deleted",
      });
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Delete Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendWebhook = async (articleId: string) => {
    try {
      const response = await supabase.functions.invoke("send-blog-webhook", {
        body: {
          article_id: articleId,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Webhook sending failed");
      }

      toast({
        title: "Webhook Sent!",
        description: `Sent to ${response.data.successful_webhooks}/${response.data.webhooks_sent} webhooks`,
      });

      fetchPosts(); // Refresh to show webhook status
    } catch (error) {
      console.error("Error sending webhook:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send webhook",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setPostForm({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      featured_image: "",
      meta_title: "",
      meta_description: "",
      keywords: "",
      status: "draft",
      publish_date: "",
      category: "",
      tags: "",
      city_id: currentCity?.id || "",
    });
  };

  const editPost = (post: BlogPost) => {
    setSelectedPost(post);
    setPostForm({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      featured_image: post.featured_image || "",
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      keywords: post.keywords.join(", "),
      status: post.status,
      publish_date: post.publish_date,
      category: post.category,
      tags: post.tags.join(", "),
      city_id: post.city_id || "",
    });
    setIsEditing(true);
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || post.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || post.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: BlogPost["status"]) => {
    switch (status) {
      case "published":
        return "bg-green-50 text-green-700 border-green-200";
      case "draft":
        return "bg-gray-50 text-gray-700 border-gray-200";
      case "scheduled":
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const getSEOScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading blog manager...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Blog Manager
        </CardTitle>
        <CardDescription>
          Create, manage, and optimize blog content with AI-powered article
          generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="posts">All Posts</TabsTrigger>
            <TabsTrigger value="keyword-planner">Keyword Planner</TabsTrigger>
            <TabsTrigger value="ai-generator">AI Generator</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-6">
            {!isEditing ? (
              <>
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="flex flex-1 gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search posts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={categoryFilter}
                      onValueChange={setCategoryFilter}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="Guides">Guides</SelectItem>
                        <SelectItem value="Comparisons">Comparisons</SelectItem>
                        <SelectItem value="Care Guides">Care Guides</SelectItem>
                        <SelectItem value="Gift Guides">Gift Guides</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowWebhookSettings(true)}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Webhooks
                    </Button>
                    <Button onClick={() => setIsEditing(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Post
                    </Button>
                  </div>
                </div>

                {/* Posts List */}
                <div className="space-y-4">
                  {filteredPosts.map((post) => (
                    <Card
                      key={post.id}
                      className="transition-all duration-200 hover:shadow-md"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge
                                className={`${getStatusColor(post.status)} font-semibold uppercase text-xs px-3 py-1`}
                              >
                                {post.status}
                              </Badge>
                              <h3 className="font-semibold line-clamp-1 flex-1">
                                {post.title}
                              </h3>
                              {post.ai_generated && (
                                <Badge
                                  variant="outline"
                                  className="bg-purple-50 text-purple-700 border-purple-200"
                                >
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  AI
                                </Badge>
                              )}
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {post.excerpt}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(post.created_at).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {post.word_count} words
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {post.estimated_reading_time} min read
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {post.view_count} views
                              </div>
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                <span
                                  className={getSEOScoreColor(post.seo_score)}
                                >
                                  SEO: {post.seo_score}%
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1 mt-2">
                              {post.tags.slice(0, 3).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {post.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{post.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {post.featured_image && (
                            <div className="w-20 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                              <img
                                src={post.featured_image}
                                alt={post.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendWebhook(post.id)}
                              title={
                                post.webhook_sent_at
                                  ? `Last sent: ${new Date(
                                      post.webhook_sent_at
                                    ).toLocaleString()}`
                                  : "Send to webhook"
                              }
                            >
                              <Globe className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => editPost(post)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deletePost(post.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              // Post Editor
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">
                      {selectedPost ? "Edit Post" : "Create New Post"}
                    </h3>
                    {!selectedPost && (
                      <BlogQuickTemplates onTemplateSelect={handleTemplateSelect} />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedPost(null);
                        resetForm();
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={savePost}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Post
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Editor */}
                  <div className="lg:col-span-2 space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={postForm.title}
                        onChange={(e) => {
                          setPostForm((prev) => ({
                            ...prev,
                            title: e.target.value,
                            slug: generateSlug(e.target.value),
                          }));
                        }}
                        placeholder="Enter post title..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="slug">URL Slug</Label>
                      <Input
                        id="slug"
                        value={postForm.slug}
                        onChange={(e) =>
                          setPostForm((prev) => ({
                            ...prev,
                            slug: e.target.value,
                          }))
                        }
                        placeholder="url-friendly-slug"
                      />
                    </div>

                    <div>
                      <Label htmlFor="excerpt">Excerpt</Label>
                      <Textarea
                        id="excerpt"
                        value={postForm.excerpt}
                        onChange={(e) =>
                          setPostForm((prev) => ({
                            ...prev,
                            excerpt: e.target.value,
                          }))
                        }
                        placeholder="Brief description of the post..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        value={postForm.content}
                        onChange={(e) =>
                          setPostForm((prev) => ({
                            ...prev,
                            content: e.target.value,
                          }))
                        }
                        placeholder="Write your post content here..."
                        rows={20}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-4">
                    {/* Publish Settings */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">
                          Publish Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={postForm.status}
                            onValueChange={(value: BlogPost["status"]) =>
                              setPostForm((prev) => ({
                                ...prev,
                                status: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">
                                Published
                              </SelectItem>
                              <SelectItem value="scheduled">
                                Scheduled
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={postForm.category}
                            onValueChange={(value) =>
                              setPostForm((prev) => ({
                                ...prev,
                                category: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Guides">Guides</SelectItem>
                              <SelectItem value="Comparisons">
                                Comparisons
                              </SelectItem>
                              <SelectItem value="Care Guides">
                                Care Guides
                              </SelectItem>
                              <SelectItem value="Gift Guides">
                                Gift Guides
                              </SelectItem>
                              <SelectItem value="Local Spotlights">
                                Local Spotlights
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="tags">Tags (comma separated)</Label>
                          <Input
                            id="tags"
                            value={postForm.tags}
                            onChange={(e) =>
                              setPostForm((prev) => ({
                                ...prev,
                                tags: e.target.value,
                              }))
                            }
                            placeholder="tag1, tag2, tag3"
                          />
                        </div>

                        {postForm.status === "scheduled" && (
                          <div>
                            <Label htmlFor="publish_date">Publish Date</Label>
                            <Input
                              id="publish_date"
                              type="datetime-local"
                              value={postForm.publish_date}
                              onChange={(e) =>
                                setPostForm((prev) => ({
                                  ...prev,
                                  publish_date: e.target.value,
                                }))
                              }
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* SEO Settings */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">SEO Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label htmlFor="meta_title">Meta Title</Label>
                          <Input
                            id="meta_title"
                            value={postForm.meta_title}
                            onChange={(e) =>
                              setPostForm((prev) => ({
                                ...prev,
                                meta_title: e.target.value,
                              }))
                            }
                            placeholder="SEO optimized title..."
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {postForm.meta_title.length}/60 characters
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="meta_description">
                            Meta Description
                          </Label>
                          <Textarea
                            id="meta_description"
                            value={postForm.meta_description}
                            onChange={(e) =>
                              setPostForm((prev) => ({
                                ...prev,
                                meta_description: e.target.value,
                              }))
                            }
                            placeholder="SEO description..."
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {postForm.meta_description.length}/160 characters
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="keywords">
                            Keywords (comma separated)
                          </Label>
                          <Input
                            id="keywords"
                            value={postForm.keywords}
                            onChange={(e) =>
                              setPostForm((prev) => ({
                                ...prev,
                                keywords: e.target.value,
                              }))
                            }
                            placeholder="keyword1, keyword2, keyword3"
                          />
                        </div>

                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span>SEO Score:</span>
                            <span
                              className={getSEOScoreColor(
                                calculateSEOScore(postForm)
                              )}
                            >
                              {calculateSEOScore(postForm)}%
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Featured Image */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">
                          Featured Image
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div>
                          <Label htmlFor="featured_image">Image URL</Label>
                          <Input
                            id="featured_image"
                            value={postForm.featured_image}
                            onChange={(e) =>
                              setPostForm((prev) => ({
                                ...prev,
                                featured_image: e.target.value,
                              }))
                            }
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                        {postForm.featured_image && (
                          <div className="mt-3">
                            <img
                              src={postForm.featured_image}
                              alt="Featured"
                              className="w-full h-32 object-cover rounded"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Product Linking - Only show for existing posts */}
                    {selectedPost && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">
                            Product Links
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Connect products to display in "Shop This Article"
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <BlogProductLinker articleId={selectedPost.id} />
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai-generator" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-primary" />
                  AI Article Generator
                </CardTitle>
                <CardDescription>
                  Generate SEO-optimized articles using AI templates and local
                  market insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="template">Article Template</Label>
                      <Select
                        value={aiGenerationForm.template_id}
                        onValueChange={(value) =>
                          setAiGenerationForm((prev) => ({
                            ...prev,
                            template_id: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {aiGenerationForm.template_id && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {
                            templates.find(
                              (t) => t.id === aiGenerationForm.template_id
                            )?.description
                          }
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="topic">Article Topic</Label>
                      <Input
                        id="topic"
                        value={aiGenerationForm.topic}
                        onChange={(e) =>
                          setAiGenerationForm((prev) => ({
                            ...prev,
                            topic: e.target.value,
                          }))
                        }
                        placeholder="e.g., Best Handmade Jewelry Gifts"
                      />
                    </div>

                    <div>
                      <Label htmlFor="target_keyword">Target Keyword</Label>
                      <Input
                        id="target_keyword"
                        value={aiGenerationForm.target_keyword}
                        onChange={(e) =>
                          setAiGenerationForm((prev) => ({
                            ...prev,
                            target_keyword: e.target.value,
                          }))
                        }
                        placeholder="e.g., handmade jewelry chicago"
                      />
                    </div>

                    <div>
                      <Label htmlFor="city_focus">City Focus</Label>
                      <Input
                        id="city_focus"
                        value={aiGenerationForm.city_focus}
                        onChange={(e) =>
                          setAiGenerationForm((prev) => ({
                            ...prev,
                            city_focus: e.target.value,
                          }))
                        }
                        placeholder="e.g., Chicago"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="word_count">Target Word Count</Label>
                      <Select
                        value={aiGenerationForm.word_count.toString()}
                        onValueChange={(value) =>
                          setAiGenerationForm((prev) => ({
                            ...prev,
                            word_count: parseInt(value),
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="500">500 words</SelectItem>
                          <SelectItem value="800">800 words</SelectItem>
                          <SelectItem value="1200">1,200 words</SelectItem>
                          <SelectItem value="1500">1,500 words</SelectItem>
                          <SelectItem value="2000">2,000 words</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="tone">Writing Tone</Label>
                      <Select
                        value={aiGenerationForm.tone}
                        onValueChange={(value) =>
                          setAiGenerationForm((prev) => ({
                            ...prev,
                            tone: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">
                            Professional
                          </SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                          <SelectItem value="conversational">
                            Conversational
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Additional Options</Label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={aiGenerationForm.include_local_references}
                            onChange={(e) =>
                              setAiGenerationForm((prev) => ({
                                ...prev,
                                include_local_references: e.target.checked,
                              }))
                            }
                          />
                          <span className="text-sm">
                            Include local references
                          </span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={aiGenerationForm.include_faqs}
                            onChange={(e) =>
                              setAiGenerationForm((prev) => ({
                                ...prev,
                                include_faqs: e.target.checked,
                              }))
                            }
                          />
                          <span className="text-sm">Include FAQ section</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={aiGenerationForm.include_call_to_action}
                            onChange={(e) =>
                              setAiGenerationForm((prev) => ({
                                ...prev,
                                include_call_to_action: e.target.checked,
                              }))
                            }
                          />
                          <span className="text-sm">
                            Include call-to-action
                          </span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="additional_context">
                        Additional Context
                      </Label>
                      <Textarea
                        id="additional_context"
                        value={aiGenerationForm.additional_context}
                        onChange={(e) =>
                          setAiGenerationForm((prev) => ({
                            ...prev,
                            additional_context: e.target.value,
                          }))
                        }
                        placeholder="Any specific requirements or context for the article..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={generateAIArticle}
                    disabled={
                      aiGenerating ||
                      !aiGenerationForm.template_id ||
                      !aiGenerationForm.topic
                    }
                    size="lg"
                    className="px-8"
                  >
                    {aiGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating Article...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Article
                      </>
                    )}
                  </Button>
                </div>

                {/* Template Preview */}
                {aiGenerationForm.template_id && (
                  <Card className="mt-6">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">
                        Template Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const template = templates.find(
                          (t) => t.id === aiGenerationForm.template_id
                        );
                        if (!template) return null;

                        return (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Template Type
                              </Label>
                              <p className="capitalize">
                                {template.template_type?.replace(/_/g, " ") ||
                                  "N/A"}
                              </p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Target Word Count
                              </Label>
                              <p>{template.target_word_count || 1000} words</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                SEO Focus Areas
                              </Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {template.seo_focus?.map((focus) => (
                                  <Badge
                                    key={focus}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {focus}
                                  </Badge>
                                )) || (
                                  <span className="text-xs text-muted-foreground">
                                    None
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Required Sections
                              </Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {template.required_sections?.map((section) => (
                                  <Badge
                                    key={section}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {section}
                                  </Badge>
                                )) || (
                                  <span className="text-xs text-muted-foreground">
                                    None
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keyword-planner" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Keyword Selector */}
              <KeywordSelector
                onKeywordSelect={(keyword) => {
                  if (!selectedKeywords.includes(keyword.primary_keyword)) {
                    setSelectedKeywords([
                      ...selectedKeywords,
                      keyword.primary_keyword,
                    ]);
                  }
                }}
                selectedKeywords={selectedKeywords}
                maxSelections={5}
              />

              {/* Selected Keywords & Template Selector */}
              <div className="space-y-6">
                {/* Selected Keywords Display */}
                {selectedKeywords.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        Selected Keywords ({selectedKeywords.length}/5)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedKeywords.map((keyword) => (
                          <Badge
                            key={keyword}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {keyword}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => {
                                setSelectedKeywords(
                                  selectedKeywords.filter((k) => k !== keyword)
                                );
                              }}
                            />
                          </Badge>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedKeywords([])}
                        size="sm"
                      >
                        Clear All
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Template Selector */}
                <BlogTemplateSelector
                  selectedKeywords={selectedKeywords.map((keyword) => ({
                    primary_keyword: keyword,
                    cluster_id: 1, // This would be properly mapped from the keyword selector
                    id: "",
                    search_volume: "medium",
                    competition: "medium",
                    buyer_intent: "medium",
                    local_modifier: false,
                    seasonal: false,
                    content_type: "guide",
                    blog_angle: "comprehensive_guide",
                  }))}
                  onTemplateSelect={(template, outline) => {
                    setSelectedBlogTemplate(template);
                    setGeneratedOutline(outline);

                    // Pre-fill the post form with template data
                    setPostForm((prev) => ({
                      ...prev,
                      title: `${
                        selectedKeywords[0] || "New Post"
                      } - Chicago Local Guide`,
                      content: outline,
                      keywords: selectedKeywords.join(", "),
                      meta_title: `${
                        selectedKeywords[0] || "New Post"
                      } - ${new Date().getFullYear()} Chicago Guide`,
                      meta_description: `Discover the best ${
                        selectedKeywords[0] || "handmade products"
                      } in Chicago. Complete local guide with maker spotlights and shopping tips.`,
                    }));

                    toast({
                      title: "Template Applied!",
                      description:
                        "Blog post template and outline generated successfully.",
                    });
                  }}
                />

                {/* Quick Actions */}
                {selectedBlogTemplate && generatedOutline && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        Ready to Write
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        Your blog post outline is ready! Choose your next step:
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setIsEditing(true);
                            setSelectedPost(null);
                          }}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Start Writing
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            // This would trigger AI generation with the selected keywords
                            setAiGenerationForm((prev) => ({
                              ...prev,
                              target_keyword: selectedKeywords[0] || "",
                              topic: selectedBlogTemplate.template_name,
                              additional_context: `Keywords: ${selectedKeywords.join(
                                ", "
                              )}\n\nOutline:\n${generatedOutline}`,
                            }));
                            toast({
                              title: "Ready for AI Generation",
                              description:
                                "Switch to the AI Generator tab to complete your post.",
                            });
                          }}
                        >
                          <Wand2 className="h-4 w-4 mr-2" />
                          Generate with AI
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Posts
                      </p>
                      <p className="text-2xl font-bold">{posts.length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Published</p>
                      <p className="text-2xl font-bold">
                        {posts.filter((p) => p.status === "published").length}
                      </p>
                    </div>
                    <Globe className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Views
                      </p>
                      <p className="text-2xl font-bold">
                        {posts
                          .reduce((sum, p) => sum + p.view_count, 0)
                          .toLocaleString()}
                      </p>
                    </div>
                    <Eye className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        AI Generated
                      </p>
                      <p className="text-2xl font-bold">
                        {posts.filter((p) => p.ai_generated).length}
                      </p>
                    </div>
                    <Sparkles className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Performing Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {posts
                    .filter((p) => p.status === "published")
                    .sort((a, b) => b.view_count - a.view_count)
                    .slice(0, 5)
                    .map((post) => (
                      <div
                        key={post.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium line-clamp-1">
                            {post.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {post.category} •{" "}
                            {new Date(post.publish_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {post.view_count.toLocaleString()} views
                          </p>
                          <p className="text-sm text-muted-foreground">
                            SEO:{" "}
                            <span className={getSEOScoreColor(post.seo_score)}>
                              {post.seo_score}%
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>

    {/* AI Article Generation Workflow Dialog */}
    {showAIWorkflow && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-5xl max-h-[90vh] overflow-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                  AI Article Generator
                </CardTitle>
                <CardDescription>
                  {aiWorkflowStep === 'keywords' && "Step 1: Select target keywords for your article"}
                  {aiWorkflowStep === 'template' && "Step 2: Choose the best template for your content"}
                  {aiWorkflowStep === 'review' && "Step 3: Review and generate your article"}
                  {aiWorkflowStep === 'generating' && "Generating your SEO-optimized article..."}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowAIWorkflow(false);
                  setAiWorkflowStep('keywords');
                  setAiSelectedKeywords([]);
                  setAiSelectedTemplate(null);
                  setAiOutline("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center gap-2 mt-4">
              <div className={`flex items-center gap-2 ${aiWorkflowStep === 'keywords' ? 'text-primary' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${aiWorkflowStep === 'keywords' ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                  1
                </div>
                <span className="text-sm font-medium">Keywords</span>
              </div>
              <div className="flex-1 h-1 bg-gray-200">
                <div className={`h-full ${['template', 'review', 'generating'].includes(aiWorkflowStep) ? 'bg-primary' : 'bg-gray-200'}`} />
              </div>
              <div className={`flex items-center gap-2 ${aiWorkflowStep === 'template' ? 'text-primary' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${['template', 'review', 'generating'].includes(aiWorkflowStep) ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                  2
                </div>
                <span className="text-sm font-medium">Template</span>
              </div>
              <div className="flex-1 h-1 bg-gray-200">
                <div className={`h-full ${['review', 'generating'].includes(aiWorkflowStep) ? 'bg-primary' : 'bg-gray-200'}`} />
              </div>
              <div className={`flex items-center gap-2 ${['review', 'generating'].includes(aiWorkflowStep) ? 'text-primary' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${['review', 'generating'].includes(aiWorkflowStep) ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                  3
                </div>
                <span className="text-sm font-medium">Generate</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Step 1: Keyword Selection */}
            {aiWorkflowStep === 'keywords' && (
              <div className="space-y-4">
                <KeywordSelector
                  onKeywordSelect={handleKeywordSelection}
                  selectedKeywords={aiSelectedKeywords.map(k => k.primary_keyword)}
                  maxSelections={5}
                />
                <div className="flex justify-between items-center pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    {aiSelectedKeywords.length} keyword{aiSelectedKeywords.length !== 1 ? 's' : ''} selected
                  </p>
                  <Button
                    onClick={() => setAiWorkflowStep('template')}
                    disabled={aiSelectedKeywords.length === 0}
                  >
                    Continue to Template Selection
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Template Selection */}
            {aiWorkflowStep === 'template' && (
              <div className="space-y-4">
                <BlogTemplateSelector
                  selectedKeywords={aiSelectedKeywords}
                  onTemplateSelect={handleTemplateSelection}
                />
                <div className="flex justify-between items-center pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setAiWorkflowStep('keywords')}
                  >
                    Back to Keywords
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Generate */}
            {aiWorkflowStep === 'review' && aiSelectedTemplate && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Selected Keywords</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {aiSelectedKeywords.map(kw => (
                          <Badge key={kw.id} variant="secondary">
                            {kw.primary_keyword}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Template</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium">{aiSelectedTemplate.template_name}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {aiSelectedTemplate.target_length} • {aiSelectedTemplate.structure?.length || 0} sections
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {aiOutline && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Article Outline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                        <pre className="text-sm whitespace-pre-wrap font-mono">{aiOutline}</pre>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAiWorkflowStep('template');
                      setAiSelectedTemplate(null);
                      setAiOutline("");
                    }}
                  >
                    Back to Templates
                  </Button>
                  <Button
                    onClick={generateAIArticleFromWorkflow}
                    disabled={aiGenerating}
                    className="gap-2"
                  >
                    {aiGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Generating Article...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Article
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Generating */}
            {aiWorkflowStep === 'generating' && (
              <div className="flex flex-col items-center justify-center py-12">
                <RefreshCw className="h-12 w-12 text-purple-600 animate-spin mb-4" />
                <h3 className="text-lg font-medium mb-2">Generating Your Article</h3>
                <p className="text-gray-600 text-center max-w-md">
                  Our AI is crafting a fully SEO-optimized article using your selected keywords and template. This may take a minute...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )}

    {/* Webhook Settings Dialog */}
    <Dialog open={showWebhookSettings} onOpenChange={setShowWebhookSettings}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Webhook Settings for Blog Articles</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="webhook-name">Webhook Name</Label>
            <Input
              id="webhook-name"
              value={webhookName}
              onChange={(e) => setWebhookName(e.target.value)}
              placeholder="e.g., Social Media Webhook"
            />
          </div>
          
          <div>
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input
              id="webhook-url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hook.us1.make.com/..."
            />
            <p className="text-sm text-muted-foreground mt-1">
              This webhook will receive blog article data with AI-generated social media descriptions (short for Twitter, long for Facebook)
            </p>
          </div>

          {webhookSettings.length > 0 && (
            <div className="space-y-2">
              <Label>Existing Blog Webhooks</Label>
              {webhookSettings.filter((w: any) => w.content_types?.includes("blog_article")).map((webhook: any) => (
                <div key={webhook.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <p className="font-medium">{webhook.name}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-md">
                      {webhook.webhook_url}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={webhook.id === selectedWebhookId ? "default" : "outline"}>
                      {webhook.id === selectedWebhookId ? "Selected" : "Available"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedWebhookId(webhook.id)}
                    >
                      Select
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowWebhookSettings(false)}>
            Cancel
          </Button>
          <Button onClick={saveWebhookSettings}>
            Save Webhook
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};
