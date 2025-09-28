import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, MessageCircle, Package, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

interface NotificationSettingsProps {
  user: User;
  profile: any;
}

export const NotificationSettings = ({ user, profile }: NotificationSettingsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [notifications, setNotifications] = useState({
    email_orders: profile?.notification_preferences?.email_orders ?? true,
    email_messages: profile?.notification_preferences?.email_messages ?? true,
    email_marketing: profile?.notification_preferences?.email_marketing ?? false,
    push_orders: false, // Not implemented yet
    push_messages: false, // Not implemented yet
    push_marketing: false, // Not implemented yet
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement notification preferences update in Supabase
      console.log("Notification preferences update:", notifications);

      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
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

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
};