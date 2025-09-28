import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Truck, 
  Plus, 
  Trash2, 
  MapPin, 
  DollarSign,
  Calendar,
  Info
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ShippingZone {
  id: string;
  zone_name: string;
  states: string[];
  shipping_cost: number;
  free_shipping_threshold?: number;
  estimated_days: number;
  is_active: boolean;
}

export const ShippingSettings = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  
  // Profile shipping settings - handle optional properties
  const [shipsNationally, setShipsNationally] = useState((profile as any)?.ships_nationally || false);
  const [defaultShippingCost, setDefaultShippingCost] = useState((profile as any)?.default_shipping_cost?.toString() || '');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState((profile as any)?.free_shipping_threshold?.toString() || '');
  const [shippingPolicy, setShippingPolicy] = useState((profile as any)?.shipping_policy || '');

  // New zone form
  const [newZone, setNewZone] = useState({
    zone_name: '',
    states: '',
    shipping_cost: '',
    free_shipping_threshold: '',
    estimated_days: '7'
  });

  const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  useEffect(() => {
    if (user) {
      fetchShippingZones();
    }
  }, [user]);

  const fetchShippingZones = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('shipping_zones')
        .select('*')
        .eq('seller_id', user.id)
        .order('zone_name');

      if (error) throw error;
      setShippingZones(data || []);
    } catch (error) {
      console.error('Error fetching shipping zones:', error);
    }
  };

  const updateProfileShipping = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ships_nationally: shipsNationally,
          default_shipping_cost: defaultShippingCost ? parseFloat(defaultShippingCost) : null,
          free_shipping_threshold: freeShippingThreshold ? parseFloat(freeShippingThreshold) : null,
          shipping_policy: shippingPolicy || null
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Shipping settings updated",
        description: "Your shipping preferences have been saved."
      });
    } catch (error) {
      console.error('Error updating shipping settings:', error);
      toast({
        title: "Error updating settings",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createShippingZone = async () => {
    if (!user || !newZone.zone_name || !newZone.states || !newZone.shipping_cost) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const statesArray = newZone.states.split(',').map(s => s.trim().toUpperCase());
      
      const { error } = await supabase
        .from('shipping_zones')
        .insert([{
          seller_id: user.id,
          zone_name: newZone.zone_name,
          states: statesArray,
          shipping_cost: parseFloat(newZone.shipping_cost),
          free_shipping_threshold: newZone.free_shipping_threshold ? parseFloat(newZone.free_shipping_threshold) : null,
          estimated_days: parseInt(newZone.estimated_days)
        }]);

      if (error) throw error;

      setNewZone({
        zone_name: '',
        states: '',
        shipping_cost: '',
        free_shipping_threshold: '',
        estimated_days: '7'
      });

      fetchShippingZones();
      
      toast({
        title: "Shipping zone created",
        description: "Your new shipping zone has been added."
      });
    } catch (error) {
      console.error('Error creating shipping zone:', error);
      toast({
        title: "Error creating zone",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const deleteShippingZone = async (zoneId: string) => {
    try {
      const { error } = await supabase
        .from('shipping_zones')
        .delete()
        .eq('id', zoneId)
        .eq('seller_id', user?.id);

      if (error) throw error;

      fetchShippingZones();
      
      toast({
        title: "Shipping zone deleted",
        description: "The shipping zone has been removed."
      });
    } catch (error) {
      console.error('Error deleting shipping zone:', error);
      toast({
        title: "Error deleting zone",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!profile?.is_seller) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Truck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Seller Account Required</h3>
          <p className="text-muted-foreground">
            You need a seller account to configure shipping settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* National Shipping Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Enable National Shipping</h3>
              <p className="text-muted-foreground mb-4">
                Reach customers nationwide by offering shipping! Items with shipping enabled appear in our National Marketplace, 
                expanding your reach beyond your local city.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ships-nationally"
                    checked={shipsNationally}
                    onCheckedChange={setShipsNationally}
                  />
                  <Label htmlFor="ships-nationally" className="font-medium">
                    Ship Nationwide
                  </Label>
                </div>
                <Button onClick={updateProfileShipping} disabled={loading}>
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {shipsNationally && (
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="zones">Shipping Zones</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Default Shipping Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="default-shipping">Default Shipping Cost ($)</Label>
                    <Input
                      id="default-shipping"
                      type="number"
                      step="0.01"
                      placeholder="15.00"
                      value={defaultShippingCost}
                      onChange={(e) => setDefaultShippingCost(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="free-shipping">Free Shipping Threshold ($)</Label>
                    <Input
                      id="free-shipping"
                      type="number"
                      step="0.01"
                      placeholder="75.00"
                      value={freeShippingThreshold}
                      onChange={(e) => setFreeShippingThreshold(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="shipping-policy">Shipping Policy</Label>
                  <Textarea
                    id="shipping-policy"
                    placeholder="Describe your shipping process, timeline, packaging, etc..."
                    value={shippingPolicy}
                    onChange={(e) => setShippingPolicy(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button onClick={updateProfileShipping} disabled={loading}>
                  Save General Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="zones" className="space-y-6">
            {/* Create New Zone */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create Shipping Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zone-name">Zone Name</Label>
                    <Input
                      id="zone-name"
                      placeholder="e.g., West Coast"
                      value={newZone.zone_name}
                      onChange={(e) => setNewZone({ ...newZone, zone_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zone-states">States (comma-separated)</Label>
                    <Input
                      id="zone-states"
                      placeholder="e.g., CA, OR, WA"
                      value={newZone.states}
                      onChange={(e) => setNewZone({ ...newZone, states: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zone-cost">Shipping Cost ($)</Label>
                    <Input
                      id="zone-cost"
                      type="number"
                      step="0.01"
                      placeholder="12.00"
                      value={newZone.shipping_cost}
                      onChange={(e) => setNewZone({ ...newZone, shipping_cost: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zone-threshold">Free Shipping Threshold ($)</Label>
                    <Input
                      id="zone-threshold"
                      type="number"
                      step="0.01"
                      placeholder="50.00"
                      value={newZone.free_shipping_threshold}
                      onChange={(e) => setNewZone({ ...newZone, free_shipping_threshold: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zone-days">Estimated Days</Label>
                    <Input
                      id="zone-days"
                      type="number"
                      placeholder="7"
                      value={newZone.estimated_days}
                      onChange={(e) => setNewZone({ ...newZone, estimated_days: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={createShippingZone} className="w-full">
                  Create Shipping Zone
                </Button>
              </CardContent>
            </Card>

            {/* Existing Zones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shippingZones.map((zone) => (
                <Card key={zone.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold">{zone.zone_name}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteShippingZone(zone.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{zone.states.join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>${zone.shipping_cost}</span>
                        {zone.free_shipping_threshold && (
                          <span className="text-muted-foreground">
                            (Free over ${zone.free_shipping_threshold})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{zone.estimated_days} days</span>
                      </div>
                    </div>
                    <Badge variant={zone.is_active ? "default" : "secondary"} className="mt-2">
                      {zone.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            {shippingZones.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Shipping Zones</h3>
                  <p className="text-muted-foreground">
                    Create shipping zones to offer different rates for different regions.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Information Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">National Marketplace Benefits</p>
              <p>
                Items with shipping enabled automatically appear in our National Marketplace, 
                reaching customers across the country. You can still offer local pickup in your city marketplace.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
