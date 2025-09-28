-- Create search analytics table for tracking search behavior
CREATE TABLE public.search_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  filters_used JSONB DEFAULT '{}',
  city_id UUID REFERENCES public.cities(id),
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better performance
CREATE INDEX idx_search_analytics_query ON public.search_analytics(query);
CREATE INDEX idx_search_analytics_created_at ON public.search_analytics(created_at);
CREATE INDEX idx_search_analytics_city_id ON public.search_analytics(city_id);

-- Enable RLS
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert search analytics (for tracking)
CREATE POLICY "Anyone can insert search analytics" 
ON public.search_analytics 
FOR INSERT 
WITH CHECK (true);

-- Admins can view all search analytics
CREATE POLICY "Admins can view all search analytics" 
ON public.search_analytics 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_search_analytics_updated_at
BEFORE UPDATE ON public.search_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();