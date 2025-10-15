import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, TrendingUp, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface InventoryAlert {
  id: string;
  listing_id: string;
  alert_type: string;
  threshold: number | null;
  current_stock: number;
  status: string;
  metadata: any;
  created_at: string;
}

export function InventoryAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAlerts();
    }
  }, [user]);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_alerts')
        .select('*')
        .eq('seller_id', user?.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error: any) {
      console.error('Error fetching inventory alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('inventory_alerts')
        .update({ 
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(alerts.filter(a => a.id !== alertId));
      toast.success('Alert acknowledged');
    } catch (error: any) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('inventory_alerts')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(alerts.filter(a => a.id !== alertId));
      toast.success('Alert resolved');
    } catch (error: any) {
      toast.error('Failed to resolve alert');
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'out_of_stock':
        return AlertCircle;
      case 'low_stock':
        return AlertTriangle;
      case 'high_demand':
        return TrendingUp;
      default:
        return AlertTriangle;
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case 'out_of_stock':
        return <Badge variant="destructive">Out of Stock</Badge>;
      case 'low_stock':
        return <Badge variant="outline" className="border-amber-500 text-amber-600">Low Stock</Badge>;
      case 'high_demand':
        return <Badge variant="secondary">High Demand</Badge>;
      case 'restock_suggestion':
        return <Badge variant="default">Restock Suggested</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getAlertMessage = (alert: InventoryAlert) => {
    const title = alert.metadata?.title || 'Unknown Item';
    
    switch (alert.alert_type) {
      case 'out_of_stock':
        return `${title} is out of stock`;
      case 'low_stock':
        return `${title} has only ${alert.current_stock} item${alert.current_stock === 1 ? '' : 's'} left`;
      case 'high_demand':
        return `${title} is experiencing high demand`;
      case 'restock_suggestion':
        return `Consider restocking ${title}`;
      default:
        return `Alert for ${title}`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading inventory alerts...</p>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Inventory Status: Good
          </CardTitle>
          <CardDescription>No inventory alerts at this time</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Alerts</CardTitle>
        <CardDescription>{alerts.length} active alert{alerts.length === 1 ? '' : 's'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => {
          const Icon = getAlertIcon(alert.alert_type);
          
          return (
            <div key={alert.id} className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="mt-0.5">
                <Icon className={`h-5 w-5 ${
                  alert.alert_type === 'out_of_stock' ? 'text-red-500' : 
                  alert.alert_type === 'low_stock' ? 'text-amber-500' : 
                  'text-blue-500'
                }`} />
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  {getAlertBadge(alert.alert_type)}
                </div>
                <p className="text-sm font-medium">
                  {getAlertMessage(alert)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(alert.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.href = `/seller/listings/${alert.listing_id}`}
                >
                  View Listing
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => acknowledgeAlert(alert.id)}
                >
                  Acknowledge
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => resolveAlert(alert.id)}
                >
                  Resolve
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
