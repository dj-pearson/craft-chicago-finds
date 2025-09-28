import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCityContext } from "@/hooks/useCityContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  X, 
  Loader2, 
  Image as ImageIcon,
  DollarSign,
  Package,
  MapPin,
  Truck
} from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CreateListingProps {
  onSuccess: () => void;
}

export const CreateListing = ({ onSuccess }: CreateListingProps) => {
  const { user } = useAuth();
  const { currentCity } = useCityContext();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category_id: "",
    inventory_count: "1",
    shipping_available: false,
    local_pickup_available: true,
    pickup_location: "",
    tags: ""
  });

  useEffect(() => {
    fetchCategories();
  }, [currentCity]);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 5 images
    const totalImages = imageFiles.length + files.length;
    if (totalImages > 5) {
      toast.error("You can upload a maximum of 5 images");
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`${file.name} is too large. Maximum size is 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setImageFiles(prev => [...prev, ...validFiles]);
      
      // Create previews
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (listingId: string): Promise<string[]> => {
    if (imageFiles.length === 0) return [];

    const uploadedPaths: string[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${listingId}/${Date.now()}-${i}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading image:', error);
        throw error;
      }

      uploadedPaths.push(data.path);
    }

    return uploadedPaths;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !currentCity) {
      toast.error("Authentication required");
      return;
    }

    if (!formData.title || !formData.price || !formData.category_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setLoading(true);

    try {
      // Create the listing first
      const { data: listing, error: listingError } = await supabase
        .from("listings")
        .insert({
          seller_id: user.id,
          city_id: currentCity.id,
          title: formData.title,
          description: formData.description || null,
          price: price,
          category_id: formData.category_id,
          inventory_count: parseInt(formData.inventory_count),
          shipping_available: formData.shipping_available,
          local_pickup_available: formData.local_pickup_available,
          pickup_location: formData.pickup_location || null,
          tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
          status: "draft" // Start as draft
        })
        .select()
        .single();

      if (listingError) {
        console.error("Error creating listing:", listingError);
        toast.error("Failed to create listing");
        return;
      }

      // Upload images if any
      let imagePaths: string[] = [];
      if (imageFiles.length > 0) {
        try {
          imagePaths = await uploadImages(listing.id);
          
          // Update listing with image paths
          const { error: updateError } = await supabase
            .from("listings")
            .update({ images: imagePaths })
            .eq("id", listing.id);

          if (updateError) {
            console.error("Error updating listing with images:", updateError);
            toast.error("Listing created but failed to upload images");
          }
        } catch (imageError) {
          console.error("Error uploading images:", imageError);
          toast.error("Listing created but failed to upload images");
        }
      }

      toast.success("Listing created successfully!");
      onSuccess();
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        price: "",
        category_id: "",
        inventory_count: "1",
        shipping_available: false,
        local_pickup_available: true,
        pickup_location: "",
        tags: ""
      });
      setImageFiles([]);
      setImagePreviews([]);

    } catch (error) {
      console.error("Error creating listing:", error);
      toast.error("Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Create New Listing</h2>
        <p className="text-muted-foreground">
          Add a new product to your {currentCity?.name} marketplace
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
          <CardDescription>
            Provide details about your handmade product
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Product Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Handwoven Ceramic Mug"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="25.00"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your product, materials used, dimensions, etc."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                  required
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
                <Label htmlFor="inventory">Inventory Count</Label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="inventory"
                    type="number"
                    min="1"
                    value={formData.inventory_count}
                    onChange={(e) => setFormData(prev => ({ ...prev, inventory_count: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Fulfillment Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Fulfillment Options</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="local_pickup"
                    checked={formData.local_pickup_available}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, local_pickup_available: checked }))}
                  />
                  <Label htmlFor="local_pickup" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Local pickup available
                  </Label>
                </div>

                {formData.local_pickup_available && (
                  <div className="ml-6 space-y-2">
                    <Label htmlFor="pickup_location">Pickup Location</Label>
                    <Input
                      id="pickup_location"
                      value={formData.pickup_location}
                      onChange={(e) => setFormData(prev => ({ ...prev, pickup_location: e.target.value }))}
                      placeholder="e.g., Lincoln Park, Downtown Chicago"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="shipping"
                    checked={formData.shipping_available}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, shipping_available: checked }))}
                  />
                  <Label htmlFor="shipping" className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Shipping available
                  </Label>
                </div>
              </div>
            </div>

            {/* Images Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Product Images</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                    <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {index === 0 && (
                      <Badge className="absolute bottom-1 left-1 text-xs">Main</Badge>
                    )}
                  </div>
                ))}
                
                {imagePreviews.length < 5 && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground text-center">
                      Add Image
                      <br />
                      ({imagePreviews.length}/5)
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground">
                Upload up to 5 images. Maximum 5MB per image. Supported formats: JPG, PNG, WebP
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="handmade, ceramic, kitchen, gift (comma separated)"
              />
              <p className="text-xs text-muted-foreground">
                Add tags to help buyers find your product
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Listing
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};