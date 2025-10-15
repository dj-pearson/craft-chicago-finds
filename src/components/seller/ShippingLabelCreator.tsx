import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Truck, Package, Download, Loader2 } from "lucide-react";

interface ShippingLabelCreatorProps {
  orderId: string;
  shippingAddress: any;
  onLabelCreated?: (trackingNumber: string) => void;
}

const CARRIERS = [
  { value: "usps", label: "USPS", services: [
    { value: "usps_priority_mail", label: "Priority Mail" },
    { value: "usps_first_class_mail", label: "First Class Mail" },
    { value: "usps_priority_mail_express", label: "Priority Mail Express" }
  ]},
  { value: "ups", label: "UPS", services: [
    { value: "ups_ground", label: "Ground" },
    { value: "ups_3_day_select", label: "3 Day Select" },
    { value: "ups_next_day_air", label: "Next Day Air" }
  ]},
  { value: "fedex", label: "FedEx", services: [
    { value: "fedex_ground", label: "Ground" },
    { value: "fedex_2_day", label: "2 Day" },
    { value: "fedex_overnight", label: "Overnight" }
  ]}
];

export const ShippingLabelCreator = ({ 
  orderId, 
  shippingAddress,
  onLabelCreated 
}: ShippingLabelCreatorProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [carrier, setCarrier] = useState("usps");
  const [serviceCode, setServiceCode] = useState("usps_priority_mail");
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);

  const selectedCarrier = CARRIERS.find(c => c.value === carrier);

  const createLabel = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-shipping-label', {
        body: { orderId, carrier, serviceCode }
      });

      if (error) throw error;

      setLabelUrl(data.labelUrl);
      setTrackingNumber(data.trackingNumber);
      
      toast({
        title: "Label created!",
        description: `Tracking number: ${data.trackingNumber}. Label cost: $${data.cost?.toFixed(2) || 'N/A'}`,
      });

      if (onLabelCreated) {
        onLabelCreated(data.trackingNumber);
      }
    } catch (error: any) {
      console.error("Error creating label:", error);
      toast({
        title: "Failed to create label",
        description: error.message || "Please check your ShipStation API credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadLabel = () => {
    if (!labelUrl) return;
    
    // Convert base64 to blob and download
    const byteCharacters = atob(labelUrl);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shipping-label-${trackingNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Create Shipping Label
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!labelUrl ? (
          <>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-1">Ship To:</div>
              <div className="text-sm text-muted-foreground">
                {shippingAddress?.street}<br />
                {shippingAddress?.city}, {shippingAddress?.state} {shippingAddress?.zip}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Carrier</label>
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARRIERS.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Service</label>
              <Select value={serviceCode} onValueChange={setServiceCode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedCarrier?.services.map(s => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={createLabel} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Label...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Create Label
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              Note: ShipStation API credentials must be configured in your edge function secrets.
            </p>
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <div className="font-medium text-green-900">Label Created!</div>
                <div className="text-sm text-green-700">
                  Tracking: <Badge variant="outline">{trackingNumber}</Badge>
                </div>
              </div>
            </div>

            <Button onClick={downloadLabel} variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download Label (PDF)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};