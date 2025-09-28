-- Create featured_slots table for homepage content management
CREATE TABLE public.featured_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  slot_type TEXT NOT NULL CHECK (slot_type IN ('hero', 'featured_category', 'featured_listing', 'seasonal')),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  action_url TEXT,
  action_text TEXT,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.featured_slots ENABLE ROW LEVEL SECURITY;

-- Create policies for featured_slots
CREATE POLICY "Featured slots are viewable by everyone" 
ON public.featured_slots 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage featured slots" 
ON public.featured_slots 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  )
);

CREATE POLICY "City moderators can manage their city's featured slots" 
ON public.featured_slots 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'city_moderator' 
    AND city_id = featured_slots.city_id
    AND is_active = true
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_featured_slots_updated_at
BEFORE UPDATE ON public.featured_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_featured_slots_city ON public.featured_slots(city_id);
CREATE INDEX idx_featured_slots_active ON public.featured_slots(is_active, city_id) WHERE is_active = true;
CREATE INDEX idx_featured_slots_sort_order ON public.featured_slots(city_id, sort_order);
CREATE INDEX idx_featured_slots_type ON public.featured_slots(slot_type, city_id);
CREATE INDEX idx_featured_slots_dates ON public.featured_slots(start_date, end_date) WHERE start_date IS NOT NULL OR end_date IS NOT NULL;

-- Create constraints for validation
ALTER TABLE public.featured_slots 
ADD CONSTRAINT check_featured_listing_has_listing_id 
CHECK (
  (slot_type = 'featured_listing' AND listing_id IS NOT NULL) OR 
  (slot_type != 'featured_listing')
);

ALTER TABLE public.featured_slots 
ADD CONSTRAINT check_featured_category_has_category_id 
CHECK (
  (slot_type = 'featured_category' AND category_id IS NOT NULL) OR 
  (slot_type != 'featured_category')
);

ALTER TABLE public.featured_slots 
ADD CONSTRAINT check_date_range 
CHECK (
  (start_date IS NULL OR end_date IS NULL) OR 
  (start_date <= end_date)
);

-- Insert some default featured slots for Chicago (if it exists)
DO $$
DECLARE
  chicago_id UUID;
BEGIN
  -- Get Chicago city ID
  SELECT id INTO chicago_id FROM public.cities WHERE slug = 'chicago' LIMIT 1;
  
  IF chicago_id IS NOT NULL THEN
    -- Insert default hero banner
    INSERT INTO public.featured_slots (
      city_id, 
      slot_type, 
      title, 
      description, 
      action_text, 
      action_url, 
      sort_order, 
      is_active
    ) VALUES (
      chicago_id,
      'hero',
      'Discover Chicago''s Local Makers',
      'Support local artisans and find unique handmade goods in the Windy City',
      'Start Shopping',
      '/chicago/browse',
      1,
      true
    );
    
    -- Insert seasonal slot
    INSERT INTO public.featured_slots (
      city_id, 
      slot_type, 
      title, 
      description, 
      action_text, 
      action_url, 
      sort_order, 
      is_active
    ) VALUES (
      chicago_id,
      'seasonal',
      'Holiday Gifts from Local Makers',
      'Find the perfect handmade gifts for the holiday season',
      'Shop Holiday Gifts',
      '/chicago/browse?category=gifts',
      2,
      true
    );
  END IF;
END $$;
