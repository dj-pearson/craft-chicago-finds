import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Package, Plus, Trash2, Percent, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Bundle {
  id: string;
  name: string;
  description: string;
  discount_percentage: number | null;
  discount_amount: number | null;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
}

export const BundleBuilder: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newBundle, setNewBundle] = useState({
    name: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 10
  });

  useEffect(() => {
    if (user) {
      fetchBundles();
    }
  }, [user]);

  const fetchBundles = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('product_bundles')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Product bundles table not available yet');
        setBundles([]);
        return;
      }

      setBundles(data || []);
    } catch (error) {
      console.error('Error fetching bundles:', error);
      setBundles([]);
    } finally {
      setLoading(false);
    }
  };

  const createBundle = async () => {
    if (!user || !newBundle.name.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please enter a bundle name',
        variant: 'destructive'
      });
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('product_bundles')
        .insert({
          seller_id: user.id,
          name: newBundle.name,
          description: newBundle.description,
          discount_percentage: newBundle.discountType === 'percentage' ? newBundle.discountValue : null,
          discount_amount: newBundle.discountType === 'fixed' ? newBundle.discountValue : null,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      setBundles(prev => [data, ...prev]);
      setNewBundle({ name: '', description: '', discountType: 'percentage', discountValue: 10 });

      toast({
        title: 'Bundle created!',
        description: 'Your bundle discount is now active.'
      });
    } catch (error) {
      console.error('Error creating bundle:', error);
      toast({
        title: 'Error',
        description: 'Failed to create bundle. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const toggleBundleStatus = async (bundleId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
      const { error } = await supabase
        .from('product_bundles')
        .update({ status: newStatus })
        .eq('id', bundleId);

      if (error) throw error;

      setBundles(prev => prev.map(b =>
        b.id === bundleId ? { ...b, status: newStatus as Bundle['status'] } : b
      ));

      toast({
        title: newStatus === 'active' ? 'Bundle activated' : 'Bundle deactivated',
        description: `Bundle is now ${newStatus}.`
      });
    } catch (error) {
      console.error('Error updating bundle:', error);
      toast({
        title: 'Error',
        description: 'Failed to update bundle status.',
        variant: 'destructive'
      });
    }
  };

  const deleteBundle = async (bundleId: string) => {
    try {
      const { error } = await supabase
        .from('product_bundles')
        .delete()
        .eq('id', bundleId);

      if (error) throw error;

      setBundles(prev => prev.filter(b => b.id !== bundleId));

      toast({
        title: 'Bundle deleted',
        description: 'The bundle has been removed.'
      });
    } catch (error) {
      console.error('Error deleting bundle:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete bundle.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Bundle Discounts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create New Bundle */}
        <div className="p-4 border rounded-lg space-y-4">
          <h3 className="font-medium">Create New Bundle</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bundleName">Bundle Name</Label>
              <Input
                id="bundleName"
                value={newBundle.name}
                onChange={(e) => setNewBundle(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Holiday Gift Set"
              />
            </div>
            <div>
              <Label htmlFor="bundleDiscount">Discount</Label>
              <div className="flex gap-2">
                <select
                  className="px-3 py-2 border rounded-md"
                  value={newBundle.discountType}
                  onChange={(e) => setNewBundle(prev => ({
                    ...prev,
                    discountType: e.target.value as 'percentage' | 'fixed'
                  }))}
                >
                  <option value="percentage">%</option>
                  <option value="fixed">$</option>
                </select>
                <Input
                  id="bundleDiscount"
                  type="number"
                  min="0"
                  value={newBundle.discountValue}
                  onChange={(e) => setNewBundle(prev => ({
                    ...prev,
                    discountValue: Number(e.target.value)
                  }))}
                />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="bundleDescription">Description (optional)</Label>
            <Input
              id="bundleDescription"
              value={newBundle.description}
              onChange={(e) => setNewBundle(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your bundle..."
            />
          </div>
          <Button onClick={createBundle} disabled={creating}>
            <Plus className="h-4 w-4 mr-2" />
            {creating ? 'Creating...' : 'Create Bundle'}
          </Button>
        </div>

        {/* Existing Bundles */}
        {bundles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No bundles yet. Create your first bundle discount above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="font-medium">Your Bundles</h3>
            {bundles.map((bundle) => (
              <div
                key={bundle.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{bundle.name}</h4>
                    <Badge variant={bundle.status === 'active' ? 'default' : 'secondary'}>
                      {bundle.status}
                    </Badge>
                    <Badge variant="outline">
                      {bundle.discount_percentage
                        ? <><Percent className="h-3 w-3 mr-1" />{bundle.discount_percentage}% off</>
                        : <><DollarSign className="h-3 w-3 mr-1" />${bundle.discount_amount} off</>
                      }
                    </Badge>
                  </div>
                  {bundle.description && (
                    <p className="text-sm text-muted-foreground mt-1">{bundle.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={bundle.status === 'active'}
                    onCheckedChange={() => toggleBundleStatus(bundle.id, bundle.status)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteBundle(bundle.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
