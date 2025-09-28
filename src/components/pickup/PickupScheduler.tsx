import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, CheckCircle, XCircle } from "lucide-react";
import { format, addDays, startOfDay, isBefore } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface PickupSchedulerProps {
  orderId: string;
  sellerId: string;
  pickupLocation: string;
  onScheduled: () => void;
}

interface PickupSlot {
  id: string;
  date: string;
  time_start: string;
  time_end: string;
  is_available: boolean;
  notes?: string;
}

export const PickupScheduler = ({ orderId, sellerId, pickupLocation, onScheduled }: PickupSchedulerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [availableSlots, setAvailableSlots] = useState<PickupSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [buyerNotes, setBuyerNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(true);

  useEffect(() => {
    fetchAvailableSlots();
  }, [sellerId]);

  const fetchAvailableSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('pickup_slots')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('is_available', true)
        .gte('date', format(startOfDay(new Date()), 'yyyy-MM-dd'))
        .order('date', { ascending: true })
        .order('time_start', { ascending: true });

      if (error) throw error;
      setAvailableSlots(data || []);
    } catch (error) {
      console.error('Error fetching pickup slots:', error);
      toast({
        title: "Error",
        description: "Failed to load available pickup times",
        variant: "destructive",
      });
    } finally {
      setFetchingSlots(false);
    }
  };

  const schedulePickup = async () => {
    if (!selectedSlot || !user) return;

    setLoading(true);
    try {
      const slot = availableSlots.find(s => s.id === selectedSlot);
      if (!slot) throw new Error('Selected slot not found');

      // Create pickup appointment
      const { error: appointmentError } = await supabase
        .from('pickup_appointments')
        .insert({
          order_id: orderId,
          slot_id: selectedSlot,
          buyer_id: user.id,
          seller_id: sellerId,
          pickup_location: pickupLocation,
          buyer_notes: buyerNotes || null,
          status: 'scheduled'
        });

      if (appointmentError) throw appointmentError;

      // Mark slot as unavailable
      const { error: slotError } = await supabase
        .from('pickup_slots')
        .update({ is_available: false })
        .eq('id', selectedSlot);

      if (slotError) throw slotError;

      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', orderId);

      if (orderError) throw orderError;

      toast({
        title: "Success",
        description: "Pickup appointment scheduled successfully!",
      });

      onScheduled();
    } catch (error) {
      console.error('Error scheduling pickup:', error);
      toast({
        title: "Error",
        description: "Failed to schedule pickup appointment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingSlots) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Pickup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Schedule Pickup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Pickup Location</p>
            <p className="text-sm text-muted-foreground">{pickupLocation}</p>
          </div>
        </div>

        {availableSlots.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Available Slots</h3>
            <p className="text-muted-foreground text-sm">
              The seller hasn't set up any pickup slots yet. Please contact them directly to arrange pickup.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <Label>Select a pickup time</Label>
              <div className="grid gap-3">
                {availableSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedSlot === slot.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedSlot(slot.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-sm font-medium">
                            {format(new Date(slot.date), 'MMM dd')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(slot.date), 'EEE')}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">
                            {slot.time_start} - {slot.time_end}
                          </p>
                          {slot.notes && (
                            <p className="text-sm text-muted-foreground">{slot.notes}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        Available
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyer-notes">Additional Notes (optional)</Label>
              <Textarea
                id="buyer-notes"
                value={buyerNotes}
                onChange={(e) => setBuyerNotes(e.target.value)}
                placeholder="Any special instructions or questions for the seller..."
                rows={3}
              />
            </div>

            <Button
              onClick={schedulePickup}
              disabled={!selectedSlot || loading}
              className="w-full"
            >
              {loading ? "Scheduling..." : "Schedule Pickup"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};