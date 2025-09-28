-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'city_moderator', 'seller', 'buyer');

-- Create user_roles table (CRITICAL: separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  city_id UUID REFERENCES public.cities(id), -- NULL for global admin
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (user_id, role, city_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role, _city_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND is_active = true
      AND (
        _city_id IS NULL 
        OR city_id IS NULL 
        OR city_id = _city_id
      )
  )
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
$$;

-- Create function to check if user is city moderator
CREATE OR REPLACE FUNCTION public.is_city_moderator(_user_id UUID, _city_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role) 
    OR public.has_role(_user_id, 'city_moderator'::app_role, _city_id)
$$;

-- RLS Policies for user_roles table
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "City moderators can view roles in their cities"
  ON public.user_roles FOR SELECT
  USING (
    public.is_city_moderator(auth.uid(), city_id)
    OR user_id = auth.uid()
  );

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin(auth.uid()));

-- Update cities table policies for admin management
CREATE POLICY "Admins can manage cities"
  ON public.cities FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "City moderators can update their cities"
  ON public.cities FOR UPDATE
  USING (public.is_city_moderator(auth.uid(), id));

-- Update categories policies for admin management
CREATE POLICY "Admins can manage all categories"
  ON public.categories FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "City moderators can manage categories in their cities"
  ON public.categories FOR ALL
  USING (public.is_city_moderator(auth.uid(), city_id));

-- Create initial admin user (replace with your email)
-- Note: This will need to be updated with actual user ID after signup
-- For now, we'll create a placeholder that can be updated
INSERT INTO public.user_roles (user_id, role, granted_by, granted_at)
SELECT 
  id,
  'admin'::app_role,
  id,
  NOW()
FROM auth.users 
WHERE email = 'admin@chicagomakers.local' -- Replace with your email
LIMIT 1;