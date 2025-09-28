import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, Plus, Edit, Trash2, CheckCircle } from "lucide-react";
import { format, addDays, startOfDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface PickupSlot {
  id: string;
  date: string;
  time_start: string;
  time_end: string;
  is_available: boolean;
  notes?: string;
  appointments?: {
    id: string;
    buyer_profile: {
      display_name: string;
    };
    status: string;
  }[];
}

export const PickupSlotManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [slots, setSlots] = useState<PickupSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState<PickupSlot | null>(null);
  
  const [formData, setFormData] = useState({
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    time_start: "10:00",
    time_end: "11:00",
    notes: ""
  });

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('pickup_slots')
        .select(`
          *,
          appointments:pickup_appointments(
            id,
            status,
            buyer_profile:profiles!pickup_appointments_buyer_id_fkey(display_name)
          )
        `)
        .eq('seller_id', user.id)
        .gte('date', format(startOfDay(new Date()), 'yyyy-MM-dd'))
        .order('date', { ascending: true })
        .order('time_start', { ascending: true });

      if (error) throw error;
      setSlots(data || []);
    } catch (error) {
      console.error('Error fetching pickup slots:', error);
      toast({
        title: "Error",
        description: "Failed to load pickup slots",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateTimeSlot = () => {
    const startTime = new Date(`2000-01-01T${formData.time_start}`);
    const endTime = new Date(`2000-01-01T${formData.time_end}`);
    
    if (endTime <= startTime) {
      toast({
        title: "Invalid Time",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return false;
    }

    const selectedDate = new Date(formData.date);
    if (selectedDate < startOfDay(new Date())) {
      toast({
        title: "Invalid Date",
        description: "Cannot create slots for past dates",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const createSlot = async () => {
    if (!user || !validateTimeSlot()) return;

    try {
      const { error } = await supabase
        .from('pickup_slots')
        .insert({
          seller_id: user.id,
          date: formData.date,
          time_start: formData.time_start,
          time_end: formData.time_end,
          notes: formData.notes || null,
          is_available: true
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pickup slot created successfully",
      });

      setShowCreateDialog(false);
      resetForm();
      fetchSlots();
    } catch (error) {
      console.error('Error creating pickup slot:', error);
      toast({
        title: "Error",
        description: "Failed to create pickup slot",
        variant: "destructive",
      });
    }
  };

  const updateSlot = async () => {
    if (!user || !editingSlot || !validateTimeSlot()) return;

    try {
      const { error } = await supabase
        .from('pickup_slots')
        .update({
          date: formData.date,
          time_start: formData.time_start,
          time_end: formData.time_end,
          notes: formData.notes || null
        })
        .eq('id', editingSlot.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pickup slot updated successfully",
      });

      setEditingSlot(null);
      resetForm();
      fetchSlots();
    } catch (error) {
      console.error('Error updating pickup slot:', error);
      toast({
        title: "Error",
        description: "Failed to update pickup slot",
        variant: "destructive",
      });
    }
  };

  const deleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('pickup_slots')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pickup slot deleted successfully",
      });

      fetchSlots();
    } catch (error) {
      console.error('Error deleting pickup slot:', error);
      toast({
        title: "Error",
        description: "Failed to delete pickup slot",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      time_start: "10:00",
      time_end: "11:00",
      notes: ""
    });
  };

  const openEditDialog = (slot: PickupSlot) => {
    setEditingSlot(slot);
    setFormData({
      date: slot.date,
      time_start: slot.time_start,
      time_end: slot.time_end,
      notes: slot.notes || ""
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pickup Availability</CardTitle>
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pickup Availability
        </CardTitle>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Slot
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Pickup Slot</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={formData.time_start}
                      onChange={(e) => setFormData(prev => ({ ...prev, time_start: e.target.value }))}
                    />
                    <Input
                      type="time"
                      value={formData.time_end}
                      onChange={(e) => setFormData(prev => ({ ...prev, time_end: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Special instructions or location details..."
                  rows={3}
                />
              </div>
              <Button onClick={createSlot} className="w-full">
                Create Slot
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {slots.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Pickup Slots</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create pickup time slots for customers to schedule when they can collect their orders.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {slots.map((slot) => (
              <div key={slot.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
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
                      {slot.appointments && slot.appointments.length > 0 && (
                        <p className="text-sm text-primary">
                          Booked by {slot.appointments[0].buyer_profile.display_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={slot.is_available ? "secondary" : "default"}
                      className={slot.is_available ? "" : "bg-green-500"}
                    >
                      {slot.is_available ? "Available" : "Booked"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(slot)}
                      disabled={!slot.is_available}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSlot(slot.id)}
                      disabled={!slot.is_available}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingSlot} onOpenChange={() => setEditingSlot(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Pickup Slot</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={formData.time_start}
                      onChange={(e) => setFormData(prev => ({ ...prev, time_start: e.target.value }))}
                    />
                    <Input
                      type="time"
                      value={formData.time_end}
                      onChange={(e) => setFormData(prev => ({ ...prev, time_end: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes (optional)</Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Special instructions or location details..."
                  rows={3}
                />
              </div>
              <Button onClick={updateSlot} className="w-full">
                Update Slot
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};