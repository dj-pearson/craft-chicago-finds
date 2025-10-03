import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Send } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function BulkNotifications() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [notificationData, setNotificationData] = useState({
    recipient_type: "all_sellers",
    notification_type: "compliance",
    title: "",
    message: "",
    action_url: "",
  });

  const handleSendNotification = async () => {
    if (!notificationData.title || !notificationData.message) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and message",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Get recipient list based on type
      let recipientQuery = supabase.from("profiles").select("user_id");

      switch (notificationData.recipient_type) {
        case "all_sellers":
          recipientQuery = recipientQuery.eq("is_seller", true);
          break;
        case "verified_sellers":
          recipientQuery = recipientQuery.eq("is_seller", true).eq("seller_verified", true);
          break;
        case "pending_verification":
          // Verification is now handled by Stripe - filter by sellers without seller_verified status
          recipientQuery = recipientQuery.eq("is_seller", true).eq("seller_verified", false);
          break;
      }

      const { data: recipients, error: recipientsError } = await recipientQuery;

      if (recipientsError) throw recipientsError;

      if (!recipients || recipients.length === 0) {
        toast({
          title: "No Recipients",
          description: "No users match the selected criteria",
          variant: "destructive",
        });
        return;
      }

      // Create notifications for all recipients
      const notifications = recipients.map((recipient) => ({
        user_id: recipient.user_id,
        type: notificationData.notification_type,
        title: notificationData.title,
        content: notificationData.message,
        action_url: notificationData.action_url || null,
      }));

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notificationError) throw notificationError;

      toast({
        title: "Notifications Sent",
        description: `Successfully sent ${recipients.length} notification(s)`,
      });

      // Reset form
      setNotificationData({
        recipient_type: "all_sellers",
        notification_type: "compliance",
        title: "",
        message: "",
        action_url: "",
      });
    } catch (error: any) {
      console.error("Error sending bulk notifications:", error);
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Bulk Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Send notifications to groups of users for compliance reminders, platform updates, or
            important announcements.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient_type">Recipients</Label>
            <Select
              value={notificationData.recipient_type}
              onValueChange={(value) =>
                setNotificationData({ ...notificationData, recipient_type: value })
              }
            >
              <SelectTrigger id="recipient_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_sellers">All Sellers</SelectItem>
                <SelectItem value="verified_sellers">Verified Sellers Only</SelectItem>
                <SelectItem value="pending_verification">Pending Verification</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification_type">Notification Type</Label>
            <Select
              value={notificationData.notification_type}
              onValueChange={(value) =>
                setNotificationData({ ...notificationData, notification_type: value })
              }
            >
              <SelectTrigger id="notification_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="platform_update">Platform Update</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Notification Title</Label>
            <Input
              id="title"
              value={notificationData.title}
              onChange={(e) =>
                setNotificationData({ ...notificationData, title: e.target.value })
              }
              placeholder="Important Compliance Update"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={notificationData.message}
              onChange={(e) =>
                setNotificationData({ ...notificationData, message: e.target.value })
              }
              placeholder="Please review your compliance status..."
              rows={6}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {notificationData.message.length}/500 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="action_url">Action URL (Optional)</Label>
            <Input
              id="action_url"
              value={notificationData.action_url}
              onChange={(e) =>
                setNotificationData({ ...notificationData, action_url: e.target.value })
              }
              placeholder="/seller-dashboard?tab=verification"
            />
          </div>

          <Button
            onClick={handleSendNotification}
            disabled={loading}
            className="w-full gap-2"
          >
            <Send className="h-4 w-4" />
            {loading ? "Sending..." : "Send Notifications"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
