import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Hash,
  Users,
  TrendingUp,
  RefreshCw,
  Webhook,
  Settings,
  Zap,
  Globe,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SocialMediaCampaign {
  id: string;
  city_id: string;
  name: string;
  description?: string;
  campaign_type: string;
  start_date: string;
  end_date?: string;
  status: string;
  target_audience?: string;
  goals?: string;
  hashtags?: string[];
  created_at: string;
  updated_at: string;
}

interface SocialMediaPost {
  id: string;
  campaign_id?: string;
  city_id: string;
  platform: string;
  post_type: string;
  title?: string;
  content: string;
  hashtags?: string[];
  media_urls?: string[];
  scheduled_for?: string;
  posted_at?: string;
  status: string;
  ai_generated: boolean;
  ai_prompt?: string;
  created_at: string;
}

interface City {
  id: string;
  name: string;
  slug: string;
}

export const SocialMediaManager = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<SocialMediaCampaign[]>([]);
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [activeTab, setActiveTab] = useState("campaigns");
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [generating30DayCampaign, setGenerating30DayCampaign] = useState(false);
  const [webhookSettings, setWebhookSettings] = useState<any[]>([]);
  const [isWebhookConfigOpen, setIsWebhookConfigOpen] = useState(false);

  const [campaignForm, setCampaignForm] = useState({
    name: "",
    description: "",
    campaign_type: "launch",
    start_date: "",
    end_date: "",
    target_audience: "",
    goals: "",
    hashtags: "",
  });

  const [postForm, setPostForm] = useState({
    campaign_id: "",
    platform: "facebook",
    post_type: "text",
    title: "",
    content: "",
    hashtags: "",
    scheduled_for: "",
    ai_prompt: "",
  });

  const [webhookForm, setWebhookForm] = useState({
    name: "",
    webhook_url: "",
    secret_key: "",
    platforms: [] as string[],
  });

  const [campaignGenForm, setCampaignGenForm] = useState({
    campaign_id: "",
    launch_date: "",
    webhook_settings_id: "",
    auto_schedule: false,
  });

  useEffect(() => {
    fetchData();
  }, [selectedCity]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch cities
      const { data: citiesData, error: citiesError } = await supabase
        .from("cities")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name");

      if (citiesError) throw citiesError;
      setCities(citiesData || []);

      // Set default city if none selected
      if (!selectedCity && citiesData && citiesData.length > 0) {
        setSelectedCity(citiesData[0].id);
        return;
      }

      if (!selectedCity) return;

      // Fetch campaigns for selected city
      const { data: campaignsData, error: campaignsError } = await supabase
        .from("social_media_campaigns")
        .select("*")
        .eq("city_id", selectedCity)
        .order("created_at", { ascending: false });

      if (campaignsError) throw campaignsError;
      setCampaigns(campaignsData || []);

      // Fetch posts for selected city
      const { data: postsData, error: postsError } = await supabase
        .from("social_media_posts")
        .select("*")
        .eq("city_id", selectedCity)
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;
      setPosts(postsData || []);

      // Fetch webhook settings
      const { data: webhookData, error: webhookError } = await supabase
        .from("webhook_settings")
        .select("*")
        .order("created_at", { ascending: false });

      if (webhookError) throw webhookError;
      setWebhookSettings(webhookData || []);
    } catch (error) {
      console.error("Error fetching social media data:", error);
      toast({
        title: "Error",
        description: "Failed to load social media data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!selectedCity) return;

    try {
      const hashtags = campaignForm.hashtags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const { error } = await supabase.from("social_media_campaigns").insert({
        city_id: selectedCity,
        name: campaignForm.name,
        description: campaignForm.description || null,
        campaign_type: campaignForm.campaign_type,
        start_date: campaignForm.start_date,
        end_date: campaignForm.end_date || null,
        target_audience: campaignForm.target_audience || null,
        goals: campaignForm.goals || null,
        hashtags,
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Campaign created successfully",
      });

      setIsCreateCampaignOpen(false);
      resetCampaignForm();
      fetchData();
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    }
  };

  const handleCreatePost = async () => {
    if (!selectedCity) return;

    try {
      const hashtags = postForm.hashtags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const { error } = await supabase.from("social_media_posts").insert({
        city_id: selectedCity,
        campaign_id: postForm.campaign_id || null,
        platform: postForm.platform,
        post_type: postForm.post_type,
        title: postForm.title || null,
        content: postForm.content,
        hashtags,
        scheduled_for: postForm.scheduled_for || null,
        ai_generated: !!postForm.ai_prompt,
        ai_prompt: postForm.ai_prompt || null,
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post created successfully",
      });

      setIsCreatePostOpen(false);
      resetPostForm();
      fetchData();
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    }
  };

  const handleGenerateContent = async () => {
    if (!postForm.ai_prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter an AI prompt",
        variant: "destructive",
      });
      return;
    }

    setGeneratingContent(true);
    try {
      const selectedCityData = cities.find((city) => city.id === selectedCity);
      const contextPrompt = `${postForm.ai_prompt}

Platform: ${postForm.platform}
Post Type: ${postForm.post_type}
City: ${selectedCityData?.name || "Chicago"}
Target: Local craft marketplace audience

Please generate engaging social media content that follows the 30-day social media plan guidelines for a local craft marketplace launch.`;

      const response = await supabase.functions.invoke("ai-generate-content", {
        body: {
          prompt: contextPrompt,
          generation_type: "social_post",
          context: {
            platform: postForm.platform,
            post_type: postForm.post_type,
            city: selectedCityData?.name,
            campaign_context: "social_media_launch",
          },
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "AI generation failed");
      }

      const result = response.data;
      setPostForm({
        ...postForm,
        content: result.content,
      });

      toast({
        title: "Content Generated",
        description: `Generated ${result.tokens_used} tokens of content`,
      });
    } catch (error) {
      console.error("Error generating content:", error);
      toast({
        title: "Error",
        description: "Failed to generate content",
        variant: "destructive",
      });
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleGenerate30DayCampaign = async () => {
    if (!selectedCity || !campaignGenForm.campaign_id || !campaignGenForm.launch_date) {
      toast({
        title: "Error",
        description: "Please select a campaign and launch date",
        variant: "destructive",
      });
      return;
    }

    setGenerating30DayCampaign(true);
    try {
      const response = await supabase.functions.invoke("generate-30day-campaign", {
        body: {
          campaign_id: campaignGenForm.campaign_id,
          city_id: selectedCity,
          launch_date: campaignGenForm.launch_date,
          webhook_settings_id: campaignGenForm.webhook_settings_id || null,
          auto_schedule: campaignGenForm.auto_schedule,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Campaign generation failed");
      }

      toast({
        title: "Campaign Generated!",
        description: `Successfully generated ${response.data.posts_generated} posts for the 30-day campaign`,
      });

      fetchData(); // Refresh the posts list
    } catch (error) {
      console.error("Error generating 30-day campaign:", error);
      toast({
        title: "Error",
        description: "Failed to generate 30-day campaign",
        variant: "destructive",
      });
    } finally {
      setGenerating30DayCampaign(false);
    }
  };

  const handleCreateWebhook = async () => {
    if (!webhookForm.name || !webhookForm.webhook_url) {
      toast({
        title: "Error",
        description: "Please provide webhook name and URL",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("webhook_settings").insert({
        name: webhookForm.name,
        webhook_url: webhookForm.webhook_url,
        secret_key: webhookForm.secret_key || null,
        platforms: webhookForm.platforms.length > 0 ? webhookForm.platforms : ["all"],
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Webhook configuration created successfully",
      });

      setIsWebhookConfigOpen(false);
      resetWebhookForm();
      fetchData();
    } catch (error) {
      console.error("Error creating webhook:", error);
      toast({
        title: "Error",
        description: "Failed to create webhook configuration",
        variant: "destructive",
      });
    }
  };

  const handleSendWebhook = async (postId: string) => {
    try {
      const response = await supabase.functions.invoke("send-social-webhook", {
        body: {
          post_id: postId,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Webhook sending failed");
      }

      toast({
        title: "Webhook Sent!",
        description: `Sent to ${response.data.successful_webhooks}/${response.data.webhooks_sent} webhooks`,
      });

      fetchData(); // Refresh to show webhook status
    } catch (error) {
      console.error("Error sending webhook:", error);
      toast({
        title: "Error",
        description: "Failed to send webhook",
        variant: "destructive",
      });
    }
  };

  const resetCampaignForm = () => {
    setCampaignForm({
      name: "",
      description: "",
      campaign_type: "launch",
      start_date: "",
      end_date: "",
      target_audience: "",
      goals: "",
      hashtags: "",
    });
  };

  const resetPostForm = () => {
    setPostForm({
      campaign_id: "",
      platform: "facebook",
      post_type: "text",
      title: "",
      content: "",
      hashtags: "",
      scheduled_for: "",
      ai_prompt: "",
    });
  };

  const resetWebhookForm = () => {
    setWebhookForm({
      name: "",
      webhook_url: "",
      secret_key: "",
      platforms: [],
    });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "facebook":
        return <Facebook className="h-4 w-4" />;
      case "instagram":
        return <Instagram className="h-4 w-4" />;
      case "twitter":
        return <Twitter className="h-4 w-4" />;
      case "linkedin":
        return <Linkedin className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "posted":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Loading social media data...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Social Media Management
          </h2>
          <p className="text-muted-foreground">
            Manage campaigns and posts for your marketplace launch
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="campaigns" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="posts" className="gap-2">
            <Send className="h-4 w-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="automation" className="gap-2">
            <Zap className="h-4 w-4" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-end">
            <Dialog
              open={isCreateCampaignOpen}
              onOpenChange={setIsCreateCampaignOpen}
            >
              <DialogTrigger asChild>
                <Button onClick={resetCampaignForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Social Media Campaign</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="campaign_name">Campaign Name</Label>
                    <Input
                      id="campaign_name"
                      value={campaignForm.name}
                      onChange={(e) =>
                        setCampaignForm({
                          ...campaignForm,
                          name: e.target.value,
                        })
                      }
                      placeholder="e.g., Chicago Launch Countdown"
                    />
                  </div>

                  <div>
                    <Label htmlFor="campaign_description">Description</Label>
                    <Textarea
                      id="campaign_description"
                      value={campaignForm.description}
                      onChange={(e) =>
                        setCampaignForm({
                          ...campaignForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Campaign description..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="campaign_type">Campaign Type</Label>
                      <Select
                        value={campaignForm.campaign_type}
                        onValueChange={(value) =>
                          setCampaignForm({
                            ...campaignForm,
                            campaign_type: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="launch">Launch</SelectItem>
                          <SelectItem value="seasonal">Seasonal</SelectItem>
                          <SelectItem value="promotional">
                            Promotional
                          </SelectItem>
                          <SelectItem value="engagement">Engagement</SelectItem>
                          <SelectItem value="countdown">Countdown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="target_audience">Target Audience</Label>
                      <Input
                        id="target_audience"
                        value={campaignForm.target_audience}
                        onChange={(e) =>
                          setCampaignForm({
                            ...campaignForm,
                            target_audience: e.target.value,
                          })
                        }
                        placeholder="e.g., Local makers, Craft shoppers"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={campaignForm.start_date}
                        onChange={(e) =>
                          setCampaignForm({
                            ...campaignForm,
                            start_date: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">End Date (Optional)</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={campaignForm.end_date}
                        onChange={(e) =>
                          setCampaignForm({
                            ...campaignForm,
                            end_date: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="hashtags">Hashtags (comma-separated)</Label>
                    <Input
                      id="hashtags"
                      value={campaignForm.hashtags}
                      onChange={(e) =>
                        setCampaignForm({
                          ...campaignForm,
                          hashtags: e.target.value,
                        })
                      }
                      placeholder="#CraftLocal, #ChicagoMakers, #ShopLocal"
                    />
                  </div>

                  <div>
                    <Label htmlFor="goals">Campaign Goals</Label>
                    <Textarea
                      id="goals"
                      value={campaignForm.goals}
                      onChange={(e) =>
                        setCampaignForm({
                          ...campaignForm,
                          goals: e.target.value,
                        })
                      }
                      placeholder="Campaign objectives and goals..."
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateCampaignOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateCampaign}>
                      Create Campaign
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {campaign.name}
                        </h3>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                        <Badge variant="outline">
                          {campaign.campaign_type}
                        </Badge>
                      </div>
                      {campaign.description && (
                        <p className="text-muted-foreground mb-3">
                          {campaign.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          Start:{" "}
                          {new Date(campaign.start_date).toLocaleDateString()}
                        </span>
                        {campaign.end_date && (
                          <span>
                            End:{" "}
                            {new Date(campaign.end_date).toLocaleDateString()}
                          </span>
                        )}
                        {campaign.hashtags && campaign.hashtags.length > 0 && (
                          <span>{campaign.hashtags.length} hashtags</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {campaigns.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No campaigns yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first social media campaign to get started.
                  </p>
                  <Button onClick={() => setIsCreateCampaignOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetPostForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Create Social Media Post</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="platform">Platform</Label>
                      <Select
                        value={postForm.platform}
                        onValueChange={(value) =>
                          setPostForm({ ...postForm, platform: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="twitter">Twitter/X</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="post_type">Post Type</Label>
                      <Select
                        value={postForm.post_type}
                        onValueChange={(value) =>
                          setPostForm({ ...postForm, post_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="carousel">Carousel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="campaign_select">Campaign (Optional)</Label>
                    <Select
                      value={postForm.campaign_id}
                      onValueChange={(value) =>
                        setPostForm({ ...postForm, campaign_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select campaign" />
                      </SelectTrigger>
                      <SelectContent>
                        {campaigns.map((campaign) => (
                          <SelectItem key={campaign.id} value={campaign.id}>
                            {campaign.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="ai_prompt">AI Content Prompt</Label>
                    <div className="flex gap-2">
                      <Textarea
                        id="ai_prompt"
                        value={postForm.ai_prompt}
                        onChange={(e) =>
                          setPostForm({
                            ...postForm,
                            ai_prompt: e.target.value,
                          })
                        }
                        placeholder="Describe the content you want AI to generate..."
                        rows={2}
                      />
                      <Button
                        onClick={handleGenerateContent}
                        disabled={generatingContent}
                        className="shrink-0"
                      >
                        {generatingContent ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={postForm.content}
                      onChange={(e) =>
                        setPostForm({ ...postForm, content: e.target.value })
                      }
                      placeholder="Post content..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hashtags_post">Hashtags</Label>
                      <Input
                        id="hashtags_post"
                        value={postForm.hashtags}
                        onChange={(e) =>
                          setPostForm({ ...postForm, hashtags: e.target.value })
                        }
                        placeholder="#CraftLocal, #ChicagoMakers"
                      />
                    </div>
                    <div>
                      <Label htmlFor="scheduled_for">
                        Schedule For (Optional)
                      </Label>
                      <Input
                        id="scheduled_for"
                        type="datetime-local"
                        value={postForm.scheduled_for}
                        onChange={(e) =>
                          setPostForm({
                            ...postForm,
                            scheduled_for: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreatePostOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePost}>Create Post</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getPlatformIcon(post.platform)}
                        <Badge className={getStatusColor(post.status)}>
                          {post.status}
                        </Badge>
                        <Badge variant="outline">{post.post_type}</Badge>
                        {post.ai_generated && (
                          <Badge variant="secondary">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI Generated
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm mb-3 line-clamp-3">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Platform: {post.platform}</span>
                        {post.scheduled_for && (
                          <span>
                            Scheduled:{" "}
                            {new Date(post.scheduled_for).toLocaleString()}
                          </span>
                        )}
                        {post.hashtags && post.hashtags.length > 0 && (
                          <span>{post.hashtags.length} hashtags</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendWebhook(post.id)}
                        disabled={!!post.webhook_sent_at}
                      >
                        <Globe className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {posts.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first social media post to get started.
                  </p>
                  <Button onClick={() => setIsCreatePostOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Post
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                30-Day Campaign Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="campaign_select_gen">Select Campaign</Label>
                  <Select
                    value={campaignGenForm.campaign_id}
                    onValueChange={(value) =>
                      setCampaignGenForm({ ...campaignGenForm, campaign_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="launch_date">Launch Date</Label>
                  <Input
                    id="launch_date"
                    type="date"
                    value={campaignGenForm.launch_date}
                    onChange={(e) =>
                      setCampaignGenForm({
                        ...campaignGenForm,
                        launch_date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="webhook_select">Webhook (Optional)</Label>
                <Select
                  value={campaignGenForm.webhook_settings_id}
                  onValueChange={(value) =>
                    setCampaignGenForm({ ...campaignGenForm, webhook_settings_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select webhook" />
                  </SelectTrigger>
                  <SelectContent>
                    {webhookSettings.map((webhook) => (
                      <SelectItem key={webhook.id} value={webhook.id}>
                        {webhook.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="auto_schedule"
                  checked={campaignGenForm.auto_schedule}
                  onChange={(e) =>
                    setCampaignGenForm({
                      ...campaignGenForm,
                      auto_schedule: e.target.checked,
                    })
                  }
                />
                <Label htmlFor="auto_schedule">Auto-schedule posts (9 AM daily)</Label>
              </div>

              <Button
                onClick={handleGenerate30DayCampaign}
                disabled={generating30DayCampaign}
                className="w-full"
              >
                {generating30DayCampaign ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate 30-Day Campaign
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isWebhookConfigOpen} onOpenChange={setIsWebhookConfigOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetWebhookForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Webhook
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configure Webhook</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="webhook_name">Webhook Name</Label>
                    <Input
                      id="webhook_name"
                      value={webhookForm.name}
                      onChange={(e) =>
                        setWebhookForm({ ...webhookForm, name: e.target.value })
                      }
                      placeholder="e.g., Zapier Integration"
                    />
                  </div>

                  <div>
                    <Label htmlFor="webhook_url">Webhook URL</Label>
                    <Input
                      id="webhook_url"
                      value={webhookForm.webhook_url}
                      onChange={(e) =>
                        setWebhookForm({ ...webhookForm, webhook_url: e.target.value })
                      }
                      placeholder="https://hooks.zapier.com/..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="secret_key">Secret Key (Optional)</Label>
                    <Input
                      id="secret_key"
                      value={webhookForm.secret_key}
                      onChange={(e) =>
                        setWebhookForm({ ...webhookForm, secret_key: e.target.value })
                      }
                      placeholder="For webhook verification"
                    />
                  </div>

                  <div>
                    <Label>Supported Platforms</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {["facebook", "instagram", "twitter", "linkedin", "all"].map((platform) => (
                        <label key={platform} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={webhookForm.platforms.includes(platform)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setWebhookForm({
                                  ...webhookForm,
                                  platforms: [...webhookForm.platforms, platform],
                                });
                              } else {
                                setWebhookForm({
                                  ...webhookForm,
                                  platforms: webhookForm.platforms.filter((p) => p !== platform),
                                });
                              }
                            }}
                          />
                          <span className="capitalize">{platform}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsWebhookConfigOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateWebhook}>Create Webhook</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {webhookSettings.map((webhook) => (
              <Card key={webhook.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{webhook.name}</h3>
                        <Badge className={webhook.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {webhook.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {webhook.webhook_url}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Platforms: {webhook.platforms?.join(", ") || "All"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {webhookSettings.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No webhooks configured</h3>
                  <p className="text-muted-foreground mb-4">
                    Add a webhook to automatically send posts to external services.
                  </p>
                  <Button onClick={() => setIsWebhookConfigOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Webhook
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
