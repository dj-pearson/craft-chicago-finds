import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Package, Truck, MapPin, RefreshCw } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  ready_today: boolean;
  ships_today: boolean;
  pickup_today: boolean;
  shipping_available: boolean;
  local_pickup_available: boolean;
}

interface ReadyTodaySettingsProps {
  sellerId: string;
}

export const ReadyTodaySettings = ({ sellerId }: ReadyTodaySettingsProps) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchListings();
  }, [sellerId]);

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, ready_today, ships_today, pickup_today, shipping_available, local_pickup_available')
        .eq('seller_id', sellerId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load listings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateListingSetting = async (listingId: string, field: keyof Pick<Listing, 'ready_today' | 'ships_today' | 'pickup_today'>, value: boolean) => {
    setUpdating(listingId);
    try {
      const { error } = await supabase
        .from('listings')
        .update({ [field]: value })
        .eq('id', listingId);

      if (error) throw error;

      setListings(prev => 
        prev.map(listing => 
          listing.id === listingId 
            ? { ...listing, [field]: value }
            : listing
        )
      );

      toast({
        title: 'Updated',
        description: `${field.replace('_', ' ')} setting updated successfully`,
      });
    } catch (error) {
      console.error('Error updating listing:', error);
      toast({
        title: 'Error',
        description: 'Failed to update setting',
        variant: 'destructive'
      });
    } finally {
      setUpdating(null);
    }
  };

  const bulkUpdateAll = async (field: keyof Pick<Listing, 'ready_today' | 'ships_today' | 'pickup_today'>, value: boolean) => {
    setUpdating('bulk');
    try {
      const { error } = await supabase
        .from('listings')
        .update({ [field]: value })
        .eq('seller_id', sellerId)
        .eq('status', 'active');

      if (error) throw error;

      setListings(prev => 
        prev.map(listing => ({ ...listing, [field]: value }))
      );

      toast({
        title: 'Bulk Update Complete',
        description: `All listings updated for ${field.replace('_', ' ')}`,
      });
    } catch (error) {
      console.error('Error bulk updating listings:', error);
      toast({
        title: 'Error',
        description: 'Failed to bulk update listings',
        variant: 'destructive'
      });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-warning/20 bg-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Available Today - Infrastructure Tool
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Turn availability into revenue. 38% of orders use same-day pickup—capture urgent gift buyers other platforms miss.
            Toggle items "Available Today" to get priority in search results.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bulk Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkUpdateAll('ready_today', true)}
              disabled={updating === 'bulk'}
              className="gap-2"
            >
              <Package className="h-4 w-4" />
              Mark All Ready Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkUpdateAll('ships_today', true)}
              disabled={updating === 'bulk'}
              className="gap-2"
            >
              <Truck className="h-4 w-4" />
              Mark All Ships Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkUpdateAll('pickup_today', true)}
              disabled={updating === 'bulk'}
              className="gap-2"
            >
              <MapPin className="h-4 w-4" />
              Mark All Pickup Today
            </Button>
          </div>

          {/* Individual Listings */}
          <div className="space-y-3">
            {listings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No active listings found</p>
              </div>
            ) : (
              listings.map((listing) => (
                <Card key={listing.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{listing.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {listing.ready_today && (
                          <Badge variant="default" className="text-xs">
                            <Package className="h-3 w-3 mr-1" />
                            Ready Today
                          </Badge>
                        )}
                        {listing.ships_today && (
                          <Badge variant="default" className="text-xs">
                            <Truck className="h-3 w-3 mr-1" />
                            Ships Today
                          </Badge>
                        )}
                        {listing.pickup_today && (
                          <Badge variant="default" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            Pickup Today
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Ready Today */}
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`ready-${listing.id}`} className="text-xs">Ready</Label>
                        <Switch
                          id={`ready-${listing.id}`}
                          checked={listing.ready_today}
                          onCheckedChange={(checked) => updateListingSetting(listing.id, 'ready_today', checked)}
                          disabled={updating === listing.id}
                        />
                      </div>

                      {/* Ships Today (only if shipping available) */}
                      {listing.shipping_available && (
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`ships-${listing.id}`} className="text-xs">Ships</Label>
                          <Switch
                            id={`ships-${listing.id}`}
                            checked={listing.ships_today}
                            onCheckedChange={(checked) => updateListingSetting(listing.id, 'ships_today', checked)}
                            disabled={updating === listing.id}
                          />
                        </div>
                      )}

                      {/* Pickup Today (only if pickup available) */}
                      {listing.local_pickup_available && (
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`pickup-${listing.id}`} className="text-xs">Pickup</Label>
                          <Switch
                            id={`pickup-${listing.id}`}
                            checked={listing.pickup_today}
                            onCheckedChange={(checked) => updateListingSetting(listing.id, 'pickup_today', checked)}
                            disabled={updating === listing.id}
                          />
                        </div>
                      )}

                      {updating === listing.id && (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          <div className="text-xs bg-primary/5 p-3 rounded-lg border border-primary/20">
            <strong className="text-primary">Infrastructure Advantage:</strong> "Available Today" listings get 3x more views and priority search placement.
            Enable each morning when you're free for pickup (2-6pm typical). Capture same-day sales that Etsy can't.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};