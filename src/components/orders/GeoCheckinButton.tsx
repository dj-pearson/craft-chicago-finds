import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GeoCheckinButtonProps {
  orderId: string;
  pickupLocation: string;
  pickupLat?: number;
  pickupLng?: number;
  onCheckinSuccess?: () => void;
}

export const GeoCheckinButton = ({
  orderId,
  pickupLocation,
  pickupLat = 0,
  pickupLng = 0,
  onCheckinSuccess,
}: GeoCheckinButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isNearby, setIsNearby] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const { toast } = useToast();

  const CHECKIN_RADIUS_METERS = 500; // 500m radius for check-in

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const checkLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not available",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const dist = calculateDistance(latitude, longitude, pickupLat, pickupLng);
        
        setDistance(Math.round(dist));
        setIsNearby(dist <= CHECKIN_RADIUS_METERS);
        setIsLoading(false);

        if (dist > CHECKIN_RADIUS_METERS) {
          toast({
            title: "Too far away",
            description: `You're ${Math.round(dist)}m away. Please get within ${CHECKIN_RADIUS_METERS}m of the pickup location.`,
            variant: "destructive",
          });
        }
      },
      (error) => {
        setIsLoading(false);
        toast({
          title: "Location error",
          description: "Please enable location services to check in.",
          variant: "destructive",
        });
        console.error("Geolocation error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleCheckin = async () => {
    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        try {
          const { error } = await supabase
            .from("orders")
            .update({
              buyer_geo_confirmed: true,
              geo_checkin_data: {
                latitude,
                longitude,
                accuracy,
                timestamp: new Date().toISOString(),
              },
            })
            .eq("id", orderId);

          if (error) throw error;

          toast({
            title: "Check-in successful!",
            description: "You've confirmed your arrival at the pickup location.",
          });

          onCheckinSuccess?.();
        } catch (error) {
          console.error("Check-in error:", error);
          toast({
            title: "Check-in failed",
            description: "Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        setIsLoading(false);
        toast({
          title: "Location error",
          description: "Please enable location services to check in.",
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    checkLocation();
    const interval = setInterval(checkLocation, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [pickupLat, pickupLng]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>Pickup: {pickupLocation}</span>
      </div>

      {distance !== null && (
        <div className="text-sm">
          Distance: <span className="font-medium">{distance}m</span> away
          {isNearby && <span className="text-green-600 ml-2">✓ Within range</span>}
        </div>
      )}

      <Button
        onClick={handleCheckin}
        disabled={!isNearby || isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Checking location...
          </>
        ) : (
          <>
            <MapPin className="mr-2 h-4 w-4" />
            Confirm Arrival & Check In
          </>
        )}
      </Button>

      {!isNearby && distance !== null && (
        <p className="text-xs text-muted-foreground text-center">
          Get within {CHECKIN_RADIUS_METERS}m of the pickup location to check in
        </p>
      )}
    </div>
  );
};
