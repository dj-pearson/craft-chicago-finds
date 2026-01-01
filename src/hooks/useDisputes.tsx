import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { handleError, ErrorMessages } from '@/lib/handleError';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type DisputeRow = Database["public"]["Tables"]["disputes"]["Row"];
type DisputeUpdate = Database["public"]["Tables"]["disputes"]["Update"];

export interface Dispute {
  id: string;
  order_id: string;
  disputing_user_id: string;
  disputed_user_id: string;
  dispute_type: 'quality' | 'shipping' | 'payment' | 'description' | 'other';
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  title: string;
  description: string;
  evidence_urls: string[];
  admin_notes?: string;
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DisputeMessage {
  id: string;
  dispute_id: string;
  sender_id: string;
  message: string;
  sender_type: 'user' | 'admin';
  created_at: string;
}

interface DisputesContextType {
  disputes: Dispute[];
  loading: boolean;
  createDispute: (disputeData: Omit<Dispute, 'id' | 'status' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateDisputeStatus: (disputeId: string, status: Dispute['status'], notes?: string) => Promise<void>;
  getDisputeMessages: (disputeId: string) => Promise<DisputeMessage[]>;
  sendDisputeMessage: (disputeId: string, message: string) => Promise<void>;
  refreshDisputes: () => Promise<void>;
}

const DisputesContext = createContext<DisputesContextType | undefined>(undefined);

export const DisputesProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDisputes();
    }
  }, [user]);

  const fetchDisputes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('disputes')
        .select('*')
        .or(`disputing_user_id.eq.${user.id},disputed_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDisputes(data as Dispute[] || []);
    } catch (error) {
      handleError(error, ErrorMessages.LOAD_ERROR);
      toast({
        title: 'Error',
        description: 'Failed to load disputes. Please refresh the page.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createDispute = async (disputeData: Omit<Dispute, 'id' | 'status' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('disputes')
        .insert([disputeData]);

      if (error) throw error;
      toast({
        title: 'Success',
        description: 'Dispute submitted successfully.',
      });
      await refreshDisputes();
    } catch (error) {
      handleError(error, 'Failed to create dispute');
      toast({
        title: 'Error',
        description: 'Failed to submit dispute. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateDisputeStatus = async (disputeId: string, status: Dispute['status'], notes?: string) => {
    try {
      const updateData: DisputeUpdate = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'resolved' && notes) {
        updateData.resolution_notes = notes;
        updateData.resolved_by = user?.id;
        updateData.resolved_at = new Date().toISOString();
      }

      if (notes && status !== 'resolved') {
        updateData.admin_notes = notes;
      }

      const { error } = await supabase
        .from('disputes')
        .update(updateData)
        .eq('id', disputeId);

      if (error) throw error;
      toast({
        title: 'Success',
        description: 'Dispute status updated successfully.',
      });
      await refreshDisputes();
    } catch (error) {
      handleError(error, 'Failed to update dispute status');
      toast({
        title: 'Error',
        description: 'Failed to update dispute status. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const getDisputeMessages = async (disputeId: string): Promise<DisputeMessage[]> => {
    try {
      const { data, error } = await supabase
        .from('dispute_messages')
        .select('*')
        .eq('dispute_id', disputeId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as DisputeMessage[] || [];
    } catch (error) {
      handleError(error, 'Failed to fetch dispute messages');
      return [];
    }
  };

  const sendDisputeMessage = async (disputeId: string, message: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('dispute_messages')
        .insert([{
          dispute_id: disputeId,
          sender_id: user.id,
          message,
          sender_type: 'user' as const
        }]);

      if (error) throw error;
      toast({
        title: 'Message sent',
        description: 'Your message has been sent.',
      });
    } catch (error) {
      handleError(error, 'Failed to send message');
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const refreshDisputes = async () => {
    await fetchDisputes();
  };

  return (
    <DisputesContext.Provider value={{
      disputes,
      loading,
      createDispute,
      updateDisputeStatus,
      getDisputeMessages,
      sendDisputeMessage,
      refreshDisputes
    }}>
      {children}
    </DisputesContext.Provider>
  );
};

export const useDisputes = () => {
  const context = useContext(DisputesContext);
  if (context === undefined) {
    throw new Error('useDisputes must be used within a DisputesProvider');
  }
  return context;
};