import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Home,
  Tag,
  Calendar,
  Save,
  X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FeaturedSlot {
  id: string;
  city_id: string;
  slot_type: "hero" | "featured_category" | "featured_listing" | "seasonal";
  title: string;
  description?: string;
  image_url?: string;
  action_url?: string;
  action_text?: string;
  listing_id?: string;
  category_id?: string;
  sort_order: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

interface City {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  images?: string[];
}

export const ContentManager = () => {
  const [featuredSlots, setFeaturedSlots] = useState<FeaturedSlot[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<FeaturedSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<{
    slot_type: "hero" | "featured_category" | "featured_listing" | "seasonal";
    title: string;
    description: string;
    image_url: string;
    action_url: string;
    action_text: string;
    listing_id: string;
    category_id: string;
    sort_order: number;
    is_active: boolean;
    start_date: string;
    end_date: string;
  }>({
    slot_type: "featured_listing",
    title: "",
    description: "",
    image_url: "",
    action_url: "",
    action_text: "",
    listing_id: "",
    category_id: "",
    sort_order: 1,
    is_active: true,
    start_date: "",
    end_date: "",
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
        return; // Will trigger useEffect again with selectedCity
      }

      if (!selectedCity) return;

      // Fetch featured slots for selected city
      const { data: slotsData, error: slotsError } = await (supabase as any)
        .from("featured_slots")
        .select("*")
        .eq("city_id", selectedCity)
        .order("sort_order");

      if (slotsError) throw slotsError;
      setFeaturedSlots(slotsData || []);

      // Fetch categories for selected city
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("city_id", selectedCity)
        .eq("is_active", true)
        .order("name");

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch active listings for selected city
      const { data: listingsData, error: listingsError } = await supabase
        .from("listings")
        .select("id, title, price, images")
        .eq("city_id", selectedCity)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(50);

      if (listingsError) throw listingsError;
      setListings(listingsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load content data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async () => {
    if (!selectedCity) return;

    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from("featured_slots").insert({
        city_id: selectedCity,
        slot_type: formData.slot_type,
        title: formData.title,
        description: formData.description || null,
        image_url: formData.image_url || null,
        action_url: formData.action_url || null,
        action_text: formData.action_text || null,
        listing_id: formData.listing_id || null,
        category_id: formData.category_id || null,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Featured slot created successfully",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error creating slot:", error);
      toast({
        title: "Error",
        description: "Failed to create featured slot",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSlot = async () => {
    if (!editingSlot) return;

    setSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from("featured_slots")
        .update({
          slot_type: formData.slot_type,
          title: formData.title,
          description: formData.description || null,
          image_url: formData.image_url || null,
          action_url: formData.action_url || null,
          action_text: formData.action_text || null,
          listing_id: formData.listing_id || null,
          category_id: formData.category_id || null,
          sort_order: formData.sort_order,
          is_active: formData.is_active,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingSlot.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Featured slot updated successfully",
      });

      setEditingSlot(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error updating slot:", error);
      toast({
        title: "Error",
        description: "Failed to update featured slot",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Are you sure you want to delete this featured slot?")) return;

    try {
      const { error } = await (supabase as any)
        .from("featured_slots")
        .delete()
        .eq("id", slotId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Featured slot deleted successfully",
      });

      fetchData();
    } catch (error) {
      console.error("Error deleting slot:", error);
      toast({
        title: "Error",
        description: "Failed to delete featured slot",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (slotId: string, isActive: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from("featured_slots")
        .update({ is_active: !isActive })
        .eq("id", slotId);

      if (error) throw error;

      fetchData();
    } catch (error) {
      console.error("Error toggling slot status:", error);
      toast({
        title: "Error",
        description: "Failed to update slot status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      slot_type: "featured_listing",
      title: "",
      description: "",
      image_url: "",
      action_url: "",
      action_text: "",
      listing_id: "",
      category_id: "",
      sort_order: 1,
      is_active: true,
      start_date: "",
      end_date: "",
    });
  };

  const startEdit = (slot: FeaturedSlot) => {
    setEditingSlot(slot);
    setFormData({
      slot_type: slot.slot_type,
      title: slot.title,
      description: slot.description || "",
      image_url: slot.image_url || "",
      action_url: slot.action_url || "",
      action_text: slot.action_text || "",
      listing_id: slot.listing_id || "",
      category_id: slot.category_id || "",
      sort_order: slot.sort_order,
      is_active: slot.is_active,
      start_date: slot.start_date ? slot.start_date.split("T")[0] : "",
      end_date: slot.end_date ? slot.end_date.split("T")[0] : "",
    });
  };

  const getSlotTypeIcon = (type: string) => {
    switch (type) {
      case "hero":
        return <Home className="h-4 w-4" />;
      case "featured_category":
        return <Tag className="h-4 w-4" />;
      case "featured_listing":
        return <Star className="h-4 w-4" />;
      case "seasonal":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const getSlotTypeColor = (type: string) => {
    switch (type) {
      case "hero":
        return "bg-purple-100 text-purple-800";
      case "featured_category":
        return "bg-blue-100 text-blue-800";
      case "featured_listing":
        return "bg-yellow-100 text-yellow-800";
      case "seasonal":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading content...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content Management</h2>
          <p className="text-muted-foreground">
            Manage homepage content and featured slots
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
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Featured Slot
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Featured Slot</DialogTitle>
              </DialogHeader>
              <FeaturedSlotForm
                formData={formData}
                setFormData={setFormData}
                categories={categories}
                listings={listings}
                onSubmit={handleCreateSlot}
                onCancel={() => setIsCreateDialogOpen(false)}
                submitting={submitting}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {featuredSlots.map((slot) => (
          <Card key={slot.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={getSlotTypeColor(slot.slot_type)}>
                      {getSlotTypeIcon(slot.slot_type)}
                      <span className="ml-1 capitalize">
                        {slot.slot_type.replace("_", " ")}
                      </span>
                    </Badge>
                    <Badge variant={slot.is_active ? "default" : "secondary"}>
                      {slot.is_active ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Order: {slot.sort_order}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg">{slot.title}</h3>
                  {slot.description && (
                    <p className="text-muted-foreground mt-1">
                      {slot.description}
                    </p>
                  )}
                  {(slot.start_date || slot.end_date) && (
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {slot.start_date && (
                        <span>
                          Start:{" "}
                          {new Date(slot.start_date).toLocaleDateString()}
                        </span>
                      )}
                      {slot.end_date && (
                        <span>
                          End: {new Date(slot.end_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(slot.id, slot.is_active)}
                  >
                    {slot.is_active ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(slot)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSlot(slot.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {featuredSlots.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No featured slots</h3>
              <p className="text-muted-foreground mb-4">
                Create your first featured slot to showcase content on the
                homepage.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Featured Slot
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingSlot} onOpenChange={() => setEditingSlot(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Featured Slot</DialogTitle>
          </DialogHeader>
          <FeaturedSlotForm
            formData={formData}
            setFormData={setFormData}
            categories={categories}
            listings={listings}
            onSubmit={handleUpdateSlot}
            onCancel={() => setEditingSlot(null)}
            submitting={submitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface FeaturedSlotFormProps {
  formData: any;
  setFormData: (data: any) => void;
  categories: Category[];
  listings: Listing[];
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
}

const FeaturedSlotForm = ({
  formData,
  setFormData,
  categories,
  listings,
  onSubmit,
  onCancel,
  submitting,
}: FeaturedSlotFormProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="slot_type">Slot Type</Label>
          <Select
            value={formData.slot_type}
            onValueChange={(value) =>
              setFormData({ ...formData, slot_type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hero">Hero Banner</SelectItem>
              <SelectItem value="featured_category">
                Featured Category
              </SelectItem>
              <SelectItem value="featured_listing">Featured Listing</SelectItem>
              <SelectItem value="seasonal">Seasonal Content</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="sort_order">Sort Order</Label>
          <Input
            id="sort_order"
            type="number"
            value={formData.sort_order}
            onChange={(e) =>
              setFormData({
                ...formData,
                sort_order: parseInt(e.target.value) || 1,
              })
            }
            min="1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter title"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Enter description (optional)"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="image_url">Image URL</Label>
        <Input
          id="image_url"
          value={formData.image_url}
          onChange={(e) =>
            setFormData({ ...formData, image_url: e.target.value })
          }
          placeholder="Enter image URL (optional)"
        />
      </div>

      {formData.slot_type === "featured_listing" && (
        <div>
          <Label htmlFor="listing_id">Featured Listing</Label>
          <Select
            value={formData.listing_id}
            onValueChange={(value) =>
              setFormData({ ...formData, listing_id: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select listing" />
            </SelectTrigger>
            <SelectContent>
              {listings.map((listing) => (
                <SelectItem key={listing.id} value={listing.id}>
                  {listing.title} - ${listing.price}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {formData.slot_type === "featured_category" && (
        <div>
          <Label htmlFor="category_id">Featured Category</Label>
          <Select
            value={formData.category_id}
            onValueChange={(value) =>
              setFormData({ ...formData, category_id: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
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
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="action_url">Action URL</Label>
          <Input
            id="action_url"
            value={formData.action_url}
            onChange={(e) =>
              setFormData({ ...formData, action_url: e.target.value })
            }
            placeholder="Enter URL (optional)"
          />
        </div>
        <div>
          <Label htmlFor="action_text">Action Text</Label>
          <Input
            id="action_text"
            value={formData.action_text}
            onChange={(e) =>
              setFormData({ ...formData, action_text: e.target.value })
            }
            placeholder="e.g., Shop Now, Learn More"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_date">Start Date (optional)</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) =>
              setFormData({ ...formData, start_date: e.target.value })
            }
          />
        </div>
        <div>
          <Label htmlFor="end_date">End Date (optional)</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) =>
              setFormData({ ...formData, end_date: e.target.value })
            }
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, is_active: checked })
          }
        />
        <Label htmlFor="is_active">Active</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={submitting}>
          <Save className="h-4 w-4 mr-2" />
          {submitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};
