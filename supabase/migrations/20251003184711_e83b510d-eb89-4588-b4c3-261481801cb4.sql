-- Create performance_metrics table for client-side performance monitoring
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  page_url TEXT NOT NULL,
  user_agent TEXT,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for performance_metrics
CREATE POLICY "Users can insert their own performance metrics"
  ON public.performance_metrics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own performance metrics"
  ON public.performance_metrics
  FOR SELECT
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Admins can view all performance metrics"
  ON public.performance_metrics
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Create index for better query performance
CREATE INDEX idx_performance_metrics_user_id ON public.performance_metrics(user_id);
CREATE INDEX idx_performance_metrics_session_id ON public.performance_metrics(session_id);
CREATE INDEX idx_performance_metrics_created_at ON public.performance_metrics(created_at DESC);