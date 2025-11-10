import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  price: number;
  status: string;
  inventory_count: number | null;
  featured: boolean;
}

export function BulkOperationsDashboard() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchListings();
    }
  }, [user]);

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, price, status, inventory_count, featured')
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error: any) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const selectAll = () => {
    if (selectedIds.size === listings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(listings.map(l => l.id)));
    }
  };

  const bulkUpdateStatus = async (newStatus: string) => {
    if (selectedIds.size === 0) {
      toast.error('No listings selected');
      return;
    }

    setProcessing(true);
    try {
      // Use the new RPC function for bulk status updates
      const { data, error } = await supabase.rpc('bulk_toggle_listing_status', {
        p_listing_ids: Array.from(selectedIds),
        p_seller_id: user?.id,
        p_new_status: newStatus,
      });

      if (error) throw error;

      await fetchListings();
      setSelectedIds(new Set());
      toast.success(`Updated ${data.updated_count} listing${data.updated_count === 1 ? '' : 's'}`);
    } catch (error: any) {
      console.error('Bulk status update error:', error);
      toast.error('Failed to update listings');
    } finally {
      setProcessing(false);
    }
  };

  const bulkUpdatePrice = async (adjustment: 'increase' | 'decrease', percentage: number) => {
    if (selectedIds.size === 0) {
      toast.error('No listings selected');
      return;
    }

    if (!percentage || percentage <= 0 || percentage > 100) {
      toast.error('Please enter a valid percentage (1-100)');
      return;
    }

    setProcessing(true);
    try {
      const selectedListings = listings.filter(l => selectedIds.has(l.id));

      // Calculate new prices for each listing
      const updates = selectedListings.map(listing => {
        const multiplier = adjustment === 'increase'
          ? (1 + percentage / 100)
          : (1 - percentage / 100);
        const newPrice = Math.max(0.01, Number(listing.price) * multiplier);

        return {
          listing_id: listing.id,
          new_price: Number(newPrice.toFixed(2)),
        };
      });

      // Use the new RPC function for bulk price updates
      const { data, error } = await supabase.rpc('bulk_update_listing_prices', {
        p_updates: updates,
        p_seller_id: user?.id,
      });

      if (error) throw error;

      await fetchListings();
      setSelectedIds(new Set());
      toast.success(`Updated prices for ${data.success_count} listing${data.success_count === 1 ? '' : 's'}`);

      if (data.error_count > 0) {
        toast.error(`Failed to update ${data.error_count} listing${data.error_count === 1 ? '' : 's'}`);
      }
    } catch (error: any) {
      console.error('Bulk price update error:', error);
      toast.error('Failed to update prices');
    } finally {
      setProcessing(false);
    }
  };

  const bulkToggleFeatured = async () => {
    if (selectedIds.size === 0) {
      toast.error('No listings selected');
      return;
    }

    setProcessing(true);
    try {
      const selectedListings = listings.filter(l => selectedIds.has(l.id));
      const allFeatured = selectedListings.every(l => l.featured);
      
      const { error } = await supabase
        .from('listings')
        .update({ featured: !allFeatured })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      await fetchListings();
      setSelectedIds(new Set());
      toast.success(`Updated ${selectedIds.size} listing${selectedIds.size === 1 ? '' : 's'}`);
    } catch (error: any) {
      toast.error('Failed to update featured status');
    } finally {
      setProcessing(false);
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error('No listings selected');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.size} listing${selectedIds.size === 1 ? '' : 's'}? This action cannot be undone.`)) {
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      await fetchListings();
      setSelectedIds(new Set());
      toast.success(`Deleted ${selectedIds.size} listing${selectedIds.size === 1 ? '' : 's'}`);
    } catch (error: any) {
      toast.error('Failed to delete listings');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Operations</CardTitle>
          <CardDescription>
            Manage multiple listings at once. Select listings and choose an action.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selection Summary */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedIds.size === listings.length && listings.length > 0}
                onCheckedChange={selectAll}
              />
              <span className="text-sm font-medium">
                {selectedIds.size} of {listings.length} selected
              </span>
            </div>
            {selectedIds.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear Selection
              </Button>
            )}
          </div>

          {/* Bulk Actions */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status Update</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => bulkUpdateStatus('active')}
                    disabled={selectedIds.size === 0 || processing}
                    variant="outline"
                    size="sm"
                  >
                    Activate
                  </Button>
                  <Button
                    onClick={() => bulkUpdateStatus('draft')}
                    disabled={selectedIds.size === 0 || processing}
                    variant="outline"
                    size="sm"
                  >
                    Draft
                  </Button>
                  <Button
                    onClick={() => bulkUpdateStatus('sold')}
                    disabled={selectedIds.size === 0 || processing}
                    variant="outline"
                    size="sm"
                  >
                    Mark Sold
                  </Button>
                  <Button
                    onClick={bulkToggleFeatured}
                    disabled={selectedIds.size === 0 || processing}
                    variant="outline"
                    size="sm"
                  >
                    Toggle Featured
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Price Adjustment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="percentage">Percentage</Label>
                  <Input
                    id="percentage"
                    type="number"
                    placeholder="10"
                    min="1"
                    max="100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => {
                      const input = document.getElementById('percentage') as HTMLInputElement;
                      bulkUpdatePrice('increase', Number(input?.value));
                    }}
                    disabled={selectedIds.size === 0 || processing}
                    variant="outline"
                    size="sm"
                  >
                    Increase
                  </Button>
                  <Button
                    onClick={() => {
                      const input = document.getElementById('percentage') as HTMLInputElement;
                      bulkUpdatePrice('decrease', Number(input?.value));
                    }}
                    disabled={selectedIds.size === 0 || processing}
                    variant="outline"
                    size="sm"
                  >
                    Decrease
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={bulkDelete}
                disabled={selectedIds.size === 0 || processing}
                variant="destructive"
                size="sm"
              >
                Delete Selected Listings
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Listings List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Listings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50"
              >
                <Checkbox
                  checked={selectedIds.has(listing.id)}
                  onCheckedChange={() => toggleSelection(listing.id)}
                />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{listing.title}</span>
                    {listing.featured && <Badge variant="secondary">Featured</Badge>}
                    <Badge variant={
                      listing.status === 'active' ? 'default' :
                      listing.status === 'draft' ? 'secondary' :
                      'outline'
                    }>
                      {listing.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    ${Number(listing.price).toFixed(2)} • 
                    Stock: {listing.inventory_count ?? 'Unlimited'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
