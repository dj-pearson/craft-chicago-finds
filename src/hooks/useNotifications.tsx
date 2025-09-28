import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CreateNotificationData {
  user_id: string;
  type: string;
  title: string;
  content: string;
  action_url?: string;
  related_id?: string;
  sender_id?: string;
  metadata?: any;
}

export function useNotifications() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const createNotification = async (data: CreateNotificationData, sendEmail: boolean = true) => {
    setLoading(true);
    try {
      if (sendEmail) {
        // Send notification with email
        const { error } = await supabase.functions.invoke('send-notification-email', {
          body: data
        });

        if (error) throw error;
      } else {
        // Create notification without email
        const { error } = await supabase.rpc('create_notification', {
          _user_id: data.user_id,
          _type: data.type,
          _title: data.title,
          _content: data.content,
          _action_url: data.action_url,
          _related_id: data.related_id,
          _sender_id: data.sender_id,
          _metadata: data.metadata || {}
        });

        if (error) throw error;
      }

      toast.success('Notification sent successfully');
    } catch (error) {
      console.error('Error creating notification:', error);
      toast.error('Failed to send notification');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendOrderNotification = async (userId: string, orderId: string, status: string) => {
    const statusMessages = {
      confirmed: 'Your order has been confirmed and is being prepared.',
      shipped: 'Your order has been shipped and is on its way.',
      delivered: 'Your order has been delivered successfully.',
      cancelled: 'Your order has been cancelled.'
    };

    await createNotification({
      user_id: userId,
      type: 'order',
      title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      content: statusMessages[status as keyof typeof statusMessages] || `Order status updated to ${status}.`,
      action_url: `/orders/${orderId}`,
      related_id: orderId,
      sender_id: user?.id
    });
  };

  const sendMessageNotification = async (userId: string, senderName: string, conversationId: string) => {
    await createNotification({
      user_id: userId,
      type: 'message',
      title: 'New Message',
      content: `${senderName} sent you a message.`,
      action_url: `/messages/${conversationId}`,
      related_id: conversationId,
      sender_id: user?.id
    });
  };

  const sendReviewNotification = async (userId: string, rating: number, productId: string) => {
    await createNotification({
      user_id: userId,
      type: 'review',
      title: 'New Review',
      content: `You received a ${rating}-star review for your product!`,
      action_url: `/products/${productId}#reviews`,
      related_id: productId,
      sender_id: user?.id
    });
  };

  const sendDisputeNotification = async (userId: string, disputeId: string, status: string) => {
    await createNotification({
      user_id: userId,
      type: 'dispute',
      title: `Dispute ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      content: `Your dispute has been ${status}.`,
      action_url: `/disputes/${disputeId}`,
      related_id: disputeId,
      sender_id: user?.id
    });
  };

  const sendSystemNotification = async (userId: string, title: string, content: string, actionUrl?: string) => {
    await createNotification({
      user_id: userId,
      type: 'system',
      title,
      content,
      action_url: actionUrl
    }, false); // System notifications don't send emails by default
  };

  return {
    createNotification,
    sendOrderNotification,
    sendMessageNotification,
    sendReviewNotification,
    sendDisputeNotification,
    sendSystemNotification,
    loading
  };
}