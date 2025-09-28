-- Create disputes table
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  disputing_user_id UUID NOT NULL,
  disputed_user_id UUID NOT NULL,
  dispute_type TEXT NOT NULL CHECK (dispute_type IN ('quality', 'shipping', 'payment', 'description', 'other')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'closed')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_urls TEXT[] DEFAULT '{}',
  admin_notes TEXT,
  resolution_notes TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dispute_messages table for communication during disputes
CREATE TABLE public.dispute_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_messages ENABLE ROW LEVEL SECURITY;

-- Disputes policies
CREATE POLICY "Users can view their own disputes" 
ON public.disputes FOR SELECT 
USING (auth.uid() = disputing_user_id OR auth.uid() = disputed_user_id);

CREATE POLICY "Users can create disputes for their orders" 
ON public.disputes FOR INSERT 
WITH CHECK (auth.uid() = disputing_user_id);

CREATE POLICY "Admins can manage all disputes" 
ON public.disputes FOR ALL 
USING (is_admin(auth.uid()));

-- Dispute messages policies
CREATE POLICY "Dispute participants can view messages" 
ON public.dispute_messages FOR SELECT 
USING (
  dispute_id IN (
    SELECT id FROM public.disputes 
    WHERE disputing_user_id = auth.uid() 
    OR disputed_user_id = auth.uid()
  ) OR is_admin(auth.uid())
);

CREATE POLICY "Dispute participants can send messages" 
ON public.dispute_messages FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND (
    dispute_id IN (
      SELECT id FROM public.disputes 
      WHERE disputing_user_id = auth.uid() 
      OR disputed_user_id = auth.uid()
    ) OR is_admin(auth.uid())
  )
);

-- Create update triggers
CREATE TRIGGER update_disputes_updated_at
BEFORE UPDATE ON public.disputes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add dispute_id to orders table for quick reference
ALTER TABLE public.orders ADD COLUMN dispute_id UUID REFERENCES public.disputes(id);