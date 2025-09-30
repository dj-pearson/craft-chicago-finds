import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCityContext } from "@/hooks/useCityContext";
import { seoManager } from "@/lib/seo-utils";

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
  status: 'draft' | 'published' | 'scheduled';
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
  created_at: string;
  updated_at: string;
}

interface AIArticleTemplate {
  id: string;
  name: string;
  description: string;
  type: 'guide' | 'comparison' | 'listicle' | 'local_spotlight' | 'seasonal' | 'faq' | 'how_to';
  prompt_template: string;
  target_word_count: number;
  seo_focus: string[];
  required_sections: string[];
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const [postForm, setPostForm] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image: '',
    meta_title: '',
    meta_description: '',
    keywords: '',
    status: 'draft' as BlogPost['status'],
    publish_date: '',
    category: '',
    tags: '',
    city_id: currentCity?.id || ''
  });

  const [aiGenerationForm, setAiGenerationForm] = useState({
    template_id: '',
    topic: '',
    target_keyword: '',
    city_focus: currentCity?.name || '',
    additional_context: '',
    word_count: 800,
    tone: 'professional',
    include_local_references: true,
    include_faqs: true,
    include_call_to_action: true
  });

  useEffect(() => {
    fetchPosts();
    fetchTemplates();
  }, [currentCity]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_articles')
        .select(`
          *,
          cities (
            id,
            name,
            slug
          )
        `)
        .order('created_at', { ascending: false });

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
      const { data, error } = await supabase
        .from('blog_article_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const generateMockPosts = (): BlogPost[] => {
    return [
      {
        id: 'post-1',
        title: 'Best Handmade Jewelry Gifts Under $50 in Chicago',
        slug: 'best-handmade-jewelry-gifts-under-50-chicago',
        content: 'Full article content would be here...',
        excerpt: 'Discover amazing handmade jewelry pieces from Chicago artisans that make perfect gifts without breaking the bank.',
        featured_image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800',
        meta_title: 'Best Handmade Jewelry Gifts Under $50 in Chicago | CraftLocal',
        meta_description: 'Find unique handmade jewelry gifts under $50 from Chicago artisans. Perfect for birthdays, holidays, and special occasions.',
        keywords: ['handmade jewelry chicago', 'affordable gifts', 'local artisans', 'jewelry under 50'],
        status: 'published',
        publish_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        author_id: user?.id || '',
        city_id: currentCity?.id,
        category: 'Gift Guides',
        tags: ['jewelry', 'gifts', 'chicago', 'affordable'],
        view_count: 1247,
        ai_generated: true,
        seo_score: 89,
        readability_score: 85,
        word_count: 1200,
        estimated_reading_time: 5,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'post-2',
        title: 'How to Care for Your Handmade Pottery: A Complete Guide',
        slug: 'how-to-care-for-handmade-pottery-guide',
        content: 'Comprehensive guide content...',
        excerpt: 'Learn the best practices for maintaining and caring for your handmade pottery pieces to ensure they last for years.',
        featured_image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
        meta_title: 'How to Care for Handmade Pottery - Complete Guide | CraftLocal',
        meta_description: 'Expert tips on caring for handmade pottery. Learn cleaning, storage, and maintenance techniques to preserve your ceramic pieces.',
        keywords: ['pottery care', 'handmade ceramics', 'pottery maintenance', 'ceramic care tips'],
        status: 'published',
        publish_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        author_id: user?.id || '',
        category: 'Care Guides',
        tags: ['pottery', 'care', 'maintenance', 'ceramics'],
        view_count: 892,
        ai_generated: false,
        seo_score: 92,
        readability_score: 88,
        word_count: 1500,
        estimated_reading_time: 6,
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'post-3',
        title: 'Etsy vs CraftLocal: Which Platform Better Supports Local Artisans?',
        slug: 'etsy-vs-craftlocal-comparison',
        content: 'Detailed comparison content...',
        excerpt: 'A comprehensive comparison of Etsy and CraftLocal, focusing on how each platform supports local artisans and makers.',
        featured_image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
        meta_title: 'Etsy vs CraftLocal Comparison - Which Supports Local Artisans Better?',
        meta_description: 'Compare Etsy and CraftLocal marketplaces. Learn which platform offers better support for local artisans and makers.',
        keywords: ['etsy vs craftlocal', 'marketplace comparison', 'local artisans', 'handmade platforms'],
        status: 'draft',
        publish_date: '',
        author_id: user?.id || '',
        category: 'Comparisons',
        tags: ['comparison', 'etsy', 'marketplace', 'artisans'],
        view_count: 0,
        ai_generated: true,
        seo_score: 0,
        readability_score: 0,
        word_count: 2100,
        estimated_reading_time: 8,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  };

  const generateMockTemplates = (): AIArticleTemplate[] => {
    return [
      {
        id: 'template-1',
        name: 'Local Gift Guide',
        description: 'Generate city-specific gift guides featuring local artisans',
        type: 'guide',
        prompt_template: 'Create a comprehensive gift guide for {city} featuring handmade items under ${price_range}. Focus on {category} from local artisans. Include seasonal relevance for {season}.',
        target_word_count: 1200,
        seo_focus: ['local gifts', 'handmade gifts', 'city name', 'artisan gifts'],
        required_sections: ['Introduction', 'Featured Products', 'Local Artisan Spotlights', 'Shopping Tips', 'Conclusion']
      },
      {
        id: 'template-2',
        name: 'Marketplace Comparison',
        description: 'Compare CraftLocal with other marketplaces',
        type: 'comparison',
        prompt_template: 'Write a detailed comparison between CraftLocal and {competitor} focusing on {comparison_points}. Highlight benefits for {audience} in {city}.',
        target_word_count: 1800,
        seo_focus: ['marketplace comparison', 'vs competitor', 'local marketplace', 'artisan platform'],
        required_sections: ['Overview', 'Feature Comparison', 'Pricing Analysis', 'User Experience', 'Recommendation']
      },
      {
        id: 'template-3',
        name: 'Care & Maintenance Guide',
        description: 'Create detailed care guides for handmade products',
        type: 'how_to',
        prompt_template: 'Write a comprehensive care guide for {product_type}. Include cleaning, storage, and maintenance tips. Focus on handmade {material} items.',
        target_word_count: 1000,
        seo_focus: ['product care', 'maintenance tips', 'how to care', 'handmade care'],
        required_sections: ['Daily Care', 'Deep Cleaning', 'Storage Tips', 'Troubleshooting', 'Professional Care']
      },
      {
        id: 'template-4',
        name: 'Local Artisan Spotlight',
        description: 'Feature local makers and their stories',
        type: 'local_spotlight',
        prompt_template: 'Create an engaging profile of a local artisan in {city}. Focus on their craft ({craft_type}), journey, and unique techniques. Include their CraftLocal shop.',
        target_word_count: 800,
        seo_focus: ['local artisan', 'maker story', 'city artisan', 'craft profile'],
        required_sections: ['Artisan Introduction', 'Craft Journey', 'Unique Techniques', 'Featured Products', 'Shop Information']
      },
      {
        id: 'template-5',
        name: 'Seasonal Craft Trends',
        description: 'Analyze and predict seasonal craft trends',
        type: 'listicle',
        prompt_template: 'Write about top {number} craft trends for {season} {year}. Focus on {city} market and local artisan perspectives. Include shopping recommendations.',
        target_word_count: 1400,
        seo_focus: ['craft trends', 'seasonal trends', 'year trends', 'local trends'],
        required_sections: ['Trend Overview', 'Top Trends List', 'Local Market Analysis', 'Shopping Guide', 'Predictions']
      }
    ];
  };

  const generateAIArticle = async () => {
    if (!aiGenerationForm.template_id || !aiGenerationForm.topic || !aiGenerationForm.target_keyword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields for AI generation",
        variant: "destructive",
      });
      return;
    }

    setAiGenerating(true);
    try {
      const response = await supabase.functions.invoke('ai-generate-blog', {
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
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'AI generation failed');
      }

      const result = response.data;

      setPostForm(prev => ({
        ...prev,
        title: result.title,
        slug: result.slug,
        content: result.content,
        excerpt: result.excerpt,
        meta_title: result.meta_title,
        meta_description: result.meta_description,
        keywords: Array.isArray(result.keywords) ? result.keywords.join(', ') : result.keywords,
        category: result.category,
        tags: Array.isArray(result.tags) ? result.tags.join(', ') : result.tags,
        city_id: currentCity?.id || '',
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
        description: error instanceof Error ? error.message : "Failed to generate article. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const generateMockContent = (template: AIArticleTemplate, formData: any): string => {
    return `
# ${formData.topic} in ${formData.city_focus}

## Introduction

Welcome to your comprehensive guide to ${formData.topic.toLowerCase()} in ${formData.city_focus}. This article explores the best local options, expert recommendations, and insider tips to help you make the most of your craft journey.

## Key Highlights

${template.required_sections.map(section => `
### ${section}

This section would contain detailed information about ${section.toLowerCase()} related to ${formData.topic} in ${formData.city_focus}. The content is optimized for the keyword "${formData.target_keyword}" and provides valuable insights for local craft enthusiasts.

`).join('')}

## Local Recommendations

Our team has carefully curated a selection of ${formData.topic.toLowerCase()} options in ${formData.city_focus} that showcase the best of local craftsmanship and artisan talent.

${formData.include_faqs ? `
## Frequently Asked Questions

**Q: Where can I find the best ${formData.topic.toLowerCase()} in ${formData.city_focus}?**
A: CraftLocal marketplace features verified local artisans specializing in ${formData.topic.toLowerCase()}. Browse our ${formData.city_focus} section for authentic, handmade options.

**Q: What makes ${formData.city_focus} ${formData.topic.toLowerCase()} unique?**
A: ${formData.city_focus} has a rich tradition of craftsmanship, with local artisans bringing unique techniques and cultural influences to their ${formData.topic.toLowerCase()}.

**Q: How do I support local artisans when shopping for ${formData.topic.toLowerCase()}?**
A: Choose platforms like CraftLocal that prioritize local makers, read artisan stories, and share your purchases on social media to help spread awareness.
` : ''}

${formData.include_call_to_action ? `
## Start Your ${formData.topic} Journey Today

Ready to explore ${formData.topic.toLowerCase()} in ${formData.city_focus}? Browse our curated collection of local artisans and discover unique, handcrafted pieces that tell a story.

[Shop ${formData.topic} in ${formData.city_focus}](/cities/${formData.city_focus.toLowerCase()}/categories/${formData.topic.toLowerCase().replace(/\s+/g, '-')})
` : ''}

*This article was generated using AI technology and reviewed by our editorial team to ensure accuracy and relevance for the ${formData.city_focus} craft community.*
    `.trim();
  };

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const calculateSEOScore = (post: any): number => {
    let score = 0;
    
    // Title optimization (0-25 points)
    if (post.title && post.title.length >= 30 && post.title.length <= 60) score += 25;
    else if (post.title && post.title.length > 0) score += 15;
    
    // Meta description (0-25 points)
    if (post.meta_description && post.meta_description.length >= 120 && post.meta_description.length <= 160) score += 25;
    else if (post.meta_description && post.meta_description.length > 0) score += 15;
    
    // Keywords (0-20 points)
    if (post.keywords && post.keywords.split(',').length >= 3) score += 20;
    else if (post.keywords && post.keywords.length > 0) score += 10;
    
    // Content length (0-20 points)
    if (post.word_count >= 800) score += 20;
    else if (post.word_count >= 500) score += 15;
    else if (post.word_count >= 300) score += 10;
    
    // Image (0-10 points)
    if (post.featured_image) score += 10;
    
    return score;
  };

  const savePost = async () => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const wordCount = postForm.content.split(/\s+/).length;
      const estimatedReadingTime = Math.ceil(wordCount / 200);
      const keywords = postForm.keywords.split(',').map(k => k.trim()).filter(k => k);
      const tags = postForm.tags.split(',').map(t => t.trim()).filter(t => t);

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
        publish_date: postForm.status === 'scheduled' ? postForm.publish_date :
                     postForm.status === 'published' ? new Date().toISOString() : null,
        author_id: user.id,
        city_id: postForm.city_id || null,
        category: postForm.category,
        tags,
        word_count: wordCount,
        estimated_reading_time: estimatedReadingTime,
        seo_score: calculateSEOScore({
          ...postForm,
          keywords: keywords.join(', '),
          word_count: wordCount,
        }),
        readability_score: 85, // TODO: Implement readability calculation
        ai_generated: selectedPost?.ai_generated || false,
      };

      if (selectedPost) {
        // Update existing post
        const { error } = await supabase
          .from('blog_articles')
          .update(postData)
          .eq('id', selectedPost.id);

        if (error) throw error;
      } else {
        // Create new post
        const { error } = await supabase
          .from('blog_articles')
          .insert([postData]);

        if (error) throw error;
      }

      setIsEditing(false);
      setSelectedPost(null);
      resetForm();
      fetchPosts(); // Refresh the list

      toast({
        title: "Post Saved!",
        description: selectedPost ? "Post updated successfully" : "New post created successfully",
      });
    } catch (error) {
      console.error("Error saving post:", error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('blog_articles')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(prev => prev.filter(p => p.id !== postId));
      toast({
        title: "Post Deleted",
        description: "Post has been permanently deleted",
      });
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendWebhook = async (articleId: string) => {
    try {
      const response = await supabase.functions.invoke('send-blog-webhook', {
        body: {
          article_id: articleId,
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Webhook sending failed');
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
        description: error instanceof Error ? error.message : "Failed to send webhook",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setPostForm({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      featured_image: '',
      meta_title: '',
      meta_description: '',
      keywords: '',
      status: 'draft',
      publish_date: '',
      category: '',
      tags: '',
      city_id: currentCity?.id || ''
    });
  };

  const editPost = (post: BlogPost) => {
    setSelectedPost(post);
    setPostForm({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      featured_image: post.featured_image || '',
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      keywords: post.keywords.join(', '),
      status: post.status,
      publish_date: post.publish_date,
      category: post.category,
      tags: post.tags.join(', '),
      city_id: post.city_id || ''
    });
    setIsEditing(true);
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: BlogPost['status']) => {
    switch (status) {
      case 'published':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'draft':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'scheduled':
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getSEOScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
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
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Blog Manager
        </CardTitle>
        <CardDescription>
          Create, manage, and optimize blog content with AI-powered article generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts">All Posts</TabsTrigger>
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
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
                  <Button onClick={() => setIsEditing(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Post
                  </Button>
                </div>

                {/* Posts List */}
                <div className="space-y-4">
                  {filteredPosts.map((post) => (
                    <Card key={post.id} className="transition-all duration-200 hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold line-clamp-1">{post.title}</h3>
                              <Badge variant="outline" className={getStatusColor(post.status)}>
                                {post.status}
                              </Badge>
                              {post.ai_generated && (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
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
                                <span className={getSEOScoreColor(post.seo_score)}>
                                  SEO: {post.seo_score}%
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1 mt-2">
                              {post.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
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
                              title={post.webhook_sent_at ? `Last sent: ${new Date(post.webhook_sent_at).toLocaleString()}` : "Send to webhook"}
                            >
                              <Globe className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => editPost(post)}>
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
                  <h3 className="text-lg font-semibold">
                    {selectedPost ? 'Edit Post' : 'Create New Post'}
                  </h3>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {
                      setIsEditing(false);
                      setSelectedPost(null);
                      resetForm();
                    }}>
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
                          setPostForm(prev => ({ 
                            ...prev, 
                            title: e.target.value,
                            slug: generateSlug(e.target.value)
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
                        onChange={(e) => setPostForm(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="url-friendly-slug"
                      />
                    </div>

                    <div>
                      <Label htmlFor="excerpt">Excerpt</Label>
                      <Textarea
                        id="excerpt"
                        value={postForm.excerpt}
                        onChange={(e) => setPostForm(prev => ({ ...prev, excerpt: e.target.value }))}
                        placeholder="Brief description of the post..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        value={postForm.content}
                        onChange={(e) => setPostForm(prev => ({ ...prev, content: e.target.value }))}
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
                        <CardTitle className="text-sm">Publish Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label htmlFor="status">Status</Label>
                          <Select value={postForm.status} onValueChange={(value: BlogPost['status']) => 
                            setPostForm(prev => ({ ...prev, status: value }))
                          }>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select value={postForm.category} onValueChange={(value) => 
                            setPostForm(prev => ({ ...prev, category: value }))
                          }>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Guides">Guides</SelectItem>
                              <SelectItem value="Comparisons">Comparisons</SelectItem>
                              <SelectItem value="Care Guides">Care Guides</SelectItem>
                              <SelectItem value="Gift Guides">Gift Guides</SelectItem>
                              <SelectItem value="Local Spotlights">Local Spotlights</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="tags">Tags (comma separated)</Label>
                          <Input
                            id="tags"
                            value={postForm.tags}
                            onChange={(e) => setPostForm(prev => ({ ...prev, tags: e.target.value }))}
                            placeholder="tag1, tag2, tag3"
                          />
                        </div>

                        {postForm.status === 'scheduled' && (
                          <div>
                            <Label htmlFor="publish_date">Publish Date</Label>
                            <Input
                              id="publish_date"
                              type="datetime-local"
                              value={postForm.publish_date}
                              onChange={(e) => setPostForm(prev => ({ ...prev, publish_date: e.target.value }))}
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
                            onChange={(e) => setPostForm(prev => ({ ...prev, meta_title: e.target.value }))}
                            placeholder="SEO optimized title..."
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {postForm.meta_title.length}/60 characters
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="meta_description">Meta Description</Label>
                          <Textarea
                            id="meta_description"
                            value={postForm.meta_description}
                            onChange={(e) => setPostForm(prev => ({ ...prev, meta_description: e.target.value }))}
                            placeholder="SEO description..."
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {postForm.meta_description.length}/160 characters
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="keywords">Keywords (comma separated)</Label>
                          <Input
                            id="keywords"
                            value={postForm.keywords}
                            onChange={(e) => setPostForm(prev => ({ ...prev, keywords: e.target.value }))}
                            placeholder="keyword1, keyword2, keyword3"
                          />
                        </div>

                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span>SEO Score:</span>
                            <span className={getSEOScoreColor(calculateSEOScore(postForm))}>
                              {calculateSEOScore(postForm)}%
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Featured Image */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Featured Image</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div>
                          <Label htmlFor="featured_image">Image URL</Label>
                          <Input
                            id="featured_image"
                            value={postForm.featured_image}
                            onChange={(e) => setPostForm(prev => ({ ...prev, featured_image: e.target.value }))}
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
                  Generate SEO-optimized articles using AI templates and local market insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="template">Article Template</Label>
                      <Select value={aiGenerationForm.template_id} onValueChange={(value) => 
                        setAiGenerationForm(prev => ({ ...prev, template_id: value }))
                      }>
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
                          {templates.find(t => t.id === aiGenerationForm.template_id)?.description}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="topic">Article Topic</Label>
                      <Input
                        id="topic"
                        value={aiGenerationForm.topic}
                        onChange={(e) => setAiGenerationForm(prev => ({ ...prev, topic: e.target.value }))}
                        placeholder="e.g., Best Handmade Jewelry Gifts"
                      />
                    </div>

                    <div>
                      <Label htmlFor="target_keyword">Target Keyword</Label>
                      <Input
                        id="target_keyword"
                        value={aiGenerationForm.target_keyword}
                        onChange={(e) => setAiGenerationForm(prev => ({ ...prev, target_keyword: e.target.value }))}
                        placeholder="e.g., handmade jewelry chicago"
                      />
                    </div>

                    <div>
                      <Label htmlFor="city_focus">City Focus</Label>
                      <Input
                        id="city_focus"
                        value={aiGenerationForm.city_focus}
                        onChange={(e) => setAiGenerationForm(prev => ({ ...prev, city_focus: e.target.value }))}
                        placeholder="e.g., Chicago"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="word_count">Target Word Count</Label>
                      <Select value={aiGenerationForm.word_count.toString()} onValueChange={(value) => 
                        setAiGenerationForm(prev => ({ ...prev, word_count: parseInt(value) }))
                      }>
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
                      <Select value={aiGenerationForm.tone} onValueChange={(value) => 
                        setAiGenerationForm(prev => ({ ...prev, tone: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                          <SelectItem value="conversational">Conversational</SelectItem>
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
                            onChange={(e) => setAiGenerationForm(prev => ({ 
                              ...prev, 
                              include_local_references: e.target.checked 
                            }))}
                          />
                          <span className="text-sm">Include local references</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={aiGenerationForm.include_faqs}
                            onChange={(e) => setAiGenerationForm(prev => ({ 
                              ...prev, 
                              include_faqs: e.target.checked 
                            }))}
                          />
                          <span className="text-sm">Include FAQ section</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={aiGenerationForm.include_call_to_action}
                            onChange={(e) => setAiGenerationForm(prev => ({ 
                              ...prev, 
                              include_call_to_action: e.target.checked 
                            }))}
                          />
                          <span className="text-sm">Include call-to-action</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="additional_context">Additional Context</Label>
                      <Textarea
                        id="additional_context"
                        value={aiGenerationForm.additional_context}
                        onChange={(e) => setAiGenerationForm(prev => ({ ...prev, additional_context: e.target.value }))}
                        placeholder="Any specific requirements or context for the article..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button 
                    onClick={generateAIArticle}
                    disabled={aiGenerating || !aiGenerationForm.template_id || !aiGenerationForm.topic}
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
                      <CardTitle className="text-sm">Template Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const template = templates.find(t => t.id === aiGenerationForm.template_id);
                        if (!template) return null;
                        
                        return (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">Template Type</Label>
                              <p className="capitalize">{template.type.replace('_', ' ')}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Target Word Count</Label>
                              <p>{template.target_word_count} words</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">SEO Focus Areas</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {template.seo_focus.map((focus) => (
                                  <Badge key={focus} variant="outline" className="text-xs">
                                    {focus}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Required Sections</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {template.required_sections.map((section) => (
                                  <Badge key={section} variant="outline" className="text-xs">
                                    {section}
                                  </Badge>
                                ))}
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

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Posts</p>
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
                        {posts.filter(p => p.status === 'published').length}
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
                      <p className="text-sm text-muted-foreground">Total Views</p>
                      <p className="text-2xl font-bold">
                        {posts.reduce((sum, p) => sum + p.view_count, 0).toLocaleString()}
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
                      <p className="text-sm text-muted-foreground">AI Generated</p>
                      <p className="text-2xl font-bold">
                        {posts.filter(p => p.ai_generated).length}
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
                    .filter(p => p.status === 'published')
                    .sort((a, b) => b.view_count - a.view_count)
                    .slice(0, 5)
                    .map((post) => (
                      <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium line-clamp-1">{post.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {post.category} • {new Date(post.publish_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{post.view_count.toLocaleString()} views</p>
                          <p className="text-sm text-muted-foreground">
                            SEO: <span className={getSEOScoreColor(post.seo_score)}>{post.seo_score}%</span>
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
  );
};
