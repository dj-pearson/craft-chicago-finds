-- Create pickup_slots table for sellers to define available pickup times
CREATE TABLE public.pickup_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  date DATE NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pickup_appointments table for scheduled pickups
CREATE TABLE public.pickup_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  slot_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  pickup_location TEXT NOT NULL,
  buyer_notes TEXT,
  seller_notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  confirmed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pickup_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for pickup_slots
CREATE POLICY "Sellers can manage their own pickup slots" 
ON public.pickup_slots 
FOR ALL 
USING (auth.uid() = seller_id);

CREATE POLICY "Pickup slots are viewable by everyone" 
ON public.pickup_slots 
FOR SELECT 
USING (true);

-- Create policies for pickup_appointments
CREATE POLICY "Users can view their own pickup appointments" 
ON public.pickup_appointments 
FOR SELECT 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can create pickup appointments" 
ON public.pickup_appointments 
FOR INSERT 
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Appointment participants can update appointments" 
ON public.pickup_appointments 
FOR UPDATE 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_pickup_slots_updated_at
BEFORE UPDATE ON public.pickup_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pickup_appointments_updated_at
BEFORE UPDATE ON public.pickup_appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create constraints for validation
ALTER TABLE public.pickup_slots 
ADD CONSTRAINT check_time_range 
CHECK (time_end > time_start);

ALTER TABLE public.pickup_appointments 
ADD CONSTRAINT check_appointment_status 
CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled'));

-- Create indexes for better performance
CREATE INDEX idx_pickup_slots_seller_date ON public.pickup_slots(seller_id, date);
CREATE INDEX idx_pickup_slots_available ON public.pickup_slots(is_available, date) WHERE is_available = true;
CREATE INDEX idx_pickup_appointments_order ON public.pickup_appointments(order_id);
CREATE INDEX idx_pickup_appointments_buyer ON public.pickup_appointments(buyer_id);
CREATE INDEX idx_pickup_appointments_seller ON public.pickup_appointments(seller_id);