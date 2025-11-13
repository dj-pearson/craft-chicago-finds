import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, MapPin, Calendar, Settings, Loader2, Sparkles } from "lucide-react";
import { CityReplicationWizard } from "./CityReplicationWizard";

interface City {
  id: string;
  name: string;
  slug: string;
  state: string;
  description: string | null;
  is_active: boolean;
  launch_date: string | null;
  hero_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export const CityManager = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    state: "",
    description: "",
    is_active: false,
    launch_date: "",
    hero_image_url: ""
  });

  const fetchCities = async () => {
    try {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching cities:", error);
        toast.error("Failed to fetch cities");
        return;
      }

      setCities(data || []);
    } catch (error) {
      console.error("Error fetching cities:", error);
      toast.error("Failed to fetch cities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      state: "",
      description: "",
      is_active: false,
      launch_date: "",
      hero_image_url: ""
    });
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleCreateCity = async () => {
    if (!formData.name || !formData.state) {
      toast.error("Name and state are required");
      return;
    }

    setSubmitting(true);
    try {
      // Call edge function to create city with all setup
      const { error } = await supabase.functions.invoke('setup-city', {
        body: {
          action: 'create',
          cityData: formData
        }
      });

      if (error) {
        console.error("Error creating city:", error);
        toast.error("Failed to create city");
        return;
      }

      toast.success("City created successfully!");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchCities();
    } catch (error) {
      console.error("Error creating city:", error);
      toast.error("Failed to create city");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCity = async () => {
    if (!editingCity || !formData.name || !formData.state) {
      toast.error("Name and state are required");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("cities")
        .update(formData)
        .eq("id", editingCity.id);

      if (error) {
        console.error("Error updating city:", error);
        toast.error("Failed to update city");
        return;
      }

      toast.success("City updated successfully!");
      setIsEditDialogOpen(false);
      setEditingCity(null);
      resetForm();
      fetchCities();
    } catch (error) {
      console.error("Error updating city:", error);
      toast.error("Failed to update city");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (city: City) => {
    setEditingCity(city);
    setFormData({
      name: city.name,
      slug: city.slug,
      state: city.state,
      description: city.description || "",
      is_active: city.is_active,
      launch_date: city.launch_date || "",
      hero_image_url: city.hero_image_url || ""
    });
    setIsEditDialogOpen(true);
  };

  const setupCityInfrastructure = async (cityId: string) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('setup-city', {
        body: {
          action: 'setup-infrastructure',
          cityId
        }
      });

      if (error) {
        console.error("Error setting up city infrastructure:", error);
        toast.error("Failed to setup city infrastructure");
        return;
      }

      toast.success("City infrastructure setup complete!");
      fetchCities();
    } catch (error) {
      console.error("Error setting up city infrastructure:", error);
      toast.error("Failed to setup city infrastructure");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading cities...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">City Management</h2>
          <p className="text-muted-foreground">Manage marketplace cities and launch new locations</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Quick Add
          </Button>
          <Button className="gap-2" onClick={() => setIsWizardOpen(true)}>
            <Sparkles className="h-4 w-4" />
            Launch New City
          </Button>
        </div>
      </div>

      {/* City Replication Wizard */}
      <CityReplicationWizard 
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onSuccess={fetchCities}
      />

      {/* Quick Add Dialog (original simple form) */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Add City</DialogTitle>
            <DialogDescription>
              Create a new city quickly. Use "Launch New City" for full template replication.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">City Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Milwaukee"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="milwaukee"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="Wisconsin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the city's maker community..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="launch_date">Launch Date</Label>
                <Input
                  id="launch_date"
                  type="date"
                  value={formData.launch_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, launch_date: e.target.value }))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Launch immediately</Label>
              </div>
              <Button 
                onClick={handleCreateCity} 
                className="w-full" 
                disabled={submitting}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create City
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cities.map((city) => (
          <Card key={city.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle>{city.name}</CardTitle>
                </div>
                <Badge variant={city.is_active ? "default" : "secondary"}>
                  {city.is_active ? "Active" : "Coming Soon"}
                </Badge>
              </div>
              <CardDescription>
                {city.state} • /{city.slug}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {city.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {city.description}
                </p>
              )}
              
              {city.launch_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Launch: {new Date(city.launch_date).toLocaleDateString()}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(city)}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                {!city.is_active && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setupCityInfrastructure(city.id)}
                    disabled={submitting}
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Setup
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit City</DialogTitle>
            <DialogDescription>
              Update city information and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">City Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-state">State</Label>
              <Input
                id="edit-state"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-launch_date">Launch Date</Label>
              <Input
                id="edit-launch_date"
                type="date"
                value={formData.launch_date}
                onChange={(e) => setFormData(prev => ({ ...prev, launch_date: e.target.value }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="edit-is_active">City is active</Label>
            </div>
            <Button 
              onClick={handleEditCity} 
              className="w-full" 
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update City
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};