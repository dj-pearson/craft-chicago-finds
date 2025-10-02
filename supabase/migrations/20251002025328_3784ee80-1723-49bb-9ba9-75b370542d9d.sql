-- Create ai_models table to store available AI models
CREATE TABLE IF NOT EXISTS public.ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  api_endpoint TEXT NOT NULL,
  model_type TEXT NOT NULL DEFAULT 'chat', -- chat, completion, embedding, etc.
  description TEXT,
  max_tokens INTEGER DEFAULT 4000,
  supports_vision BOOLEAN DEFAULT false,
  supports_streaming BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

-- Admins can manage AI models
CREATE POLICY "Admins can manage AI models"
  ON public.ai_models
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  );

-- Everyone can view active models
CREATE POLICY "Active models are viewable by everyone"
  ON public.ai_models
  FOR SELECT
  USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_ai_models_updated_at
  BEFORE UPDATE ON public.ai_models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default Claude models
INSERT INTO public.ai_models (model_name, display_name, provider, api_endpoint, description, max_tokens, supports_vision, is_default, sort_order) VALUES
  ('claude-sonnet-4-5-20250929', 'Claude Sonnet 4.5 (Latest)', 'anthropic', 'https://api.anthropic.com/v1/messages', 'Claude Sonnet 4.5 - Latest version with improved reasoning and performance', 8000, true, true, 1),
  ('claude-sonnet-4-5', 'Claude Sonnet 4.5 (Alias)', 'anthropic', 'https://api.anthropic.com/v1/messages', 'Claude Sonnet 4.5 - Auto-selects the latest 4.5 model version', 8000, true, false, 2),
  ('claude-sonnet-4-20250514', 'Claude Sonnet 4', 'anthropic', 'https://api.anthropic.com/v1/messages', 'Claude Sonnet 4 - High-performance model with exceptional reasoning', 8000, true, false, 3),
  ('claude-opus-4-1-20250805', 'Claude Opus 4.1', 'anthropic', 'https://api.anthropic.com/v1/messages', 'Claude Opus 4.1 - Most capable model with superior reasoning', 8000, true, false, 4),
  ('claude-3-5-haiku-20241022', 'Claude 3.5 Haiku', 'anthropic', 'https://api.anthropic.com/v1/messages', 'Claude 3.5 Haiku - Fast and efficient model for quick responses', 4000, false, false, 5);

-- Add model_id column to ai_settings to reference ai_models
ALTER TABLE public.ai_settings
  ADD COLUMN IF NOT EXISTS model_id UUID REFERENCES public.ai_models(id);

-- Update existing ai_settings to use the default model
UPDATE public.ai_settings
SET model_id = (SELECT id FROM public.ai_models WHERE is_default = true LIMIT 1)
WHERE model_id IS NULL;