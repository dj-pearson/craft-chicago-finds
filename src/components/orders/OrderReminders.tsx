import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Clock, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface Reminder {
  id: string;
  order_id: string;
  reminder_type: string;
  scheduled_for: string;
  sent_at: string | null;
  message: string;
  metadata: any;
}

export const OrderReminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchReminders = async () => {
      const { data, error } = await supabase
        .from("order_reminders")
        .select("*")
        .eq("recipient_id", user.id)
        .is("sent_at", null)
        .order("scheduled_for", { ascending: true })
        .limit(5);

      if (!error && data) {
        setReminders(data);
      }
      setLoading(false);
    };

    fetchReminders();

    // Subscribe to new reminders
    const channel = supabase
      .channel("order_reminders_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_reminders",
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          setReminders((prev) => [payload.new as Reminder, ...prev].slice(0, 5));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading || reminders.length === 0) return null;

  const getReminderIcon = (type: string) => {
    switch (type) {
      case "pickup_ready":
        return <Package className="h-4 w-4" />;
      case "pickup_reminder":
        return <Clock className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getReminderColor = (type: string) => {
    switch (type) {
      case "pickup_ready":
        return "default";
      case "pickup_reminder":
        return "secondary";
      case "pickup_overdue":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Upcoming Reminders
        </CardTitle>
        <CardDescription>Your scheduled order notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            className="flex items-start gap-3 p-3 rounded-lg border bg-card"
          >
            <div className="mt-1">{getReminderIcon(reminder.reminder_type)}</div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">{reminder.message}</p>
              <div className="flex items-center gap-2">
                <Badge variant={getReminderColor(reminder.reminder_type)}>
                  {reminder.reminder_type.replace(/_/g, " ")}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(reminder.scheduled_for), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
