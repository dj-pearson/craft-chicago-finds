-- Create rate_limit_logs table for tracking API rate limits
CREATE TABLE IF NOT EXISTS public.rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier_endpoint 
ON public.rate_limit_logs(identifier, endpoint, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limit_created_at 
ON public.rate_limit_logs(created_at);

-- Enable RLS
ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view rate limit logs
CREATE POLICY "Admins can view rate limit logs"
ON public.rate_limit_logs
FOR SELECT
USING (public.is_admin(auth.uid()));

-- System can insert rate limit logs (edge functions use service role)
CREATE POLICY "Service role can insert rate limit logs"
ON public.rate_limit_logs
FOR INSERT
WITH CHECK (true);

-- System can delete old logs for cleanup
CREATE POLICY "Service role can delete old rate limit logs"
ON public.rate_limit_logs
FOR DELETE
USING (true);