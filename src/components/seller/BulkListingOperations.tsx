import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckSquare,
  Loader2,
  Package,
  DollarSign,
  TrendingUp,
  Edit2,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

interface Listing {
  id: string;
  title: string;
  price: number;
  inventory_count: number;
  status: string;
  shipping_available: boolean;
  local_pickup: boolean;
  local_delivery: boolean;
  images: string[];
}

interface BulkListingOperationsProps {
  listings: Listing[];
  onUpdate: () => void;
}

interface PreviewItem {
  id: string;
  title: string;
  oldValue: string;
  newValue: string;
  change: string;
}

export function BulkListingOperations({ listings, onUpdate }: BulkListingOperationsProps) {
  const { user } = useAuth();
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);

  // Bulk update form state
  const [bulkAction, setBulkAction] = useState<string>('status');
  const [newStatus, setNewStatus] = useState<string>('active');
  const [priceAdjustment, setPriceAdjustment] = useState<number>(0);
  const [priceAdjustmentType, setPriceAdjustmentType] = useState<'percentage' | 'fixed'>('percentage');
  const [shippingEnabled, setShippingEnabled] = useState<boolean>(false);
  const [pickupEnabled, setPickupEnabled] = useState<boolean>(false);
  const [deliveryEnabled, setDeliveryEnabled] = useState<boolean>(false);

  const handleSelectAll = () => {
    if (selectedListings.length === listings.length) {
      setSelectedListings([]);
    } else {
      setSelectedListings(listings.map(l => l.id));
    }
  };

  const handleSelectListing = (listingId: string) => {
    setSelectedListings(prev =>
      prev.includes(listingId)
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };

  const handleBulkStatusUpdate = async () => {
    if (!user || selectedListings.length === 0) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('bulk_toggle_listing_status', {
        p_listing_ids: selectedListings,
        p_seller_id: user.id,
        p_new_status: newStatus,
      });

      if (error) throw error;

      toast.success(`Updated ${data.updated_count} listing(s) successfully`);
      setSelectedListings([]);
      setBulkDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating listings:', error);
      toast.error('Failed to update listings');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkPriceUpdate = async () => {
    if (!user || selectedListings.length === 0) return;

    setLoading(true);
    try {
      // Calculate new prices
      const updates = selectedListings.map(listingId => {
        const listing = listings.find(l => l.id === listingId);
        if (!listing) return null;

        let newPrice = listing.price;
        if (priceAdjustmentType === 'percentage') {
          newPrice = listing.price * (1 + priceAdjustment / 100);
        } else {
          newPrice = listing.price + priceAdjustment;
        }

        // Round to 2 decimal places
        newPrice = Math.round(newPrice * 100) / 100;

        return {
          listing_id: listingId,
          new_price: newPrice,
        };
      }).filter(Boolean);

      const { data, error } = await supabase.rpc('bulk_update_listing_prices', {
        p_updates: updates,
        p_seller_id: user.id,
      });

      if (error) throw error;

      toast.success(`Updated prices for ${data.success_count} listing(s)`);
      if (data.error_count > 0) {
        toast.error(`Failed to update ${data.error_count} listing(s)`);
      }

      setSelectedListings([]);
      setBulkDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating prices:', error);
      toast.error('Failed to update prices');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkFieldUpdate = async () => {
    if (!user || selectedListings.length === 0) return;

    setLoading(true);
    try {
      const fields: any = {};

      if (bulkAction === 'delivery_options') {
        fields.shipping_available = shippingEnabled;
        fields.local_pickup = pickupEnabled;
        fields.local_delivery = deliveryEnabled;
      }

      const { data, error } = await supabase.rpc('bulk_update_listing_fields', {
        p_listing_ids: selectedListings,
        p_seller_id: user.id,
        p_fields: fields,
      });

      if (error) throw error;

      toast.success(`Updated ${data.updated_count} listing(s) successfully`);
      setSelectedListings([]);
      setBulkDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating listings:', error);
      toast.error('Failed to update listings');
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = () => {
    const preview: PreviewItem[] = [];

    selectedListings.forEach(listingId => {
      const listing = listings.find(l => l.id === listingId);
      if (!listing) return;

      let previewItem: PreviewItem;

      switch (bulkAction) {
        case 'status':
          previewItem = {
            id: listing.id,
            title: listing.title,
            oldValue: listing.status,
            newValue: newStatus,
            change: `Status: ${listing.status} → ${newStatus}`
          };
          break;
        case 'price':
          let newPrice = listing.price;
          if (priceAdjustmentType === 'percentage') {
            newPrice = listing.price * (1 + priceAdjustment / 100);
          } else {
            newPrice = listing.price + priceAdjustment;
          }
          newPrice = Math.round(newPrice * 100) / 100;

          previewItem = {
            id: listing.id,
            title: listing.title,
            oldValue: `$${listing.price.toFixed(2)}`,
            newValue: `$${newPrice.toFixed(2)}`,
            change: `Price: $${listing.price.toFixed(2)} → $${newPrice.toFixed(2)} (${priceAdjustment > 0 ? '+' : ''}${priceAdjustmentType === 'percentage' ? `${priceAdjustment}%` : `$${priceAdjustment}`})`
          };
          break;
        case 'delivery_options':
          const oldOptions = [];
          const newOptions = [];
          if (listing.shipping_available) oldOptions.push('Shipping');
          if (listing.local_pickup) oldOptions.push('Pickup');
          if (listing.local_delivery) oldOptions.push('Delivery');

          if (shippingEnabled) newOptions.push('Shipping');
          if (pickupEnabled) newOptions.push('Pickup');
          if (deliveryEnabled) newOptions.push('Delivery');

          previewItem = {
            id: listing.id,
            title: listing.title,
            oldValue: oldOptions.join(', ') || 'None',
            newValue: newOptions.join(', ') || 'None',
            change: `Options: ${oldOptions.join(', ') || 'None'} → ${newOptions.join(', ') || 'None'}`
          };
          break;
        default:
          return;
      }

      preview.push(previewItem);
    });

    setPreviewItems(preview);
    setShowPreview(true);
  };

  const handleBulkUpdate = async () => {
    // Close preview
    setShowPreview(false);

    switch (bulkAction) {
      case 'status':
        await handleBulkStatusUpdate();
        break;
      case 'price':
        await handleBulkPriceUpdate();
        break;
      case 'delivery_options':
        await handleBulkFieldUpdate();
        break;
    }
  };

  const selectedCount = selectedListings.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Bulk Operations
            </CardTitle>
            <CardDescription>
              Select multiple listings to update them at once
            </CardDescription>
          </div>

          {selectedCount > 0 && (
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm">
                {selectedCount} selected
              </Badge>
              <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Bulk Update
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Bulk Update {selectedCount} Listings</DialogTitle>
                    <DialogDescription>
                      Make changes to multiple listings at once
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Action</Label>
                      <Select value={bulkAction} onValueChange={setBulkAction}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="status">Change Status</SelectItem>
                          <SelectItem value="price">Adjust Prices</SelectItem>
                          <SelectItem value="delivery_options">Update Delivery Options</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {bulkAction === 'status' && (
                      <div className="space-y-2">
                        <Label>New Status</Label>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {bulkAction === 'price' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Adjustment Type</Label>
                          <Select
                            value={priceAdjustmentType}
                            onValueChange={(v) => setPriceAdjustmentType(v as 'percentage' | 'fixed')}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="fixed">Fixed Amount</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>
                            {priceAdjustmentType === 'percentage' ? 'Percentage Change (%)' : 'Amount Change ($)'}
                          </Label>
                          <Input
                            type="number"
                            value={priceAdjustment}
                            onChange={(e) => setPriceAdjustment(parseFloat(e.target.value) || 0)}
                            placeholder={priceAdjustmentType === 'percentage' ? 'e.g., 10 for +10%' : 'e.g., 5 for +$5'}
                            step={priceAdjustmentType === 'percentage' ? '1' : '0.01'}
                          />
                          <p className="text-xs text-muted-foreground">
                            Use negative numbers to decrease prices
                          </p>
                        </div>
                      </div>
                    )}

                    {bulkAction === 'delivery_options' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="shipping">Shipping Available</Label>
                          <Switch
                            id="shipping"
                            checked={shippingEnabled}
                            onCheckedChange={setShippingEnabled}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="pickup">Local Pickup</Label>
                          <Switch
                            id="pickup"
                            checked={pickupEnabled}
                            onCheckedChange={setPickupEnabled}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="delivery">Local Delivery</Label>
                          <Switch
                            id="delivery"
                            checked={deliveryEnabled}
                            onCheckedChange={setDeliveryEnabled}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={generatePreview} disabled={loading}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview Changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Preview Dialog */}
              <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Preview Bulk Changes</DialogTitle>
                    <DialogDescription>
                      Review the changes before applying them to {selectedCount} listing{selectedCount !== 1 ? 's' : ''}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex-1 overflow-y-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Listing</TableHead>
                          <TableHead>Current</TableHead>
                          <TableHead className="text-center">→</TableHead>
                          <TableHead>New</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium max-w-[200px]">
                              <p className="truncate" title={item.title}>{item.title}</p>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {item.oldValue}
                            </TableCell>
                            <TableCell className="text-center text-primary">
                              <TrendingUp className="h-4 w-4 mx-auto" />
                            </TableCell>
                            <TableCell className="font-medium text-green-600">
                              {item.newValue}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Summary */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Total listings to update:
                      </span>
                      <Badge variant="secondary" className="text-base">
                        {selectedCount}
                      </Badge>
                    </div>
                    {bulkAction === 'price' && (
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-muted-foreground">
                          Estimated revenue impact:
                        </span>
                        <span className="font-medium">
                          {(() => {
                            const impact = previewItems.reduce((sum, item) => {
                              const oldPrice = parseFloat(item.oldValue.replace('$', ''));
                              const newPrice = parseFloat(item.newValue.replace('$', ''));
                              return sum + (newPrice - oldPrice);
                            }, 0);
                            return impact > 0 ? `+$${impact.toFixed(2)}` : `$${impact.toFixed(2)}`;
                          })()}
                        </span>
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowPreview(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleBulkUpdate} disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Applying...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Confirm & Apply
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                onClick={() => setSelectedListings([])}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {listings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No listings to display</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Checkbox
                checked={selectedListings.length === listings.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">
                Select All ({listings.length})
              </span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                    selectedListings.includes(listing.id) ? 'bg-muted/50 border-primary' : ''
                  }`}
                >
                  <Checkbox
                    checked={selectedListings.includes(listing.id)}
                    onCheckedChange={() => handleSelectListing(listing.id)}
                  />

                  <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                    {listing.images?.[0] ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{listing.title}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {listing.price}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {listing.inventory_count} in stock
                      </span>
                    </div>
                  </div>

                  <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                    {listing.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
