import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CollectionCard } from './CollectionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Collection {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  cover_image_url: string | null;
  creator_name: string | null;
  creator_avatar: string | null;
  creator_id: string;
  category: string | null;
  is_featured: boolean;
  item_count: number;
  follow_count: number;
  view_count: number;
  created_at: string;
  is_following?: boolean;
}

interface FeaturedCollectionsProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

export const FeaturedCollections = ({ 
  limit = 6, 
  showHeader = true,
  className = '' 
}: FeaturedCollectionsProps) => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeaturedCollections();
  }, [limit]);

  const fetchFeaturedCollections = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try RPC first
      const { data, error: fetchError } = await supabase
        .rpc('get_featured_collections', { collection_limit: limit });

      if (fetchError) {
        console.warn('RPC get_featured_collections not available, using fallback query:', fetchError.message);
        // Fallback to direct query if RPC doesn't exist
        return await fetchFeaturedCollectionsFallback();
      }

      // Add is_featured: true to all results since the function only returns featured collections
      const collectionsWithFeaturedFlag = (data || []).map((collection: any) => ({
        ...collection,
        is_featured: true,
      }));

      setCollections(collectionsWithFeaturedFlag);
    } catch (error: any) {
      console.error('Error fetching featured collections:', error);
      // Try fallback on any error
      await fetchFeaturedCollectionsFallback();
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedCollectionsFallback = async () => {
    try {
      // Fallback query: get featured collections directly
      const { data, error } = await supabase
        .from('collections')
        .select(`
          id,
          title,
          description,
          slug,
          cover_image_url,
          creator_id,
          category,
          item_count,
          follow_count,
          view_count,
          created_at,
          profiles!inner(display_name, avatar_url)
        `)
        .eq('is_public', true)
        .eq('is_featured', true)
        .order('follow_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      // Map the response to match the Collection interface
      const collectionsWithFeaturedFlag = (data || []).map((collection: any) => ({
        id: collection.id,
        title: collection.title,
        description: collection.description,
        slug: collection.slug,
        cover_image_url: collection.cover_image_url,
        creator_id: collection.creator_id,
        creator_name: collection.profiles?.display_name || null,
        creator_avatar: collection.profiles?.avatar_url || null,
        category: collection.category,
        is_featured: true,
        item_count: collection.item_count || 0,
        follow_count: collection.follow_count || 0,
        view_count: collection.view_count || 0,
        created_at: collection.created_at,
      }));

      setCollections(collectionsWithFeaturedFlag);
    } catch (error: any) {
      console.error('Fallback query failed:', error);
      setError(error.message || 'Failed to load featured collections');
      setCollections([]);
    }
  };

  const handleViewAll = () => {
    navigate('/collections');
  };

  if (loading) {
    return (
      <div className={className}>
        {showHeader && (
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: limit }, (_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Card className="p-8 text-center">
          <div className="text-muted-foreground mb-4">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Unable to load collections</p>
            <p className="text-sm">{error}</p>
          </div>
          <Button onClick={fetchFeaturedCollections} variant="outline">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className={className}>
        {showHeader && (
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Featured Collections
              </h2>
              <p className="text-muted-foreground mt-1">
                Discover curated collections from our community
              </p>
            </div>
          </div>
        )}
        
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No featured collections yet</p>
            <p className="text-sm">
              Check back later for curated collections from our community creators.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Featured Collections
            </h2>
            <p className="text-muted-foreground mt-1">
              Discover curated collections from makers and tastemakers
            </p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleViewAll}
            className="gap-2"
          >
            View All
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            showCreator={true}
            className="h-full"
          />
        ))}
      </div>
      
      {/* Call to Action */}
      {collections.length > 0 && (
        <div className="mt-8 text-center">
          <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardContent className="p-0">
              <h3 className="font-semibold mb-2">Create Your Own Collection</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Curate your favorite items and share them with the community
              </p>
              <Button onClick={() => navigate('/collections/create')}>
                Start Curating
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
