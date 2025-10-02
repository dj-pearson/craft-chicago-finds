import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Loader2, 
  Check, 
  Copy, 
  MapPin, 
  Calendar,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Grid3x3,
  Star,
  Image as ImageIcon
} from "lucide-react";

interface CityReplicationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface TemplateData {
  categories: Array<{ name: string; slug: string; description: string | null }>;
  featuredSlots: Array<{ slot_type: string; title: string; description: string | null }>;
}

export const CityReplicationWizard = ({ open, onOpenChange, onSuccess }: CityReplicationWizardProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [templateData, setTemplateData] = useState<TemplateData | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    state: "",
    description: "",
    is_active: false,
    launch_date: "",
    hero_image_url: "",
    replicate_from_chicago: true,
    include_categories: true,
    include_featured_slots: true,
  });

  // Load Chicago template data
  useEffect(() => {
    const loadTemplateData = async () => {
      if (!open) return;
      
      setLoading(true);
      try {
        const chicagoCity = await supabase
          .from("cities")
          .select("id")
          .eq("slug", "chicago")
          .single();

        if (chicagoCity.data) {
          const [categoriesRes, slotsRes] = await Promise.all([
            supabase
              .from("categories")
              .select("name, slug, description")
              .eq("city_id", chicagoCity.data.id)
              .order("sort_order"),
            supabase
              .from("featured_slots")
              .select("slot_type, title, description")
              .eq("city_id", chicagoCity.data.id)
              .eq("is_active", true)
              .order("sort_order")
          ]);

          setTemplateData({
            categories: categoriesRes.data || [],
            featuredSlots: slotsRes.data || [],
          });
        }
      } catch (error) {
        console.error("Error loading template data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplateData();
  }, [open]);

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      state: "",
      description: "",
      is_active: false,
      launch_date: "",
      hero_image_url: "",
      replicate_from_chicago: true,
      include_categories: true,
      include_featured_slots: true,
    });
    setStep(1);
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

  const handleSubmit = async () => {
    if (!formData.name || !formData.state) {
      toast.error("Name and state are required");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-city', {
        body: {
          action: 'replicate',
          cityData: {
            name: formData.name,
            slug: formData.slug,
            state: formData.state,
            description: formData.description,
            is_active: formData.is_active,
            launch_date: formData.launch_date || null,
            hero_image_url: formData.hero_image_url || null,
          },
          replicationOptions: {
            templateCitySlug: 'chicago',
            includeCategories: formData.include_categories,
            includeFeaturedSlots: formData.include_featured_slots,
          }
        }
      });

      if (error) {
        console.error("Error replicating city:", error);
        toast.error("Failed to create city");
        return;
      }

      toast.success(`${formData.name} marketplace created successfully! 🎉`);
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error replicating city:", error);
      toast.error("Failed to create city");
    } finally {
      setSubmitting(false);
    }
  };

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Launch New City Marketplace
          </DialogTitle>
          <DialogDescription>
            Step {step} of {totalSteps} - Replicate Chicago's setup to launch a new city
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading Chicago template...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      City Information
                    </CardTitle>
                    <CardDescription>
                      Enter the basic details for your new marketplace
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2 sm:col-span-1">
                        <Label htmlFor="name">City Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          placeholder="e.g., Milwaukee"
                        />
                      </div>
                      <div className="space-y-2 col-span-2 sm:col-span-1">
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                          placeholder="e.g., Wisconsin"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="slug">URL Slug</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">/</span>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                          placeholder="milwaukee"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Auto-generated from city name. This will be your marketplace URL.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the city's maker community and unique character..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="launch_date" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Launch Date
                      </Label>
                      <Input
                        id="launch_date"
                        type="date"
                        value={formData.launch_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, launch_date: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Optional: Set a future launch date for "coming soon" mode
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="space-y-0.5">
                        <Label htmlFor="is_active" className="text-base">
                          Launch Immediately
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Make marketplace active right away
                        </p>
                      </div>
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button onClick={() => setStep(2)} className="gap-2">
                    Next: Review Template
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Template Review */}
            {step === 2 && (
              <div className="space-y-4">
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Copy className="h-5 w-5" />
                      Chicago Template
                    </CardTitle>
                    <CardDescription>
                      Review what will be replicated from the Chicago marketplace
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Categories */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Grid3x3 className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold">Categories</h4>
                          <Badge variant="secondary">{templateData?.categories.length || 0}</Badge>
                        </div>
                        <Switch
                          checked={formData.include_categories}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, include_categories: checked }))}
                        />
                      </div>
                      {formData.include_categories && templateData?.categories && (
                        <div className="grid grid-cols-2 gap-2 pl-7">
                          {templateData.categories.map((cat, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <Check className="h-3 w-3 text-green-600" />
                              <span>{cat.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Featured Slots */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold">Featured Slots</h4>
                          <Badge variant="secondary">{templateData?.featuredSlots.length || 0}</Badge>
                        </div>
                        <Switch
                          checked={formData.include_featured_slots}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, include_featured_slots: checked }))}
                        />
                      </div>
                      {formData.include_featured_slots && templateData?.featuredSlots && (
                        <div className="space-y-2 pl-7">
                          {templateData.featuredSlots.length > 0 ? (
                            templateData.featuredSlots.map((slot, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm">
                                <Check className="h-3 w-3 text-green-600 mt-1" />
                                <div>
                                  <p className="font-medium">{slot.title}</p>
                                  <p className="text-muted-foreground text-xs">Type: {slot.slot_type}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No featured slots configured yet in Chicago</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        <strong>Note:</strong> Content will be duplicated as templates. You can customize categories, featured content, and other settings after launch from the admin dashboard.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} className="gap-2">
                    Next: Confirm
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <div className="space-y-4">
                <Card className="border-green-600">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      Ready to Launch
                    </CardTitle>
                    <CardDescription>
                      Review your settings before creating the marketplace
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">City Name:</span>
                        <span className="text-sm">{formData.name}, {formData.state}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">URL Slug:</span>
                        <Badge variant="outline">/{formData.slug}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Status:</span>
                        <Badge variant={formData.is_active ? "default" : "secondary"}>
                          {formData.is_active ? "Active" : "Coming Soon"}
                        </Badge>
                      </div>
                      {formData.launch_date && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Launch Date:</span>
                          <span className="text-sm">{new Date(formData.launch_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Will be created:</h4>
                      <ul className="space-y-1 pl-5">
                        <li className="text-sm flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-600" />
                          City marketplace page
                        </li>
                        {formData.include_categories && (
                          <li className="text-sm flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-600" />
                            {templateData?.categories.length || 0} product categories
                          </li>
                        )}
                        {formData.include_featured_slots && templateData?.featuredSlots && templateData.featuredSlots.length > 0 && (
                          <li className="text-sm flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-600" />
                            {templateData.featuredSlots.length} featured content slots
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900">
                      <p className="text-sm text-amber-900 dark:text-amber-100">
                        <strong>Ready to go!</strong> Your new marketplace will be fully set up and ready for sellers to join.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={submitting}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {submitting ? "Creating..." : "Launch Marketplace"}
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
