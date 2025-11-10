import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  Edit,
  Save,
  X,
  Upload,
  Download,
  Loader2,
  CheckCircle,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ListingInventory {
  id: string;
  title: string;
  inventory_count: number;
  low_stock_threshold: number;
  auto_hide_out_of_stock: boolean;
  price: number;
  is_active: boolean;
}

interface InventoryStats {
  total_listings: number;
  low_stock_listings: number;
  out_of_stock_listings: number;
  total_inventory_value: number;
  low_stock_value: number;
}

export function InventoryManager() {
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingInventory[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<ListingInventory>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchInventory();
      fetchStats();
    }
  }, [user]);

  const fetchInventory = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, inventory_count, low_stock_threshold, auto_hide_out_of_stock, price, is_active')
        .eq('seller_id', user.id)
        .order('inventory_count', { ascending: true });

      if (error) throw error;

      setListings(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_inventory_stats', {
        p_seller_id: user.id,
      });

      if (error) throw error;

      setStats(data as InventoryStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleEdit = (listing: ListingInventory) => {
    setEditingId(listing.id);
    setEditValues({
      inventory_count: listing.inventory_count,
      low_stock_threshold: listing.low_stock_threshold,
      auto_hide_out_of_stock: listing.auto_hide_out_of_stock,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleSave = async (listingId: string) => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase.rpc('update_inventory_count', {
        p_listing_id: listingId,
        p_new_count: editValues.inventory_count!,
        p_seller_id: user.id,
      });

      if (error) throw error;

      // Also update threshold and auto-hide settings
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          low_stock_threshold: editValues.low_stock_threshold,
          auto_hide_out_of_stock: editValues.auto_hide_out_of_stock,
        })
        .eq('id', listingId)
        .eq('seller_id', user.id);

      if (updateError) throw updateError;

      toast.success('Inventory updated successfully');
      setEditingId(null);
      setEditValues({});
      await fetchInventory();
      await fetchStats();
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast.error('Failed to update inventory');
    } finally {
      setSaving(false);
    }
  };

  const exportInventory = () => {
    if (listings.length === 0) {
      toast.error('No inventory to export');
      return;
    }

    const csvContent = [
      ['Listing ID', 'Title', 'Current Stock', 'Low Stock Threshold', 'Auto-Hide OOS', 'Price', 'Is Active'].join(','),
      ...listings.map((item) =>
        [
          item.id,
          `"${item.title}"`,
          item.inventory_count,
          item.low_stock_threshold,
          item.auto_hide_out_of_stock,
          item.price,
          item.is_active,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Inventory exported successfully');
  };

  const getStockStatus = (listing: ListingInventory) => {
    if (listing.inventory_count <= 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-300' };
    } else if (listing.inventory_count <= listing.low_stock_threshold) {
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    } else {
      return { label: 'In Stock', color: 'bg-green-100 text-green-800 border-green-300' };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_listings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.low_stock_listings}</div>
              <p className="text-xs text-muted-foreground">
                ${stats.low_stock_value.toFixed(2)} value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.out_of_stock_listings}</div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.total_inventory_value.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total stock value</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>
                Manage stock levels and low stock alerts for your listings
              </CardDescription>
            </div>
            <Button onClick={exportInventory} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {stats && (stats.low_stock_listings > 0 || stats.out_of_stock_listings > 0) && (
            <Alert className="mb-4 bg-yellow-50 border-yellow-300">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Action Required:</strong> You have {stats.low_stock_listings} low stock item
                {stats.low_stock_listings !== 1 ? 's' : ''} and {stats.out_of_stock_listings} out of stock item
                {stats.out_of_stock_listings !== 1 ? 's' : ''}. Update inventory to prevent lost sales.
              </AlertDescription>
            </Alert>
          )}

          {listings.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
              <p className="text-muted-foreground">
                Create your first listing to start managing inventory
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Listing</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Current Stock</TableHead>
                    <TableHead className="text-center">Alert Threshold</TableHead>
                    <TableHead className="text-center">Auto-Hide OOS</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((listing) => {
                    const isEditing = editingId === listing.id;
                    const status = getStockStatus(listing);

                    return (
                      <TableRow key={listing.id}>
                        <TableCell>
                          <div className="max-w-md">
                            <div className="font-medium truncate">{listing.title}</div>
                            <div className="text-xs text-muted-foreground">
                              ${listing.price} • {listing.is_active ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge className={status.color}>{status.label}</Badge>
                        </TableCell>

                        <TableCell className="text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              min="0"
                              value={editValues.inventory_count}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  inventory_count: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-20 text-center"
                              disabled={saving}
                            />
                          ) : (
                            <span className="font-medium">{listing.inventory_count}</span>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              min="1"
                              value={editValues.low_stock_threshold}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  low_stock_threshold: parseInt(e.target.value) || 5,
                                })
                              }
                              className="w-20 text-center"
                              disabled={saving}
                            />
                          ) : (
                            <span>{listing.low_stock_threshold}</span>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          {isEditing ? (
                            <Switch
                              checked={editValues.auto_hide_out_of_stock}
                              onCheckedChange={(checked) =>
                                setEditValues({
                                  ...editValues,
                                  auto_hide_out_of_stock: checked,
                                })
                              }
                              disabled={saving}
                            />
                          ) : (
                            <CheckCircle
                              className={`h-4 w-4 mx-auto ${
                                listing.auto_hide_out_of_stock
                                  ? 'text-green-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSave(listing.id)}
                                disabled={saving}
                              >
                                {saving ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancel}
                                disabled={saving}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(listing)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
