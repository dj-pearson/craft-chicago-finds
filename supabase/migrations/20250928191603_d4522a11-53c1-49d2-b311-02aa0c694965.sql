-- Bootstrap: grant admin role to the specified user if not present
-- This migration is designed to be safe - it will skip if the user doesn't exist
DO $$
DECLARE
  target_user uuid := 'cc51f69b-b5b6-4916-869c-1c594af9b34d';
BEGIN
  -- Only proceed if the user exists in auth.users and doesn't already have admin role
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = target_user) 
     AND NOT EXISTS (
       SELECT 1 FROM public.user_roles 
       WHERE user_id = target_user AND role = 'admin'::app_role AND is_active = true
     ) THEN
    INSERT INTO public.user_roles (user_id, role, is_active)
    VALUES (target_user, 'admin'::app_role, true);
  END IF;
END $$;