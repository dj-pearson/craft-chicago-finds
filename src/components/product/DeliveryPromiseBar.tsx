import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Truck, MapPin, Clock, Calendar, CheckCircle } from "lucide-react";

interface DeliveryPromiseBarProps {
  processingTimeDays: number;
  shippingTimeDays: number;
  fulfillmentMethod: 'shipping' | 'pickup' | 'both';
  pickupLocation?: string;
  className?: string;
}

interface DeliveryEstimate {
  orderByDate: Date;
  shipDate: Date;
  deliveryDate: Date;
  pickupDate?: Date;
}

export const DeliveryPromiseBar = ({
  processingTimeDays,
  shippingTimeDays,
  fulfillmentMethod,
  pickupLocation,
  className = ""
}: DeliveryPromiseBarProps) => {
  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);

  useEffect(() => {
    calculateDeliveryEstimate();
  }, [processingTimeDays, shippingTimeDays]);

  const calculateDeliveryEstimate = () => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // If it's after 2 PM, start counting from tomorrow
    let startDate = new Date(now);
    if (currentHour >= 14) {
      startDate.setDate(startDate.getDate() + 1);
    }
    
    // Calculate ship date (skip weekends)
    let shipDate = new Date(startDate);
    let businessDays = 0;
    while (businessDays < processingTimeDays) {
      shipDate.setDate(shipDate.getDate() + 1);
      const dayOfWeek = shipDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        businessDays++;
      }
    }
    
    // Calculate delivery date (skip weekends)
    let deliveryDate = new Date(shipDate);
    businessDays = 0;
    while (businessDays < shippingTimeDays) {
      deliveryDate.setDate(deliveryDate.getDate() + 1);
      const dayOfWeek = deliveryDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        businessDays++;
      }
    }
    
    // For pickup, estimate is same as ship date
    const pickupDate = new Date(shipDate);
    
    // Calculate the latest order-by date for shipping delivery
    let orderByDate = new Date(deliveryDate);
    orderByDate.setDate(orderByDate.getDate() - (processingTimeDays + shippingTimeDays));
    
    // If order-by date is in the past, use today
    if (orderByDate < now) {
      orderByDate = new Date(now);
    }
    
    setEstimate({
      orderByDate,
      shipDate,
      deliveryDate,
      pickupDate
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days`;
  };

  const isExpressEligible = () => {
    return processingTimeDays <= 1 && shippingTimeDays <= 2;
  };

  const isSameDayPickupAvailable = () => {
    const now = new Date();
    return fulfillmentMethod !== 'shipping' && now.getHours() < 14;
  };

  if (!estimate) return null;

  return (
    <Card className={`border-primary/20 bg-primary/5 ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Main Promise */}
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            <div className="flex-1">
              {fulfillmentMethod === 'shipping' && (
                <div className="font-medium text-primary">
                  Order by {formatDate(estimate.orderByDate)} → Arrives {formatDate(estimate.deliveryDate)}
                </div>
              )}
              {fulfillmentMethod === 'pickup' && (
                <div className="font-medium text-primary">
                  Order today → Ready for pickup {formatDate(estimate.pickupDate)}
                </div>
              )}
              {fulfillmentMethod === 'both' && (
                <div className="font-medium text-primary">
                  Multiple delivery options available
                </div>
              )}
            </div>
            {isExpressEligible() && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Clock className="h-3 w-3 mr-1" />
                Fast
              </Badge>
            )}
          </div>

          {/* Detailed Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {/* Processing */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">Processing</div>
                <div className="text-muted-foreground">
                  {processingTimeDays} business {processingTimeDays === 1 ? 'day' : 'days'}
                </div>
              </div>
            </div>

            {/* Shipping */}
            {fulfillmentMethod !== 'pickup' && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Truck className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <div className="font-medium">Shipping</div>
                  <div className="text-muted-foreground">
                    {shippingTimeDays} business {shippingTimeDays === 1 ? 'day' : 'days'}
                  </div>
                </div>
              </div>
            )}

            {/* Pickup */}
            {fulfillmentMethod !== 'shipping' && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">Pickup</div>
                  <div className="text-muted-foreground">
                    {pickupLocation || 'Location provided after order'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Special Options */}
          {(isSameDayPickupAvailable() || fulfillmentMethod === 'both') && (
            <>
              <Separator />
              <div className="space-y-2">
                {isSameDayPickupAvailable() && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="border-green-500 text-green-700">
                      <MapPin className="h-3 w-3 mr-1" />
                      Same-day pickup
                    </Badge>
                    <span className="text-muted-foreground">
                      Order by 2 PM for same-day pickup
                    </span>
                  </div>
                )}
                
                {fulfillmentMethod === 'both' && (
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Truck className="h-3 w-3" />
                      <span>Ships {formatDate(estimate.deliveryDate)}</span>
                    </div>
                    <span className="text-muted-foreground">or</span>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>Pickup {formatDate(estimate.pickupDate)}</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Delivery Guarantee */}
          <div className="text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 inline mr-1" />
            Delivery estimates exclude weekends and holidays. 
            {fulfillmentMethod !== 'pickup' && ' Tracking provided once shipped.'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
