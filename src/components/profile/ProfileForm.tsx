import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Upload, Camera, MapPin, Globe, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCityContext } from "@/hooks/useCityContext";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { z } from "zod";

const profileSchema = z.object({
  display_name: z.string().trim().min(2, "Display name must be at least 2 characters").max(50, "Display name must be less than 50 characters"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  location: z.string().max(100, "Location must be less than 100 characters").optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  phone: z.string().max(20, "Phone number must be less than 20 characters").optional(),
});

interface ProfileFormProps {
  user: SupabaseUser;
  profile: any;
}

export const ProfileForm = ({ user, profile }: ProfileFormProps) => {
  const { cities } = useCityContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    display_name: profile?.display_name || "",
    bio: profile?.bio || "",
    location: profile?.location || "",
    website: profile?.website || "",
    phone: profile?.phone || "",
    city_id: profile?.city_id || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const validatedData = profileSchema.parse(formData);

      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: validatedData.display_name,
          bio: validatedData.bio || null,
          location: validatedData.location || null,
          website: validatedData.website || null,
          phone: formData.phone || null,
          city_id: formData.city_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        console.error('Profile update error:', error);
        toast({
          title: "Update failed",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = () => {
    toast({
      title: "Feature coming soon",
      description: "Avatar upload will be available soon.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Information
        </CardTitle>
        <CardDescription>
          Update your profile information and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || ""} alt="Profile picture" />
                <AvatarFallback className="text-xl">
                  {profile?.display_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
                onClick={handleAvatarUpload}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                {profile?.display_name || "User"}
                {profile?.seller_verified && (
                  <Badge variant="outline" className="gap-1">
                    ✓ Verified
                  </Badge>
                )}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAvatarUpload}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Photo
              </Button>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="Your display name"
                required
              />
              {errors.display_name && <p className="text-sm text-destructive">{errors.display_name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us about yourself..."
              rows={3}
              maxLength={500}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{errors.bio && <span className="text-destructive">{errors.bio}</span>}</span>
              <span>{formData.bio.length}/500</span>
            </div>
          </div>

          {/* Location Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city_id">Primary City</Label>
              <Select
                value={formData.city_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, city_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {city.name}, {city.state}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Neighborhood/Area</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Lincoln Park, Wicker Park"
              />
              {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://yourwebsite.com"
                className="pl-10"
              />
            </div>
            {errors.website && <p className="text-sm text-destructive">{errors.website}</p>}
          </div>

          {/* Account Information */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-2">Account Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Email:</span>
                <span className="ml-2">{user.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Account Type:</span>
                <span className="ml-2">
                  {profile?.is_seller ? "Seller Account" : "Buyer Account"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Member Since:</span>
                <span className="ml-2">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Last Seen:</span>
                <span className="ml-2">
                  {profile?.last_seen_at ? new Date(profile.last_seen_at).toLocaleDateString() : "Never"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Profile"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};