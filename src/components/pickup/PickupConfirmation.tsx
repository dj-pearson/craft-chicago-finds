import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Calendar, Clock, MapPin, User } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface PickupConfirmationProps {
  orderId: string;
  onConfirmed: () => void;
}

interface PickupAppointment {
  id: string;
  status: string;
  pickup_location: string;
  buyer_notes?: string;
  seller_notes?: string;
  confirmed_at?: string;
  completed_at?: string;
  slot: {
    date: string;
    time_start: string;
    time_end: string;
  };
  buyer_profile: {
    display_name: string;
    email: string;
    phone?: string;
  };
}

export const PickupConfirmation = ({ orderId, onConfirmed }: PickupConfirmationProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointment, setAppointment] = useState<PickupAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [sellerNotes, setSellerNotes] = useState("");

  useEffect(() => {
    fetchAppointment();
  }, [orderId]);

  const fetchAppointment = async () => {
    try {
      const { data, error } = await supabase
        .from('pickup_appointments')
        .select(`
          *,
          slot:pickup_slots(date, time_start, time_end),
          buyer_profile:profiles!pickup_appointments_buyer_id_fkey(display_name, email, phone)
        `)
        .eq('order_id', orderId)
        .single();

      if (error) throw error;
      setAppointment(data);
      setSellerNotes(data.seller_notes || "");
    } catch (error) {
      console.error('Error fetching pickup appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (status: 'confirmed' | 'cancelled' | 'completed') => {
    if (!appointment || !user) return;

    setUpdating(true);
    try {
      const updates: any = {
        status,
        seller_notes: sellerNotes || null
      };

      if (status === 'confirmed') {
        updates.confirmed_at = new Date().toISOString();
      } else if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('pickup_appointments')
        .update(updates)
        .eq('id', appointment.id);

      if (error) throw error;

      // Update order status based on pickup status
      let orderStatus = 'confirmed';
      if (status === 'completed') {
        orderStatus = 'completed';
      } else if (status === 'cancelled') {
        orderStatus = 'cancelled';
        
        // Make slot available again if cancelled
        await supabase
          .from('pickup_slots')
          .update({ is_available: true })
          .eq('id', appointment.slot.id);
      }

      await supabase
        .from('orders')
        .update({ status: orderStatus })
        .eq('id', orderId);

      toast({
        title: "Success",
        description: `Pickup appointment ${status} successfully`,
      });

      onConfirmed();
    } catch (error) {
      console.error('Error updating pickup appointment:', error);
      toast({
        title: "Error",
        description: "Failed to update pickup appointment",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pickup Details</CardTitle>
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

  if (!appointment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pickup Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No pickup appointment found for this order.</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500';
      case 'confirmed':
        return 'bg-green-500';
      case 'completed':
        return 'bg-gray-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const isSeller = user?.id === appointment.seller_id;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Pickup Appointment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Status</h3>
          <Badge className={getStatusColor(appointment.status)}>
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </Badge>
        </div>

        <div className="grid gap-4">
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Date & Time</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(appointment.slot.date), 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm text-muted-foreground">
                {appointment.slot.time_start} - {appointment.slot.time_end}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Pickup Location</p>
              <p className="text-sm text-muted-foreground">{appointment.pickup_location}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {isSeller ? 'Buyer' : 'Seller'} Information
              </p>
              <p className="text-sm text-muted-foreground">{appointment.buyer_profile.display_name}</p>
              <p className="text-sm text-muted-foreground">{appointment.buyer_profile.email}</p>
              {appointment.buyer_profile.phone && (
                <p className="text-sm text-muted-foreground">{appointment.buyer_profile.phone}</p>
              )}
            </div>
          </div>
        </div>

        {appointment.buyer_notes && (
          <div className="space-y-2">
            <Label className="text-muted-foreground">Buyer Notes</Label>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">{appointment.buyer_notes}</p>
            </div>
          </div>
        )}

        {isSeller && (
          <div className="space-y-2">
            <Label htmlFor="seller-notes">Seller Notes</Label>
            <Textarea
              id="seller-notes"
              value={sellerNotes}
              onChange={(e) => setSellerNotes(e.target.value)}
              placeholder="Add notes about the pickup location, special instructions, etc."
              rows={3}
            />
          </div>
        )}

        {appointment.seller_notes && !isSeller && (
          <div className="space-y-2">
            <Label className="text-muted-foreground">Seller Notes</Label>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">{appointment.seller_notes}</p>
            </div>
          </div>
        )}

        {isSeller && appointment.status === 'scheduled' && (
          <div className="flex gap-2">
            <Button
              onClick={() => updateAppointmentStatus('confirmed')}
              disabled={updating}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Pickup
            </Button>
            <Button
              variant="destructive"
              onClick={() => updateAppointmentStatus('cancelled')}
              disabled={updating}
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}

        {isSeller && appointment.status === 'confirmed' && (
          <Button
            onClick={() => updateAppointmentStatus('completed')}
            disabled={updating}
            className="w-full"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Completed
          </Button>
        )}

        {appointment.confirmed_at && (
          <div className="text-xs text-muted-foreground">
            Confirmed: {format(new Date(appointment.confirmed_at), 'MMM d, yyyy at h:mm a')}
          </div>
        )}

        {appointment.completed_at && (
          <div className="text-xs text-muted-foreground">
            Completed: {format(new Date(appointment.completed_at), 'MMM d, yyyy at h:mm a')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};