import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, 
  Check, 
  X, 
  MessageSquare, 
  ShoppingCart, 
  Star, 
  User,
  Package,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: 'message' | 'order' | 'review' | 'listing' | 'system';
  title: string;
  content: string;
  read: boolean;
  created_at: string;
  action_url?: string;
  related_id?: string;
  sender?: {
    display_name: string;
    avatar_url?: string;
  };
}

export const NotificationCenter = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Create mock notifications since we don't have a notifications table yet
      // In a real implementation, you'd fetch from a notifications table
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'message',
          title: 'New Message',
          content: 'You have a new message about your listing "Handmade Ceramic Mug"',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          action_url: '/messages',
          sender: {
            display_name: 'Sarah Johnson',
            avatar_url: ''
          }
        },
        {
          id: '2',
          type: 'order',
          title: 'Order Confirmed',
          content: 'Your order #12345 has been confirmed by the seller',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          action_url: '/orders',
          related_id: '12345'
        },
        {
          id: '3',
          type: 'review',
          title: 'New Review',
          content: 'You received a 5-star review for your recent sale',
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          sender: {
            display_name: 'Mike Chen',
            avatar_url: ''
          }
        },
        {
          id: '4',
          type: 'listing',
          title: 'Listing Approved',
          content: 'Your listing "Artisan Wooden Bowl" has been approved and is now live',
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
        },
        {
          id: '5',
          type: 'system',
          title: 'Welcome to Chicago Makers!',
          content: 'Thank you for joining our community. Start exploring amazing handmade products from local artisans.',
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week ago
        }
      ];

      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read: true }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // In a real implementation, you'd update the database here
      // await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);

      // In a real implementation, you'd update the database here
      // await supabase.from('notifications').update({ read: true }).eq('user_id', user.id);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'order':
        return <ShoppingCart className="h-4 w-4" />;
      case 'review':
        return <Star className="h-4 w-4" />;
      case 'listing':
        return <Package className="h-4 w-4" />;
      case 'system':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'text-blue-500';
      case 'order':
        return 'text-green-500';
      case 'review':
        return 'text-yellow-500';
      case 'listing':
        return 'text-purple-500';
      case 'system':
        return 'text-orange-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Notifications</DialogTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>
          <DialogDescription>
            {unreadCount > 0 
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'You\'re all caught up!'
            }
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-96">
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`cursor-pointer transition-colors ${
                    !notification.read ? 'bg-primary/5 border-primary/20' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full bg-background ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium truncate">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="h-2 w-2 bg-primary rounded-full ml-2 flex-shrink-0" />
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {notification.content}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                          
                          {notification.sender && (
                            <div className="flex items-center gap-1">
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={notification.sender.avatar_url} />
                                <AvatarFallback className="text-xs">
                                  {notification.sender.display_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground truncate max-w-20">
                                {notification.sender.display_name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};