import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, MessageCircle, Package, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface NotificationPreferences {
  email_orders: boolean;
  email_messages: boolean;
  email_marketing: boolean;
  push_orders: boolean;
  push_messages: boolean;
  push_marketing: boolean;
}

interface NotificationSettingsProps {
  user: User;
  profile: any;
}

export const NotificationSettings = ({ user, profile }: NotificationSettingsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const defaultPreferences: NotificationPreferences = {
    email_orders: true,
    email_messages: true,
    email_marketing: false,
    push_orders: false,
    push_messages: false,
    push_marketing: false,
  };

  const [notifications, setNotifications] = useState<NotificationPreferences>(() => ({
    email_orders: profile?.notification_preferences?.email_orders ?? defaultPreferences.email_orders,
    email_messages: profile?.notification_preferences?.email_messages ?? defaultPreferences.email_messages,
    email_marketing: profile?.notification_preferences?.email_marketing ?? defaultPreferences.email_marketing,
    push_orders: profile?.notification_preferences?.push_orders ?? defaultPreferences.push_orders,
    push_messages: profile?.notification_preferences?.push_messages ?? defaultPreferences.push_messages,
    push_marketing: profile?.notification_preferences?.push_marketing ?? defaultPreferences.push_marketing,
  }));

  const [originalNotifications, setOriginalNotifications] = useState<NotificationPreferences>(notifications);

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(notifications) !== JSON.stringify(originalNotifications);
    setHasChanges(changed);
  }, [notifications, originalNotifications]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          notification_preferences: notifications,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setOriginalNotifications(notifications);
      setHasChanges(false);

      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast({
        title: "Update failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Choose what email notifications you'd like to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Order Updates
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified about order confirmations, shipping updates, and delivery
              </p>
            </div>
            <Switch
              checked={notifications.email_orders}
              onCheckedChange={() => handleToggle('email_orders')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Messages
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified when you receive new messages from buyers or sellers
              </p>
            </div>
            <Switch
              checked={notifications.email_messages}
              onCheckedChange={() => handleToggle('email_messages')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Marketing & Updates
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive newsletters, product updates, and promotional offers
              </p>
            </div>
            <Switch
              checked={notifications.email_marketing}
              onCheckedChange={() => handleToggle('email_marketing')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Get instant notifications on your device (coming soon)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-3 p-3 bg-muted/50 border rounded-lg">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-muted-foreground">Coming Soon</p>
              <p className="text-sm text-muted-foreground">
                Push notifications will be available in a future update.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between opacity-50">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Order Updates
              </Label>
              <p className="text-sm text-muted-foreground">
                Instant notifications for order status changes
              </p>
            </div>
            <Switch disabled />
          </div>

          <div className="flex items-center justify-between opacity-50">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                New Messages
              </Label>
              <p className="text-sm text-muted-foreground">
                Instant notifications for new messages
              </p>
            </div>
            <Switch disabled />
          </div>
        </CardContent>
      </Card>

      {/* Frequency Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Email Frequency</CardTitle>
          <CardDescription>
            Control how often you receive email notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Digest Emails</p>
                <p className="text-sm text-muted-foreground">
                  Receive a summary of activity instead of individual emails
                </p>
              </div>
              <Switch disabled />
            </div>
            <p className="text-sm text-muted-foreground">
              This feature will be available in a future update.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {!hasChanges && (
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Saved
          </span>
        )}
        <Button onClick={handleSave} disabled={loading || !hasChanges}>
          {loading ? "Saving..." : hasChanges ? "Save Preferences" : "No Changes"}
        </Button>
      </div>
    </div>
  );
};