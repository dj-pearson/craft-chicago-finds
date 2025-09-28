-- Create image_optimizations table for tracking optimized images
CREATE TABLE public.image_optimizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  original_url TEXT NOT NULL,
  original_size INTEGER NOT NULL,
  optimized_versions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.image_optimizations ENABLE ROW LEVEL SECURITY;

-- Create policies for image_optimizations
CREATE POLICY "Users can view their own image optimizations" 
ON public.image_optimizations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own image optimizations" 
ON public.image_optimizations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own image optimizations" 
ON public.image_optimizations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_image_optimizations_updated_at
BEFORE UPDATE ON public.image_optimizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_image_optimizations_user ON public.image_optimizations(user_id);
CREATE INDEX idx_image_optimizations_original_url ON public.image_optimizations(original_url);
CREATE INDEX idx_image_optimizations_created_at ON public.image_optimizations(created_at DESC);

-- Add foreign key constraint
ALTER TABLE public.image_optimizations 
ADD CONSTRAINT image_optimizations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
