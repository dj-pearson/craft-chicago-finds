-- Create collections table
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  cover_image_url TEXT,
  category TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  item_count INTEGER NOT NULL DEFAULT 0,
  follow_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create collection_items table (items within collections)
CREATE TABLE IF NOT EXISTS public.collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(collection_id, listing_id)
);

-- Create collection_follows table
CREATE TABLE IF NOT EXISTS public.collection_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(collection_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_collections_creator ON public.collections(creator_id);
CREATE INDEX IF NOT EXISTS idx_collections_featured ON public.collections(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_collections_public ON public.collections(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON public.collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_listing ON public.collection_items(listing_id);
CREATE INDEX IF NOT EXISTS idx_collection_follows_collection ON public.collection_follows(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_follows_user ON public.collection_follows(user_id);

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collections
CREATE POLICY "Public collections are viewable by everyone"
  ON public.collections FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own collections"
  ON public.collections FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can create their own collections"
  ON public.collections FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own collections"
  ON public.collections FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own collections"
  ON public.collections FOR DELETE
  USING (auth.uid() = creator_id);

-- RLS Policies for collection_items
CREATE POLICY "Collection items viewable if collection is viewable"
  ON public.collection_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE id = collection_items.collection_id
        AND (is_public = true OR creator_id = auth.uid())
    )
  );

CREATE POLICY "Collection owners can manage items"
  ON public.collection_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE id = collection_items.collection_id AND creator_id = auth.uid()
    )
  );

-- RLS Policies for collection_follows
CREATE POLICY "Users can view all follows"
  ON public.collection_follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow collections"
  ON public.collection_follows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow collections"
  ON public.collection_follows FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON public.collections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT SELECT ON public.collection_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.collection_items TO authenticated;
GRANT SELECT ON public.collection_follows TO anon, authenticated;
GRANT INSERT, DELETE ON public.collection_follows TO authenticated;

-- Function to update collection item count
CREATE OR REPLACE FUNCTION update_collection_item_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.collections
    SET item_count = item_count + 1
    WHERE id = NEW.collection_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.collections
    SET item_count = item_count - 1
    WHERE id = OLD.collection_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update collection follow count
CREATE OR REPLACE FUNCTION update_collection_follow_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.collections
    SET follow_count = follow_count + 1
    WHERE id = NEW.collection_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.collections
    SET follow_count = follow_count - 1
    WHERE id = OLD.collection_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER trigger_collection_item_count
  AFTER INSERT OR DELETE ON public.collection_items
  FOR EACH ROW EXECUTE FUNCTION update_collection_item_count();

CREATE TRIGGER trigger_collection_follow_count
  AFTER INSERT OR DELETE ON public.collection_follows
  FOR EACH ROW EXECUTE FUNCTION update_collection_follow_count();

-- RPC function to get featured collections
CREATE OR REPLACE FUNCTION get_featured_collections(collection_limit INTEGER DEFAULT 6)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  slug TEXT,
  cover_image_url TEXT,
  creator_id UUID,
  creator_name TEXT,
  creator_avatar TEXT,
  category TEXT,
  item_count INTEGER,
  follow_count INTEGER,
  view_count INTEGER,
  created_at TIMESTAMPTZ
) 
LANGUAGE sql STABLE
SECURITY DEFINER
AS $$
  SELECT 
    c.id,
    c.title,
    c.description,
    c.slug,
    c.cover_image_url,
    c.creator_id,
    p.display_name as creator_name,
    p.avatar_url as creator_avatar,
    c.category,
    c.item_count,
    c.follow_count,
    c.view_count,
    c.created_at
  FROM public.collections c
  INNER JOIN public.profiles p ON c.creator_id = p.user_id
  WHERE c.is_public = true 
    AND c.is_featured = true
  ORDER BY c.follow_count DESC, c.created_at DESC
  LIMIT collection_limit;
$$;