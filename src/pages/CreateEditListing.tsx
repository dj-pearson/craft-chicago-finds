import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCityContext } from "@/hooks/useCityContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Upload,
  X,
  Save,
  Eye,
  Loader2,
  ImageIcon,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { AIPhotoHelper } from "@/components/seller/AIPhotoHelper";
import { AIListingHelper } from "@/components/seller/AIListingHelper";
import { PriceCoach } from "@/components/seller/PriceCoach";
import { ListingTemplatesLibrary } from "@/components/seller/ListingTemplatesLibrary";
import { useContentModeration } from "@/hooks/useContentModeration";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ListingFormData {
  title: string;
  description: string;
  price: string;
  category_id: string;
  inventory_count: string;
  shipping_available: boolean;
  local_pickup_available: boolean;
  pickup_location: string;
  tags: string;
  status: 'draft' | 'active';
}

const CreateEditListing = () => {
  const { user, profile } = useAuth();
  const { currentCity } = useCityContext();
  const navigate = useNavigate();
  const { id: listingId } = useParams();
  const isEditing = !!listingId;
  const { moderateListing, moderating } = useContentModeration();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<ListingFormData>({
    title: "",
    description: "",
    price: "",
    category_id: "",
    inventory_count: "1",
    shipping_available: false,
    local_pickup_available: true,
    pickup_location: "",
    tags: "",
    status: "draft"
  });

  useEffect(() => {
    if (!user || !profile?.is_seller) {
      navigate("/auth");
      return;
    }

    // Check Stripe connection for new listings (editing existing is allowed)
    if (!isEditing && !(profile as any)?.stripe_account_id) {
      toast.error("Please connect your Stripe account before creating listings");
      navigate("/dashboard");
      return;
    }

    fetchCategories();

    if (isEditing) {
      fetchListing();
    }
  }, [user, profile, isEditing, listingId]);

  const fetchCategories = async () => {
    if (!currentCity) return;

    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("city_id", currentCity.id)
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error("Error fetching categories:", error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchListing = async () => {
    if (!listingId || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", listingId)
        .eq("seller_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching listing:", error);
        toast.error("Failed to fetch listing");
        navigate("/dashboard");
        return;
      }

      setFormData({
        title: data.title || "",
        description: data.description || "",
        price: data.price?.toString() || "",
        category_id: data.category_id || "",
        inventory_count: data.inventory_count?.toString() || "1",
        shipping_available: data.shipping_available || false,
        local_pickup_available: data.local_pickup_available || true,
        pickup_location: data.pickup_location || "",
        tags: data.tags?.join(", ") || "",
        status: (data.status as 'draft' | 'active') || "draft"
      });

      setImages(data.images || []);
    } catch (error) {
      console.error("Error fetching listing:", error);
      toast.error("Failed to fetch listing");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (files: FileList) => {
    if (!user || files.length === 0) return;

    setUploadingImages(true);
    const newImages: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          toast.error(`${file.name} is too large. Maximum size is 5MB`);
          continue;
        }

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (error) {
          console.error("Error uploading image:", error);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(data.path);

        newImages.push(publicUrl);
      }

      setImages(prev => [...prev, ...newImages]);
      toast.success(`Uploaded ${newImages.length} image(s)`);
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = async (imageUrl: string, index: number) => {
    try {
      // Extract file path from URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const filePath = `${user?.id}/${fileName}`;

      // Delete from storage
      const { error } = await supabase.storage
        .from('product-images')
        .remove([filePath]);

      if (error) {
        console.error("Error deleting image from storage:", error);
      }

      // Remove from state
      setImages(prev => prev.filter((_, i) => i !== index));
      toast.success("Image removed");
    } catch (error) {
      console.error("Error removing image:", error);
      toast.error("Failed to remove image");
    }
  };

  const handleTemplateSelect = (template: any) => {
    setFormData(prev => ({
      ...prev,
      title: template.title,
      description: template.description,
      price: template.price_range.min.toString(),
      tags: template.tags.join(', '),
      inventory_count: template.suggested_inventory.toString(),
      pickup_location: template.pickup_location_hint,
    }));

    // Scroll to top of form to see changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!user || !currentCity) return;

    // Validation
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Valid price is required");
      return;
    }

    if (!formData.category_id) {
      toast.error("Category is required");
      return;
    }

    if (images.length === 0) {
      toast.error("At least one image is required");
      return;
    }

    setLoading(true);
    try {
      const listingData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        category_id: formData.category_id,
        city_id: currentCity.id,
        seller_id: user.id,
        inventory_count: parseInt(formData.inventory_count) || 1,
        shipping_available: formData.shipping_available,
        local_pickup_available: formData.local_pickup_available,
        pickup_location: formData.pickup_location.trim() || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        images,
        status: formData.status
      };

      if (isEditing) {
        const { error } = await supabase
          .from("listings")
          .update(listingData)
          .eq("id", listingId)
          .eq("seller_id", user.id);

        if (error) {
          console.error("Error updating listing:", error);
          toast.error("Failed to update listing");
          return;
        }

        toast.success("Listing updated successfully!");
      } else {
        const { data: newListing, error } = await supabase
          .from("listings")
          .insert([listingData])
          .select()
          .single();

        if (error) {
          console.error("Error creating listing:", error);
          toast.error("Failed to create listing");
          return;
        }

        // Run content moderation for new listings
        const { approved, result } = await moderateListing(
          newListing.id,
          user.id,
          formData.title,
          formData.description,
          formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
        );

        if (!approved) {
          if (result.severity === 'high' && result.confidence >= 60) {
            toast.error("Listing rejected: " + result.reasons.join(', '));
          } else {
            toast.warning("Listing flagged for review: " + result.reasons.join(', '));
          }
        } else {
          toast.success("Listing created successfully!");
        }
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving listing:", error);
      toast.error("Failed to save listing");
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading listing...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Header */}
      <div className="border-b bg-muted/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {isEditing ? "Edit Listing" : "Create New Listing"}
              </h1>
              <p className="text-muted-foreground">
                {currentCity?.name} • Add your handmade products
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Quick Start Templates - Only show for new listings */}
          {!isEditing && (
            <Card className="mb-6 bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Quick Start with a Template
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Save time! Choose from 10+ professionally crafted listing templates for common products.
                    </CardDescription>
                  </div>
                  <ListingTemplatesLibrary onTemplateSelect={handleTemplateSelect} />
                </div>
              </CardHeader>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                  <CardDescription>Basic details about your product</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Product Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Handcrafted Wooden Bowl"
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your product, materials used, dimensions, etc."
                      rows={4}
                      maxLength={1000}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price ($) *</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="25.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="inventory">Inventory Count</Label>
                      <Input
                        id="inventory"
                        type="number"
                        min="0"
                        value={formData.inventory_count}
                        onChange={(e) => setFormData(prev => ({ ...prev, inventory_count: e.target.value }))}
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      value={formData.category_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (optional)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="handmade, wood, kitchen, gift"
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate tags with commas to help buyers find your product
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Images */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Images *</CardTitle>
                  <CardDescription>Add photos of your product (max 5MB each)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    <div className="text-center">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                        className="hidden"
                        id="image-upload"
                        disabled={uploadingImages}
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2">
                          {uploadingImages ? (
                            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                          ) : (
                            <Upload className="h-8 w-8 text-muted-foreground" />
                          )}
                          <p className="text-sm font-medium">
                            {uploadingImages ? "Uploading..." : "Click to upload images"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG up to 5MB each
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Image Preview */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Product ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeImage(image, index)}
                            className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          {index === 0 && (
                            <Badge className="absolute bottom-2 left-2 text-xs">
                              Main
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Fulfillment */}
              <Card>
                <CardHeader>
                  <CardTitle>Fulfillment Options</CardTitle>
                  <CardDescription>How customers can receive their orders</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="local-pickup">Local Pickup</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow customers to pick up locally
                      </p>
                    </div>
                    <Switch
                      id="local-pickup"
                      checked={formData.local_pickup_available}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, local_pickup_available: checked }))
                      }
                    />
                  </div>

                  {formData.local_pickup_available && (
                    <div className="space-y-2">
                      <Label htmlFor="pickup-location">Pickup Location</Label>
                      <Input
                        id="pickup-location"
                        value={formData.pickup_location}
                        onChange={(e) => setFormData(prev => ({ ...prev, pickup_location: e.target.value }))}
                        placeholder="e.g., Logan Square, Near Blue Line"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="shipping">Shipping Available</Label>
                      <p className="text-sm text-muted-foreground">
                        Offer shipping to customers
                      </p>
                    </div>
                    <Switch
                      id="shipping"
                      checked={formData.shipping_available}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, shipping_available: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Publishing</CardTitle>
                  <CardDescription>Control your listing visibility</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value: 'draft' | 'active') => 
                        setFormData(prev => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft (not visible)</SelectItem>
                        <SelectItem value="active">Active (visible to buyers)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={handleSubmit}
                      disabled={loading || moderating}
                      className="w-full gap-2"
                    >
                      {(loading || moderating) && <Loader2 className="h-4 w-4 animate-spin" />}
                      {!loading && !moderating && <Save className="h-4 w-4" />}
                      {moderating ? "Checking..." : isEditing ? "Update Listing" : "Create Listing"}
                    </Button>

                    {formData.status === 'active' && (
                      <Button variant="outline" className="w-full gap-2">
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* AI Listing Helper */}
              <AIListingHelper
                imageUrl={images[0]}
                category={categories.find(c => c.id === formData.category_id)?.name}
                currentTitle={formData.title}
                currentDescription={formData.description}
                currentTags={formData.tags}
                onContentGenerated={(content) => {
                  if (content.title) {
                    setFormData(prev => ({ ...prev, title: content.title! }));
                  }
                  if (content.description) {
                    setFormData(prev => ({ ...prev, description: content.description! }));
                  }
                  if (content.tags) {
                    setFormData(prev => ({ ...prev, tags: content.tags!.join(', ') }));
                  }
                }}
                className="mb-6"
              />

              {/* AI Photo Helper - Show only if there are images */}
              {images.length > 0 && (
                <AIPhotoHelper
                  imageUrl={images[0]}
                  onImageProcessed={(newImageUrl) => {
                    setImages(prev => [newImageUrl, ...prev.slice(1)]);
                  }}
                  className="mb-6"
                />
              )}

              {/* Price Coach */}
              <PriceCoach
                category={formData.category_id}
                currentPrice={formData.price ? parseFloat(formData.price) : undefined}
                productTitle={formData.title}
                productTags={formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []}
                className="mb-6"
              />

              {/* Tips */}
              <Card>
                <CardHeader>
                  <CardTitle>Listing Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <ImageIcon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p>Use high-quality, well-lit photos showing different angles</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Eye className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p>Write detailed descriptions including materials and dimensions</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Eye className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p>Price competitively by researching similar products</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CreateEditListing;