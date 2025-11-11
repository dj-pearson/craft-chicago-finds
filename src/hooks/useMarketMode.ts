import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface MarketModeSession {
  id: string;
  participant_id: string;
  fair_id: string;
  session_start: string;
  session_end: string | null;
  is_active: boolean;
  qr_scans: number;
  catalog_views: number;
  items_viewed: number;
  reservations_made: number;
  orders_placed: number;
  available_for_pickup: boolean;
  available_for_shipping: boolean;
  booth_notes: string | null;
  fair: {
    name: string;
    venue_name: string;
    start_date: string;
    end_date: string;
  };
  participant: {
    booth_number: string;
    booth_location: string;
  };
}

interface FairParticipation {
  id: string;
  fair_id: string;
  seller_id: string;
  booth_number: string | null;
  booth_location: string | null;
  status: string;
  market_mode_enabled: boolean;
  qr_code_url: string | null;
  fair: {
    name: string;
    venue_name: string;
    start_date: string;
    end_date: string;
    status: string;
  };
}

export const useMarketMode = (sellerId: string) => {
  const queryClient = useQueryClient();

  // Get seller's fair participations
  const { data: participations, isLoading: participationsLoading } = useQuery({
    queryKey: ['fair-participations', sellerId],
    queryFn: async (): Promise<FairParticipation[]> => {
      if (!sellerId) return [];

      const { data, error } = await supabase
        .from('fair_participants')
        .select(`
          id,
          fair_id,
          seller_id,
          booth_number,
          booth_location,
          status,
          market_mode_enabled,
          qr_code_url,
          craft_fairs!inner(
            name,
            venue_name,
            start_date,
            end_date,
            status
          )
        `)
        .eq('seller_id', sellerId)
        .order('craft_fairs.start_date', { ascending: false });

      if (error) throw error;

      // Transform the data to match our interface
      return (data || []).map((item: any) => ({
        id: item.id,
        fair_id: item.fair_id,
        seller_id: item.seller_id,
        booth_number: item.booth_number,
        booth_location: item.booth_location,
        status: item.status,
        market_mode_enabled: item.market_mode_enabled,
        qr_code_url: item.qr_code_url,
        fair: {
          name: item.craft_fairs.name,
          venue_name: item.craft_fairs.venue_name,
          start_date: item.craft_fairs.start_date,
          end_date: item.craft_fairs.end_date,
          status: item.craft_fairs.status
        }
      }));
    },
    enabled: !!sellerId,
  });

  // Get active Market Mode sessions
  const { data: activeSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['market-mode-sessions', sellerId],
    queryFn: async (): Promise<MarketModeSession[]> => {
      if (!sellerId) return [];

      const { data, error } = await supabase
        .from('market_mode_sessions')
        .select(`
          *,
          craft_fairs!inner(name, venue_name, start_date, end_date),
          fair_participants!inner(booth_number, booth_location)
        `)
        .eq('seller_id', sellerId)
        .eq('is_active', true);

      if (error) throw error;

      return (data || []).map((session: any) => ({
        ...session,
        fair: {
          name: session.craft_fairs.name,
          venue_name: session.craft_fairs.venue_name,
          start_date: session.craft_fairs.start_date,
          end_date: session.craft_fairs.end_date
        },
        participant: {
          booth_number: session.fair_participants.booth_number,
          booth_location: session.fair_participants.booth_location
        }
      }));
    },
    enabled: !!sellerId,
    refetchInterval: 30000, // Refresh every 30 seconds for live metrics
  });

  // Start Market Mode session
  const startSession = useMutation({
    mutationFn: async (params: {
      participantId: string;
      fairId: string;
      availableForPickup: boolean;
      availableForShipping: boolean;
      boothNotes?: string;
    }) => {
      const { data, error } = await supabase
        .from('market_mode_sessions')
        .insert({
          participant_id: params.participantId,
          seller_id: sellerId,
          fair_id: params.fairId,
          is_active: true,
          available_for_pickup: params.availableForPickup,
          available_for_shipping: params.availableForShipping,
          booth_notes: params.boothNotes || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-mode-sessions', sellerId] });
      toast({
        title: "Market Mode Activated",
        description: "Your booth is now live! Buyers can scan your QR code to browse your full catalog.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to start Market Mode: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // End Market Mode session
  const endSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase
        .from('market_mode_sessions')
        .update({
          is_active: false,
          session_end: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('seller_id', sellerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-mode-sessions', sellerId] });
      toast({
        title: "Market Mode Ended",
        description: "Session closed successfully. View your performance metrics in analytics.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to end session: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  return {
    participations,
    activeSessions,
    isLoading: participationsLoading || sessionsLoading,
    startSession,
    endSession
  };
};
